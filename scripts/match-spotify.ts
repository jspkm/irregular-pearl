#!/usr/bin/env bun
/**
 * Match pieces in Supabase with Spotify recordings.
 * Runs as a separate pass after import-openopus.ts.
 *
 * Usage:
 *   SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... bun scripts/match-spotify.ts
 *
 * Required env vars:
 *   PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *
 * Optional:
 *   DRY_RUN=1         — Print matches without writing
 *   BATCH=100         — Number of pieces per batch (default 100)
 *   OFFSET=0          — Start from this offset (for resuming)
 *   LIMIT=0           — Process this many pieces (0 = all)
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';
const MIN_POPULARITY = 20; // Skip matches below this popularity score
const RATE_LIMIT_DELAY_MS = 40; // ~25 req/s
const BATCH_SIZE = parseInt(process.env.BATCH || '100', 10);
const OFFSET = parseInt(process.env.OFFSET || '0', 10);
const LIMIT = parseInt(process.env.LIMIT || '0', 10);
const isDryRun = process.env.DRY_RUN === '1';

// ---------------------------------------------------------------------------
// Env validation
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!spotifyClientId || !spotifyClientSecret) {
  console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  process.exit(1);
}

if (isDryRun) console.log('[DRY RUN] No data will be written.\n');

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ---------------------------------------------------------------------------
// Spotify auth (client credentials flow)
// ---------------------------------------------------------------------------

let spotifyToken = '';
let tokenExpiry = 0;

async function getSpotifyToken(): Promise<string> {
  if (spotifyToken && Date.now() < tokenExpiry) return spotifyToken;

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  spotifyToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min early
  return spotifyToken;
}

// ---------------------------------------------------------------------------
// Spotify search
// ---------------------------------------------------------------------------

interface SpotifyMatch {
  trackId: string;
  trackName: string;
  artistName: string;
  popularity: number;
  url: string;
}

async function searchSpotify(title: string, composer: string): Promise<SpotifyMatch | null> {
  const token = await getSpotifyToken();

  // Use composer last name + title for better classical music matching
  const composerLast = composer.split(' ').pop() || composer;
  const q = `${title} ${composerLast}`;

  const params = new URLSearchParams({
    q,
    type: 'track',
    limit: '5',
  });

  const res = await fetch(`${SPOTIFY_SEARCH_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 429) {
    // Rate limited — wait and retry
    const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
    console.error(`  [429] Rate limited, waiting ${retryAfter}s...`);
    await sleep(retryAfter * 1000);
    return searchSpotify(title, composer);
  }

  if (!res.ok) return null;

  const data = await res.json();
  const tracks = data?.tracks?.items;
  if (!tracks || tracks.length === 0) return null;

  // Pick the most popular track that meets the threshold
  const best = tracks
    .filter((t: any) => t.popularity >= MIN_POPULARITY)
    .sort((a: any, b: any) => b.popularity - a.popularity)[0];

  if (!best) return null;

  return {
    trackId: best.id,
    trackName: best.name,
    artistName: best.artists?.[0]?.name || 'Unknown',
    popularity: best.popularity,
    url: best.external_urls?.spotify || `https://open.spotify.com/track/${best.id}`,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Spotify Matching Pass');
  console.log('=====================\n');

  // Get pieces that don't already have a Spotify link
  console.log('Fetching pieces without Spotify links...');

  // Get IDs of pieces that already have spotify links
  const { data: existingLinks } = await supabase
    .from('external_links')
    .select('piece_id')
    .eq('type', 'spotify');

  const linkedIds = new Set((existingLinks || []).map((l: any) => l.piece_id));

  // Get all pieces
  let query = supabase
    .from('pieces')
    .select('id, title, composer_name')
    .order('id')
    .range(OFFSET, OFFSET + (LIMIT || 100000) - 1);

  const { data: pieces, error } = await query;

  if (error || !pieces) {
    console.error('Failed to fetch pieces:', error?.message);
    process.exit(1);
  }

  // Filter out pieces that already have Spotify links
  const toMatch = pieces.filter((p: any) => !linkedIds.has(p.id));
  console.log(`Found ${pieces.length} pieces total, ${toMatch.length} need Spotify matching.\n`);

  let matched = 0;
  let skipped = 0;
  let noMatch = 0;
  let errors = 0;

  for (let i = 0; i < toMatch.length; i++) {
    const piece = toMatch[i];

    try {
      const result = await searchSpotify(piece.title, piece.composer_name);

      if (result) {
        matched++;
        if (isDryRun) {
          console.log(`  [MATCH] ${piece.composer_name} — ${piece.title}`);
          console.log(`          → ${result.artistName}: ${result.trackName} (pop: ${result.popularity})`);
        } else {
          const linkId = `spotify-${piece.id}`.slice(0, 120);
          await supabase.from('external_links').upsert({
            id: linkId,
            piece_id: piece.id,
            type: 'spotify',
            url: result.url,
            label: `${result.artistName} — ${result.trackName}`,
            source: 'spotify',
          }, { onConflict: 'id', ignoreDuplicates: true });
        }
      } else {
        noMatch++;
      }
    } catch (err: any) {
      errors++;
      console.error(`  [ERR] ${piece.id}: ${err.message}`);
    }

    // Rate limit
    await sleep(RATE_LIMIT_DELAY_MS);

    // Progress
    if ((i + 1) % 50 === 0 || i === toMatch.length - 1) {
      process.stdout.write(`  Progress: ${i + 1}/${toMatch.length} (${matched} matched, ${noMatch} no match, ${errors} errors)\r`);
    }
  }

  console.log('\n\n========================================');
  console.log(`  Matched:   ${matched}`);
  console.log(`  No match:  ${noMatch}`);
  console.log(`  Skipped:   ${pieces.length - toMatch.length} (already linked)`);
  console.log(`  Errors:    ${errors}`);
  console.log('========================================\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
