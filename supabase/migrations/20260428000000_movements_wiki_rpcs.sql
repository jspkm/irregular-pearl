-- Slice C Step 3: wiki-edit RPCs for movements.
--
-- Landing:
--   • rate_limit_log — shared table for per-user per-action throttling.
--     First consumer is movement edits (10/hour/user). Future consumers
--     include voting (30/min) and draft submissions (20/hour) — reuse the
--     same table + _check_rate_limit helper.
--   • _check_rate_limit(p_action, p_limit, p_window_seconds) — helper
--     called by every rate-limited RPC. Raises cleanly with a throttle
--     error on limit breach.
--   • update_movement — any authenticated user can edit a movement's
--     name/tempo/key/meter/ordinal. Writes a new version row, bumps
--     current_version_id. Retry-once on unique_violation (version_number
--     race). Rate-limited at 10/hour/user.
--   • revert_movement — any authenticated user reverts a movement to a
--     prior version by copying that version's fields into a new version
--     with reverted_from_version_id set. Same rate limit as update.
--   • fetch_movement_history — security-definer read returning all
--     versions for a movement in version_number DESC order with the
--     author's display_name joined in (or "Seed data" for null).
--
-- Auth model (per plan §1.0): any registered user (role=user/firstchair/
-- admin) can edit movements. No draftee-role gate applies here — movements
-- are wiki-edit, not byline content.
--
-- Concurrent-edit race (plan §8): two users edit the same movement
-- simultaneously. Both read max(version_number) as N, both attempt to
-- insert N+1. The unique (movement_id, version_number) constraint fails
-- one; the retry recomputes max → inserts N+2. Last write wins on
-- current_version_id. Client UI surfaces collision toast when the server
-- refresh shows a version_number higher than what the client expected.

begin;

-- ============================================
-- rate_limit_log + _check_rate_limit
-- ============================================

create table if not exists public.rate_limit_log (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists ix_rate_limit_log_user_action_time
  on public.rate_limit_log (user_id, action, created_at desc);

alter table public.rate_limit_log enable row level security;

-- No select/insert/update policies — only callable via security-definer helpers.

create or replace function public._check_rate_limit(
  p_action text,
  p_limit integer,
  p_window_seconds integer
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  select count(*)
    into v_count
    from public.rate_limit_log
    where user_id = v_uid
      and action = p_action
      and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    raise exception 'rate limit exceeded for action % (% per % seconds)',
      p_action, p_limit, p_window_seconds
      using errcode = 'P0001'; -- raise_exception; clients can pattern-match on this
  end if;

  -- Record this call so it counts toward future checks.
  insert into public.rate_limit_log (user_id, action)
    values (v_uid, p_action);

  -- Opportunistic garbage-collect: delete rows older than 2x window so the
  -- table doesn't grow unboundedly. Runs every ~20 inserts via the id %.
  if (select last_value from public.rate_limit_log_id_seq) % 20 = 0 then
    delete from public.rate_limit_log
      where created_at < now() - make_interval(secs => p_window_seconds * 2);
  end if;
end;
$$;

revoke execute on function public._check_rate_limit(text, integer, integer) from public;

-- ============================================
-- update_movement
-- ============================================
--
-- Any authenticated user can edit a movement. Writes a new version_versions
-- row and bumps current_version_id. Retry-once on unique_violation to
-- handle the concurrent-edit race on (movement_id, version_number).

create or replace function public.update_movement(
  p_movement_id uuid,
  p_ordinal smallint,
  p_name text,
  p_tempo_indication text,
  p_key_signature text,
  p_meter text,
  p_edit_summary text default null
) returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_piece_id text;
  v_next_version integer;
  v_new_version_id uuid;
  v_attempt integer := 0;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('update_movement', 10, 3600);

  -- Load piece_id for the version row (denormalized immutable).
  select piece_id into v_piece_id
    from public.movements
    where id = p_movement_id;
  if not found then
    raise exception 'movement not found: %', p_movement_id;
  end if;

  -- Validate shape.
  if char_length(coalesce(p_name, '')) < 1 or char_length(p_name) > 200 then
    raise exception 'name must be 1-200 chars';
  end if;
  if p_ordinal < 1 then
    raise exception 'ordinal must be >= 1';
  end if;

  -- Retry loop for version_number race. Max 3 attempts.
  while v_attempt < 3 loop
    v_attempt := v_attempt + 1;

    select coalesce(max(version_number), 0) + 1
      into v_next_version
      from public.movement_versions
      where movement_id = p_movement_id;

    begin
      insert into public.movement_versions (
        movement_id, piece_id, ordinal, name,
        tempo_indication, key_signature, meter,
        version_number, authored_by, edit_summary
      ) values (
        p_movement_id, v_piece_id, p_ordinal, p_name,
        p_tempo_indication, p_key_signature, p_meter,
        v_next_version, v_uid, p_edit_summary
      )
      returning id into v_new_version_id;

      exit; -- success, break out of retry loop
    exception when unique_violation then
      if v_attempt >= 3 then
        raise exception 'could not assign a unique version_number after 3 retries for movement %',
          p_movement_id;
      end if;
      -- Loop again to recompute max.
    end;
  end loop;

  -- Update the movement row: new ordinal/name/tempo/key/meter, point
  -- current_version_id at the new version. Deferred FK is fine.
  update public.movements
    set ordinal = p_ordinal,
        name = p_name,
        tempo_indication = p_tempo_indication,
        key_signature = p_key_signature,
        meter = p_meter,
        current_version_id = v_new_version_id,
        updated_at = now()
    where id = p_movement_id;

  return v_new_version_id;
end;
$$;

revoke execute on function public.update_movement(uuid, smallint, text, text, text, text, text) from public;
grant execute on function public.update_movement(uuid, smallint, text, text, text, text, text) to authenticated;

-- ============================================
-- revert_movement
-- ============================================
--
-- Copies target version's fields into a new version with
-- reverted_from_version_id set. Same rate limit as update_movement (they
-- share the 'update_movement' action key so bursts of revert+update count
-- against one bucket).

create or replace function public.revert_movement(
  p_movement_id uuid,
  p_target_version_id uuid,
  p_edit_summary text default null
) returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_target record;
  v_next_version integer;
  v_new_version_id uuid;
  v_attempt integer := 0;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('update_movement', 10, 3600);

  select * into v_target
    from public.movement_versions
    where id = p_target_version_id
      and movement_id = p_movement_id;
  if not found then
    raise exception 'target version % does not belong to movement %',
      p_target_version_id, p_movement_id;
  end if;

  while v_attempt < 3 loop
    v_attempt := v_attempt + 1;

    select coalesce(max(version_number), 0) + 1
      into v_next_version
      from public.movement_versions
      where movement_id = p_movement_id;

    begin
      insert into public.movement_versions (
        movement_id, piece_id, ordinal, name,
        tempo_indication, key_signature, meter,
        version_number, authored_by, edit_summary,
        reverted_from_version_id
      ) values (
        p_movement_id, v_target.piece_id, v_target.ordinal, v_target.name,
        v_target.tempo_indication, v_target.key_signature, v_target.meter,
        v_next_version, v_uid,
        coalesce(p_edit_summary, format('reverted to version %s', v_target.version_number)),
        p_target_version_id
      )
      returning id into v_new_version_id;

      exit;
    exception when unique_violation then
      if v_attempt >= 3 then
        raise exception 'could not assign a unique version_number after 3 retries for movement %',
          p_movement_id;
      end if;
    end;
  end loop;

  update public.movements
    set ordinal = v_target.ordinal,
        name = v_target.name,
        tempo_indication = v_target.tempo_indication,
        key_signature = v_target.key_signature,
        meter = v_target.meter,
        current_version_id = v_new_version_id,
        updated_at = now()
    where id = p_movement_id;

  return v_new_version_id;
end;
$$;

revoke execute on function public.revert_movement(uuid, uuid, text) from public;
grant execute on function public.revert_movement(uuid, uuid, text) to authenticated;

-- ============================================
-- fetch_movement_history
-- ============================================
--
-- Returns every version for a movement, most recent first, with the
-- author's display_name joined in (or 'Seed data' when authored_by is
-- null). Security-definer so it can read public.users across RLS.

create or replace function public.fetch_movement_history(
  p_movement_id uuid
) returns table (
  id uuid,
  movement_id uuid,
  piece_id text,
  ordinal smallint,
  name text,
  tempo_indication text,
  key_signature text,
  meter text,
  version_number integer,
  authored_by uuid,
  authored_by_display_name text,
  created_at timestamptz,
  edit_summary text,
  reverted_from_version_id uuid,
  is_current boolean
)
  language sql
  security definer
  set search_path = public
as $$
  select
    mv.id,
    mv.movement_id,
    mv.piece_id,
    mv.ordinal,
    mv.name,
    mv.tempo_indication,
    mv.key_signature,
    mv.meter,
    mv.version_number,
    mv.authored_by,
    coalesce(u.display_name, 'Seed data') as authored_by_display_name,
    mv.created_at,
    mv.edit_summary,
    mv.reverted_from_version_id,
    (m.current_version_id = mv.id) as is_current
  from public.movement_versions mv
  join public.movements m on m.id = mv.movement_id
  left join public.users u on u.id = mv.authored_by
  where mv.movement_id = p_movement_id
  order by mv.version_number desc;
$$;

grant execute on function public.fetch_movement_history(uuid) to anon, authenticated;

commit;
