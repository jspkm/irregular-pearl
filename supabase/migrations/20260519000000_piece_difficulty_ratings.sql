-- User-contributed Difficulty ratings — signed four-axis scoring.
--
-- Mirrors the signed-description pattern: the seed difficulty (hardcoded in
-- src/data/difficulty-axes.ts) remains the default voice on every piece, and
-- any registered user can publish their own signed rating alongside it. The
-- piece page rotates through the stack — user ratings sort first by
-- vote_tallies.net_score DESC, the seed card slots last. Thumbs-up / -down
-- is available on every card, seed included.
--
-- Key design differences from piece_descriptions (body-only prose):
--   • Numeric subject — four smallint axis levels + four optional short
--     notes. No version history table. Edits mutate in place; the
--     content_mutation_log entry (added in a companion migration pass, not
--     here — change-log hookup is deferred) is the audit trail.
--   • Self-authored only in v1. No staff-drafted path, no approval queue,
--     no notification subject_table entry. If a future contributor wants
--     to draft on another's behalf, the same shape used by descriptions
--     applies.
--   • Status is still a draft_status column so soft-removal can share the
--     vote-cleanup trigger used by every other signed subject.
--
-- Seed votable:
--   pieces.seed_difficulty_vote_id uuid — one per piece, lives with the piece,
--   never changes. Same mechanism introduced for seed_description in
--   20260516000000. votes.subject_table and vote_tallies.subject_table accept
--   the new virtual subject 'pieces_seed_difficulty'.
--
-- The subject 'piece_difficulty_ratings' is also added to both check
-- constraints + cast_vote so the user ratings themselves are voteable.

begin;

-- ============================================
-- piece_difficulty_ratings
-- ============================================

create table public.piece_difficulty_ratings (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,

  -- Four PRD axes. 0 = n/a (bars render empty); 1..5 = Light .. Professional.
  -- Labels are derived client-side from the level — kept out of the schema
  -- so editorial vocabulary changes don't require a migration.
  technical_level smallint not null,
  technical_note text,
  stamina_level smallint not null,
  stamina_note text,
  interpretive_level smallint not null,
  interpretive_note text,
  ensemble_level smallint not null,
  ensemble_note text,

  status draft_status not null default 'published',
  removed_by uuid references public.users(id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pdr_technical_level_range check (technical_level between 0 and 5),
  constraint pdr_stamina_level_range check (stamina_level between 0 and 5),
  constraint pdr_interpretive_level_range check (interpretive_level between 0 and 5),
  constraint pdr_ensemble_level_range check (ensemble_level between 0 and 5),
  constraint pdr_note_length check (
    coalesce(length(technical_note), 0) <= 500
    and coalesce(length(stamina_note), 0) <= 500
    and coalesce(length(interpretive_note), 0) <= 500
    and coalesce(length(ensemble_note), 0) <= 500
  )
);

create index idx_piece_difficulty_ratings_piece_published
  on public.piece_difficulty_ratings(piece_id) where status = 'published';
create index idx_piece_difficulty_ratings_contributor
  on public.piece_difficulty_ratings(contributor_id);

create function public.touch_piece_difficulty_ratings_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_touch_piece_difficulty_ratings_updated_at
  before update on public.piece_difficulty_ratings
  for each row
  execute function public.touch_piece_difficulty_ratings_updated_at();

alter table public.piece_difficulty_ratings enable row level security;

create policy "Published difficulty ratings are viewable by everyone"
  on public.piece_difficulty_ratings for select
  using (status = 'published');

create policy "Contributor can view own difficulty ratings"
  on public.piece_difficulty_ratings for select
  using (contributor_id = auth.uid());

create policy "Staff can view all difficulty ratings"
  on public.piece_difficulty_ratings for select
  using (public.is_staff());

-- ============================================
-- pieces.seed_difficulty_vote_id — stable virtual subject for the seed card
-- ============================================

alter table public.pieces
  add column if not exists seed_difficulty_vote_id uuid;

update public.pieces
  set seed_difficulty_vote_id = gen_random_uuid()
  where seed_difficulty_vote_id is null;

alter table public.pieces
  alter column seed_difficulty_vote_id set not null,
  alter column seed_difficulty_vote_id set default gen_random_uuid();

alter table public.pieces
  add constraint ux_pieces_seed_difficulty_vote_id unique (seed_difficulty_vote_id);

-- ============================================
-- Widen votes + vote_tallies subject whitelists
-- ============================================

alter table public.votes
  drop constraint if exists votes_subject_table_check;

alter table public.votes
  add constraint votes_subject_table_check
    check (subject_table in (
      'performers_notes',
      'interpretive_schools',
      'piece_descriptions',
      'landmarks',
      'pieces_seed_description',
      'piece_difficulty_ratings',
      'pieces_seed_difficulty'
    ));

alter table public.vote_tallies
  drop constraint if exists vote_tallies_subject_table_check;

alter table public.vote_tallies
  add constraint vote_tallies_subject_table_check
    check (subject_table in (
      'performers_notes',
      'interpretive_schools',
      'piece_descriptions',
      'landmarks',
      'pieces_seed_description',
      'piece_difficulty_ratings',
      'pieces_seed_difficulty'
    ));

-- cast_vote has an explicit whitelist; widen it too.
create or replace function public.cast_vote(
  p_subject_table text,
  p_subject_id uuid,
  p_vote_value smallint
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_vote_value not in (-1, 1) then
    raise exception 'vote_value must be -1 or 1';
  end if;

  if p_subject_table not in (
    'performers_notes',
    'interpretive_schools',
    'piece_descriptions',
    'landmarks',
    'pieces_seed_description',
    'piece_difficulty_ratings',
    'pieces_seed_difficulty'
  ) then
    raise exception 'invalid subject_table: %', p_subject_table;
  end if;

  perform public._check_rate_limit('cast_vote', 30, 60);

  insert into public.votes (user_id, subject_table, subject_id, vote_value)
  values (v_uid, p_subject_table, p_subject_id, p_vote_value)
  on conflict (user_id, subject_table, subject_id) do update
    set vote_value = excluded.vote_value,
        updated_at = now();
end;
$$;

-- ============================================
-- Orphan cleanup triggers
-- ============================================

-- When a piece_difficulty_ratings row is hard-deleted, wipe its votes so
-- vote_tallies stays consistent. Mirrors the piece_descriptions trigger.
create trigger trg_clear_votes_piece_difficulty_ratings
  after delete on public.piece_difficulty_ratings
  for each row execute function public._clear_votes_on_subject_delete('piece_difficulty_ratings');

-- When a piece is deleted, its seed_difficulty_vote_id votes+tallies need to
-- be wiped too. Extend the existing seed_description cleanup function to
-- cover both virtual subjects in one trigger pass.
create or replace function public._cleanup_seed_description_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.votes
    where (subject_table = 'pieces_seed_description' and subject_id = old.seed_description_vote_id)
       or (subject_table = 'pieces_seed_difficulty' and subject_id = old.seed_difficulty_vote_id);
  delete from public.vote_tallies
    where (subject_table = 'pieces_seed_description' and subject_id = old.seed_description_vote_id)
       or (subject_table = 'pieces_seed_difficulty' and subject_id = old.seed_difficulty_vote_id);
  return old;
end;
$$;

-- ============================================
-- RPCs — self-authored (publish / edit / remove)
-- ============================================

create or replace function public.publish_contributor_piece_difficulty(
  p_piece_id text,
  p_technical_level smallint,
  p_technical_note text,
  p_stamina_level smallint,
  p_stamina_note text,
  p_interpretive_level smallint,
  p_interpretive_note text,
  p_ensemble_level smallint,
  p_ensemble_note text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_rating_id uuid;
  v_contributor_id uuid := auth.uid();
begin
  perform public._require_active_contributor();

  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;

  -- Range validation matches the CHECK but surfaces a friendlier error path.
  if p_technical_level not between 0 and 5
     or p_stamina_level not between 0 and 5
     or p_interpretive_level not between 0 and 5
     or p_ensemble_level not between 0 and 5 then
    raise exception 'axis levels must be between 0 and 5';
  end if;

  v_rating_id := gen_random_uuid();

  insert into public.piece_difficulty_ratings (
    id, piece_id, contributor_id,
    technical_level, technical_note,
    stamina_level, stamina_note,
    interpretive_level, interpretive_note,
    ensemble_level, ensemble_note,
    status
  )
  values (
    v_rating_id, p_piece_id, v_contributor_id,
    p_technical_level, nullif(trim(coalesce(p_technical_note, '')), ''),
    p_stamina_level, nullif(trim(coalesce(p_stamina_note, '')), ''),
    p_interpretive_level, nullif(trim(coalesce(p_interpretive_note, '')), ''),
    p_ensemble_level, nullif(trim(coalesce(p_ensemble_note, '')), ''),
    'published'
  );

  return v_rating_id;
end;
$$;

create or replace function public.publish_contributor_piece_difficulty_edit(
  p_rating_id uuid,
  p_technical_level smallint,
  p_technical_note text,
  p_stamina_level smallint,
  p_stamina_note text,
  p_interpretive_level smallint,
  p_interpretive_note text,
  p_ensemble_level smallint,
  p_ensemble_note text
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_contributor_id uuid := auth.uid();
  v_status draft_status;
begin
  perform public._require_active_contributor();

  select status into v_status
    from public.piece_difficulty_ratings
    where id = p_rating_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'rating not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only edit a published rating (current status: %)', v_status;
  end if;

  if p_technical_level not between 0 and 5
     or p_stamina_level not between 0 and 5
     or p_interpretive_level not between 0 and 5
     or p_ensemble_level not between 0 and 5 then
    raise exception 'axis levels must be between 0 and 5';
  end if;

  update public.piece_difficulty_ratings
    set technical_level = p_technical_level,
        technical_note = nullif(trim(coalesce(p_technical_note, '')), ''),
        stamina_level = p_stamina_level,
        stamina_note = nullif(trim(coalesce(p_stamina_note, '')), ''),
        interpretive_level = p_interpretive_level,
        interpretive_note = nullif(trim(coalesce(p_interpretive_note, '')), ''),
        ensemble_level = p_ensemble_level,
        ensemble_note = nullif(trim(coalesce(p_ensemble_note, '')), '')
    where id = p_rating_id;
end;
$$;

create or replace function public.remove_piece_difficulty(
  p_rating_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_contributor_id uuid := auth.uid();
  v_status draft_status;
begin
  perform public._require_active_contributor();

  select status into v_status
    from public.piece_difficulty_ratings
    where id = p_rating_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'rating not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only remove a published rating (current status: %)', v_status;
  end if;

  update public.piece_difficulty_ratings
    set status = 'removed',
        removed_by = v_contributor_id,
        removed_at = now()
    where id = p_rating_id;
end;
$$;

grant execute on function public.publish_contributor_piece_difficulty(
  text, smallint, text, smallint, text, smallint, text, smallint, text
) to authenticated;
grant execute on function public.publish_contributor_piece_difficulty_edit(
  uuid, smallint, text, smallint, text, smallint, text, smallint, text
) to authenticated;
grant execute on function public.remove_piece_difficulty(uuid) to authenticated;

commit;
