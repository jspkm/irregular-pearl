-- Clean up events with empty titles from backfill
-- Set title to 'Untitled Event' or delete if completely empty
DELETE FROM public.events WHERE title = '' OR title IS NULL;
