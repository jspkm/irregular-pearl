/**
 * Per-venue scraper interface. Each file in this directory exports a
 * VenueScraper. Runner imports them all, opens one shared Playwright
 * browser, and calls scrape(page, venue) per venue.
 *
 * Required event fields: title, event_date, url. Everything else is
 * best-effort; the runner will fill in venue/city/country from the
 * VenueScraper config so individual scrapers don't have to repeat them.
 */

import type { Page } from 'playwright';

export interface VenueEvent {
  title: string;
  event_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM, 24hr
  description?: string;
  url: string; // deep link to the event detail page
  image_url?: string; // poster
  performers?: string[];
  program?: string[]; // composer + work titles, free text
  event_type?: 'recital' | 'concert' | 'competition' | 'masterclass' | 'recording' | 'festival';
}

export interface VenueScraper {
  /** Stable slug used for source='venue:<slug>'. lowercase-hyphens. */
  slug: string;
  name: string;
  city: string;
  country: string;
  /** Calendar URL the scraper navigates to. */
  url: string;
  /**
   * Pull events from the calendar. Should return events with event_date
   * within the next ~60 days at minimum. Throw on hard failure; return
   * empty on a benign empty result.
   */
  scrape(page: Page, venue: VenueScraper): Promise<VenueEvent[]>;
}
