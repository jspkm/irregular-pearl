-- Backfill: migrate existing performances and discography into events system
-- This is a one-time migration that copies data from the old tables into the new schema

-- Migrate performances → events + event_performances
INSERT INTO public.events (id, title, venue, event_date, event_type, created_by, created_at)
SELECT
  gen_random_uuid(),
  event_name,
  venue,
  coalesce(date::date, current_date),
  CASE WHEN is_upcoming THEN 'concert' ELSE 'concert' END,
  user_id,
  created_at
FROM public.performances
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.title = performances.event_name AND e.created_by = performances.user_id
)
ON CONFLICT DO NOTHING;

-- Link performances to pieces via event_performances
INSERT INTO public.event_performances (event_id, artist_id, piece_id)
SELECT e.id, p.user_id, p.piece_id
FROM public.performances p
JOIN public.events e ON e.title = p.event_name AND e.created_by = p.user_id
WHERE p.piece_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Migrate discography → events with event_type = 'recording'
INSERT INTO public.events (id, title, event_date, event_type, url, created_by, created_at)
SELECT
  gen_random_uuid(),
  title,
  make_date(coalesce(year, 2000), 1, 1),
  'recording',
  url,
  user_id,
  created_at
FROM public.discography
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.title = discography.title AND e.created_by = discography.user_id AND e.event_type = 'recording'
)
ON CONFLICT DO NOTHING;
