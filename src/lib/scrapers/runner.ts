/**
 * Scraper Runner — orchestrates all scraper adapters.
 *
 * Runs each adapter, normalizes candidates, deduplicates against existing
 * events, and inserts new events as status='queued'.
 *
 * Uses Supabase service role key (bypasses RLS) because scraped events
 * have created_by=NULL and source!='user', which the INSERT policy rejects.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run src/lib/scrapers/runner.ts
 */

import { createClient } from '@supabase/supabase-js';
import type { ScraperAdapter, EventCandidate } from './types';
import { BachtrackScraper } from './bachtrack';
import { GoogleEventsScraper } from './google-events';

const BATCH_SIZE = 50;

interface RunResult {
  total_candidates: number;
  inserted: number;
  skipped_dedup: number;
  errors: string[];
}

export async function runScrapers(): Promise<RunResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Register adapters
  const adapters: ScraperAdapter[] = [
    new BachtrackScraper(),
    new GoogleEventsScraper(),
  ];

  const allCandidates: { candidate: EventCandidate; source: string }[] = [];
  const allErrors: string[] = [];

  // Run all adapters
  for (const adapter of adapters) {
    console.log(`[scraper] Running ${adapter.source}...`);
    try {
      const result = await adapter.scrape();
      console.log(`[scraper] ${adapter.source}: ${result.candidates.length} candidates, ${result.errors.length} errors`);

      for (const candidate of result.candidates) {
        allCandidates.push({ candidate, source: adapter.source });
      }
      allErrors.push(...result.errors);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      allErrors.push(`${adapter.source} crashed: ${msg}`);
      console.error(`[scraper] ${adapter.source} crashed:`, msg);
    }
  }

  // Warn if 0 results with 0 errors (parser may be broken)
  if (allCandidates.length === 0 && allErrors.length === 0) {
    console.warn('[scraper] WARNING: 0 candidates and 0 errors. Parsers may be broken.');
    allErrors.push('WARNING: 0 candidates and 0 errors across all adapters. Check parsers.');
  }

  // Dedup against existing events (title + venue + date)
  let inserted = 0;
  let skippedDedup = 0;

  for (let i = 0; i < allCandidates.length; i += BATCH_SIZE) {
    const batch = allCandidates.slice(i, i + BATCH_SIZE);

    for (const { candidate, source } of batch) {
      // Check for existing event with same title + venue + date
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('title', candidate.title)
        .eq('venue', candidate.venue)
        .eq('event_date', candidate.event_date)
        .limit(1);

      if (existing && existing.length > 0) {
        skippedDedup++;
        continue;
      }

      // Insert as queued
      const { error } = await supabase
        .from('events')
        .insert({
          title: candidate.title,
          venue: candidate.venue,
          city: candidate.city,
          country: candidate.country || null,
          event_date: candidate.event_date,
          start_time: candidate.start_time || null,
          event_type: candidate.event_type,
          description: candidate.description || null,
          url: candidate.url || null,
          source,
          status: 'queued',
          created_by: null,
        });

      if (error) {
        allErrors.push(`Insert failed for "${candidate.title}": ${error.message}`);
        console.error(`[scraper] Insert failed: ${error.message}`);
      } else {
        inserted++;
      }
    }
  }

  const result: RunResult = {
    total_candidates: allCandidates.length,
    inserted,
    skipped_dedup: skippedDedup,
    errors: allErrors,
  };

  console.log(`[scraper] Done. ${inserted} inserted, ${skippedDedup} deduped, ${allErrors.length} errors`);
  return result;
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('runner.ts')) {
  runScrapers()
    .then(result => {
      if (result.errors.length > 0) {
        console.error('[scraper] Errors:', result.errors);
        // Exit 0 even with errors — scraping is experimental, not a launch dependency.
        // Errors are logged and visible in GH Actions output.
      }
    })
    .catch(err => {
      console.error('[scraper] Fatal:', err);
      process.exit(1);
    });
}
