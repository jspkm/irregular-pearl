-- Contributor approval pipeline — Slice C Step 4: Landmark RPCs.
--
-- 10 RPCs + 2 shared helpers covering the LandmarkPacket aggregate state
-- machine: draft → awaiting_contributor_approval → published → removed.
-- Mirrors the Slice A + B shape exactly: every mutation goes through a
-- security-definer RPC with integrated auth + state-machine validation +
-- version inserts with retry-once on unique-violation + notification
-- lifecycle + JSONB payload validation.
--
-- Flags and practice_notes ride inside landmark_versions as JSONB arrays.
-- DB-level CHECK constrains array type + max length; per-element enum and
-- body-length validation happens in _validate_landmark_payload, called
-- before every insert into landmark_versions.
--
-- Rate limiting: reuses the shared _check_rate_limit helper +
-- rate_limit_log table from 20260428000000_movements_wiki_rpcs.sql.
--   - content_edit / 30 per hour: self-publish + edit + approve-and-edit.
--   - submit_landmark / 20 per hour: staff drafter submits for review.
--
-- Governance alignment (20260513000000_open_self_authoring.sql):
--   - _require_active_contributor() = authenticated only.
--   - _require_staff() still gates create_*_draft / submit / retract —
--     only admin/firstchair can draft on behalf of another user.
--
-- See PLAN-contributor-pipeline-slice-c.md §4.1 for RPC signatures, §4.5
-- for body-line text, §4.7 for payload validation, §4.6 for rate limits.

-- ============================================
-- Shared helper: landmark payload validation
-- ============================================

-- Validates the shape of the flags and practice_notes JSONB payload plus
-- the scalar label / description lengths. CHECK constraints on the table
-- enforce array type + size; this helper enforces per-element rules:
--   flags[]:
--     - type must cast to flag_type enum
--     - severity must cast to flag_severity enum
--     - instrument_specificity (if present) must be a JSON array
--   practice_notes[]:
--     - body length 1..4000
-- Raises on violation with a clear message.
create or replace function public._validate_landmark_payload(
  p_label text,
  p_description text,
  p_flags jsonb,
  p_practice_notes jsonb
)
  returns void
  language plpgsql
  set search_path = public
as $$
declare
  v_elem jsonb;
  v_body text;
begin
  if p_label is null or char_length(trim(p_label)) = 0 then
    raise exception 'label required';
  end if;
  if char_length(trim(p_label)) > 60 then
    raise exception 'label exceeds 60 chars';
  end if;
  if p_description is not null and char_length(p_description) > 4000 then
    raise exception 'description exceeds 4000 chars';
  end if;

  if p_flags is null or jsonb_typeof(p_flags) <> 'array' then
    raise exception 'flags must be a JSON array';
  end if;
  if jsonb_array_length(p_flags) > 20 then
    raise exception 'flags exceeds 20 entries';
  end if;
  for v_elem in select * from jsonb_array_elements(p_flags) loop
    if v_elem->>'type' is null then
      raise exception 'flag.type required';
    end if;
    perform (v_elem->>'type')::public.flag_type;
    if v_elem->>'severity' is null then
      raise exception 'flag.severity required';
    end if;
    perform (v_elem->>'severity')::public.flag_severity;
    if v_elem ? 'instrument_specificity'
       and jsonb_typeof(v_elem->'instrument_specificity') <> 'array' then
      raise exception 'flag.instrument_specificity must be a JSON array';
    end if;
  end loop;

  if p_practice_notes is null or jsonb_typeof(p_practice_notes) <> 'array' then
    raise exception 'practice_notes must be a JSON array';
  end if;
  if jsonb_array_length(p_practice_notes) > 10 then
    raise exception 'practice_notes exceeds 10 entries';
  end if;
  for v_elem in select * from jsonb_array_elements(p_practice_notes) loop
    v_body := v_elem->>'body';
    if v_body is null or char_length(trim(v_body)) = 0 then
      raise exception 'practice_note.body required';
    end if;
    if char_length(v_body) > 4000 then
      raise exception 'practice_note.body exceeds 4000 chars';
    end if;
  end loop;
end;
$$;

-- ============================================
-- Shared helper: insert landmark version (retry-once on unique_violation)
-- ============================================

create or replace function public._insert_landmark_version(
  p_landmark_id uuid,
  p_piece_id text,
  p_movement_id uuid,
  p_contributor_id uuid,
  p_measure_start int,
  p_measure_end int,
  p_label text,
  p_description text,
  p_ordinal int,
  p_flags jsonb,
  p_practice_notes jsonb,
  p_authored_by uuid,
  p_approved boolean,
  p_rejection_note text default null
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_version_id uuid;
  v_next int;
  v_attempt int := 0;
begin
  loop
    begin
      select coalesce(max(version_number), 0) + 1
        into v_next
        from public.landmark_versions
        where landmark_id = p_landmark_id;

      v_version_id := gen_random_uuid();
      insert into public.landmark_versions (
        id, landmark_id, piece_id, movement_id, contributor_id,
        measure_start, measure_end, label, description, ordinal,
        flags, practice_notes,
        version_number, authored_by, approved_at, rejection_note
      )
      values (
        v_version_id, p_landmark_id, p_piece_id, p_movement_id, p_contributor_id,
        p_measure_start, p_measure_end, trim(p_label), p_description, coalesce(p_ordinal, 0),
        p_flags, p_practice_notes,
        v_next, p_authored_by,
        case when p_approved then now() else null end,
        p_rejection_note
      );
      return v_version_id;
    exception
      when unique_violation then
        v_attempt := v_attempt + 1;
        if v_attempt >= 2 then raise; end if;
    end;
  end loop;
end;
$$;

-- ============================================================================
-- Contributor self-authored path (3 RPCs)
-- ============================================================================

-- publish_contributor_landmark: create + publish atomically. No notification.
create or replace function public.publish_contributor_landmark(
  p_piece_id text,
  p_movement_id uuid,
  p_measure_start int,
  p_measure_end int,
  p_label text,
  p_description text,
  p_flags jsonb,
  p_practice_notes jsonb
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_landmark_id uuid;
  v_version_id uuid;
  v_contributor_id uuid := auth.uid();
  v_movement_piece_id text;
begin
  perform public._require_active_contributor();
  perform public._check_rate_limit('content_edit', 30, 3600);

  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;

  select piece_id into v_movement_piece_id
    from public.movements where id = p_movement_id;
  if not found then
    raise exception 'movement not found';
  end if;
  if v_movement_piece_id <> p_piece_id then
    raise exception 'movement does not belong to piece';
  end if;

  if p_measure_start is null or p_measure_start < 1 then
    raise exception 'measure_start must be >= 1';
  end if;
  if p_measure_end is not null and p_measure_end < p_measure_start then
    raise exception 'measure_end must be >= measure_start';
  end if;

  perform public._validate_landmark_payload(p_label, p_description, p_flags, p_practice_notes);

  v_landmark_id := gen_random_uuid();
  insert into public.landmarks (
    id, piece_id, movement_id, contributor_id, status, drafted_by
  )
  values (v_landmark_id, p_piece_id, p_movement_id, v_contributor_id, 'draft', null);

  v_version_id := public._insert_landmark_version(
    v_landmark_id, p_piece_id, p_movement_id, v_contributor_id,
    p_measure_start, p_measure_end, p_label, p_description, 0,
    p_flags, p_practice_notes,
    v_contributor_id, true, null
  );

  update public.landmarks
    set status = 'published',
        current_version_id = v_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = v_landmark_id;

  return v_landmark_id;
end;
$$;

-- publish_contributor_landmark_edit: owner edits a published landmark.
-- Writes a new approved version + moves current_version_id. No notification.
create or replace function public.publish_contributor_landmark_edit(
  p_landmark_id uuid,
  p_measure_start int,
  p_measure_end int,
  p_label text,
  p_description text,
  p_flags jsonb,
  p_practice_notes jsonb
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_version_id uuid;
  v_contributor_id uuid := auth.uid();
  v_piece_id text;
  v_movement_id uuid;
  v_status draft_status;
  v_ordinal smallint;
begin
  perform public._require_active_contributor();
  perform public._check_rate_limit('content_edit', 30, 3600);

  if p_measure_start is null or p_measure_start < 1 then
    raise exception 'measure_start must be >= 1';
  end if;
  if p_measure_end is not null and p_measure_end < p_measure_start then
    raise exception 'measure_end must be >= measure_start';
  end if;

  select l.piece_id, l.movement_id, l.status, cv.ordinal
    into v_piece_id, v_movement_id, v_status, v_ordinal
    from public.landmarks l
    left join public.landmark_versions cv on cv.id = l.current_version_id
    where l.id = p_landmark_id
      and l.contributor_id = v_contributor_id;

  if not found then
    raise exception 'landmark not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only edit a published landmark (current status: %)', v_status;
  end if;

  perform public._validate_landmark_payload(p_label, p_description, p_flags, p_practice_notes);

  v_version_id := public._insert_landmark_version(
    p_landmark_id, v_piece_id, v_movement_id, v_contributor_id,
    p_measure_start, p_measure_end, p_label, p_description, coalesce(v_ordinal, 0),
    p_flags, p_practice_notes,
    v_contributor_id, true, null
  );

  update public.landmarks
    set current_version_id = v_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_landmark_id;

  return v_version_id;
end;
$$;

-- remove_landmark: owner-only soft remove. Only published landmarks.
create or replace function public.remove_landmark(
  p_landmark_id uuid
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
    from public.landmarks
    where id = p_landmark_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'landmark not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only remove a published landmark (current status: %)', v_status;
  end if;

  update public.landmarks
    set status = 'removed',
        removed_by = v_contributor_id,
        removed_at = now()
    where id = p_landmark_id;
end;
$$;

-- ============================================================================
-- Staff-drafted path (4 RPCs)
-- ============================================================================

-- create_landmark_draft: staff drafts a landmark on behalf of a target user.
create or replace function public.create_landmark_draft(
  p_piece_id text,
  p_movement_id uuid,
  p_contributor_id uuid,
  p_measure_start int,
  p_measure_end int,
  p_label text,
  p_description text,
  p_flags jsonb,
  p_practice_notes jsonb
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_landmark_id uuid;
  v_staff_id uuid := auth.uid();
  v_movement_piece_id text;
begin
  perform public._require_staff();

  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;

  select piece_id into v_movement_piece_id
    from public.movements where id = p_movement_id;
  if not found then
    raise exception 'movement not found';
  end if;
  if v_movement_piece_id <> p_piece_id then
    raise exception 'movement does not belong to piece';
  end if;

  if not exists (select 1 from public.users where id = p_contributor_id) then
    raise exception 'target user not found';
  end if;

  if p_measure_start is null or p_measure_start < 1 then
    raise exception 'measure_start must be >= 1';
  end if;
  if p_measure_end is not null and p_measure_end < p_measure_start then
    raise exception 'measure_end must be >= measure_start';
  end if;

  perform public._validate_landmark_payload(p_label, p_description, p_flags, p_practice_notes);

  v_landmark_id := gen_random_uuid();
  insert into public.landmarks (
    id, piece_id, movement_id, contributor_id, status, drafted_by
  )
  values (v_landmark_id, p_piece_id, p_movement_id, p_contributor_id, 'draft', v_staff_id);

  perform public._insert_landmark_version(
    v_landmark_id, p_piece_id, p_movement_id, p_contributor_id,
    p_measure_start, p_measure_end, p_label, p_description, 0,
    p_flags, p_practice_notes,
    v_staff_id, false, null
  );

  return v_landmark_id;
end;
$$;

-- update_landmark_draft: staff revises a draft. Writes a new unapproved
-- version with the new payload. Pre-publish, so no approval contract yet.
create or replace function public.update_landmark_draft(
  p_landmark_id uuid,
  p_measure_start int,
  p_measure_end int,
  p_label text,
  p_description text,
  p_flags jsonb,
  p_practice_notes jsonb
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_version_id uuid;
  v_staff_id uuid := auth.uid();
  v_piece_id text;
  v_movement_id uuid;
  v_contributor_id uuid;
  v_status draft_status;
  v_ordinal smallint;
begin
  perform public._require_staff();

  if p_measure_start is null or p_measure_start < 1 then
    raise exception 'measure_start must be >= 1';
  end if;
  if p_measure_end is not null and p_measure_end < p_measure_start then
    raise exception 'measure_end must be >= measure_start';
  end if;

  select l.piece_id, l.movement_id, l.contributor_id, l.status,
         (select lv.ordinal
            from public.landmark_versions lv
            where lv.landmark_id = l.id
            order by lv.version_number desc
            limit 1)
    into v_piece_id, v_movement_id, v_contributor_id, v_status, v_ordinal
    from public.landmarks l
    where l.id = p_landmark_id;

  if not found then
    raise exception 'landmark not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'can only revise a draft (current status: %)', v_status;
  end if;

  perform public._validate_landmark_payload(p_label, p_description, p_flags, p_practice_notes);

  v_version_id := public._insert_landmark_version(
    p_landmark_id, v_piece_id, v_movement_id, v_contributor_id,
    p_measure_start, p_measure_end, p_label, p_description, coalesce(v_ordinal, 0),
    p_flags, p_practice_notes,
    v_staff_id, false, null
  );

  update public.landmarks
    set drafted_by = v_staff_id,
        updated_at = now()
    where id = p_landmark_id;

  return v_version_id;
end;
$$;

-- submit_landmark: staff submits a draft for the contributor's review.
-- Fires the approval notification.
create or replace function public.submit_landmark(
  p_landmark_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_staff_id uuid := auth.uid();
  v_contributor_id uuid;
  v_status draft_status;
  v_label text;
  v_measure_start int;
begin
  perform public._require_staff();
  perform public._check_rate_limit('submit_landmark', 20, 3600);

  select l.contributor_id, l.status, lv.label, lv.measure_start
    into v_contributor_id, v_status, v_label, v_measure_start
    from public.landmarks l
    join public.landmark_versions lv
      on lv.landmark_id = l.id
    where l.id = p_landmark_id
    order by lv.version_number desc
    limit 1;

  if not found then
    raise exception 'landmark not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'can only submit a draft (current status: %)', v_status;
  end if;

  update public.landmarks
    set status = 'awaiting_contributor_approval',
        submitted_by = v_staff_id
    where id = p_landmark_id;

  perform public._insert_notification(
    v_contributor_id,
    'landmarks',
    p_landmark_id,
    format('A draft landmark awaits your review: "%s" (m. %s)', v_label, v_measure_start),
    '/notifications'
  );
end;
$$;

-- retract_landmark: staff pulls back a submitted draft to draft status.
-- Clears the notification.
create or replace function public.retract_landmark(
  p_landmark_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_staff_id uuid := auth.uid();
  v_status draft_status;
begin
  perform public._require_staff();

  select status into v_status from public.landmarks where id = p_landmark_id;
  if not found then
    raise exception 'landmark not found';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only retract a submitted draft (current status: %)', v_status;
  end if;

  update public.landmarks
    set status = 'draft',
        retracted_by = v_staff_id,
        retracted_at = now()
    where id = p_landmark_id;

  perform public._clear_notifications_for('landmarks', p_landmark_id);
end;
$$;

-- ============================================================================
-- Contributor approval actions (3 RPCs)
-- ============================================================================

-- approve_landmark: contributor approves a staff-drafted landmark as-is.
-- Stamps approved_at on the pending version + publishes.
create or replace function public.approve_landmark(
  p_landmark_id uuid
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_contributor_id uuid := auth.uid();
  v_pending_version_id uuid;
  v_status draft_status;
begin
  perform public._require_active_contributor();

  select l.status, lv.id
    into v_status, v_pending_version_id
    from public.landmarks l
    join public.landmark_versions lv
      on lv.landmark_id = l.id and lv.approved_at is null
    where l.id = p_landmark_id
      and l.contributor_id = v_contributor_id
    order by lv.version_number desc
    limit 1;

  if not found then
    raise exception 'landmark not found, not owned by caller, or has no pending version';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only approve a submitted draft (current status: %)', v_status;
  end if;

  update public.landmark_versions
    set approved_at = now()
    where id = v_pending_version_id;

  update public.landmarks
    set status = 'published',
        current_version_id = v_pending_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_landmark_id;

  perform public._clear_notifications_for('landmarks', p_landmark_id);
  return v_pending_version_id;
end;
$$;

-- approve_and_edit_landmark: contributor approves + edits in a single action.
-- Writes a fresh approved version with the contributor's edits and publishes.
create or replace function public.approve_and_edit_landmark(
  p_landmark_id uuid,
  p_measure_start int,
  p_measure_end int,
  p_label text,
  p_description text,
  p_flags jsonb,
  p_practice_notes jsonb
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_contributor_id uuid := auth.uid();
  v_piece_id text;
  v_movement_id uuid;
  v_status draft_status;
  v_ordinal smallint;
  v_new_version_id uuid;
begin
  perform public._require_active_contributor();
  perform public._check_rate_limit('content_edit', 30, 3600);

  if p_measure_start is null or p_measure_start < 1 then
    raise exception 'measure_start must be >= 1';
  end if;
  if p_measure_end is not null and p_measure_end < p_measure_start then
    raise exception 'measure_end must be >= measure_start';
  end if;

  select l.piece_id, l.movement_id, l.status,
         (select lv.ordinal
            from public.landmark_versions lv
            where lv.landmark_id = l.id
            order by lv.version_number desc
            limit 1)
    into v_piece_id, v_movement_id, v_status, v_ordinal
    from public.landmarks l
    where l.id = p_landmark_id
      and l.contributor_id = v_contributor_id;

  if not found then
    raise exception 'landmark not found or not owned by caller';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only approve-and-edit a submitted draft (current status: %)', v_status;
  end if;

  perform public._validate_landmark_payload(p_label, p_description, p_flags, p_practice_notes);

  v_new_version_id := public._insert_landmark_version(
    p_landmark_id, v_piece_id, v_movement_id, v_contributor_id,
    p_measure_start, p_measure_end, p_label, p_description, coalesce(v_ordinal, 0),
    p_flags, p_practice_notes,
    v_contributor_id, true, null
  );

  update public.landmarks
    set status = 'published',
        current_version_id = v_new_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_landmark_id;

  perform public._clear_notifications_for('landmarks', p_landmark_id);
  return v_new_version_id;
end;
$$;

-- reject_landmark: contributor rejects a staff-drafted landmark.
-- Stamps rejection_note on the pending version + returns to draft.
create or replace function public.reject_landmark(
  p_landmark_id uuid,
  p_reason text default null
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_contributor_id uuid := auth.uid();
  v_pending_version_id uuid;
  v_status draft_status;
begin
  perform public._require_active_contributor();

  select l.status, lv.id
    into v_status, v_pending_version_id
    from public.landmarks l
    join public.landmark_versions lv
      on lv.landmark_id = l.id and lv.approved_at is null
    where l.id = p_landmark_id
      and l.contributor_id = v_contributor_id
    order by lv.version_number desc
    limit 1;

  if not found then
    raise exception 'landmark not found, not owned by caller, or has no pending version';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only reject a submitted draft (current status: %)', v_status;
  end if;

  update public.landmark_versions
    set rejection_note = p_reason
    where id = v_pending_version_id;

  update public.landmarks
    set status = 'draft',
        rejected_by = v_contributor_id
    where id = p_landmark_id;

  perform public._clear_notifications_for('landmarks', p_landmark_id);
end;
$$;

-- ============================================
-- Grants — anon and authenticated can call; RPCs enforce auth internally.
-- ============================================

grant execute on function public.publish_contributor_landmark(text, uuid, int, int, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.publish_contributor_landmark_edit(uuid, int, int, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.remove_landmark(uuid) to authenticated;
grant execute on function public.create_landmark_draft(text, uuid, uuid, int, int, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.update_landmark_draft(uuid, int, int, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.submit_landmark(uuid) to authenticated;
grant execute on function public.retract_landmark(uuid) to authenticated;
grant execute on function public.approve_landmark(uuid) to authenticated;
grant execute on function public.approve_and_edit_landmark(uuid, int, int, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.reject_landmark(uuid, text) to authenticated;
