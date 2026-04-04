/**
 * Google Events scraper.
 *
 * Searches Google for "classical music events [city] this week" and parses
 * the structured event cards from the HTML response. Runs locally (home IP)
 * to avoid cloud IP blocking.
 *
 * Google event cards use structured data (JSON-LD) embedded in the page,
 * which is more stable than Bachtrack's custom HTML classes.
 */

import type { ScraperAdapter, ScraperResult, EventCandidate } from './types';

const FETCH_TIMEOUT_MS = 30000;
const REQUEST_DELAY_MS = 2000; // be respectful, 1 query per 2 seconds

// Cities to search — start small, expand based on user base
const TARGET_CITIES = [
  'New York',
  'Boston',
  'San Francisco',
  'Los Angeles',
  'Chicago',
  'Philadelphia',
  'Washington DC',
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
 * Parse JSON-LD event data from Google search results.
 * Google embeds Event schema.org objects in script tags.
 */
export function parseGoogleEvents(html: string, city: string): EventCandidate[] {
  const candidates: EventCandidate[] = [];

  // Extract JSON-LD blocks
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

        // Extract date
        const startDate = item.startDate || '';
        const dateMatch = startDate.match(/^(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) continue;
        const event_date = dateMatch[1];

        // Skip past events
        if (new Date(event_date) < new Date(new Date().toISOString().split('T')[0])) continue;

        // Extract time
        const timeMatch = startDate.match(/T(\d{2}:\d{2})/);
        const start_time = timeMatch ? timeMatch[1] : undefined;

        // Extract venue
        const location = item.location;
        const venue = typeof location === 'string'
          ? location
          : location?.name || location?.address?.name || 'Unknown venue';

        const venueCity = location?.address?.addressLocality || city;

        // Extract URL
        const url = item.url || undefined;

        // Extract ticket price
        let ticket_price: string | undefined;
        if (item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
          const prices = offers
            .filter((o: any) => o.price)
            .map((o: any) => `$${o.price}`);
          if (prices.length > 0) ticket_price = prices.join('-');
          else if (offers.some((o: any) => o.price === 0 || o.price === '0')) ticket_price = 'Free';
        }

        // Extract performers
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
      // JSON parse error — skip this block
    }
  }

  // Fallback: parse event cards from HTML if no JSON-LD found
  if (candidates.length === 0) {
    const eventCardPattern = /<div[^>]*data-ved[^>]*>[\s\S]*?<div[^>]*class="[^"]*YOGjf[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div[^>]*class="[^"]*cEZxRc[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let cardMatch;

    while ((cardMatch = eventCardPattern.exec(html)) !== null) {
      const title = cardMatch[1].replace(/<[^>]+>/g, '').trim();
      const meta = cardMatch[2].replace(/<[^>]+>/g, '').trim();
      if (!title) continue;

      // Try to extract date from meta text
      const dateStr = meta.match(/(\w+ \d{1,2},? \d{4})/)?.[1];
      if (!dateStr) continue;

      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) continue;
      const event_date = parsed.toISOString().split('T')[0];

      candidates.push({
        title,
        venue: 'See event details',
        city,
        event_date,
        event_type: inferEventType(title),
      });
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

    for (const city of this.cities) {
      try {
        const query = encodeURIComponent(`classical music concerts ${city} this week`);
        const url = `https://www.google.com/search?q=${query}&ibp=htl;events`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          errors.push(`Google returned ${response.status} for ${city}`);
          await sleep(REQUEST_DELAY_MS);
          continue;
        }

        const html = await response.text();
        const cityEvents = parseGoogleEvents(html, city);
        allCandidates.push(...cityEvents);

        console.log(`[google-events] ${city}: ${cityEvents.length} events found`);
        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Google fetch error for ${city}: ${msg}`);
      }
    }

    return { source: 'google', candidates: allCandidates, errors };
  }
}
