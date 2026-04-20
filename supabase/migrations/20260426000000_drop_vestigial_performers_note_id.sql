-- Post-Slice-B cleanup: drop vestigial notifications.performers_note_id.
--
-- Slice B's polymorphic notifications pivot (20260421000000) added
-- (subject_table, subject_id) alongside the narrow FK and kept
-- performers_note_id vestigial with dual-write from Slice A's submit RPC.
-- Consumers flipped to the polymorphic pair in Slice B Step 3
-- (20260422000000). The narrow FK has been load-bearing only on backfilled
-- pre-pivot rows that already have (subject_table, subject_id) populated.
--
-- This migration finishes the pivot:
--   1. Rewrite _insert_notification to drop the dual-write branch.
--   2. Rewrite _clear_notifications_for to drop the narrow-FK OR predicate.
--   3. Rewrite _clear_notifications_for_note as a thin delegate to the
--      polymorphic _clear_notifications_for so Slice A callers need no
--      changes (retract/reject/approve/remove still call it).
--   4. Rewrite submit_performers_note to route through _insert_notification
--      instead of its pre-pivot direct INSERT with performers_note_id.
--   5. Verify no function body still references performers_note_id.
--   6. Drop the column.
--
-- Runs in a single transaction. The guard in step 5 raises and rolls back
-- if any function was missed.
--
-- See PLAN-contributor-pipeline-slice-c.md §2.1 for the ordering rationale.

begin;

-- ============================================
-- Step 1: Rewrite _insert_notification — drop dual-write.
-- ============================================

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
begin
  insert into public.notifications (
    recipient_id, type, subject_table, subject_id, body, link_path
  )
  values (
    p_recipient_id, 'draft_awaiting_approval',
    p_subject_table, p_subject_id, p_body, p_link_path
  )
  on conflict (subject_table, subject_id, type) where cleared_at is null
  do nothing
  returning id into v_id;

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

-- ============================================
-- Step 2: Rewrite _clear_notifications_for — drop narrow-FK predicate.
-- ============================================

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
    where subject_table = p_subject_table
      and subject_id = p_subject_id
      and cleared_at is null;
$$;

-- ============================================
-- Step 3: Rewrite _clear_notifications_for_note — delegate to polymorphic.
-- ============================================
--
-- Keeps Slice A callers (retract_performers_note, reject_performers_note,
-- approve_performers_note, remove_performers_note) working unchanged while
-- removing the narrow-FK read path.

create or replace function public._clear_notifications_for_note(p_note_id uuid)
  returns void
  language sql
  security definer
  set search_path = public
as $$
  update public.notifications
    set cleared_at = now()
    where subject_table = 'performers_notes'
      and subject_id = p_note_id
      and cleared_at is null;
$$;

-- ============================================
-- Step 4: Rewrite submit_performers_note — route through _insert_notification.
-- ============================================
--
-- Slice A's original direct INSERT with performers_note_id is replaced by
-- a call to the polymorphic helper, matching the pattern Slice B submit RPCs
-- already use. Preserves the state-machine guards and body-line format.

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

  perform public._insert_notification(
    v_contributor_id,
    'performers_notes',
    p_note_id,
    format('A draft performer''s note on %s is ready for your review.', v_piece_title),
    '/notifications'
  );
end;
$$;

-- ============================================
-- Step 5: Verify no function body still references performers_note_id.
-- ============================================
--
-- Runs before the column drop so we roll back cleanly if any function was
-- missed. If this raises, examine pg_proc WHERE prosrc LIKE '%performers_note_id%'
-- to find the stragglers.

do $$
declare
  _count integer;
  _culprits text;
begin
  select count(*), string_agg(proname, ', ')
    into _count, _culprits
    from pg_proc
    where pronamespace = (select oid from pg_namespace where nspname = 'public')
      and prosrc like '%performers_note_id%';

  if _count > 0 then
    raise exception
      'Refusing to drop notifications.performers_note_id: % function(s) still reference it (%)',
      _count, _culprits;
  end if;
end
$$;

-- ============================================
-- Step 6: Drop the column.
-- ============================================

alter table public.notifications
  drop column performers_note_id;

commit;
