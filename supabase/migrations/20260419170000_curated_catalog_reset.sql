-- Curated catalog reset — PRD rev 2 "narrow scope, deep craft".
-- Wipe the OpenOpus-imported breadth catalog (~7,829 pieces) so the piece-page
-- redesign is built against the curated cello-forward editorial spine defined
-- in src/data/seed.ts.
--
-- All FK relations to public.pieces use `on delete cascade` or `set null`, so
-- truncate ... cascade cleans dependent rows (editions, recordings, discography,
-- performances, external_links, working_on, maestro_playlist, search_queries,
-- artist profile linked pieces, admin-role linked pieces).
--
-- The curated pieces are re-inserted post-migration via `bun run supabase/seed.ts`
-- using the service role key. Seed contents are canonical in src/data/seed.ts;
-- this migration only handles the wipe.

truncate table public.pieces cascade;
