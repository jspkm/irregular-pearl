-- Enable pg_trgm for fuzzy/typo-tolerant search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_pieces_title_trgm ON public.pieces USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pieces_composer_trgm ON public.pieces USING gin(composer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_display_name_trgm ON public.users USING gin(display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON public.events USING gin(title gin_trgm_ops);

-- Fuzzy search RPC: returns results ranked by similarity when full-text search misses
CREATE OR REPLACE FUNCTION public.fuzzy_search(search_query text)
RETURNS TABLE (
  match_type text,
  match_id text,
  match_title text,
  match_subtitle text,
  similarity real
)
LANGUAGE sql STABLE
AS $$
  -- Pieces (match on title or composer)
  SELECT
    'piece' AS match_type,
    p.id AS match_id,
    p.title AS match_title,
    p.composer_name AS match_subtitle,
    GREATEST(
      similarity(p.title, search_query),
      similarity(p.composer_name, search_query)
    ) AS similarity
  FROM public.pieces p
  WHERE p.title % search_query OR p.composer_name % search_query

  UNION ALL

  -- Users (match on display_name)
  SELECT
    'artist' AS match_type,
    u.id::text AS match_id,
    u.display_name AS match_title,
    COALESCE(u.instrument, '') AS match_subtitle,
    similarity(u.display_name, search_query) AS similarity
  FROM public.users u
  WHERE u.display_name % search_query

  UNION ALL

  -- Events (match on title)
  SELECT
    'event' AS match_type,
    e.id::text AS match_id,
    e.title AS match_title,
    COALESCE(e.venue, '') AS match_subtitle,
    similarity(e.title, search_query) AS similarity
  FROM public.events e
  WHERE e.title % search_query

  ORDER BY similarity DESC
  LIMIT 20;
$$;
