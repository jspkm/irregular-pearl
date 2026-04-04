/**
 * Scraper adapter interface.
 *
 * Each source implements ScraperAdapter. The runner calls scrape() on each,
 * normalizes results into EventCandidate[], dedupes, and inserts as queued.
 *
 * ┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
 * │ BachtrackScraper │────▶│  ScraperRunner    │────▶│  Supabase   │
 * │ (HTML parsing)   │     │  (dedup + insert) │     │  (queued)   │
 * └─────────────────┘     └──────────────────┘     └─────────────┘
 */

export interface EventCandidate {
  title: string;
  venue: string;
  city: string;
  country?: string;
  event_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  event_type: 'recital' | 'concert' | 'competition' | 'masterclass' | 'recording' | 'festival';
  description?: string;
  url?: string;
  performers?: string[]; // display names (not linked to users)
}

export interface ScraperResult {
  source: string;
  candidates: EventCandidate[];
  errors: string[];
}

export interface ScraperAdapter {
  readonly source: string;
  scrape(): Promise<ScraperResult>;
}
