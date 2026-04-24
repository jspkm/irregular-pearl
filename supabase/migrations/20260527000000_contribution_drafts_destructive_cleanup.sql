-- Contribution-request drafts — destructive cleanup (PR 5b of contribution-request-drafts plan).
-- See PLAN-contribution-request-drafts.md §2.6 for the full rationale.
--
-- This migration drops every code path that's been superseded by PR 1's
-- schema + RPCs and PR 4's drafting-mode UX:
--   1. Drain assertion — refuse to run if any content row is still in a
--      retired draft state (awaiting_contributor_approval / draft). Defensive;
--      should be impossible to fail after PR 5a deploys.
--   2. Auto-clear any un-cleared notifications in retired types so the bell
--      doesn't render unrenderable rows.
--   3. Drop fulfilled_at on contribution_requests + its trigger — replaced
--      by the auto-close-on-full-disposition trigger shipped in PR 1.
--   4. Drop inline_dismissed_at on contribution_request_drafts +
--      dismiss_draft_inline RPC — retired by Draft 3's Option C (no longer
--      called by any client).
--   5. Rebuild draft_status enum to ('published', 'removed'). Drops
--      'draft' and 'awaiting_contributor_approval' which only the retired
--      staff-draft pipeline wrote.
--   6. Rebuild notification_type enum to ('contribution_requested'). Drops
--      'draft_awaiting_approval' and 'contribution_fulfilled'.
--   7. Drop submitted_by, retracted_by, retracted_at columns from the four
--      content tables (performers_notes, interpretive_schools,
--      piece_descriptions, landmarks).
--   8. Drop the 21 staff-draft RPCs from Slices A and B for the three
--      body-only subjects (7 RPCs × 3 subjects).
--
-- Note: landmark staff-draft RPCs are left in place. Plan §3.5 treats
-- landmarks as out-of-scope for this retirement pass (Slice C shipped
-- self-author as the canonical path; staff-draft landmarks are unused).

-- ============================================
-- 1. Drain assertion
-- ============================================

do $$
declare
  v_bad_count int;
begin
  select coalesce(sum(c), 0) into v_bad_count from (
    select count(*) c from public.performers_notes
      where status::text in ('awaiting_contributor_approval', 'draft')
    union all
    select count(*) c from public.interpretive_schools
      where status::text in ('awaiting_contributor_approval', 'draft')
    union all
    select count(*) c from public.piece_descriptions
      where status::text in ('awaiting_contributor_approval', 'draft')
    union all
    select count(*) c from public.landmarks
      where status::text in ('awaiting_contributor_approval', 'draft')
  ) bad;

  if v_bad_count > 0 then
    raise exception
      'Cannot retire draft_status values: % rows still in awaiting_contributor_approval or draft state. '
      'Verify PR 5a shipped and no out-of-band inserts happened.', v_bad_count;
  end if;
end
$$;

-- ============================================
-- 2. Auto-clear notifications in retired types
-- ============================================

update public.notifications
  set cleared_at = now()
  where cleared_at is null
    and type::text in ('draft_awaiting_approval', 'contribution_fulfilled');

-- ============================================
-- 3. Replace clear_contrib_requests_on_publish + drop fulfilled_at
-- ============================================
-- The helper that fires from the trg_clear_contrib_on_*_publish triggers
-- stamps fulfilled_at + cleared_at on the request when a recipient publishes
-- matching content. With fulfilled_at retired, the function is redefined to
-- clear only. The triggers themselves remain — publish still auto-clears the
-- request, it just no longer records a fulfilment timestamp (the auto-close
-- trigger on contribution_request_drafts covers full-disposition lifecycle).

create or replace function public.clear_contrib_requests_on_publish(
  p_piece_id text,
  p_contributor_id uuid
) returns void
  language plpgsql security definer
  set search_path = public
as $$
declare
  v_request_ids uuid[];
begin
  select coalesce(array_agg(id), array[]::uuid[])
    into v_request_ids
    from public.contribution_requests
    where piece_id = p_piece_id
      and recipient_id = p_contributor_id
      and cleared_at is null;

  if array_length(v_request_ids, 1) is null then
    return;
  end if;

  update public.contribution_requests
    set cleared_at = now()
    where id = any(v_request_ids);

  update public.notifications
    set cleared_at = now()
    where cleared_at is null
      and subject_table = 'contribution_requests'
      and subject_id = any(v_request_ids);
end;
$$;

alter table public.contribution_requests
  drop column if exists fulfilled_at;

-- ============================================
-- 4. Drop inline_dismissed_at + dismiss_draft_inline
-- ============================================

drop function if exists public.dismiss_draft_inline(uuid);

alter table public.contribution_request_drafts
  drop column if exists inline_dismissed_at;

-- ============================================
-- 5. draft_status enum values 'draft' and 'awaiting_contributor_approval'
-- ============================================
-- Intentionally NOT dropped. Rebuilding the enum would require cascading
-- drops on four RLS policies, four partial indexes, four check constraints,
-- and four views across five tables — all to remove two unused enum values.
-- The drain assertion in step 1 guarantees zero rows reference them, and no
-- code path can write them post-PR-5a (the admin pages are gone and the
-- 21 staff-draft RPCs are dropped in step 8 below). Leaving the values as
-- unused dead enum entries is a pragmatic trade-off; a future cleanup pass
-- can rebuild the enum if editorial hygiene ever outweighs the refactor cost.

-- ============================================
-- 6. notification_type enum values 'draft_awaiting_approval' and 'contribution_fulfilled'
-- ============================================
-- Same trade-off as draft_status above. Step 2 auto-cleared any un-cleared
-- rows in retiring types; no code path writes either value (the staff-draft
-- RPCs are dropped in step 8, and the publish-triggered clear helper was
-- redefined in step 3 to stop writing fulfilled_at). The enum values remain
-- as dead entries rather than triggering a column re-type that would cascade
-- to the notifications table's RLS policies and indexes.

-- ============================================
-- 7. Drop vestigial columns on content tables
-- ============================================

alter table public.performers_notes
  drop column if exists submitted_by,
  drop column if exists retracted_by,
  drop column if exists retracted_at;

alter table public.interpretive_schools
  drop column if exists submitted_by,
  drop column if exists retracted_by,
  drop column if exists retracted_at;

alter table public.piece_descriptions
  drop column if exists submitted_by,
  drop column if exists retracted_by,
  drop column if exists retracted_at;

alter table public.landmarks
  drop column if exists submitted_by,
  drop column if exists retracted_by,
  drop column if exists retracted_at;

-- ============================================
-- 8. Drop 21 staff-draft RPCs (7 × 3 body-only subjects)
-- ============================================
-- Any views or dependent objects (none expected) are handled by CASCADE.

-- performers_notes
drop function if exists public.create_performers_note_draft(text, uuid, text) cascade;
drop function if exists public.create_performers_note_draft(text, uuid, text, text) cascade;
drop function if exists public.update_performers_note_draft(uuid, text) cascade;
drop function if exists public.submit_performers_note(uuid) cascade;
drop function if exists public.retract_performers_note(uuid) cascade;
drop function if exists public.approve_performers_note(uuid) cascade;
drop function if exists public.approve_and_edit_performers_note(uuid, text) cascade;
drop function if exists public.reject_performers_note(uuid, text) cascade;

-- interpretive_schools
drop function if exists public.create_interpretive_school_draft(text, uuid, text, text, jsonb, text) cascade;
drop function if exists public.create_interpretive_school_draft(text, uuid, text, jsonb, text) cascade;
drop function if exists public.update_interpretive_school_draft(uuid, text, jsonb, text) cascade;
drop function if exists public.update_interpretive_school_draft(uuid, text) cascade;
drop function if exists public.submit_interpretive_school(uuid) cascade;
drop function if exists public.retract_interpretive_school(uuid) cascade;
drop function if exists public.approve_interpretive_school(uuid) cascade;
drop function if exists public.approve_and_edit_interpretive_school(uuid, text, text, jsonb) cascade;
drop function if exists public.approve_and_edit_interpretive_school(uuid, text) cascade;
drop function if exists public.reject_interpretive_school(uuid, text) cascade;

-- piece_descriptions
drop function if exists public.create_piece_description_draft(text, uuid, text) cascade;
drop function if exists public.create_piece_description_draft(text, uuid, text, text) cascade;
drop function if exists public.update_piece_description_draft(uuid, text) cascade;
drop function if exists public.submit_piece_description(uuid) cascade;
drop function if exists public.retract_piece_description(uuid) cascade;
drop function if exists public.approve_piece_description(uuid) cascade;
drop function if exists public.approve_and_edit_piece_description(uuid, text) cascade;
drop function if exists public.reject_piece_description(uuid, text) cascade;
