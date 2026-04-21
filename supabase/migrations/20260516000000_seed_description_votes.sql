-- Seed-description voting.
--
-- The unsigned pieces.description is a column on pieces, not a row in any
-- signed-content table, so it never had a vote subject. Users asked for a
-- thumbs affordance on the seed card so they can register their feedback
-- on the default description too.
--
-- Approach (per the plan): synthesize a deterministic vote subject per
-- piece.
--
--   1. Add pieces.seed_description_vote_id uuid (gen_random_uuid default,
--      NOT NULL after backfill). One UUID per piece, lives with the piece,
--      never changes.
--
--   2. Widen the votes.subject_table CHECK to include the new virtual
--      subject 'pieces_seed_description'. Votes cast with that subject
--      carry (user_id, 'pieces_seed_description', seed_description_vote_id).
--
-- No orphan-cleanup trigger is needed: the subject id lives on the piece
-- row, so dropping the piece cascades its votes through the existing
-- user_id → users FK cascade path combined with manual cleanup tied to
-- pieces below. We attach a small trigger on pieces to delete the votes
-- when the seed_description_vote_id goes away.

begin;

-- ---- 1. pieces.seed_description_vote_id ----

alter table public.pieces
  add column if not exists seed_description_vote_id uuid;

update public.pieces
  set seed_description_vote_id = gen_random_uuid()
  where seed_description_vote_id is null;

alter table public.pieces
  alter column seed_description_vote_id set not null,
  alter column seed_description_vote_id set default gen_random_uuid();

-- Unique so no collision with other subject ids in the votes table and so
-- the trigger cleanup below can match the subject_id cleanly.
alter table public.pieces
  add constraint ux_pieces_seed_description_vote_id unique (seed_description_vote_id);

-- ---- 2. Widen votes subject_table CHECK ----

-- Postgres doesn't let us mutate a CHECK in place — drop + recreate with the
-- widened whitelist. The new 'pieces_seed_description' value joins the
-- four signed-content subjects already present.

alter table public.votes
  drop constraint if exists votes_subject_table_check;

alter table public.votes
  add constraint votes_subject_table_check
    check (subject_table in (
      'performers_notes',
      'interpretive_schools',
      'piece_descriptions',
      'landmarks',
      'pieces_seed_description'
    ));

-- vote_tallies carries the same subject_table column; widen it too so the
-- trigger-maintained aggregates can include the new subject.

alter table public.vote_tallies
  drop constraint if exists vote_tallies_subject_table_check;

alter table public.vote_tallies
  add constraint vote_tallies_subject_table_check
    check (subject_table in (
      'performers_notes',
      'interpretive_schools',
      'piece_descriptions',
      'landmarks',
      'pieces_seed_description'
    ));

-- ---- 3. Orphan cleanup when a piece is deleted ----

-- Piece deletes already cascade the seed_description_vote_id via column
-- removal, but votes + vote_tallies are keyed on subject_id + subject_table,
-- not on a FK. A trigger on pieces wipes both tables before the piece row
-- goes away.

create or replace function public._cleanup_seed_description_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.votes
    where subject_table = 'pieces_seed_description'
      and subject_id = old.seed_description_vote_id;
  delete from public.vote_tallies
    where subject_table = 'pieces_seed_description'
      and subject_id = old.seed_description_vote_id;
  return old;
end;
$$;

drop trigger if exists t_cleanup_seed_description_votes on public.pieces;
create trigger t_cleanup_seed_description_votes
  before delete on public.pieces
  for each row
  execute function public._cleanup_seed_description_votes();

commit;
