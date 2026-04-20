-- Remove Crumb "Vox Balaenae" from the curated catalog.
-- Editorial decision: the chamber-trio scope (electric flute + cello + piano,
-- masks, blue lighting, graphic notation) sits outside the cellist-forward
-- daily-use loop the catalog is being built around in PRD rev 2.
-- FK cascade on editions, external_links, and all piece-referencing tables
-- handles cleanup.

delete from public.pieces where id = 'crumb-vox-balaenae';
