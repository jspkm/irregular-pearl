-- Contributor approval pipeline — Slice B Step 2: RPC families.
--
-- Adds shared helpers + 23 new RPCs covering InterpretiveSchool (12) and
-- PieceDescription (11). Mirrors the Slice A shape exactly: every mutation
-- goes through a security-definer RPC with integrated auth + state-machine
-- validation + version inserts with retry-once on unique-violation +
-- notification lifecycle.
--
-- Shared helpers added:
--   • _insert_notification(recipient, subject_table, subject_id, body, link_path)
--     — idempotent via ON CONFLICT DO NOTHING on uq_notifications_live_per_subject
--     (CM3). Returns the notification row id (existing or new).
--   • _clear_notifications_for(subject_table, subject_id) — generic clearing
--     for the polymorphic pair (Slice A's _clear_notifications_for_note stays
--     for the vestigial dual-write window).
--   • _insert_interpretive_school_version / _insert_piece_description_version
--     — per-subject version inserters with retry-once on unique_violation,
--     mirrors _insert_performers_note_version exactly.
--
-- Contributor self-authored paths (publish_contributor_*) publish immediately
-- without a notification, per the PRD invariant that authoring IS approval
-- when the bylined contributor is the hands on the keyboard.
--
-- Staff/AI-drafted paths route through the approval queue: create_*_draft →
-- submit_* → approve/reject/retract. The submit RPC is the only place new
-- notifications are inserted.
--
-- CM4: update_interpretive_school_metadata is OWNER-ONLY. Staff cannot rename
-- a published school. Audit via metadata_updated_by/at (4A).
--
-- See PLAN-contributor-pipeline-slice-b.md §4 for the full RPC table.

-- ============================================
-- Shared helpers — notification lifecycle
-- ============================================

-- _insert_notification: idempotent notification insert.
-- Returns the id of the live notification for this (subject, type), whether
-- newly created or already existing (CM3). Double-submits are no-ops.
create or replace function public._insert_notification(
  p_recipient_id uuid,
  p_subject_table text,
  p_subject_id uuid,
  p_body text,
  p_link_path text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_id uuid;
  v_performers_note_id uuid := null;
begin
  -- Dual-write during vestigial window (CM1): populate performers_note_id
  -- when the subject is a performers_note so Slice A consumers keep working.
  if p_subject_table = 'performers_notes' then
    v_performers_note_id := p_subject_id;
  end if;

  insert into public.notifications (
    recipient_id, type, performers_note_id,
    subject_table, subject_id, body, link_path
  )
  values (
    p_recipient_id, 'draft_awaiting_approval', v_performers_note_id,
    p_subject_table, p_subject_id, p_body, p_link_path
  )
  on conflict (subject_table, subject_id, type) where cleared_at is null
  do nothing
  returning id into v_id;

  -- If nothing was inserted (live notification already exists), return the
  -- existing row's id so callers have a stable reference.
  if v_id is null then
    select id into v_id
      from public.notifications
      where subject_table = p_subject_table
        and subject_id = p_subject_id
        and type = 'draft_awaiting_approval'
        and cleared_at is null
      limit 1;
  end if;

  return v_id;
end;
$$;

-- _clear_notifications_for: generic polymorphic clear.
-- Matches both the polymorphic pair AND (for performers_notes) the narrow FK
-- so the dual-write window is fully covered.
create or replace function public._clear_notifications_for(
  p_subject_table text,
  p_subject_id uuid
)
  returns void
  language sql
  security definer
  set search_path = public
as $$
  update public.notifications
    set cleared_at = now()
    where (
      (subject_table = p_subject_table and subject_id = p_subject_id)
      or (p_subject_table = 'performers_notes' and performers_note_id = p_subject_id)
    )
      and cleared_at is null;
$$;

-- ============================================
-- Shared helpers — per-subject version inserts (with retry-once)
-- ============================================

create or replace function public._insert_interpretive_school_version(
  p_school_id uuid,
  p_piece_id text,
  p_contributor_id uuid,
  p_body text,
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
        from public.interpretive_school_versions
        where school_id = p_school_id;

      v_version_id := gen_random_uuid();
      insert into public.interpretive_school_versions (
        id, school_id, piece_id, contributor_id,
        body, authored_by, version_number,
        approved_at, rejection_note
      )
      values (
        v_version_id, p_school_id, p_piece_id, p_contributor_id,
        p_body, p_authored_by, v_next,
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

create or replace function public._insert_piece_description_version(
  p_description_id uuid,
  p_piece_id text,
  p_contributor_id uuid,
  p_body text,
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
        from public.piece_description_versions
        where description_id = p_description_id;

      v_version_id := gen_random_uuid();
      insert into public.piece_description_versions (
        id, description_id, piece_id, contributor_id,
        body, authored_by, version_number,
        approved_at, rejection_note
      )
      values (
        v_version_id, p_description_id, p_piece_id, p_contributor_id,
        p_body, p_authored_by, v_next,
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
-- INTERPRETIVE SCHOOL RPCs (12)
-- ============================================================================

-- ============================================
-- Contributor self-authored path (schools)
-- ============================================

create or replace function public.publish_contributor_interpretive_school(
  p_piece_id text,
  p_name text,
  p_body text,
  p_tempo_cues jsonb default null
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_school_id uuid;
  v_version_id uuid;
  v_contributor_id uuid := auth.uid();
begin
  perform public._require_active_contributor();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name required';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;

  v_school_id := gen_random_uuid();

  insert into public.interpretive_schools (
    id, piece_id, contributor_id, name, tempo_cues, status, drafted_by
  )
  values (v_school_id, p_piece_id, v_contributor_id, trim(p_name), p_tempo_cues, 'draft', null);

  v_version_id := public._insert_interpretive_school_version(
    v_school_id, p_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  update public.interpretive_schools
    set status = 'published',
        current_version_id = v_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = v_school_id;

  return v_school_id;
end;
$$;

create or replace function public.publish_contributor_interpretive_school_edit(
  p_school_id uuid,
  p_body text
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
  v_status draft_status;
begin
  perform public._require_active_contributor();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;

  select piece_id, status into v_piece_id, v_status
    from public.interpretive_schools
    where id = p_school_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'school not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only edit a published school (current status: %)', v_status;
  end if;

  v_version_id := public._insert_interpretive_school_version(
    p_school_id, v_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  update public.interpretive_schools
    set current_version_id = v_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_school_id;

  return v_version_id;
end;
$$;

-- update_interpretive_school_metadata (CM4, 4A): OWNER-ONLY.
-- Updates name / tempo_cues without bumping version. Staff cannot call.
-- Sets metadata_updated_by/at for audit.
create or replace function public.update_interpretive_school_metadata(
  p_school_id uuid,
  p_name text default null,
  p_tempo_cues jsonb default null
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_contributor_id uuid := auth.uid();
begin
  perform public._require_active_contributor();

  if p_name is null and p_tempo_cues is null then
    raise exception 'at least one of p_name or p_tempo_cues is required';
  end if;

  if p_name is not null and length(trim(p_name)) = 0 then
    raise exception 'name cannot be empty';
  end if;

  -- CM4: owner-only. The WHERE contributor_id = auth.uid() is the gate.
  update public.interpretive_schools
    set name = coalesce(trim(p_name), name),
        tempo_cues = case when p_tempo_cues is not null then p_tempo_cues else tempo_cues end,
        metadata_updated_by = v_contributor_id,
        metadata_updated_at = now()
    where id = p_school_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'school not found or not owned by caller';
  end if;
end;
$$;

create or replace function public.remove_interpretive_school(
  p_school_id uuid
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
    from public.interpretive_schools
    where id = p_school_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'school not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only remove a published school (current status: %)', v_status;
  end if;

  update public.interpretive_schools
    set status = 'removed',
        removed_by = v_contributor_id,
        removed_at = now()
    where id = p_school_id;
end;
$$;

-- ============================================
-- Staff-drafted path (schools)
-- ============================================

create or replace function public.create_interpretive_school_draft(
  p_piece_id text,
  p_contributor_id uuid,
  p_name text,
  p_body text,
  p_tempo_cues jsonb default null
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_school_id uuid;
  v_staff_id uuid := auth.uid();
begin
  perform public._require_staff();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name required';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;
  if not exists (
    select 1 from public.users
    where id = p_contributor_id and is_contributor = true and contributor_active = true
  ) then
    raise exception 'target user is not an active contributor';
  end if;

  v_school_id := gen_random_uuid();
  insert into public.interpretive_schools (
    id, piece_id, contributor_id, name, tempo_cues, status, drafted_by
  )
  values (v_school_id, p_piece_id, p_contributor_id, trim(p_name), p_tempo_cues, 'draft', v_staff_id);

  perform public._insert_interpretive_school_version(
    v_school_id, p_piece_id, p_contributor_id,
    p_body, v_staff_id, false
  );

  return v_school_id;
end;
$$;

create or replace function public.update_interpretive_school_draft(
  p_school_id uuid,
  p_body text default null,
  p_name text default null,
  p_tempo_cues jsonb default null
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
  v_contributor_id uuid;
  v_status draft_status;
begin
  perform public._require_staff();

  if p_body is null and p_name is null and p_tempo_cues is null then
    raise exception 'at least one of p_body, p_name, p_tempo_cues is required';
  end if;

  select piece_id, contributor_id, status
    into v_piece_id, v_contributor_id, v_status
    from public.interpretive_schools where id = p_school_id;

  if not found then
    raise exception 'school not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'can only revise a draft (current status: %)', v_status;
  end if;

  -- If body changed, insert a new version row.
  if p_body is not null then
    if length(trim(p_body)) = 0 then
      raise exception 'body cannot be empty';
    end if;
    v_version_id := public._insert_interpretive_school_version(
      p_school_id, v_piece_id, v_contributor_id,
      p_body, v_staff_id, false
    );
  end if;

  -- Metadata fields (name, tempo_cues) update on the row without a version bump.
  -- Pre-publish, this is fine — no approval contract to violate yet.
  update public.interpretive_schools
    set name = coalesce(nullif(trim(coalesce(p_name, '')), ''), name),
        tempo_cues = case when p_tempo_cues is not null then p_tempo_cues else tempo_cues end,
        drafted_by = v_staff_id,
        updated_at = now()
    where id = p_school_id;

  return v_version_id;
end;
$$;

create or replace function public.submit_interpretive_school(
  p_school_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_staff_id uuid := auth.uid();
  v_piece_id text;
  v_piece_title text;
  v_contributor_id uuid;
  v_status draft_status;
  v_name text;
begin
  perform public._require_staff();

  select s.piece_id, s.contributor_id, s.status, s.name, p.title
    into v_piece_id, v_contributor_id, v_status, v_name, v_piece_title
    from public.interpretive_schools s
    join public.pieces p on p.id = s.piece_id
    where s.id = p_school_id;

  if not found then
    raise exception 'school not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'can only submit a draft (current status: %)', v_status;
  end if;

  update public.interpretive_schools
    set status = 'awaiting_contributor_approval',
        submitted_by = v_staff_id
    where id = p_school_id;

  perform public._insert_notification(
    v_contributor_id,
    'interpretive_schools',
    p_school_id,
    format('A draft interpretive school (''%s'') on %s is ready for your review.', v_name, v_piece_title),
    '/notifications'
  );
end;
$$;

create or replace function public.retract_interpretive_school(
  p_school_id uuid
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

  select status into v_status from public.interpretive_schools where id = p_school_id;
  if not found then
    raise exception 'school not found';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only retract a submitted draft (current status: %)', v_status;
  end if;

  update public.interpretive_schools
    set status = 'draft',
        retracted_by = v_staff_id,
        retracted_at = now()
    where id = p_school_id;

  perform public._clear_notifications_for('interpretive_schools', p_school_id);
end;
$$;

-- ============================================
-- Contributor actions on staff-drafted schools
-- ============================================

create or replace function public.approve_interpretive_school(
  p_school_id uuid
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

  select s.status, v.id
    into v_status, v_pending_version_id
    from public.interpretive_schools s
    join public.interpretive_school_versions v
      on v.school_id = s.id and v.approved_at is null
    where s.id = p_school_id
      and s.contributor_id = v_contributor_id
    order by v.version_number desc
    limit 1;

  if not found then
    raise exception 'school not found, not owned by caller, or has no pending version';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only approve a submitted draft (current status: %)', v_status;
  end if;

  update public.interpretive_school_versions
    set approved_at = now()
    where id = v_pending_version_id;

  update public.interpretive_schools
    set status = 'published',
        current_version_id = v_pending_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_school_id;

  perform public._clear_notifications_for('interpretive_schools', p_school_id);
  return v_pending_version_id;
end;
$$;

create or replace function public.approve_and_edit_interpretive_school(
  p_school_id uuid,
  p_body text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_contributor_id uuid := auth.uid();
  v_piece_id text;
  v_status draft_status;
  v_new_version_id uuid;
begin
  perform public._require_active_contributor();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;

  select piece_id, status
    into v_piece_id, v_status
    from public.interpretive_schools
    where id = p_school_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'school not found or not owned by caller';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only approve-and-edit a submitted draft (current status: %)', v_status;
  end if;

  v_new_version_id := public._insert_interpretive_school_version(
    p_school_id, v_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  update public.interpretive_schools
    set status = 'published',
        current_version_id = v_new_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_school_id;

  perform public._clear_notifications_for('interpretive_schools', p_school_id);
  return v_new_version_id;
end;
$$;

create or replace function public.reject_interpretive_school(
  p_school_id uuid,
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

  select s.status, v.id
    into v_status, v_pending_version_id
    from public.interpretive_schools s
    join public.interpretive_school_versions v
      on v.school_id = s.id and v.approved_at is null
    where s.id = p_school_id
      and s.contributor_id = v_contributor_id
    order by v.version_number desc
    limit 1;

  if not found then
    raise exception 'school not found, not owned by caller, or has no pending version';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only reject a submitted draft (current status: %)', v_status;
  end if;

  update public.interpretive_school_versions
    set rejection_note = p_reason
    where id = v_pending_version_id;

  update public.interpretive_schools
    set status = 'draft',
        rejected_by = v_contributor_id
    where id = p_school_id;

  perform public._clear_notifications_for('interpretive_schools', p_school_id);
end;
$$;

-- ============================================================================
-- PIECE DESCRIPTION RPCs (11 — no metadata RPC, body-only entity)
-- ============================================================================

-- ============================================
-- Contributor self-authored path (descriptions)
-- ============================================

create or replace function public.publish_contributor_piece_description(
  p_piece_id text,
  p_body text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_description_id uuid;
  v_version_id uuid;
  v_contributor_id uuid := auth.uid();
begin
  perform public._require_active_contributor();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;

  v_description_id := gen_random_uuid();

  insert into public.piece_descriptions (
    id, piece_id, contributor_id, status, drafted_by
  )
  values (v_description_id, p_piece_id, v_contributor_id, 'draft', null);

  v_version_id := public._insert_piece_description_version(
    v_description_id, p_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  update public.piece_descriptions
    set status = 'published',
        current_version_id = v_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = v_description_id;

  return v_description_id;
end;
$$;

create or replace function public.publish_contributor_piece_description_edit(
  p_description_id uuid,
  p_body text
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
  v_status draft_status;
begin
  perform public._require_active_contributor();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;

  select piece_id, status into v_piece_id, v_status
    from public.piece_descriptions
    where id = p_description_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'description not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only edit a published description (current status: %)', v_status;
  end if;

  v_version_id := public._insert_piece_description_version(
    p_description_id, v_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  update public.piece_descriptions
    set current_version_id = v_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_description_id;

  return v_version_id;
end;
$$;

create or replace function public.remove_piece_description(
  p_description_id uuid
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
    from public.piece_descriptions
    where id = p_description_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'description not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only remove a published description (current status: %)', v_status;
  end if;

  update public.piece_descriptions
    set status = 'removed',
        removed_by = v_contributor_id,
        removed_at = now()
    where id = p_description_id;
end;
$$;

-- ============================================
-- Staff-drafted path (descriptions)
-- ============================================

create or replace function public.create_piece_description_draft(
  p_piece_id text,
  p_contributor_id uuid,
  p_body text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_description_id uuid;
  v_staff_id uuid := auth.uid();
begin
  perform public._require_staff();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;
  if not exists (
    select 1 from public.users
    where id = p_contributor_id and is_contributor = true and contributor_active = true
  ) then
    raise exception 'target user is not an active contributor';
  end if;

  v_description_id := gen_random_uuid();
  insert into public.piece_descriptions (
    id, piece_id, contributor_id, status, drafted_by
  )
  values (v_description_id, p_piece_id, p_contributor_id, 'draft', v_staff_id);

  perform public._insert_piece_description_version(
    v_description_id, p_piece_id, p_contributor_id,
    p_body, v_staff_id, false
  );

  return v_description_id;
end;
$$;

create or replace function public.update_piece_description_draft(
  p_description_id uuid,
  p_body text
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
  v_contributor_id uuid;
  v_status draft_status;
begin
  perform public._require_staff();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;

  select piece_id, contributor_id, status
    into v_piece_id, v_contributor_id, v_status
    from public.piece_descriptions where id = p_description_id;

  if not found then
    raise exception 'description not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'can only revise a draft (current status: %)', v_status;
  end if;

  v_version_id := public._insert_piece_description_version(
    p_description_id, v_piece_id, v_contributor_id,
    p_body, v_staff_id, false
  );

  update public.piece_descriptions
    set drafted_by = v_staff_id,
        updated_at = now()
    where id = p_description_id;

  return v_version_id;
end;
$$;

create or replace function public.submit_piece_description(
  p_description_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_staff_id uuid := auth.uid();
  v_piece_id text;
  v_piece_title text;
  v_contributor_id uuid;
  v_status draft_status;
begin
  perform public._require_staff();

  select d.piece_id, d.contributor_id, d.status, p.title
    into v_piece_id, v_contributor_id, v_status, v_piece_title
    from public.piece_descriptions d
    join public.pieces p on p.id = d.piece_id
    where d.id = p_description_id;

  if not found then
    raise exception 'description not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'can only submit a draft (current status: %)', v_status;
  end if;

  update public.piece_descriptions
    set status = 'awaiting_contributor_approval',
        submitted_by = v_staff_id
    where id = p_description_id;

  perform public._insert_notification(
    v_contributor_id,
    'piece_descriptions',
    p_description_id,
    format('A draft piece description on %s is ready for your review.', v_piece_title),
    '/notifications'
  );
end;
$$;

create or replace function public.retract_piece_description(
  p_description_id uuid
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

  select status into v_status from public.piece_descriptions where id = p_description_id;
  if not found then
    raise exception 'description not found';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only retract a submitted draft (current status: %)', v_status;
  end if;

  update public.piece_descriptions
    set status = 'draft',
        retracted_by = v_staff_id,
        retracted_at = now()
    where id = p_description_id;

  perform public._clear_notifications_for('piece_descriptions', p_description_id);
end;
$$;

-- ============================================
-- Contributor actions on staff-drafted descriptions
-- ============================================

create or replace function public.approve_piece_description(
  p_description_id uuid
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

  select d.status, v.id
    into v_status, v_pending_version_id
    from public.piece_descriptions d
    join public.piece_description_versions v
      on v.description_id = d.id and v.approved_at is null
    where d.id = p_description_id
      and d.contributor_id = v_contributor_id
    order by v.version_number desc
    limit 1;

  if not found then
    raise exception 'description not found, not owned by caller, or has no pending version';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only approve a submitted draft (current status: %)', v_status;
  end if;

  update public.piece_description_versions
    set approved_at = now()
    where id = v_pending_version_id;

  update public.piece_descriptions
    set status = 'published',
        current_version_id = v_pending_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_description_id;

  perform public._clear_notifications_for('piece_descriptions', p_description_id);
  return v_pending_version_id;
end;
$$;

create or replace function public.approve_and_edit_piece_description(
  p_description_id uuid,
  p_body text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_contributor_id uuid := auth.uid();
  v_piece_id text;
  v_status draft_status;
  v_new_version_id uuid;
begin
  perform public._require_active_contributor();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;

  select piece_id, status
    into v_piece_id, v_status
    from public.piece_descriptions
    where id = p_description_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'description not found or not owned by caller';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only approve-and-edit a submitted draft (current status: %)', v_status;
  end if;

  v_new_version_id := public._insert_piece_description_version(
    p_description_id, v_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  update public.piece_descriptions
    set status = 'published',
        current_version_id = v_new_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_description_id;

  perform public._clear_notifications_for('piece_descriptions', p_description_id);
  return v_new_version_id;
end;
$$;

create or replace function public.reject_piece_description(
  p_description_id uuid,
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

  select d.status, v.id
    into v_status, v_pending_version_id
    from public.piece_descriptions d
    join public.piece_description_versions v
      on v.description_id = d.id and v.approved_at is null
    where d.id = p_description_id
      and d.contributor_id = v_contributor_id
    order by v.version_number desc
    limit 1;

  if not found then
    raise exception 'description not found, not owned by caller, or has no pending version';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only reject a submitted draft (current status: %)', v_status;
  end if;

  update public.piece_description_versions
    set rejection_note = p_reason
    where id = v_pending_version_id;

  update public.piece_descriptions
    set status = 'draft',
        rejected_by = v_contributor_id
    where id = p_description_id;

  perform public._clear_notifications_for('piece_descriptions', p_description_id);
end;
$$;

-- ============================================
-- Execute grants (authenticated; functions gate via auth.uid())
-- ============================================

-- Schools
grant execute on function public.publish_contributor_interpretive_school(text, text, text, jsonb)        to authenticated;
grant execute on function public.publish_contributor_interpretive_school_edit(uuid, text)               to authenticated;
grant execute on function public.update_interpretive_school_metadata(uuid, text, jsonb)                 to authenticated;
grant execute on function public.remove_interpretive_school(uuid)                                       to authenticated;
grant execute on function public.create_interpretive_school_draft(text, uuid, text, text, jsonb)        to authenticated;
grant execute on function public.update_interpretive_school_draft(uuid, text, text, jsonb)              to authenticated;
grant execute on function public.submit_interpretive_school(uuid)                                       to authenticated;
grant execute on function public.retract_interpretive_school(uuid)                                      to authenticated;
grant execute on function public.approve_interpretive_school(uuid)                                      to authenticated;
grant execute on function public.approve_and_edit_interpretive_school(uuid, text)                       to authenticated;
grant execute on function public.reject_interpretive_school(uuid, text)                                 to authenticated;

-- Descriptions
grant execute on function public.publish_contributor_piece_description(text, text)                      to authenticated;
grant execute on function public.publish_contributor_piece_description_edit(uuid, text)                 to authenticated;
grant execute on function public.remove_piece_description(uuid)                                         to authenticated;
grant execute on function public.create_piece_description_draft(text, uuid, text)                       to authenticated;
grant execute on function public.update_piece_description_draft(uuid, text)                             to authenticated;
grant execute on function public.submit_piece_description(uuid)                                         to authenticated;
grant execute on function public.retract_piece_description(uuid)                                        to authenticated;
grant execute on function public.approve_piece_description(uuid)                                        to authenticated;
grant execute on function public.approve_and_edit_piece_description(uuid, text)                         to authenticated;
grant execute on function public.reject_piece_description(uuid, text)                                   to authenticated;

-- Internal helpers — revoked from public.
revoke execute on function public._insert_notification(uuid, text, uuid, text, text) from public;
revoke execute on function public._clear_notifications_for(text, uuid) from public;
revoke execute on function public._insert_interpretive_school_version(uuid, text, uuid, text, uuid, boolean, text) from public;
revoke execute on function public._insert_piece_description_version(uuid, text, uuid, text, uuid, boolean, text) from public;
