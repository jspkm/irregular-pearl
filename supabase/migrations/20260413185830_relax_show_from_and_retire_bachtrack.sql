-- Relax show_from CHECK so scrapers can set it to scrape-time (today),
-- which lets events surface 30+ days before they happen instead of being
-- gated to only the last 30 days.
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_show_from_check;
ALTER TABLE public.events ADD CONSTRAINT events_show_from_check
  CHECK (show_from <= event_date);

-- Retire the bachtrack scraper. Soft-reject existing rows so they vanish
-- from the public events page (RLS already filters non-approved); preserve
-- history rather than hard-deleting.
UPDATE public.events
SET status = 'rejected',
    moderation_note = COALESCE(moderation_note, '') || ' [retired: bachtrack source dropped 2026-04-13]'
WHERE source = 'bachtrack';

-- Allow new per-venue scraper sources (source='venue:carnegie-hall', etc.)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_source_check;
ALTER TABLE public.events ADD CONSTRAINT events_source_check
  CHECK (source IN ('user', 'bachtrack', 'venue_scrape') OR source LIKE 'venue:%');
