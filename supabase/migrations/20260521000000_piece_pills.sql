-- piece_pills — user-contributed metadata pills under the byline.
--
-- The pills row on the piece page (instrument(s), era, form, duration,
-- difficulty) becomes a contributor surface. Any registered user can add
-- a pill where a slot is open; mods/admins can also delete seeded pills
-- and add their own. Regular users can delete any user-added pill (the
-- "delete-and-add" pattern stands in for in-place edits).
--
-- Source of truth: piece_pills. The legacy scalar/array columns on
-- pieces (instruments text[], era text, form text, difficulty difficulty,
-- duration_minutes int) are kept as a denormalized read cache so
-- existing browse / piece-page reads keep working without a wholesale
-- refactor. A trigger on piece_pills recomputes the cache after every
-- write. NOT NULL is dropped from era/form/difficulty so the cache can
-- legitimately be empty if a mod removes the last single-value pill.
--
-- Single-value vs. multi-value:
--   instrument  — multi-value (a piece can carry many)
--   era, form, duration, difficulty — single-value (one per piece)
--   The RPC enforces single-value-ness; the table allows it via the
--   UNIQUE(piece_id, category, value) constraint plus an extra
--   single-value guard in add_piece_pill.
--
-- Source values:
--   seed — backfilled from the legacy scalar/array columns on existing pieces
--   user — added by a regular registered user
--   mod  — added by a moderator or admin (visually distinguished in UI;
--          regular users cannot delete these)

begin;

-- ============================================
-- Table
-- ============================================

create table public.piece_pills (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  category text not null check (category in ('instrument', 'era', 'form', 'duration', 'difficulty')),
  value text not null,
  source text not null check (source in ('seed', 'user', 'mod')),
  added_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (piece_id, category, value)
);

create index idx_piece_pills_piece on public.piece_pills(piece_id);
create index idx_piece_pills_added_by on public.piece_pills(added_by) where added_by is not null;

-- ============================================
-- Backfill from existing pieces columns (BEFORE creating the sync trigger
-- so the writes don't try to overwrite the columns we're reading from)
-- ============================================

insert into public.piece_pills (piece_id, category, value, source)
select id, 'instrument', lower(unnest(instruments)), 'seed'
  from public.pieces
  where instruments is not null and array_length(instruments, 1) > 0
on conflict (piece_id, category, value) do nothing;

insert into public.piece_pills (piece_id, category, value, source)
select id, 'era', lower(era), 'seed'
  from public.pieces
  where era is not null and trim(era) <> ''
on conflict (piece_id, category, value) do nothing;

insert into public.piece_pills (piece_id, category, value, source)
select id, 'form', lower(form), 'seed'
  from public.pieces
  where form is not null and trim(form) <> ''
on conflict (piece_id, category, value) do nothing;

insert into public.piece_pills (piece_id, category, value, source)
select id, 'duration', '~' || duration_minutes || ' min', 'seed'
  from public.pieces
  where duration_minutes is not null
on conflict (piece_id, category, value) do nothing;

insert into public.piece_pills (piece_id, category, value, source)
select id, 'difficulty', difficulty::text, 'seed'
  from public.pieces
  where difficulty is not null
on conflict (piece_id, category, value) do nothing;

-- ============================================
-- Drop NOT NULL on cache columns so single-value pills can be cleared by
-- mods/admins without violating the schema. (instruments and
-- duration_minutes are already nullable / defaulted.)
-- ============================================

alter table public.pieces alter column era drop not null;
alter table public.pieces alter column form drop not null;
alter table public.pieces alter column difficulty drop not null;

-- ============================================
-- Sync trigger — recompute the legacy cache columns on every pill write.
-- ============================================

create or replace function public._sync_piece_pill_caches() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_piece_id text;
begin
  v_piece_id := coalesce(new.piece_id, old.piece_id);

  update public.pieces p
    set
      instruments = coalesce((
        select array_agg(value order by created_at)
          from public.piece_pills
          where piece_id = v_piece_id and category = 'instrument'
      ), '{}'::text[]),
      era = (
        select value from public.piece_pills
          where piece_id = v_piece_id and category = 'era'
          order by created_at limit 1
      ),
      form = (
        select value from public.piece_pills
          where piece_id = v_piece_id and category = 'form'
          order by created_at limit 1
      ),
      difficulty = (
        select value::difficulty from public.piece_pills
          where piece_id = v_piece_id and category = 'difficulty'
          order by created_at limit 1
      ),
      duration_minutes = (
        select (regexp_replace(value, '^~(\d+) min$', '\1'))::int
          from public.piece_pills
          where piece_id = v_piece_id and category = 'duration'
          order by created_at limit 1
      )
    where p.id = v_piece_id;

  return null;
end;
$$;

create trigger trg_sync_piece_pill_caches
  after insert or update or delete on public.piece_pills
  for each row execute function public._sync_piece_pill_caches();

-- ============================================
-- Mirror trigger — when a NEW piece is inserted (e.g. by the seed script),
-- automatically create seed pills from the scalar/array columns. Without
-- this, seed-inserted pieces would render no pills until someone opens
-- an editor on them.
-- ============================================

create or replace function public._seed_pills_from_new_piece() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.instruments is not null then
    insert into public.piece_pills (piece_id, category, value, source)
      select new.id, 'instrument', lower(unnest(new.instruments)), 'seed'
      on conflict (piece_id, category, value) do nothing;
  end if;
  if new.era is not null and trim(new.era) <> '' then
    insert into public.piece_pills (piece_id, category, value, source)
      values (new.id, 'era', lower(new.era), 'seed')
      on conflict (piece_id, category, value) do nothing;
  end if;
  if new.form is not null and trim(new.form) <> '' then
    insert into public.piece_pills (piece_id, category, value, source)
      values (new.id, 'form', lower(new.form), 'seed')
      on conflict (piece_id, category, value) do nothing;
  end if;
  if new.duration_minutes is not null then
    insert into public.piece_pills (piece_id, category, value, source)
      values (new.id, 'duration', '~' || new.duration_minutes || ' min', 'seed')
      on conflict (piece_id, category, value) do nothing;
  end if;
  if new.difficulty is not null then
    insert into public.piece_pills (piece_id, category, value, source)
      values (new.id, 'difficulty', new.difficulty::text, 'seed')
      on conflict (piece_id, category, value) do nothing;
  end if;
  return new;
end;
$$;

create trigger trg_seed_pills_from_new_piece
  after insert on public.pieces
  for each row execute function public._seed_pills_from_new_piece();

-- ============================================
-- RLS
-- ============================================

alter table public.piece_pills enable row level security;

create policy "Pills are viewable by everyone"
  on public.piece_pills for select
  using (true);

-- Writes only via RPC (security definer), so no INSERT/UPDATE/DELETE policies.

-- ============================================
-- RPCs — add / remove
-- ============================================

create or replace function public.add_piece_pill(
  p_piece_id text,
  p_category text,
  p_value text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_staff boolean;
  v_source text;
  v_normalized text;
  v_pill_id uuid;
  v_existing_count int;
  v_duration_min int;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_category not in ('instrument', 'era', 'form', 'duration', 'difficulty') then
    raise exception 'invalid category: %', p_category;
  end if;

  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;

  v_is_staff := public.is_staff();
  v_source := case when v_is_staff then 'mod' else 'user' end;

  -- Normalize the value. duration is the only category that keeps its raw
  -- format — must be "~N min" with 3 ≤ N ≤ 90 (the UI submits already-
  -- formatted "~N min" so the storage shape stays uniform). The others
  -- lowercase + trim.
  if p_category = 'duration' then
    v_normalized := trim(p_value);
    if v_normalized !~ '^~\d{1,3} min$' then
      raise exception 'duration must match the format "~N min" (e.g. "~18 min")';
    end if;
    v_duration_min := (regexp_replace(v_normalized, '^~(\d+) min$', '\1'))::int;
    if v_duration_min < 3 or v_duration_min > 90 then
      raise exception 'duration minutes must be between 3 and 90 (got %)', v_duration_min;
    end if;
  else
    v_normalized := lower(trim(p_value));
    if v_normalized = '' then
      raise exception 'value cannot be empty';
    end if;
  end if;

  -- Single-value categories: at most one pill per (piece, category).
  if p_category in ('era', 'form', 'duration', 'difficulty') then
    select count(*) into v_existing_count
      from public.piece_pills
      where piece_id = p_piece_id and category = p_category;
    if v_existing_count > 0 then
      raise exception 'category % already has a pill on this piece', p_category;
    end if;
  end if;

  -- Difficulty value must be a valid difficulty enum value (cache column
  -- is typed; the trigger will fail otherwise).
  if p_category = 'difficulty' and v_normalized not in ('beginner', 'intermediate', 'advanced', 'virtuoso') then
    raise exception 'invalid difficulty value: %', v_normalized;
  end if;

  perform public._check_rate_limit('add_piece_pill', 30, 60);

  insert into public.piece_pills (piece_id, category, value, source, added_by)
  values (p_piece_id, p_category, v_normalized, v_source, v_uid)
  returning id into v_pill_id;

  return v_pill_id;
exception
  when unique_violation then
    raise exception 'this pill already exists on this piece';
end;
$$;

create or replace function public.remove_piece_pill(
  p_pill_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_source text;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  select source into v_source
    from public.piece_pills
    where id = p_pill_id;

  if not found then
    raise exception 'pill not found';
  end if;

  -- Regular users can only delete user-source pills (any user-source pill,
  -- not just their own — the delete-and-replace pattern is how a user
  -- "edits" another user's contribution). Seed and mod pills require
  -- staff role.
  if v_source in ('seed', 'mod') and not public.is_staff() then
    raise exception 'only moderators can delete % pills', v_source;
  end if;

  perform public._check_rate_limit('remove_piece_pill', 30, 60);

  delete from public.piece_pills where id = p_pill_id;
end;
$$;

grant execute on function public.add_piece_pill(text, text, text) to authenticated;
grant execute on function public.remove_piece_pill(uuid) to authenticated;

-- ============================================
-- One-shot cache sync — pull the freshly backfilled (lowercased) pill
-- values back into the legacy cache columns so reads see the same casing
-- as the pill table. The trigger only fires on subsequent writes.
-- ============================================

update public.pieces p set
  era = sub.era,
  form = sub.form,
  difficulty = sub.difficulty,
  duration_minutes = sub.duration_minutes,
  instruments = sub.instruments
from (
  select
    pi.id,
    (select value from public.piece_pills where piece_id = pi.id and category = 'era' order by created_at limit 1) as era,
    (select value from public.piece_pills where piece_id = pi.id and category = 'form' order by created_at limit 1) as form,
    (select value::difficulty from public.piece_pills where piece_id = pi.id and category = 'difficulty' order by created_at limit 1) as difficulty,
    (select (regexp_replace(value, '^~(\d+) min$', '\1'))::int from public.piece_pills where piece_id = pi.id and category = 'duration' order by created_at limit 1) as duration_minutes,
    coalesce((select array_agg(value order by created_at) from public.piece_pills where piece_id = pi.id and category = 'instrument'), '{}'::text[]) as instruments
  from public.pieces pi
) sub
where p.id = sub.id;

commit;
