#!/usr/bin/env bun
/**
 * Import all works from the OpenOpus API into Supabase as stub piece pages.
 *
 * Usage:
 *   bun scripts/import-openopus.ts
 *
 * Required env vars:
 *   PUBLIC_SUPABASE_URL          — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY    — Service-role key (NOT the anon key)
 *
 * Optional:
 *   DRY_RUN=1                    — Print what would be inserted without writing
 */

import { createClient } from '@supabase/supabase-js';
import { generatePieceId, slugify } from './lib/slugify';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENOPUS_BASE = 'https://api.openopus.org';
const BATCH_SIZE = 100;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const INTER_COMPOSER_DELAY_MS = 100;

// ---------------------------------------------------------------------------
// Supabase client (service-role for inserts)
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing required environment variables:\n' +
    '  PUBLIC_SUPABASE_URL\n' +
    '  SUPABASE_SERVICE_ROLE_KEY\n\n' +
    'Set them in .env or pass them inline:\n' +
    '  PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun scripts/import-openopus.ts',
  );
  process.exit(1);
}

const isDryRun = process.env.DRY_RUN === '1';
if (isDryRun) console.log('[DRY RUN] No data will be written to Supabase.\n');

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ---------------------------------------------------------------------------
// OpenOpus types
// ---------------------------------------------------------------------------

interface OOComposer {
  id: string;
  name: string;         // "Ludwig van Beethoven"
  complete_name: string; // "Ludwig van Beethoven"
  birth: string;
  death: string | null;
  epoch: string;         // "Baroque", "Classical", "Romantic", etc.
  portrait: string;
}

interface OOWork {
  id: string;
  title: string;
  subtitle: string;
  searchterms: string;
  popular: string;       // "0" or "1"
  recommended: string;   // "0" or "1"
  genre: string;         // "Orchestral", "Chamber", "Keyboard", etc.
}

// ---------------------------------------------------------------------------
// Era / genre mapping
// ---------------------------------------------------------------------------

const ERA_MAP: Record<string, string> = {
  Medieval: 'Medieval',
  Renaissance: 'Renaissance',
  Baroque: 'Baroque',
  Classical: 'Classical',
  'Early Romantic': 'Romantic',
  Romantic: 'Romantic',
  'Late Romantic': 'Romantic',
  '20th Century': 'Modern',
  'Post-War': 'Modern',
  '21st Century': 'Contemporary',
  Modern: 'Modern',
};

function mapEra(epoch: string): string {
  return ERA_MAP[epoch] || epoch;
}

const GENRE_TO_FORM: Record<string, string> = {
  Orchestral: 'Orchestral',
  Chamber: 'Chamber',
  Keyboard: 'Solo',
  'Stage': 'Opera',
  Vocal: 'Vocal',
  Choral: 'Choral',
  'Popular': 'Popular',
};

function mapForm(genre: string): string {
  return GENRE_TO_FORM[genre] || genre;
}

const GENRE_TO_INSTRUMENTS: Record<string, string[]> = {
  Keyboard: ['Piano'],
  Orchestral: ['Orchestra'],
  Chamber: ['Chamber Ensemble'],
  Vocal: ['Voice'],
  Choral: ['Choir'],
  Stage: ['Orchestra', 'Voice'],
};

function inferInstruments(genre: string): string[] {
  return GENRE_TO_INSTRUMENTS[genre] || ['Unknown'];
}

// ---------------------------------------------------------------------------
// HTTP helpers with retry + timeout
// ---------------------------------------------------------------------------

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      if (attempt === retries) throw err;
      const backoff = Math.pow(2, attempt) * 500;
      console.error(`  [retry ${attempt}/${retries}] ${err.message} — waiting ${backoff}ms`);
      await sleep(backoff);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Catalog number extraction
// ---------------------------------------------------------------------------

/**
 * The OpenOpus "title" field often embeds the catalog number, e.g.:
 *   "Sonata No. 1 in F minor, Op. 2 No. 1"
 *   "Brandenburg Concerto No. 3, BWV 1048"
 *
 * We extract common catalog prefixes.
 */
const CATALOG_PATTERNS = [
  // Op. / Opus
  /,?\s*(Op(?:us)?\.?\s*\d+(?:\s*(?:No|no|Nr)\.?\s*\d+)?)/i,
  // BWV, K, KV, D, Sz, BB, S, WoO, Hob, RV, HWV, WAB, L, TrV, BV etc.
  /,?\s*((?:BWV|K(?:V)?|D|Sz|BB|S|WoO|Hob|RV|HWV|WAB|L|TrV|BV|TWV|FP|CNW|JB|B|EG|H)\.?\s*[\d\w/.]+(?:\s*(?:No|no|Nr)\.?\s*\d+)?)/,
];

function extractCatalogNumber(title: string): string | null {
  for (const pat of CATALOG_PATTERNS) {
    const match = title.match(pat);
    if (match) return match[1].trim().replace(/^,\s*/, '');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Piece row builder
// ---------------------------------------------------------------------------

interface PieceRow {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[];
  era: string;
  form: string;
  duration_minutes: number | null;
  difficulty: null;
  description: string;
  source: string;
}

interface ExternalLinkRow {
  id: string;
  piece_id: string;
  type: string;
  url: string;
  label: string;
  source: string;
}

function buildPieceRow(composer: OOComposer, work: OOWork): PieceRow {
  const catalog = extractCatalogNumber(work.title);
  const id = generatePieceId(composer.complete_name, work.title, catalog);

  return {
    id,
    title: work.title,
    composer_name: composer.complete_name,
    catalog_number: catalog,
    instruments: inferInstruments(work.genre),
    era: mapEra(composer.epoch),
    form: mapForm(work.genre),
    duration_minutes: null,
    difficulty: null,
    description: '',
    source: 'openopus',
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Fetching composers from OpenOpus...');
  const composersData = await fetchWithRetry(`${OPENOPUS_BASE}/composer/list/search/.json`);

  // The endpoint returns { status: {...}, composers: [...] }
  const composers: OOComposer[] = composersData?.composers;
  if (!composers || !Array.isArray(composers)) {
    console.error('Failed to fetch composers list. Response:', JSON.stringify(composersData).slice(0, 500));
    process.exit(1);
  }

  console.log(`Found ${composers.length} composers.\n`);

  let totalPieces = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailures = 0;

  const allPieces: PieceRow[] = [];
  const allLinks: ExternalLinkRow[] = [];

  for (const composer of composers) {
    try {
      const worksData = await fetchWithRetry(
        `${OPENOPUS_BASE}/work/list/composer/${composer.id}/genre/all.json`,
      );

      const works: OOWork[] = worksData?.works;
      if (!works || !Array.isArray(works)) {
        console.error(`  [skip] No works found for ${composer.complete_name}`);
        continue;
      }

      console.log(`  ${composer.complete_name} (${composer.epoch}): ${works.length} works`);

      for (const work of works) {
        const piece = buildPieceRow(composer, work);
        allPieces.push(piece);

        // Build Wikipedia external link if available from composer data
        // OpenOpus doesn't give Wikipedia URLs directly, so we construct one
        const composerWikiSlug = composer.complete_name.replace(/\s+/g, '_');
        const linkId = `wiki-${piece.id}`;
        allLinks.push({
          id: linkId,
          piece_id: piece.id,
          type: 'wikipedia',
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(composerWikiSlug)}`,
          label: `Wikipedia — ${composer.complete_name}`,
          source: 'openopus',
        });

        totalPieces++;
      }

      // Rate-limit: polite delay between composers
      await sleep(INTER_COMPOSER_DELAY_MS);
    } catch (err: any) {
      console.error(`  [FAIL] ${composer.complete_name}: ${err.message}`);
      totalFailures++;
    }
  }

  console.log(`\nTotal works collected: ${totalPieces}`);

  if (isDryRun) {
    console.log('[DRY RUN] Sample pieces (first 5):');
    for (const p of allPieces.slice(0, 5)) {
      console.log(`  ${p.id}  |  ${p.composer_name}  |  ${p.title}  |  ${p.era}  |  ${p.form}`);
    }
    console.log(`\n[DRY RUN] Would insert ${allPieces.length} pieces and ${allLinks.length} links.`);
    return;
  }

  // Batch-insert pieces
  console.log(`\nInserting pieces in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < allPieces.length; i += BATCH_SIZE) {
    const batch = allPieces.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from('pieces')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error(`  [batch ${i}-${i + batch.length}] Error: ${error.message}`);
      totalFailures += batch.length;
    } else {
      const inserted = count ?? batch.length;
      totalInserted += inserted;
      totalSkipped += batch.length - inserted;
    }

    if ((i / BATCH_SIZE) % 10 === 0) {
      process.stdout.write(`  ${i + batch.length} / ${allPieces.length}\r`);
    }
  }
  console.log('');

  // Batch-insert external links
  console.log(`Inserting external links in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < allLinks.length; i += BATCH_SIZE) {
    const batch = allLinks.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('external_links')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      console.error(`  [links batch ${i}-${i + batch.length}] Error: ${error.message}`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log(`  Imported:  ${totalInserted} pieces`);
  console.log(`  Skipped:   ${totalSkipped} (already exist)`);
  console.log(`  Failures:  ${totalFailures}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
