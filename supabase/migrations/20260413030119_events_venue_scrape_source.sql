-- Add 'venue_scrape' as a valid event source and deduplicated unique index
-- Enables bulk venue scraping with auto-approved events

-- 1. Drop and recreate the source CHECK to include 'venue_scrape'
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_source_check;
ALTER TABLE public.events ADD CONSTRAINT events_source_check
  CHECK (source IN ('user', 'bachtrack', 'venue_scrape'));

-- 2. Unique index for deduplication on (lower(title), event_date, lower(venue))
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_dedup
  ON public.events (lower(title), event_date, lower(coalesce(venue, '')));
