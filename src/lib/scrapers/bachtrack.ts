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
// No city list — global search, extract city from each listing's content.
const MAX_PER_CITY_PER_DAY = 10;

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
 * Parse date and time from Bachtrack listing text.
 * Uses the displayed text (no timezone conversion) so times match
 * what the venue shows. Falls back to unix timestamp for date only.
 *
 * Examples:
 *   "Sat  4 Apr at 11:00"  → { event_date: "2026-04-04", start_time: "11:00" }
 *   "Apr 04 mat, 05 mat"   → { event_date: "2026-04-04" }
 */
function parseBachtrackDate(dataDates: string, dateText: string): { event_date: string; start_time?: string } | null {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const year = new Date().getFullYear();

  // Try parsing display text first (preserves local time as shown)
  // Pattern: "Sat  4 Apr at 11:00" or "4 Apr at 19:30" or "Apr 04 mat"
  const textMatch = dateText.match(/(\d{1,2})\s+(\w{3})(?:\s+at\s+(\d{1,2}:\d{2}))?/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const month = months[textMatch[2]];
    if (month !== undefined) {
      const d = new Date(year, month, day);
      // If the date is in the past, it's probably next year
      if (d < new Date(new Date().toISOString().split('T')[0])) d.setFullYear(year + 1);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return {
        event_date: `${d.getFullYear()}-${mm}-${dd}`,
        start_time: textMatch[3] || undefined,
      };
    }
  }

  // Pattern: "Apr 04 mat, 05 mat" (multi-date, take the first)
  const altMatch = dateText.match(/(\w{3})\s+(\d{1,2})/);
  if (altMatch) {
    const month = months[altMatch[1]];
    const day = parseInt(altMatch[2], 10);
    if (month !== undefined) {
      const d = new Date(year, month, day);
      if (d < new Date(new Date().toISOString().split('T')[0])) d.setFullYear(year + 1);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return { event_date: `${d.getFullYear()}-${mm}-${dd}` };
    }
  }

  // Last resort: unix timestamp (for date only, no time — timezone unreliable)
  const timestamps = dataDates.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  if (timestamps.length > 0) {
    const d = new Date(timestamps[0] * 1000);
    return { event_date: d.toISOString().split('T')[0] };
  }

  return null;
}

/**
 * Parse Bachtrack listing blocks from HTML.
 */
export function parseEventListing(html: string, fallbackCity?: string): EventCandidate[] {
  const candidates: EventCandidate[] = [];

  // Match full listing blocks: from <div data-id="X"> through the closing </li>
  const listingPattern = /<div\s+data-id="(\d+)"[^>]*data-dates="([^"]*)"[^>]*>([\s\S]*?)<\/li>/gi;
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
        // Venue without links (e.g. "Opéra de Monte-Carlo")
        venue = venueHtml.replace(/<[^>]+>/g, '').trim();
      }
    }

    // Fallback: extract city from listing-ms-city (mobile layout in same block)
    if (!city) {
      const msCityMatch = block.match(/listing-ms-city"?>([^<]+)/i);
      if (msCityMatch) city = msCityMatch[1].trim();
    }

    // Fallback: extract venue from listing-ms-venue if not found above
    if (!venue) {
      const msVenueMatch = block.match(/listing-ms-venue"?>([^<]+)/i);
      if (msVenueMatch) venue = msVenueMatch[1].trim();
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

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"]/i)
      ?? html.match(/<meta[^>]+content=['"]([^'"]+)['"][^>]+property=['"]og:image['"]/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function enrichPosters(candidates: EventCandidate[], errors: string[]): Promise<void> {
  const targets = candidates.filter((c) => c.url && c.url.includes('bachtrack.com'));
  const CONC = 4;
  let i = 0;
  let updated = 0;
  await Promise.all(
    Array.from({ length: CONC }, async () => {
      while (true) {
        const idx = i++;
        if (idx >= targets.length) return;
        const c = targets[idx];
        const og = await fetchOgImage(c.url!);
        if (og) {
          c.image_url = og;
          updated++;
        }
        await sleep(500);
      }
    })
  );
  console.log(`[bachtrack] enriched ${updated}/${targets.length} poster_urls from detail pages`);
  if (updated < targets.length / 2) {
    errors.push(`Poster enrichment low yield: ${updated}/${targets.length}`);
  }
}

export class BachtrackScraper implements ScraperAdapter {
  readonly source = 'bachtrack';

  async scrape(): Promise<ScraperResult> {
    const errors: string[] = [];
    let allCandidates: EventCandidate[] = [];

    const today = new Date().toISOString().split('T')[0];
    const twoMonths = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    // Bachtrack's global search (no city filter) returns 50 events per page
    // with full worldwide coverage. City-filtered searches only return ~4
    // premium listings. One global fetch gives us the best variety.
    //
    // Pagination: Bachtrack loads pages via AJAX with a page= param.
    // We fetch multiple pages to get broad coverage.
    const PAGES_TO_FETCH = 4; // 50 events/page × 4 = up to 200 events

    let chromium: any;
    let browser: any;
    let usePlaywright = false;

    try {
      const pw = await import('playwright');
      chromium = pw.chromium;
      browser = await chromium.launch({ headless: true });
      usePlaywright = true;
    } catch {
      // Playwright not available, fall back to fetch
    }

    for (let pg = 1; pg <= PAGES_TO_FETCH; pg++) {
      try {
        const pageParam = pg > 1 ? `&page=${pg}` : '';
        const url = `${BACHTRACK_BASE}?date_from=${today}&date_to=${twoMonths}&genre=1${pageParam}`;

        let html = '';

        if (usePlaywright && browser) {
          const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            locale: 'en-US',
          });
          const page = await context.newPage();
          await page.goto(url, { waitUntil: 'networkidle', timeout: FETCH_TIMEOUT_MS });
          await page.waitForTimeout(2000);
          html = await page.content();
          await page.close();
          await context.close();
        } else {
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

          if (response.status === 403) {
            errors.push('Blocked by Bachtrack (403). Try running locally.');
            break;
          }
          if (!response.ok) {
            errors.push(`Bachtrack returned ${response.status} for page ${pg}`);
            continue;
          }
          html = await response.text();
        }

        const pageCandidates = parseEventListing(html);
        console.log(`[bachtrack] page ${pg}: ${pageCandidates.length} events`);

        if (pageCandidates.length === 0) break; // no more pages
        allCandidates.push(...pageCandidates);

        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Bachtrack page ${pg} error: ${msg}`);
      }
    }

    if (browser) await browser.close();

    // Cap to MAX_PER_CITY_PER_DAY for variety across dates
    const capped = capPerCityPerDay(allCandidates);
    console.log(`[bachtrack] ${allCandidates.length} total, ${capped.length} after cap (max ${MAX_PER_CITY_PER_DAY}/city/day)`);

    // Enrich poster_url from each event's detail page (og:image is the
    // event-specific poster; the listing thumbnail is often a venue logo).
    await enrichPosters(capped, errors);

    return { source: this.source, candidates: capped, errors };
  }
}
