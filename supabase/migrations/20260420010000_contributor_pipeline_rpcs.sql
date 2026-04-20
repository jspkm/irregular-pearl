-- Contributor approval pipeline — Slice A RPCs (step 2).
--
-- All state transitions on performers_notes go through these security-definer
-- functions. The RLS policies on the underlying tables deliberately allow
-- only select; clients mutate via these RPCs, which run with elevated
-- privileges and encapsulate:
--
--   • auth + role guards (who can call this?)
--   • state-machine validation (is this transition legal?)
--   • audit trail writes (who did this, when?)
--   • version row inserts with unique-violation retry-once
--   • notification lifecycle (insert on submit, clear on approve/reject/retract)
--
-- Contributor self-authored paths (publish_contributor_note,
-- publish_contributor_edit) bypass the approval queue entirely per the PRD
-- clarification: when the bylined contributor is the hands on the keyboard,
-- authoring is approval. No notifications fire.
--
-- Staff/AI-drafted paths (create/update/submit/retract) keep the draft
-- invisible to the contributor until the explicit `submit` step, which
-- inserts the notification that nags the contributor to act.
--
-- See PLAN-contributor-pipeline-slice-a.md §3 for the full state machine.

-- ============================================
-- Internal helper: clear an un-cleared notification for a note
-- ============================================

create or replace function public._clear_notifications_for_note(p_note_id uuid)
  returns void
  language sql
  security definer
  set search_path = public
as $$
  update public.notifications
    set cleared_at = now()
    where performers_note_id = p_note_id
      and cleared_at is null;
$$;

-- ============================================
-- Internal helper: require the caller be an active contributor
-- ============================================

create or replace function public._require_active_contributor()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if not exists (
    select 1 from public.users
    where id = auth.uid()
      and is_contributor = true
      and contributor_active = true
  ) then
    raise exception 'caller is not an active contributor';
  end if;
end;
$$;

-- ============================================
-- Internal helper: require the caller be staff
-- ============================================

create or replace function public._require_staff()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if not public.is_staff() then
    raise exception 'caller is not staff';
  end if;
end;
$$;

-- ============================================
-- Internal helper: insert a new version with retry-once on unique_violation
-- Returns the new version row's id.
-- ============================================

create or replace function public._insert_performers_note_version(
  p_note_id uuid,
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
        from public.performers_note_versions
        where note_id = p_note_id;

      v_version_id := gen_random_uuid();
      insert into public.performers_note_versions (
        id, note_id, piece_id, contributor_id,
        body, authored_by, version_number,
        approved_at, rejection_note
      )
      values (
        v_version_id, p_note_id, p_piece_id, p_contributor_id,
        p_body, p_authored_by, v_next,
        case when p_approved then now() else null end,
        p_rejection_note
      );
      return v_version_id;
    exception
      when unique_violation then
        v_attempt := v_attempt + 1;
        if v_attempt >= 2 then
          raise;
        end if;
        -- loop to retry: another transaction grabbed the same version_number
    end;
  end loop;
end;
$$;

-- ============================================
-- CONTRIBUTOR self-authored path
-- ============================================

-- publish_contributor_note: contributor creates + publishes in one atomic RPC.
-- Status goes directly to 'published'; no notification fires.
create or replace function public.publish_contributor_note(
  p_piece_id text,
  p_body text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_note_id uuid;
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

  v_note_id := gen_random_uuid();

  -- Insert as draft first so the published_has_version CHECK is satisfied.
  insert into public.performers_notes (
    id, piece_id, contributor_id, status, drafted_by
  )
  values (v_note_id, p_piece_id, v_contributor_id, 'draft', null);

  -- Insert v1 (approved, authored by contributor).
  v_version_id := public._insert_performers_note_version(
    v_note_id, p_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  -- Flip to published with the version attached in one statement.
  update public.performers_notes
    set status = 'published',
        current_version_id = v_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = v_note_id;

  return v_note_id;
end;
$$;

-- publish_contributor_edit: contributor edits their own published note.
-- New version inserted, current_version_id bumped, status stays 'published'.
-- No intermediate state, no notification trigger fires.
create or replace function public.publish_contributor_edit(
  p_note_id uuid,
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
    from public.performers_notes
    where id = p_note_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'note not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only edit a published note (current status: %)', v_status;
  end if;

  v_version_id := public._insert_performers_note_version(
    p_note_id, v_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  update public.performers_notes
    set current_version_id = v_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_note_id;

  return v_version_id;
end;
$$;

-- remove_performers_note: contributor soft-removes their own published note.
-- Trigger auto-clears any un-cleared notifications for this note.
create or replace function public.remove_performers_note(
  p_note_id uuid
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
    from public.performers_notes
    where id = p_note_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'note not found or not owned by caller';
  end if;
  if v_status <> 'published' then
    raise exception 'can only remove a published note (current status: %)', v_status;
  end if;

  update public.performers_notes
    set status = 'removed',
        removed_by = v_contributor_id,
        removed_at = now()
    where id = p_note_id;
end;
$$;

-- ============================================
-- STAFF/AI-drafted path
-- ============================================

-- create_performers_note_draft: staff authors a draft on behalf of a contributor.
-- Creates the note in 'draft' status + v1. No notification yet.
create or replace function public.create_performers_note_draft(
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
  v_note_id uuid;
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
    where id = p_contributor_id
      and is_contributor = true
      and contributor_active = true
  ) then
    raise exception 'target user is not an active contributor';
  end if;

  v_note_id := gen_random_uuid();
  insert into public.performers_notes (
    id, piece_id, contributor_id, status, drafted_by
  )
  values (v_note_id, p_piece_id, p_contributor_id, 'draft', v_staff_id);

  perform public._insert_performers_note_version(
    v_note_id, p_piece_id, p_contributor_id,
    p_body, v_staff_id, false
  );

  return v_note_id;
end;
$$;

-- update_performers_note_draft: staff revises an existing draft with a new
-- version. Must be in 'draft' status (post-create or post-reject/retract).
-- Creates a new version row; staff can inspect prior versions' rejection_note
-- to understand why H. sent it back.
create or replace function public.update_performers_note_draft(
  p_note_id uuid,
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
    from public.performers_notes where id = p_note_id;

  if not found then
    raise exception 'note not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'can only revise a draft (current status: %)', v_status;
  end if;

  v_version_id := public._insert_performers_note_version(
    p_note_id, v_piece_id, v_contributor_id,
    p_body, v_staff_id, false
  );

  update public.performers_notes
    set drafted_by = v_staff_id,
        updated_at = now()
    where id = p_note_id;

  return v_version_id;
end;
$$;

-- submit_performers_note: staff sends a draft to the contributor's queue.
-- Transitions 'draft' → 'awaiting_contributor_approval' and inserts the
-- notification. This is the only way a notification gets created in Slice A.
create or replace function public.submit_performers_note(
  p_note_id uuid
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

  select n.piece_id, n.contributor_id, n.status, p.title
    into v_piece_id, v_contributor_id, v_status, v_piece_title
    from public.performers_notes n
    join public.pieces p on p.id = n.piece_id
    where n.id = p_note_id;

  if not found then
    raise exception 'note not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'can only submit a draft (current status: %)', v_status;
  end if;

  update public.performers_notes
    set status = 'awaiting_contributor_approval',
        submitted_by = v_staff_id
    where id = p_note_id;

  insert into public.notifications (
    recipient_id, type, performers_note_id, body, link_path
  )
  values (
    v_contributor_id,
    'draft_awaiting_approval',
    p_note_id,
    format('A draft performer''s note on %s is ready for your review.', v_piece_title),
    '/notifications'
  );
end;
$$;

-- retract_performers_note: staff pulls a submitted draft back.
-- Transitions 'awaiting_contributor_approval' → 'draft' and clears the
-- notification.
create or replace function public.retract_performers_note(
  p_note_id uuid
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

  select status into v_status from public.performers_notes where id = p_note_id;
  if not found then
    raise exception 'note not found';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only retract a submitted draft (current status: %)', v_status;
  end if;

  update public.performers_notes
    set status = 'draft',
        retracted_by = v_staff_id,
        retracted_at = now()
    where id = p_note_id;

  perform public._clear_notifications_for_note(p_note_id);
end;
$$;

-- ============================================
-- CONTRIBUTOR actions on staff/AI-drafted notes
-- ============================================

-- approve_performers_note: contributor approves a pending staff draft as-is.
create or replace function public.approve_performers_note(
  p_note_id uuid
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

  select n.status, pv.id
    into v_status, v_pending_version_id
    from public.performers_notes n
    join public.performers_note_versions pv
      on pv.note_id = n.id and pv.approved_at is null
    where n.id = p_note_id
      and n.contributor_id = v_contributor_id
    order by pv.version_number desc
    limit 1;

  if not found then
    raise exception 'note not found, not owned by caller, or has no pending version';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only approve a submitted draft (current status: %)', v_status;
  end if;

  update public.performers_note_versions
    set approved_at = now()
    where id = v_pending_version_id;

  update public.performers_notes
    set status = 'published',
        current_version_id = v_pending_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_note_id;

  perform public._clear_notifications_for_note(p_note_id);
  return v_pending_version_id;
end;
$$;

-- approve_and_edit_performers_note: contributor approves a pending draft with
-- wording edits. Inserts a new version with the contributor's body and
-- publishes it in one atomic RPC. The pending staff version stays on the
-- record as history (unapproved, for audit).
create or replace function public.approve_and_edit_performers_note(
  p_note_id uuid,
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
    from public.performers_notes
    where id = p_note_id
      and contributor_id = v_contributor_id;

  if not found then
    raise exception 'note not found or not owned by caller';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only approve-and-edit a submitted draft (current status: %)', v_status;
  end if;

  v_new_version_id := public._insert_performers_note_version(
    p_note_id, v_piece_id, v_contributor_id,
    p_body, v_contributor_id, true
  );

  update public.performers_notes
    set status = 'published',
        current_version_id = v_new_version_id,
        approved_by = v_contributor_id,
        approved_by_contributor_at = now()
    where id = p_note_id;

  perform public._clear_notifications_for_note(p_note_id);
  return v_new_version_id;
end;
$$;

-- reject_performers_note: contributor sends the draft back to staff with an
-- optional freeform reason. Reason is stored on the pending version row.
create or replace function public.reject_performers_note(
  p_note_id uuid,
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

  select n.status, pv.id
    into v_status, v_pending_version_id
    from public.performers_notes n
    join public.performers_note_versions pv
      on pv.note_id = n.id and pv.approved_at is null
    where n.id = p_note_id
      and n.contributor_id = v_contributor_id
    order by pv.version_number desc
    limit 1;

  if not found then
    raise exception 'note not found, not owned by caller, or has no pending version';
  end if;
  if v_status <> 'awaiting_contributor_approval' then
    raise exception 'can only reject a submitted draft (current status: %)', v_status;
  end if;

  update public.performers_note_versions
    set rejection_note = p_reason
    where id = v_pending_version_id;

  update public.performers_notes
    set status = 'draft',
        rejected_by = v_contributor_id
    where id = p_note_id;

  perform public._clear_notifications_for_note(p_note_id);
end;
$$;

-- ============================================
-- NOTIFICATION clearing
-- ============================================

-- clear_notification: recipient clears a single un-cleared notification.
create or replace function public.clear_notification(p_notification_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_recipient_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  select recipient_id into v_recipient_id
    from public.notifications where id = p_notification_id;

  if not found then
    raise exception 'notification not found';
  end if;
  if v_recipient_id <> auth.uid() then
    raise exception 'notification not owned by caller';
  end if;

  update public.notifications
    set cleared_at = now()
    where id = p_notification_id
      and cleared_at is null;
end;
$$;

-- clear_all_notifications: recipient marks every un-cleared notification as
-- cleared. Returns the number cleared.
create or replace function public.clear_all_notifications()
  returns integer
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  with cleared as (
    update public.notifications
      set cleared_at = now()
      where recipient_id = auth.uid()
        and cleared_at is null
      returning 1
  )
  select count(*) into v_count from cleared;
  return v_count;
end;
$$;

-- ============================================
-- Execute grants (authenticated users can invoke; functions gate via auth.uid())
-- ============================================

grant execute on function public.publish_contributor_note(text, text)            to authenticated;
grant execute on function public.publish_contributor_edit(uuid, text)            to authenticated;
grant execute on function public.remove_performers_note(uuid)                    to authenticated;
grant execute on function public.create_performers_note_draft(text, uuid, text)  to authenticated;
grant execute on function public.update_performers_note_draft(uuid, text)        to authenticated;
grant execute on function public.submit_performers_note(uuid)                    to authenticated;
grant execute on function public.retract_performers_note(uuid)                   to authenticated;
grant execute on function public.approve_performers_note(uuid)                   to authenticated;
grant execute on function public.approve_and_edit_performers_note(uuid, text)    to authenticated;
grant execute on function public.reject_performers_note(uuid, text)              to authenticated;
grant execute on function public.clear_notification(uuid)                        to authenticated;
grant execute on function public.clear_all_notifications()                       to authenticated;

-- Internal helpers: no anon/authenticated grants — invoked only from other
-- security-definer functions. Revoke any inherited public grants.
revoke all on function public._clear_notifications_for_note(uuid) from public;
revoke all on function public._require_active_contributor() from public;
revoke all on function public._require_staff() from public;
revoke all on function public._insert_performers_note_version(uuid, text, uuid, text, uuid, boolean, text) from public;
