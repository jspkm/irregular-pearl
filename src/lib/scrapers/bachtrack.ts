/**
 * Bachtrack HTML scraper.
 *
 * EXPERIMENTAL: Bachtrack ToS likely prohibits scraping. This adapter is
 * not a launch dependency. If Bachtrack blocks or sends a C&D, disable
 * this adapter and the pipeline continues with user submissions only.
 *
 * Parses bachtrack.com/search-concerts for upcoming classical events.
 * Rate: 1 request/sec, respectful crawling.
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
  return 'concert'; // default
}

/**
 * Parse a single event listing from Bachtrack HTML.
 * Bachtrack uses structured listing elements with consistent class names.
 * If the HTML structure changes, this parser will return empty arrays
 * and the runner will log a warning (0 results, 0 errors).
 */
export function parseEventListing(html: string): EventCandidate[] {
  const candidates: EventCandidate[] = [];

  // Bachtrack listing items: <div class="listing-item"> or similar
  // This regex-based parser is intentionally simple. If Bachtrack changes
  // their HTML, update these patterns and re-run tests with a new fixture.
  const listingPattern = /<article[^>]*class="[^"]*listing[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  let match;

  while ((match = listingPattern.exec(html)) !== null) {
    const block = match[1];

    // Extract title
    const titleMatch = block.match(/<h\d[^>]*class="[^"]*listing-title[^"]*"[^>]*>([\s\S]*?)<\/h\d>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    if (!title) continue;

    // Extract venue
    const venueMatch = block.match(/<[^>]*class="[^"]*listing-venue[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
    const venue = venueMatch ? venueMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract location (city)
    const locationMatch = block.match(/<[^>]*class="[^"]*listing-location[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
    const locationText = locationMatch ? locationMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const [city = '', country = ''] = locationText.split(',').map(s => s.trim());

    // Extract date
    const dateMatch = block.match(/datetime="(\d{4}-\d{2}-\d{2})/i);
    const event_date = dateMatch ? dateMatch[1] : '';
    if (!event_date) continue;

    // Extract time
    const timeMatch = block.match(/datetime="\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/i);
    const start_time = timeMatch ? timeMatch[1] : undefined;

    // Extract URL
    const urlMatch = block.match(/href="(\/[^"]*concert[^"]*)"/i);
    const url = urlMatch ? `https://bachtrack.com${urlMatch[1]}` : undefined;

    // Extract performers
    const performerPattern = /<[^>]*class="[^"]*listing-performer[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi;
    const performers: string[] = [];
    let perfMatch;
    while ((perfMatch = performerPattern.exec(block)) !== null) {
      const name = perfMatch[1].replace(/<[^>]+>/g, '').trim();
      if (name) performers.push(name);
    }

    candidates.push({
      title,
      venue: venue || 'Unknown venue',
      city: city || 'Unknown',
      country: country || undefined,
      event_date,
      start_time,
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

    // Fetch the first page of upcoming concerts
    const today = new Date().toISOString().split('T')[0];
    const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const url = `${BACHTRACK_BASE}?date_from=${today}&date_to=${twoWeeks}&genre=1`; // genre=1 = classical

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'IrregularPearl/1.0 (classical music community; contact@irregularpearl.org)',
          'Accept': 'text/html',
        },
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        errors.push('Rate limited by Bachtrack (429). Will retry next run.');
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
