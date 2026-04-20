-- Contributor approval pipeline — Slice B RPCs, part 1.
--
-- Step 1 of the 6-step rollout (companion to 20260421000000). This file
-- contains ONLY the Slice A dual-write updates needed to keep Slice A
-- consumers working during the vestigial-column window (CM1):
--
--   • submit_performers_note — now populates BOTH performers_note_id AND
--     (subject_table='performers_notes', subject_id=<note_id>) on insert,
--     with ON CONFLICT DO NOTHING for idempotency (CM3).
--   • _clear_notifications_for_note — updated to clear by subject_table
--     as well (belt-and-suspenders; both predicates find the same rows
--     during the vestigial window).
--
-- The 11+12 new RPC families for interpretive_schools and piece_descriptions
-- ship in Step 2 of the rollout, in a follow-up migration.
--
-- See PLAN-contributor-pipeline-slice-b.md §4 and §10.1.

-- ============================================
-- submit_performers_note — dual-write + idempotent insert
-- ============================================

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

  -- CM1: dual-write performers_note_id AND (subject_table, subject_id)
  -- until Slice A consumers are refactored in Step 3. A later cleanup
  -- migration drops performers_note_id and removes the dual-write.
  -- CM3: ON CONFLICT DO NOTHING is the idempotency guard. The partial
  -- unique index uq_notifications_live_per_subject (added in
  -- 20260421000000) catches a retry or double-submit and makes it a no-op.
  insert into public.notifications (
    recipient_id, type, performers_note_id, subject_table, subject_id,
    body, link_path
  )
  values (
    v_contributor_id,
    'draft_awaiting_approval',
    p_note_id,
    'performers_notes',
    p_note_id,
    format('A draft performer''s note on %s is ready for your review.', v_piece_title),
    '/notifications'
  )
  on conflict (subject_table, subject_id, type) where cleared_at is null
  do nothing;
end;
$$;

-- ============================================
-- _clear_notifications_for_note — belt-and-suspenders dual-predicate clear
-- ============================================

create or replace function public._clear_notifications_for_note(p_note_id uuid)
  returns void
  language sql
  security definer
  set search_path = public
as $$
  update public.notifications
    set cleared_at = now()
    where (performers_note_id = p_note_id
           or (subject_table = 'performers_notes' and subject_id = p_note_id))
      and cleared_at is null;
$$;
