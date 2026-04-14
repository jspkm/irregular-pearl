/**
 * Per-venue scraper runner.
 *
 * Imports the VenueScraper registry, runs each one, dedupes against the
 * existing events table, and inserts new rows as status='approved' with
 * source='venue:<slug>'. show_from is set to today so events surface as
 * soon as they are picked up (instead of waiting for event_date - 30).
 *
 * Bachtrack and the venue_scrape LLM-mediated path have been retired.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run src/lib/scrapers/runner.ts
 */

import { createClient } from '@supabase/supabase-js';
import { VENUE_SCRAPERS } from './venues';
import type { VenueEvent, VenueScraper } from './venues/types';

interface RunResult {
  total_candidates: number;
  inserted: number;
  skipped_dedup: number;
  errors: string[];
  per_venue: Record<string, { found: number; inserted: number; deduped: number; error?: string }>;
}

export async function runScrapers(): Promise<RunResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const errors: string[] = [];
  const perVenue: RunResult['per_venue'] = {};
  let totalCandidates = 0;
  let totalInserted = 0;
  let totalDeduped = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const venue of VENUE_SCRAPERS) {
    perVenue[venue.slug] = { found: 0, inserted: 0, deduped: 0 };
    let candidates: VenueEvent[];
    try {
      candidates = await venue.scrape(null as never, venue);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[scraper] ${venue.slug}: scrape failed — ${msg}`);
      errors.push(`${venue.slug}: ${msg}`);
      perVenue[venue.slug].error = msg;
      continue;
    }
    perVenue[venue.slug].found = candidates.length;
    totalCandidates += candidates.length;
    console.log(`[scraper] ${venue.slug}: ${candidates.length} candidates`);

    for (const c of candidates) {
      if (!c.title || !c.event_date) continue;
      // Dedup: same title + venue + date already present
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('title', c.title.slice(0, 200))
        .eq('venue', venue.name)
        .eq('event_date', c.event_date)
        .limit(1);
      if (existing && existing.length > 0) {
        perVenue[venue.slug].deduped++;
        totalDeduped++;
        continue;
      }
      const performers = Array.isArray(c.performers) ? c.performers.filter((x) => typeof x === 'string') : [];
      const program = Array.isArray(c.program) ? c.program.filter((x) => typeof x === 'string') : [];
      const insertRow = {
        title: c.title.slice(0, 200),
        venue: venue.name,
        city: venue.city,
        country: venue.country,
        event_date: c.event_date,
        show_from: today,
        start_time: c.start_time ?? null,
        event_type: c.event_type ?? 'concert',
        description: c.description || null,
        performers_raw: performers.length ? performers : null,
        program_raw: program.length ? program : null,
        url: c.url,
        poster_url: c.image_url ?? null,
        source: `venue:${venue.slug}`,
        status: 'approved' as const,
        created_by: null,
      };
      const { error } = await supabase.from('events').insert(insertRow);
      if (error) {
        const msg = `${venue.slug} insert "${c.title.slice(0, 60)}": ${error.message}`;
        console.error(`[scraper] ${msg}`);
        errors.push(msg);
        continue;
      }
      perVenue[venue.slug].inserted++;
      totalInserted++;
    }
    console.log(`[scraper] ${venue.slug}: inserted=${perVenue[venue.slug].inserted} deduped=${perVenue[venue.slug].deduped}`);
  }

  return {
    total_candidates: totalCandidates,
    inserted: totalInserted,
    skipped_dedup: totalDeduped,
    errors,
    per_venue: perVenue,
  };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('runner.ts')) {
  const result = await runScrapers();
  console.log('---');
  console.log(JSON.stringify({ total: result.total_candidates, inserted: result.inserted, deduped: result.skipped_dedup, errors: result.errors.length }, null, 2));
  for (const [slug, s] of Object.entries(result.per_venue)) {
    console.log(`  ${slug.padEnd(15)} found=${s.found.toString().padStart(4)} inserted=${s.inserted.toString().padStart(4)} deduped=${s.deduped.toString().padStart(4)}${s.error ? ' ERR: ' + s.error : ''}`);
  }
}
