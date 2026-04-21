-- Backfill: materialize seed movements into public.movements.
--
-- Slice C Step 2 (20260427000000_movements_table.sql) shipped the schema
-- only. Population was deferred to `bun run supabase/seed.ts`, which runs
-- locally but never ran against production — CI applies migrations, not
-- seed.ts. As a result, production pieces have no movement rows, and
-- MovementsList.tsx falls back to the read-only seedMovements branch
-- (pulled from src/data/seed.ts at build time). No edit/reorder/delete
-- controls render, so wiki-edit is invisible on every piece page.
--
-- This migration inserts the 69 seed movements across 18 pieces plus
-- their initial version rows, exactly matching what seed.ts would have
-- written:
--
--   movements:          (piece_id, ordinal, name, key_signature, meter)
--   movement_versions:  version_number = 1, authored_by = NULL (seed marker),
--                       edit_summary = 'initial seed from src/data/seed.ts'
--
-- Idempotent. A NOT EXISTS guard on (piece_id, ordinal) skips any row
-- already seeded or already created by a user, so re-runs are safe and
-- user edits are never overwritten. Pieces absent from the DB (e.g.
-- removed catalog entries) are skipped via the pieces-table join.
--
-- Executes in three statements because CTE sub-statements run
-- concurrently with the outer query; we need the INSERT into movements
-- to land before the INSERT into movement_versions reads the returning
-- ids, and both must land before the UPDATE that links current_version_id.

begin;

-- Scratch table holding the authoritative seed rows for this migration.
create temporary table _seed_movements (
  piece_id text not null,
  ordinal smallint not null,
  name text not null,
  key_signature text,
  meter text,
  primary key (piece_id, ordinal)
) on commit drop;

insert into _seed_movements (piece_id, ordinal, name, key_signature, meter) values
  ('bach-chaconne-cello-arr', 1, 'Chaconne', 'D minor', '3/4'),
  ('bach-cello-suite-1', 1, 'I. Prélude', 'G major', '4/4'),
  ('bach-cello-suite-1', 2, 'II. Allemande', 'G major', '4/4'),
  ('bach-cello-suite-1', 3, 'III. Courante', 'G major', '3/4'),
  ('bach-cello-suite-1', 4, 'IV. Sarabande', 'G major', '3/4'),
  ('bach-cello-suite-1', 5, 'V. Menuet I & II', 'G major', '3/4'),
  ('bach-cello-suite-1', 6, 'VI. Gigue', 'G major', '6/8'),
  ('bach-cello-suite-2', 1, 'I. Prélude', 'D minor', '4/4'),
  ('bach-cello-suite-2', 2, 'II. Allemande', 'D minor', '4/4'),
  ('bach-cello-suite-2', 3, 'III. Courante', 'D minor', '3/4'),
  ('bach-cello-suite-2', 4, 'IV. Sarabande', 'D minor', '3/4'),
  ('bach-cello-suite-2', 5, 'V. Menuet I & II', 'D minor', '3/4'),
  ('bach-cello-suite-2', 6, 'VI. Gigue', 'D minor', '3/8'),
  ('bach-cello-suite-3', 1, 'I. Prélude', 'C major', '3/4'),
  ('bach-cello-suite-3', 2, 'II. Allemande', 'C major', '4/4'),
  ('bach-cello-suite-3', 3, 'III. Courante', 'C major', '3/4'),
  ('bach-cello-suite-3', 4, 'IV. Sarabande', 'C major', '3/4'),
  ('bach-cello-suite-3', 5, 'V. Bourrée I & II', 'C major', '2/2'),
  ('bach-cello-suite-3', 6, 'VI. Gigue', 'C major', '3/8'),
  ('bach-cello-suite-4', 1, 'I. Prélude', 'E-flat major', '4/4'),
  ('bach-cello-suite-4', 2, 'II. Allemande', 'E-flat major', '4/4'),
  ('bach-cello-suite-4', 3, 'III. Courante', 'E-flat major', '3/4'),
  ('bach-cello-suite-4', 4, 'IV. Sarabande', 'E-flat major', '3/4'),
  ('bach-cello-suite-4', 5, 'V. Bourrée I & II', 'E-flat major', '2/2'),
  ('bach-cello-suite-4', 6, 'VI. Gigue', 'E-flat major', '12/8'),
  ('bach-cello-suite-5', 1, 'I. Prélude', 'C minor', '2/2 & 3/8'),
  ('bach-cello-suite-5', 2, 'II. Allemande', 'C minor', '4/4'),
  ('bach-cello-suite-5', 3, 'III. Courante', 'C minor', '3/4'),
  ('bach-cello-suite-5', 4, 'IV. Sarabande', 'C minor', '3/4'),
  ('bach-cello-suite-5', 5, 'V. Gavotte I & II', 'C minor', '2/2'),
  ('bach-cello-suite-5', 6, 'VI. Gigue', 'C minor', '3/8'),
  ('bach-cello-suite-6', 1, 'I. Prélude', 'D major', '12/8'),
  ('bach-cello-suite-6', 2, 'II. Allemande', 'D major', '4/4'),
  ('bach-cello-suite-6', 3, 'III. Courante', 'D major', '6/8'),
  ('bach-cello-suite-6', 4, 'IV. Sarabande', 'D major', '3/2'),
  ('bach-cello-suite-6', 5, 'V. Gavotte I & II', 'D major', '2/2'),
  ('bach-cello-suite-6', 6, 'VI. Gigue', 'D major', '6/8'),
  ('bach-viola-da-gamba-sonata-1', 1, 'I. Adagio', 'G major', '3/2'),
  ('bach-viola-da-gamba-sonata-1', 2, 'II. Allegro ma non tanto', 'G major', '6/8'),
  ('bach-viola-da-gamba-sonata-1', 3, 'III. Andante', 'E minor', '3/4'),
  ('bach-viola-da-gamba-sonata-1', 4, 'IV. Allegro moderato', 'G major', '2/4'),
  ('bach-viola-da-gamba-sonata-2', 1, 'I. Adagio', 'D major', '4/4'),
  ('bach-viola-da-gamba-sonata-2', 2, 'II. Allegro', 'D major', '3/4'),
  ('bach-viola-da-gamba-sonata-2', 3, 'III. Andante', 'B minor', '4/4'),
  ('bach-viola-da-gamba-sonata-2', 4, 'IV. Allegro', 'D major', '6/8'),
  ('bach-viola-da-gamba-sonata-3', 1, 'I. Vivace', 'G minor', '4/4'),
  ('bach-viola-da-gamba-sonata-3', 2, 'II. Adagio', 'B-flat major', '3/2'),
  ('bach-viola-da-gamba-sonata-3', 3, 'III. Allegro', 'G minor', '4/4'),
  ('haydn-cello-concerto-1', 1, 'I. Moderato', 'C major', '4/4'),
  ('haydn-cello-concerto-1', 2, 'II. Adagio', 'F major', '2/4'),
  ('haydn-cello-concerto-1', 3, 'III. Allegro molto', 'C major', '4/4'),
  ('vivaldi-rv-544', 1, 'I. Allegro', 'F major', '4/4'),
  ('vivaldi-rv-544', 2, 'II. Largo', 'D minor', '3/4'),
  ('vivaldi-rv-544', 3, 'III. Allegro', 'F major', '4/4'),
  ('saint-saens-cello-concerto-1', 1, 'I. Allegro non troppo', 'A minor', '4/4'),
  ('saint-saens-cello-concerto-1', 2, 'II. Allegretto con moto', 'B-flat major', '3/4'),
  ('saint-saens-cello-concerto-1', 3, 'III. Tempo primo', 'A minor', '4/4'),
  ('elgar-cello-concerto', 1, 'I. Adagio — Moderato', 'E minor', '4/4'),
  ('elgar-cello-concerto', 2, 'II. Lento — Allegro molto', 'G major', '2/4'),
  ('elgar-cello-concerto', 3, 'III. Adagio', 'B-flat major', '3/8'),
  ('elgar-cello-concerto', 4, 'IV. Allegro — Moderato — Allegro, ma non troppo', 'E minor', '2/4 & 4/4'),
  ('strauss-cello-sonata', 1, 'I. Allegro con brio', 'F major', '4/4'),
  ('strauss-cello-sonata', 2, 'II. Andante ma non troppo', 'F minor', '4/4'),
  ('strauss-cello-sonata', 3, 'III. Finale: Allegro vivo', 'F major', '4/4'),
  ('mendelssohn-song-without-words-cello', 1, 'Andante espressivo', 'D major', '4/4'),
  ('faure-papillon', 1, 'Allegro vivo — Andantino — Allegro vivo', 'A major', '3/4'),
  ('crumb-sonata-solo-cello', 1, 'I. Fantasia', null, 'free meter'),
  ('crumb-sonata-solo-cello', 2, 'II. Tema pastorale con variazioni', null, '3/4'),
  ('crumb-sonata-solo-cello', 3, 'III. Toccata', null, '4/4');

-- 1. Insert the movement rows for pieces that exist in public.pieces and
-- don't already have an active movement at that ordinal. Deleted_at
-- rows don't block — they keep their historical ordinal but the partial
-- unique index means a new seed at the same ordinal is allowed.
insert into public.movements (piece_id, ordinal, name, key_signature, meter)
select s.piece_id, s.ordinal, s.name, s.key_signature, s.meter
from _seed_movements s
where exists (select 1 from public.pieces p where p.id = s.piece_id)
  and not exists (
    select 1 from public.movements m
    where m.piece_id = s.piece_id
      and m.ordinal = s.ordinal
      and m.deleted_at is null
  );

-- 2. For every movement that's missing its initial version row (either
-- freshly inserted above, or landed earlier without a version), insert
-- version 1 with authored_by = NULL as the seed marker.
insert into public.movement_versions (
  movement_id, piece_id, ordinal, name, key_signature, meter,
  version_number, authored_by, edit_summary
)
select
  m.id, m.piece_id, m.ordinal, m.name, m.key_signature, m.meter,
  1, null, 'initial seed from src/data/seed.ts'
from public.movements m
where m.deleted_at is null
  and not exists (
    select 1 from public.movement_versions mv
    where mv.movement_id = m.id
      and mv.version_number = 1
  );

-- 3. Link each unlinked movement to its version-1 row.
update public.movements m
  set current_version_id = mv.id
  from public.movement_versions mv
  where m.current_version_id is null
    and m.deleted_at is null
    and mv.movement_id = m.id
    and mv.version_number = 1;

commit;
