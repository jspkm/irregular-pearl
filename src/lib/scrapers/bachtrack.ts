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
const REQUEST_DELAY_MS = 1000;
const FETCH_TIMEOUT_MS = 30000;

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
export function parseEventListing(html: string): EventCandidate[] {
  const candidates: EventCandidate[] = [];

  // Match wrapper divs with data-id and data-dates
  const listingPattern = /<div\s+data-id="(\d+)"[^>]*data-dates="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<li\s+data-id="\1"/gi;
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

    // Extract URL from listing-more-info link
    const urlMatch = block.match(/<a[^>]*class="listing-more-info"[^>]*href="([^"]+)"/i);
    const url = urlMatch ? `https://bachtrack.com${urlMatch[1]}` : undefined;

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
      city: city || 'Unknown',
      event_date: parsed.event_date,
      start_time: parsed.start_time,
      event_type: inferEventType(title),
      url,
      performers: performers.length > 0 ? performers : undefined,
    });
  }

  return candidates;
}

export class BachtrackScraper implements ScraperAdapter {
  readonly source = 'bachtrack';

  async scrape(): Promise<ScraperResult> {
    const errors: string[] = [];
    let allCandidates: EventCandidate[] = [];

    const today = new Date().toISOString().split('T')[0];
    const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const url = `${BACHTRACK_BASE}?date_from=${today}&date_to=${twoWeeks}&genre=1`;

    try {
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

      if (response.status === 429) {
        errors.push('Rate limited by Bachtrack (429). Will retry next run.');
        return { source: this.source, candidates: [], errors };
      }

      if (response.status === 403) {
        errors.push('Blocked by Bachtrack (403). Try running from a different IP.');
        return { source: this.source, candidates: [], errors };
      }

      if (!response.ok) {
        errors.push(`Bachtrack returned ${response.status}: ${response.statusText}`);
        return { source: this.source, candidates: [], errors };
      }

      const html = await response.text();
      allCandidates = parseEventListing(html);

      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort')) {
        errors.push('Bachtrack request timed out after 30s');
      } else {
        errors.push(`Bachtrack fetch error: ${msg}`);
      }
    }

    return { source: this.source, candidates: allCandidates, errors };
  }
}
