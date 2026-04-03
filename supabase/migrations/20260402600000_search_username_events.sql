-- Expand search: add username to users FTS, add FTS to events table

-- 1. Rebuild users FTS to include username
ALTER TABLE public.users DROP COLUMN IF EXISTS fts;
ALTER TABLE public.users ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(instrument, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B')
  ) STORED;

DROP INDEX IF EXISTS idx_users_fts;
CREATE INDEX idx_users_fts ON public.users USING gin(fts);

-- 2. Add FTS to events (title + venue + city + description)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(venue, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_events_fts ON public.events USING gin(fts);
