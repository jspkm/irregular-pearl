/**
 * Berliner Philharmoniker — Typesense-backed calendar at
 * /filter/search/collections/performance_1/documents/search.
 *
 * Data shape:
 *   - artists: [{ name, role }]            (clean, preferred)
 *   - artists_raw: "Conductor Soloist..."  (whitespace-jammed string)
 *   - works: [{}]                          (empty objects — don't use)
 *   - works_raw: "Composer Work ...Programme note" (multi-line string)
 *   - thumbnail.formats.sm.src: relative image path
 *   - detail_url: "/en/concert/calendar/<id>/"
 *   - primary_category: 'concert_cat' | 'guest_cat' | 'house_tour_cat' | 'chamber_music_cat'
 *     (we filter out house_tour_cat)
 */

import type { VenueScraper, VenueEvent } from './types';

const KEY = '09zNJI6igIRLJHhNB2YGwgaX0JApQYOL';
const BASE = 'https://www.berliner-philharmoniker.de';

interface Hit {
  document?: {
    title?: string;
    super_title?: string;
    time_start?: number;
    detail_url?: string;
    thumbnail?: { formats?: { lg?: { src?: string }; md?: { src?: string }; sm?: { src?: string } } };
    artists?: { name?: string; role?: string }[];
    artists_raw?: string;
    works_raw?: string;
    primary_category?: string;
    is_house_tour?: boolean;
  };
}

function extractProgram(worksRaw?: string): string[] {
  if (!worksRaw) return [];
  // The string is long whitespace-delimited lines of alternating tokens.
  // Heuristic: split on 2+ spaces, then fold pairs "Composer" + "Work" into "Composer: Work".
  // "Programme note" trailer, if present, gets dropped.
  const tokens = worksRaw
    .replace(/Programme note.*$/i, '')
    .split(/\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Dumb pairing: consecutive tokens where first looks like a composer (ends with a name)
  // and second starts with a capital work title. Good enough for display; users who
  // want precise info click through.
  if (tokens.length >= 2) return tokens;
  return [];
}

function pickImage(d: NonNullable<Hit['document']>): string | undefined {
  const p = d.thumbnail?.formats?.lg?.src ?? d.thumbnail?.formats?.md?.src ?? d.thumbnail?.formats?.sm?.src;
  if (!p) return undefined;
  return p.startsWith('http') ? p : `${BASE}${p}`;
}

export const berlinPhil: VenueScraper = {
  slug: 'berlin-phil',
  name: 'Berliner Philharmonie',
  city: 'Berlin',
  country: 'Germany',
  url: 'https://www.berliner-philharmoniker.de/en/concerts/calendar/',

  async scrape(): Promise<VenueEvent[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    const out: VenueEvent[] = [];
    const PAGE = 100;
    for (let pg = 1; pg <= 5; pg++) {
      const params = new URLSearchParams({
        q: '*',
        query_by: 'title',
        filter_by: `time_start:>=${nowSec} && is_house_tour:false`,
        sort_by: 'time_start:asc',
        per_page: String(PAGE),
        page: String(pg),
      });
      const r = await fetch(`${BASE}/filter/search/collections/performance_1/documents/search?${params}`, {
        signal: AbortSignal.timeout(20_000),
        headers: {
          accept: 'application/json',
          referer: 'https://www.berliner-philharmoniker.de/en/concerts/calendar/',
          'x-typesense-api-key': KEY,
        },
      });
      if (!r.ok) throw new Error(`berlin-phil typesense ${r.status}`);
      const data = (await r.json()) as { hits?: Hit[] };
      const hits = data.hits ?? [];
      for (const h of hits) {
        const d = h.document;
        if (!d?.title || !d?.time_start) continue;
        const dt = new Date(d.time_start * 1000);
        const date = dt.toISOString().slice(0, 10);
        const time = dt.toISOString().slice(11, 16);
        const title = [d.super_title, d.title].filter((x) => x && x !== d.title).concat(d.title).join(' — ').slice(0, 200);
        const performers = (d.artists ?? [])
          .map((a) => (a.name ? (a.role ? `${a.name} (${a.role})` : a.name) : ''))
          .filter(Boolean);
        const program = extractProgram(d.works_raw);
        out.push({
          title: title || d.title,
          event_date: date,
          start_time: time,
          url: d.detail_url ? `${BASE}${d.detail_url}` : 'https://www.berliner-philharmoniker.de/en/concerts/calendar/',
          image_url: pickImage(d),
          performers: performers.length ? performers : undefined,
          program: program.length ? program : undefined,
        });
      }
      if (hits.length < PAGE) break;
    }
    return out;
  },
};
