-- Add show_from to events: controls when an event becomes visible on /events.
-- Constraint: show_from must be in [event_date - 30 days, event_date].
-- Default and backfill to event_date - 30 days.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_from date;

UPDATE public.events
SET show_from = event_date - INTERVAL '30 days'
WHERE show_from IS NULL;

ALTER TABLE public.events ALTER COLUMN show_from SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN show_from SET DEFAULT (CURRENT_DATE - INTERVAL '30 days');

DO $$ BEGIN
  ALTER TABLE public.events ADD CONSTRAINT events_show_from_check
    CHECK (show_from >= event_date - INTERVAL '30 days' AND show_from <= event_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_show_from ON public.events(show_from);
