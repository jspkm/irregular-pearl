-- Slice C Step 3 extension: add / delete / reorder movements.
--
-- The Step 3 core (20260428000000) only covered in-place wiki-edit of
-- existing movements. User feedback surfaced that discovery of "move this",
-- "remove this", and "add another" was missing. Consistent with the
-- wiki-edit model: any authenticated user can perform all four operations,
-- all share the 10/hour/user rate bucket, and every mutation writes to
-- movement_versions for history.
--
-- RPCs:
--   • create_movement — appends a new movement to a piece. Its ordinal is
--     max(ordinal)+1 for the piece (1 if none). Writes the initial version
--     with authored_by = caller (vs seed data which is authored_by NULL).
--   • delete_movement — hard-deletes movement + all versions via cascade.
--     We keep this simple for now; Slice C Step 6 introduces landmarks that
--     FK to movements (no cascade to landmarks yet, so no orphan risk).
--   • swap_movement_ordinals — transactionally swaps the ordinal of two
--     movements belonging to the same piece. Client picks the neighbor to
--     swap with (↑ = swap with ordinal-1, ↓ = swap with ordinal+1). Writes
--     a new version row for BOTH movements so history records the move.
--
-- Rate limit: all three share the 'update_movement' bucket (10/hour/user).
-- This prevents drive-by vandalism via bursts of add/delete/reorder.

begin;

-- ============================================
-- create_movement
-- ============================================

create or replace function public.create_movement(
  p_piece_id text,
  p_name text,
  p_tempo_indication text default null,
  p_key_signature text default null,
  p_meter text default null,
  p_edit_summary text default null
) returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_next_ordinal smallint;
  v_movement_id uuid;
  v_version_id uuid;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('update_movement', 10, 3600);

  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found: %', p_piece_id;
  end if;

  if char_length(coalesce(p_name, '')) < 1 or char_length(p_name) > 200 then
    raise exception 'name must be 1-200 chars';
  end if;

  select coalesce(max(ordinal), 0) + 1
    into v_next_ordinal
    from public.movements
    where piece_id = p_piece_id;

  -- Defer the current_version_id FK until both rows exist.
  set constraints all deferred;

  insert into public.movements (
    piece_id, ordinal, name, tempo_indication, key_signature, meter, current_version_id
  ) values (
    p_piece_id, v_next_ordinal, p_name, p_tempo_indication, p_key_signature, p_meter, null
  )
  returning id into v_movement_id;

  insert into public.movement_versions (
    movement_id, piece_id, ordinal, name,
    tempo_indication, key_signature, meter,
    version_number, authored_by, edit_summary
  ) values (
    v_movement_id, p_piece_id, v_next_ordinal, p_name,
    p_tempo_indication, p_key_signature, p_meter,
    1, v_uid, coalesce(p_edit_summary, 'created')
  )
  returning id into v_version_id;

  update public.movements
    set current_version_id = v_version_id
    where id = v_movement_id;

  return v_movement_id;
end;
$$;

revoke execute on function public.create_movement(text, text, text, text, text, text) from public;
grant execute on function public.create_movement(text, text, text, text, text, text) to authenticated;

-- ============================================
-- delete_movement
-- ============================================

create or replace function public.delete_movement(
  p_movement_id uuid
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

  perform public._check_rate_limit('update_movement', 10, 3600);

  if not exists (select 1 from public.movements where id = p_movement_id) then
    raise exception 'movement not found: %', p_movement_id;
  end if;

  -- current_version_id FK is deferrable; cascade will drop versions first,
  -- then the movement row. No orphan versions.
  delete from public.movements where id = p_movement_id;
end;
$$;

revoke execute on function public.delete_movement(uuid) from public;
grant execute on function public.delete_movement(uuid) to authenticated;

-- ============================================
-- swap_movement_ordinals
-- ============================================
--
-- Two-movement swap, both rows get new version entries so the move is in
-- history. The intermediate negative-ordinal step dodges the unique
-- (piece_id, ordinal) constraint without needing to make it deferrable.

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
  select * into v_b from public.movements where id = p_movement_id_b;
  if not found then raise exception 'movement B not found'; end if;

  if v_a.piece_id <> v_b.piece_id then
    raise exception 'movements belong to different pieces';
  end if;

  -- Dance around the unique constraint with a temporary negative ordinal.
  update public.movements set ordinal = -1 where id = p_movement_id_a;
  update public.movements set ordinal = v_a.ordinal where id = p_movement_id_b;
  update public.movements set ordinal = v_b.ordinal where id = p_movement_id_a;

  -- Bump updated_at on both.
  update public.movements set updated_at = now()
    where id in (p_movement_id_a, p_movement_id_b);

  -- Record the move in history for both movements.
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

revoke execute on function public.swap_movement_ordinals(uuid, uuid) from public;
grant execute on function public.swap_movement_ordinals(uuid, uuid) to authenticated;

commit;
