/**
 * Google Events scraper using Playwright.
 *
 * Searches Google Events for "classical music concerts [city]" and extracts
 * structured event data from the rendered page. Uses a headless browser
 * because Google Events is client-side rendered (no JSON-LD in initial HTML).
 *
 * Runs on GitHub Actions (Playwright installed) or locally.
 */

import type { ScraperAdapter, ScraperResult, EventCandidate } from './types';

const REQUEST_DELAY_MS = 3000;

// Top 20 cities for Google Events (Playwright is slow, keep this shorter than Bachtrack)
const TARGET_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Boston', 'San Francisco',
  'London', 'Berlin', 'Vienna', 'Paris', 'Amsterdam',
  'Tokyo', 'Seoul', 'Sydney', 'Toronto', 'Munich',
  'Milan', 'Prague', 'Budapest', 'Tel Aviv', 'Singapore',
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function inferEventType(text: string): EventCandidate['event_type'] {
  const lower = text.toLowerCase();
  if (lower.includes('recital')) return 'recital';
  if (lower.includes('masterclass') || lower.includes('master class')) return 'masterclass';
  if (lower.includes('competition')) return 'competition';
  if (lower.includes('festival')) return 'festival';
  return 'concert';
}

/**
 * Parse JSON-LD Event objects from rendered HTML.
 */
export function parseGoogleEvents(html: string, city: string): EventCandidate[] {
  const candidates: EventCandidate[] = [];

  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item['@type'] !== 'Event' && item['@type'] !== 'MusicEvent') continue;

        const title = item.name?.trim();
        if (!title) continue;

        const startDate = item.startDate || '';
        const dateMatch = startDate.match(/^(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) continue;
        const event_date = dateMatch[1];

        if (new Date(event_date) < new Date(new Date().toISOString().split('T')[0])) continue;

        const timeMatch = startDate.match(/T(\d{2}:\d{2})/);
        const start_time = timeMatch ? timeMatch[1] : undefined;

        const location = item.location;
        const venue = typeof location === 'string'
          ? location
          : location?.name || location?.address?.name || 'Unknown venue';
        const venueCity = location?.address?.addressLocality || city;

        const url = item.url || undefined;

        const performers: string[] = [];
        if (item.performer) {
          const perfs = Array.isArray(item.performer) ? item.performer : [item.performer];
          for (const p of perfs) {
            const name = typeof p === 'string' ? p : p.name;
            if (name) performers.push(name.trim());
          }
        }

        candidates.push({
          title,
          venue,
          city: venueCity,
          event_date,
          start_time,
          event_type: inferEventType(title),
          url,
          description: item.description?.slice(0, 500) || undefined,
          performers: performers.length > 0 ? performers : undefined,
        });
      }
    } catch {
      // JSON parse error, skip
    }
  }

  return candidates;
}

export class GoogleEventsScraper implements ScraperAdapter {
  readonly source = 'google';
  private cities: string[];

  constructor(cities?: string[]) {
    this.cities = cities || TARGET_CITIES;
  }

  async scrape(): Promise<ScraperResult> {
    const errors: string[] = [];
    const allCandidates: EventCandidate[] = [];

    let chromium: any;
    let browser: any;

    try {
      // Dynamic import so the module still loads if playwright isn't installed
      const pw = await import('playwright');
      chromium = pw.chromium;
    } catch {
      errors.push('Playwright not installed. Run: bun add -d playwright && bunx playwright install chromium');
      return { source: 'google', candidates: [], errors };
    }

    try {
      browser = await chromium.launch({ headless: true });
    } catch (err) {
      errors.push(`Failed to launch browser: ${err instanceof Error ? err.message : String(err)}. Run: bunx playwright install chromium`);
      return { source: 'google', candidates: [], errors };
    }

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        locale: 'en-US',
      });

      for (const city of this.cities) {
        try {
          const page = await context.newPage();
          const query = encodeURIComponent(`classical music concerts ${city}`);
          const url = `https://www.google.com/search?q=${query}&ibp=htl;events`;

          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

          // Wait for event cards to render
          await page.waitForTimeout(2000);

          const html = await page.content();
          const cityEvents = parseGoogleEvents(html, city);
          allCandidates.push(...cityEvents);

          console.log(`[google-events] ${city}: ${cityEvents.length} events found`);
          await page.close();
          await sleep(REQUEST_DELAY_MS);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Google fetch error for ${city}: ${msg}`);
        }
      }

      await context.close();
    } finally {
      await browser?.close();
    }

    return { source: 'google', candidates: allCandidates, errors };
  }
}
