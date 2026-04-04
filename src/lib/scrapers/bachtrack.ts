/**
 * Bachtrack HTML scraper.
 *
 * EXPERIMENTAL: Bachtrack ToS likely prohibits scraping. This adapter is
 * not a launch dependency. Run locally (home IP) to avoid cloud IP blocking.
 *
 * Parses bachtrack.com/search-concerts listing blocks.
 *
 * Bachtrack HTML structure (as of 2026-04):
 *   <div data-id="433573" data-dates="1775296800">
 *     <div class="listing-shortform ...">
 *       <div class="listing-shortform-dates">Sat  4 Apr at 11:00</div>
 *       <h2 class="li-shortform-venue"><a href="/venue/...">Wigmore Hall</a>, <a href="/city/...">London</a></h2>
 *       <div class="li-shortform-title">Event Title Here</div>
 *       <a class="listing-more-info" href="/concert-event/...">More info</a>
 *       <span class="performername">Martha McLorinan</span>
 *     </div>
 *   </div>
 */

import type { ScraperAdapter, ScraperResult, EventCandidate } from './types';

const BACHTRACK_BASE = 'https://bachtrack.com/search-concerts';
const REQUEST_DELAY_MS = 1500;
const FETCH_TIMEOUT_MS = 30000;
const MAX_PER_CITY_PER_DAY = 5;

// US cities: slug (Bachtrack URL) → display name
const US_CITIES: Record<string, string> = {
  'new-york-city': 'New York',
  'boston': 'Boston',
  'san-francisco': 'San Francisco',
  'los-angeles': 'Los Angeles',
  'chicago': 'Chicago',
  'philadelphia': 'Philadelphia',
  'washington': 'Washington DC',
  'houston': 'Houston',
  'seattle': 'Seattle',
  'cleveland': 'Cleveland',
};

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
 * Parse date from Bachtrack's data-dates attribute (unix timestamp in seconds)
 * or from the listing-shortform-dates text.
 */
function parseBachtrackDate(dataDates: string, dateText: string): { event_date: string; start_time?: string } | null {
  // Try unix timestamp first (more reliable)
  const timestamps = dataDates.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  if (timestamps.length > 0) {
    const d = new Date(timestamps[0] * 1000);
    const event_date = d.toISOString().split('T')[0];
    const hours = d.getUTCHours();
    const mins = d.getUTCMinutes();
    const start_time = (hours > 0 || mins > 0)
      ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
      : undefined;
    return { event_date, start_time };
  }

  // Fallback: parse text like "Sat  4 Apr at 11:00"
  const textMatch = dateText.match(/(\d{1,2})\s+(\w+)(?:\s+at\s+(\d{2}:\d{2}))?/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2];
    const time = textMatch[3];
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const month = months[monthStr];
    if (month !== undefined) {
      const year = new Date().getFullYear();
      const d = new Date(year, month, day);
      return {
        event_date: d.toISOString().split('T')[0],
        start_time: time || undefined,
      };
    }
  }

  return null;
}

/**
 * Parse Bachtrack listing blocks from HTML.
 */
export function parseEventListing(html: string, fallbackCity?: string): EventCandidate[] {
  const candidates: EventCandidate[] = [];

  // Match full listing blocks: from <div data-id="X"> to <li data-id="X">
  const listingPattern = /<div\s+data-id="(\d+)"[^>]*data-dates="([^"]*)"[^>]*>([\s\S]*?)<li\s+data-id="\1"/gi;
  let match;

  while ((match = listingPattern.exec(html)) !== null) {
    const dataId = match[1];
    const dataDates = match[2];
    const block = match[3];

    // Extract title from li-shortform-title
    const titleMatch = block.match(/<div\s+class="li-shortform-title"[^>]*>([\s\S]*?)<\/div>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() : '';
    if (!title) continue;

    // Extract venue from li-shortform-venue links
    const venueMatch = block.match(/<h2\s+class="li-shortform-venue"[^>]*>([\s\S]*?)<\/h2>/i);
    let venue = '';
    let city = '';
    if (venueMatch) {
      const venueHtml = venueMatch[1];
      // First <a> is venue, second is city (if present)
      const links = [...venueHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/gi)];
      if (links.length >= 2) {
        venue = links[0][1].trim();
        city = links[1][1].trim();
      } else if (links.length === 1) {
        venue = links[0][1].trim();
      } else {
        venue = venueHtml.replace(/<[^>]+>/g, '').trim();
      }
    }

    // Parse date
    const dateText = block.match(/<div\s+class="listing-shortform-dates"[^>]*>([\s\S]*?)<\/div>/i);
    const parsed = parseBachtrackDate(dataDates, dateText ? dateText[1].replace(/<[^>]+>/g, '').trim() : '');
    if (!parsed) continue;

    // Skip past events
    if (new Date(parsed.event_date) < new Date(new Date().toISOString().split('T')[0])) continue;

    // Extract URL from listing-more-info link or concert-event href
    const urlMatch = block.match(/href="(\/concert-event\/[^"]+)"/i);
    const url = urlMatch ? `https://bachtrack.com${urlMatch[1]}` : undefined;

    // Extract image from listing image
    const imgMatch = block.match(/src="(https:\/\/cdn\.bachtrack\.com\/[^"]+\.(jpg|webp|png))"/i);
    const image_url = imgMatch ? imgMatch[1] : undefined;

    // Extract performers
    const performers: string[] = [];
    const perfPattern = /<span\s+class="performername"[^>]*>([^<]+)<\/span>/gi;
    let perfMatch;
    while ((perfMatch = perfPattern.exec(block)) !== null) {
      const name = perfMatch[1].trim();
      if (name) performers.push(name);
    }

    candidates.push({
      title,
      venue: venue || 'Unknown venue',
      city: city || fallbackCity || 'Unknown',
      event_date: parsed.event_date,
      start_time: parsed.start_time,
      event_type: inferEventType(title),
      url,
      image_url,
      performers: performers.length > 0 ? performers : undefined,
    });
  }

  return candidates;
}

/**
 * Cap events to MAX_PER_CITY_PER_DAY per city per date for variety.
 */
function capPerCityPerDay(candidates: EventCandidate[]): EventCandidate[] {
  const counts: Record<string, number> = {};
  return candidates.filter(c => {
    const key = `${c.city}|${c.event_date}`;
    counts[key] = (counts[key] || 0) + 1;
    return counts[key] <= MAX_PER_CITY_PER_DAY;
  });
}

export class BachtrackScraper implements ScraperAdapter {
  readonly source = 'bachtrack';

  async scrape(): Promise<ScraperResult> {
    const errors: string[] = [];
    let allCandidates: EventCandidate[] = [];

    const today = new Date().toISOString().split('T')[0];
    const twoMonths = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

    // Bachtrack loads most listings via JS, so we need a headless browser
    let chromium: any;
    let browser: any;

    try {
      const pw = await import('playwright');
      chromium = pw.chromium;
    } catch {
      // Fallback to fetch (gets only 4 promoted events per city)
      errors.push('Playwright not installed. Run: bunx playwright install chromium. Falling back to fetch (limited results).');
      for (const [citySlug, cityName] of Object.entries(US_CITIES)) {
        try {
          const url = `${BACHTRACK_BASE}/city/${citySlug}?date_from=${today}&date_to=${twoMonths}&genre=1`;
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'text/html' },
          });
          if (response.ok) {
            const html = await response.text();
            allCandidates.push(...parseEventListing(html, cityName));
          }
          await sleep(REQUEST_DELAY_MS);
        } catch {}
      }
      const capped = capPerCityPerDay(allCandidates);
      return { source: this.source, candidates: capped, errors };
    }

    try {
      browser = await chromium.launch({ headless: true });
    } catch (err) {
      errors.push(`Failed to launch browser: ${err instanceof Error ? err.message : String(err)}`);
      return { source: this.source, candidates: [], errors };
    }

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        locale: 'en-US',
      });

      for (const [citySlug, cityName] of Object.entries(US_CITIES)) {
        try {
          const page = await context.newPage();
          const url = `${BACHTRACK_BASE}/city/${citySlug}?date_from=${today}&date_to=${twoMonths}&genre=1`;

          await page.goto(url, { waitUntil: 'networkidle', timeout: FETCH_TIMEOUT_MS });
          await page.waitForTimeout(2000);

          const html = await page.content();
          const cityCandidates = parseEventListing(html, cityName);
          allCandidates.push(...cityCandidates);

          console.log(`[bachtrack] ${cityName}: ${cityCandidates.length} events`);
          await page.close();
          await sleep(REQUEST_DELAY_MS);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Bachtrack error for ${cityName}: ${msg}`);
        }
      }

      await context.close();
    } finally {
      await browser?.close();
    }

    // Cap to MAX_PER_CITY_PER_DAY for variety across dates
    const capped = capPerCityPerDay(allCandidates);
    console.log(`[bachtrack] ${allCandidates.length} total, ${capped.length} after cap (max ${MAX_PER_CITY_PER_DAY}/city/day)`);

    return { source: this.source, candidates: capped, errors };
  }
}
