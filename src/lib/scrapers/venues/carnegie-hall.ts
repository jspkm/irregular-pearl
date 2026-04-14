/**
 * Carnegie Hall — calendar is powered by Algolia (Q0TMLOPF1J / prod_Events).
 * Algolia gives title/date/url only; the description and event-specific
 * poster live on each detail page as `.ch-page-hero-block__intro` and
 * `.ch-page-hero-block__image img`. Those templates are hydrated by JS,
 * so we use Playwright to enrich each event.
 */

import type { VenueScraper, VenueEvent } from './types';

const ALGOLIA_APP = 'Q0TMLOPF1J';
const ALGOLIA_KEY = 'd2d2b382f2659c44ef8927aad7a24172';
const ALGOLIA_INDEX = 'prod_Events';

interface AlgoliaHit {
  title?: string;
  url?: string;
  startdate?: number; // epoch ms
  time?: string;
  facility?: string;
  genre?: string[];
}

function parseTime(t?: string): string | undefined {
  if (!t) return undefined;
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return undefined;
  let h = parseInt(m[1], 10);
  const min = m[2] ?? '00';
  const ampm = m[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

function inferEventType(genre?: string[]): VenueEvent['event_type'] {
  if (!genre?.length) return 'concert';
  const g = genre.join(' ').toLowerCase();
  if (g.includes('recital')) return 'recital';
  if (g.includes('master')) return 'masterclass';
  if (g.includes('competition')) return 'competition';
  if (g.includes('festival')) return 'festival';
  return 'concert';
}

export const carnegieHall: VenueScraper = {
  slug: 'carnegie-hall',
  name: 'Carnegie Hall',
  city: 'New York',
  country: 'USA',
  url: 'https://www.carnegiehall.org/Calendar',

  async scrape(): Promise<VenueEvent[]> {
    const now = Date.now();
    const out: VenueEvent[] = [];
    const PAGE_SIZE = 100;
    for (let pg = 0; pg < 5; pg++) {
      const r = await fetch(
        `https://q0tmlopf1j-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=irregular-pearl-scraper`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(20_000),
          headers: {
            'x-algolia-api-key': ALGOLIA_KEY,
            'x-algolia-application-id': ALGOLIA_APP,
            'content-type': 'application/x-www-form-urlencoded',
            referer: 'https://www.carnegiehall.org/',
          },
          body: JSON.stringify({
            requests: [
              {
                indexName: ALGOLIA_INDEX,
                params: `hitsPerPage=${PAGE_SIZE}&page=${pg}&numericFilters=${encodeURIComponent(`startdate>${now}`)}`,
              },
            ],
          }),
        }
      );
      if (!r.ok) throw new Error(`carnegie algolia ${r.status}`);
      const data = (await r.json()) as { results: { hits: AlgoliaHit[]; nbPages: number }[] };
      const hits = data.results?.[0]?.hits ?? [];
      for (const h of hits) {
        if (!h.title || !h.startdate || !h.url) continue;
        // Skip events at off-site facilities — we want events at Carnegie Hall proper.
        if (h.facility && !/Carnegie Hall|Stern|Perelman|Zankel|Weill/i.test(h.facility)) continue;
        const date = new Date(h.startdate).toISOString().slice(0, 10);
        out.push({
          title: h.title,
          event_date: date,
          start_time: parseTime(h.time),
          url: `https://www.carnegiehall.org${h.url}`,
          event_type: inferEventType(h.genre),
        });
      }
      if (hits.length < PAGE_SIZE || pg + 1 >= (data.results?.[0]?.nbPages ?? 1)) break;
    }
    await enrichFromDetailPages(out);
    return out;
  },
};

async function enrichFromDetailPages(events: VenueEvent[]): Promise<void> {
  if (events.length === 0) return;
  let chromium: typeof import('playwright').chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.warn('[carnegie] playwright not available — skipping detail enrichment');
    return;
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    const CONC = 4;
    let idx = 0;
    let enriched = 0;
    await Promise.all(
      Array.from({ length: CONC }, async () => {
        const page = await ctx.newPage();
        while (true) {
          const i = idx++;
          if (i >= events.length) break;
          const e = events[i];
          try {
            await page.goto(e.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
            // Wait for the hero block to hydrate (JS-rendered). Rental /
            // offsite events don't have it — fall through after the timeout.
            await page
              .waitForSelector('.ch-page-hero-block__image img, .ch-page-hero-block__intro', { timeout: 10_000 })
              .catch(() => null);
            const data = await page.evaluate(() => {
              const img = document.querySelector<HTMLImageElement>('.ch-page-hero-block__image img');
              const intro = document.querySelector('.ch-page-hero-block__intro');
              return {
                image: img?.src ?? null,
                intro: intro?.textContent?.trim() ?? null,
              };
            });
            if (data.image) e.image_url = data.image;
            if (data.intro) e.description = data.intro;
            if (data.image || data.intro) enriched++;
          } catch {
            /* skip this event */
          }
        }
        await page.close();
      })
    );
    console.log(`[carnegie] enriched ${enriched}/${events.length} detail pages`);
  } finally {
    await browser.close();
  }
}
