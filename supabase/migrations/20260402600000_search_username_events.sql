-- Rebuild users FTS to include username.

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
