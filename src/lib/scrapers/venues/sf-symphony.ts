/**
 * SF Symphony — calendar uses Algolia (3ZVEWSXVK4 / prod_sfs_calendar).
 * Fields: title (HTML-escaped), performanceDate (ISO local), startDate (epoch),
 * artists, composers, conductors, works (HTML-em wrapped), venue, kenticoUrl,
 * image.src, Concert Type.
 */

import type { VenueScraper, VenueEvent } from './types';

const APP = '3ZVEWSXVK4';
const KEY = 'e6c0617a0995d310c9dd600df5af93c2';
const INDEX = 'prod_sfs_calendar';

interface Hit {
  title?: string;
  performanceDate?: string;
  startDate?: number; // seconds
  kenticoUrl?: string;
  image?: { src?: string };
  artists?: string[];
  composers?: string[];
  conductors?: string[];
  works?: string[];
  venue?: string;
  'Concert Type'?: string[];
  hideTime?: boolean;
}

function stripHtml(s?: string): string | undefined {
  return s
    ?.replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function inferEventType(types?: string[]): VenueEvent['event_type'] {
  if (!types?.length) return 'concert';
  const t = types.join(' ').toLowerCase();
  if (t.includes('recital')) return 'recital';
  if (t.includes('master')) return 'masterclass';
  if (t.includes('festival')) return 'festival';
  return 'concert';
}

export const sfSymphony: VenueScraper = {
  slug: 'sf-symphony',
  name: 'Davies Symphony Hall',
  city: 'San Francisco',
  country: 'USA',
  url: 'https://www.sfsymphony.org/Buy-Tickets',

  async scrape(): Promise<VenueEvent[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    const out: VenueEvent[] = [];
    const PAGE = 100;
    for (let pg = 0; pg < 5; pg++) {
      const r = await fetch(
        `https://${APP.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries?x-algolia-api-key=${KEY}&x-algolia-application-id=${APP}`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(20_000),
          headers: { 'content-type': 'application/x-www-form-urlencoded', referer: 'https://www.sfsymphony.org/' },
          body: JSON.stringify({
            requests: [
              {
                indexName: INDEX,
                params: `hitsPerPage=${PAGE}&page=${pg}&numericFilters=${encodeURIComponent(`startDate>=${nowSec}`)}`,
              },
            ],
          }),
        }
      );
      if (!r.ok) throw new Error(`sf-symphony algolia ${r.status}`);
      const data = (await r.json()) as { results: { hits: Hit[]; nbPages?: number }[] };
      const hits = data.results?.[0]?.hits ?? [];
      for (const h of hits) {
        if (!h.title || !h.performanceDate || !h.kenticoUrl) continue;
        // Skip non-Davies events (the index also has chamber music at other halls).
        if (h.venue && !/Davies|SoundBox/i.test(h.venue)) continue;
        const date = h.performanceDate.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        const time = h.hideTime ? undefined : h.performanceDate.slice(11, 16);
        const program = (h.works ?? []).map((w, i) => {
          const composer = h.composers?.[i] ?? h.composers?.[0];
          const work = stripHtml(w);
          return composer ? `${composer}: ${work}` : (work ?? '');
        }).filter(Boolean);
        out.push({
          title: stripHtml(h.title) || h.title,
          event_date: date,
          start_time: time,
          url: `https://www.sfsymphony.org${h.kenticoUrl}`,
          image_url: h.image?.src,
          performers: [...(h.artists ?? []), ...(h.conductors ?? [])],
          program,
          event_type: inferEventType(h['Concert Type']),
        });
      }
      if (hits.length < PAGE || pg + 1 >= (data.results?.[0]?.nbPages ?? 1)) break;
    }
    return out;
  },
};
