-- Clean up blank instrument entries left by cancelled add operations
DELETE FROM public.instruments WHERE type = '' OR type IS NULL;
