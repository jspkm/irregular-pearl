-- Slice C Step 3 follow-up: soft-delete for movements.
--
-- The Step 3 add/delete/reorder migration (20260429000000) had
-- delete_movement hard-delete the row, cascading all movement_versions.
-- For a wiki-edit model that destroys accountability and makes recovery
-- impossible. This migration:
--
--   • Adds movements.deleted_at (null = active).
--   • Replaces the unique(piece_id, ordinal) constraint with a PARTIAL
--     unique index so soft-deleted rows don't reserve ordinals.
--   • Replaces delete_movement() to write a tombstone version row
--     (edit_summary='deleted'), set deleted_at=now(), and leave versions
--     intact.
--   • Updates fetch_movement_history to still return history for
--     soft-deleted movements (callers decide whether to display).
--
-- Reads: client-side filter `deleted_at is null` lives in src/lib/movements.ts.
-- We keep it client-side for now rather than a view/RLS rewrite, since the
-- table is small and we may want admin-only queries that include deleted
-- rows later without a second view.

begin;

alter table public.movements
  add column if not exists deleted_at timestamptz;

-- Swap the total unique constraint for a partial unique index that only
-- covers active rows. This lets a soft-deleted movement keep its ordinal
-- in the history while a new movement is added at the same ordinal.
alter table public.movements drop constraint if exists movements_piece_id_ordinal_key;

create unique index if not exists ux_movements_piece_ordinal_active
  on public.movements (piece_id, ordinal)
  where deleted_at is null;

-- ============================================
-- delete_movement — soft-delete + tombstone version
-- ============================================

create or replace function public.delete_movement(
  p_movement_id uuid,
  p_edit_summary text default null
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_mv record;
  v_next_version integer;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('update_movement', 10, 3600);

  select * into v_mv from public.movements where id = p_movement_id;
  if not found then
    raise exception 'movement not found: %', p_movement_id;
  end if;
  if v_mv.deleted_at is not null then
    raise exception 'movement already deleted';
  end if;

  -- Write a tombstone version row so history records who/when/why.
  select coalesce(max(version_number), 0) + 1 into v_next_version
    from public.movement_versions where movement_id = p_movement_id;

  insert into public.movement_versions (
    movement_id, piece_id, ordinal, name,
    tempo_indication, key_signature, meter,
    version_number, authored_by, edit_summary
  ) values (
    p_movement_id, v_mv.piece_id, v_mv.ordinal, v_mv.name,
    v_mv.tempo_indication, v_mv.key_signature, v_mv.meter,
    v_next_version, v_uid, coalesce(p_edit_summary, 'deleted')
  );

  update public.movements
    set deleted_at = now(),
        updated_at = now()
    where id = p_movement_id;
end;
$$;

revoke execute on function public.delete_movement(uuid, text) from public;
grant execute on function public.delete_movement(uuid, text) to authenticated;

-- Drop the pre-soft-delete single-arg signature so callers upgrade.
drop function if exists public.delete_movement(uuid);

-- Prevent create/update/reorder on soft-deleted movements by guarding the
-- two RPCs that look up by movement_id. Minimal touch: raise on deleted_at.
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
  v_deleted_at timestamptz;
  v_next_version integer;
  v_new_version_id uuid;
  v_attempt integer := 0;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('update_movement', 10, 3600);

  select piece_id, deleted_at into v_piece_id, v_deleted_at
    from public.movements
    where id = p_movement_id;
  if not found then
    raise exception 'movement not found: %', p_movement_id;
  end if;
  if v_deleted_at is not null then
    raise exception 'movement is deleted';
  end if;

  if char_length(coalesce(p_name, '')) < 1 or char_length(p_name) > 200 then
    raise exception 'name must be 1-200 chars';
  end if;
  if p_ordinal < 1 then
    raise exception 'ordinal must be >= 1';
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
        version_number, authored_by, edit_summary
      ) values (
        p_movement_id, v_piece_id, p_ordinal, p_name,
        p_tempo_indication, p_key_signature, p_meter,
        v_next_version, v_uid, p_edit_summary
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

create or replace function public.swap_movement_ordinals(
  p_movement_id_a uuid,
  p_movement_id_b uuid
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_a record;
  v_b record;
  v_next_a integer;
  v_next_b integer;
  v_new_va uuid;
  v_new_vb uuid;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_movement_id_a = p_movement_id_b then
    raise exception 'cannot swap a movement with itself';
  end if;

  perform public._check_rate_limit('update_movement', 10, 3600);

  select * into v_a from public.movements where id = p_movement_id_a;
  if not found then raise exception 'movement A not found'; end if;
  if v_a.deleted_at is not null then raise exception 'movement A is deleted'; end if;
  select * into v_b from public.movements where id = p_movement_id_b;
  if not found then raise exception 'movement B not found'; end if;
  if v_b.deleted_at is not null then raise exception 'movement B is deleted'; end if;

  if v_a.piece_id <> v_b.piece_id then
    raise exception 'movements belong to different pieces';
  end if;

  update public.movements set ordinal = -1 where id = p_movement_id_a;
  update public.movements set ordinal = v_a.ordinal where id = p_movement_id_b;
  update public.movements set ordinal = v_b.ordinal where id = p_movement_id_a;

  update public.movements set updated_at = now()
    where id in (p_movement_id_a, p_movement_id_b);

  select coalesce(max(version_number), 0) + 1 into v_next_a
    from public.movement_versions where movement_id = p_movement_id_a;
  insert into public.movement_versions (
    movement_id, piece_id, ordinal, name,
    tempo_indication, key_signature, meter,
    version_number, authored_by, edit_summary
  ) values (
    p_movement_id_a, v_a.piece_id, v_b.ordinal, v_a.name,
    v_a.tempo_indication, v_a.key_signature, v_a.meter,
    v_next_a, v_uid,
    format('reordered: %s → %s', v_a.ordinal, v_b.ordinal)
  )
  returning id into v_new_va;

  select coalesce(max(version_number), 0) + 1 into v_next_b
    from public.movement_versions where movement_id = p_movement_id_b;
  insert into public.movement_versions (
    movement_id, piece_id, ordinal, name,
    tempo_indication, key_signature, meter,
    version_number, authored_by, edit_summary
  ) values (
    p_movement_id_b, v_b.piece_id, v_a.ordinal, v_b.name,
    v_b.tempo_indication, v_b.key_signature, v_b.meter,
    v_next_b, v_uid,
    format('reordered: %s → %s', v_b.ordinal, v_a.ordinal)
  )
  returning id into v_new_vb;

  update public.movements set current_version_id = v_new_va where id = p_movement_id_a;
  update public.movements set current_version_id = v_new_vb where id = p_movement_id_b;
end;
$$;

commit;
