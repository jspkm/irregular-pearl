-- Sample canonical_piece_index entries for local dev.
-- Idempotent: ON CONFLICT DO NOTHING against (composer_name, canonical_title, catalog_number).
-- Note: canonical_piece_index has no unique constraint on (composer, title, catalog) by design,
-- so idempotency here is by-hand via WHERE NOT EXISTS. Fine for a dev script.

INSERT INTO public.canonical_piece_index (canonical_title, composer_name, catalog_number, era, form, instruments)
SELECT * FROM (VALUES
  ('Clarinet Trio in A minor', 'Johannes Brahms', 'Op. 114', 'Romantic', 'trio', ARRAY['clarinet','cello','piano']::text[]),
  ('Piano Quintet in F minor', 'Johannes Brahms', 'Op. 34', 'Romantic', 'quintet', ARRAY['piano','violin','viola','cello']::text[]),
  ('Cello Sonata No. 1 in E minor', 'Johannes Brahms', 'Op. 38', 'Romantic', 'sonata', ARRAY['cello','piano']::text[]),
  ('Cello Sonata No. 2 in F major', 'Johannes Brahms', 'Op. 99', 'Romantic', 'sonata', ARRAY['cello','piano']::text[]),
  ('Double Concerto for Violin and Cello in A minor', 'Johannes Brahms', 'Op. 102', 'Romantic', 'concerto', ARRAY['violin','cello','orchestra']::text[]),
  ('Piano Trio in B-flat major "Archduke"', 'Ludwig van Beethoven', 'Op. 97', 'Classical', 'trio', ARRAY['piano','violin','cello']::text[]),
  ('Cello Sonata No. 3 in A major', 'Ludwig van Beethoven', 'Op. 69', 'Classical', 'sonata', ARRAY['cello','piano']::text[]),
  ('Cello Concerto in B minor', 'Antonín Dvořák', 'Op. 104', 'Romantic', 'concerto', ARRAY['cello','orchestra']::text[]),
  ('Piano Quintet No. 2 in A major', 'Antonín Dvořák', 'Op. 81', 'Romantic', 'quintet', ARRAY['piano','violin','viola','cello']::text[]),
  ('Cello Sonata in D minor', 'Dmitri Shostakovich', 'Op. 40', '20th Century', 'sonata', ARRAY['cello','piano']::text[]),
  ('Cello Concerto No. 1 in E-flat major', 'Dmitri Shostakovich', 'Op. 107', '20th Century', 'concerto', ARRAY['cello','orchestra']::text[]),
  ('Cello Sonata in G minor', 'Sergei Rachmaninoff', 'Op. 19', 'Late Romantic', 'sonata', ARRAY['cello','piano']::text[]),
  ('Cello Concerto in E minor', 'Edward Elgar', 'Op. 85', 'Late Romantic', 'concerto', ARRAY['cello','orchestra']::text[]),
  ('Sinfonia Concertante in E minor', 'Sergei Prokofiev', 'Op. 125', '20th Century', 'concerto', ARRAY['cello','orchestra']::text[]),
  ('Cello Concerto', 'William Walton', NULL, '20th Century', 'concerto', ARRAY['cello','orchestra']::text[]),
  ('Variations on a Rococo Theme', 'Pyotr Ilyich Tchaikovsky', 'Op. 33', 'Romantic', 'variations', ARRAY['cello','orchestra']::text[]),
  ('Cello Concerto No. 1 in A minor', 'Camille Saint-Saëns', 'Op. 33', 'Romantic', 'concerto', ARRAY['cello','orchestra']::text[]),
  ('Cello Concerto in A minor', 'Robert Schumann', 'Op. 129', 'Romantic', 'concerto', ARRAY['cello','orchestra']::text[]),
  ('Piano Sonata No. 14 in C-sharp minor "Moonlight"', 'Ludwig van Beethoven', 'Op. 27 No. 2', 'Classical', 'sonata', ARRAY['piano']::text[]),
  ('Piano Sonata No. 21 in C major "Waldstein"', 'Ludwig van Beethoven', 'Op. 53', 'Classical', 'sonata', ARRAY['piano']::text[]),
  ('Piano Sonata No. 2 in B-flat minor', 'Frédéric Chopin', 'Op. 35', 'Romantic', 'sonata', ARRAY['piano']::text[]),
  ('Ballade No. 1 in G minor', 'Frédéric Chopin', 'Op. 23', 'Romantic', 'ballade', ARRAY['piano']::text[]),
  ('Violin Concerto in D major', 'Ludwig van Beethoven', 'Op. 61', 'Classical', 'concerto', ARRAY['violin','orchestra']::text[]),
  ('Violin Concerto in D minor', 'Jean Sibelius', 'Op. 47', 'Late Romantic', 'concerto', ARRAY['violin','orchestra']::text[]),
  ('Sonata No. 1 for Solo Violin in G minor', 'Johann Sebastian Bach', 'BWV 1001', 'Baroque', 'sonata', ARRAY['violin']::text[])
) AS src(canonical_title, composer_name, catalog_number, era, form, instruments)
WHERE NOT EXISTS (
  SELECT 1 FROM public.canonical_piece_index c
  WHERE c.canonical_title = src.canonical_title
    AND c.composer_name = src.composer_name
    AND c.catalog_number IS NOT DISTINCT FROM src.catalog_number
);

SELECT
  'canonical_piece_index rows' AS metric,
  count(*) AS value
FROM public.canonical_piece_index;

SELECT
  'unmaterialized (available in NOT YET CURATED)' AS metric,
  count(*) AS value
FROM public.canonical_piece_index c
WHERE NOT EXISTS (SELECT 1 FROM public.pieces p WHERE p.canonical_index_id = c.id);
