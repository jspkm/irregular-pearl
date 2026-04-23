-- Contribution-request drafts — schema additions (PR 1 of contribution-request-drafts plan)
-- See PLAN-contribution-request-drafts.md for the full design.
--
-- This migration adds the data model for the bundled-drafts surface that
-- replaces the per-content-type staff-draft admin pages.
--
--   1. contribution_requests.sent_at — NULL = outbox state (sender composing
--      drafts, recipient cannot see). NON-NULL = sent (recipient can act).
--   2. notifications.metadata jsonb — for { draft_count, kind } payload that
--      drives notification copy variants without an enum value addition.
--   3. draft_kind enum — discriminator for the four signed-content types.
--   4. contribution_request_drafts — bundled drafts on a request. Soft
--      disposition (acted rows persist for sender's archive view).
--   5. sent_request_archive — immutable copy of what the sender sent. Survives
--      the lifecycle trigger that deletes the live request when all drafts
--      are dispositioned.
--   6. _validate_draft_payload — per-kind shape validator.
--   7. _null_accepted_as_id_on_content_delete — null out dangling pointers
--      when a recipient deletes their own published content row that came
--      from an accepted draft.
--   8. _auto_close_request_on_full_disposition — delete the live request
--      (cascading drafts, auto-clearing recipient's notification) when every
--      draft on it is dispositioned. Sender's archive copy survives.
--   9. RLS: recipient sees only live drafts on sent requests; sender SELECT
--      on contribution_request_drafts is DENIED (sender reads via the
--      sender_drafts_archive_v view defined alongside).
--  10. Update existing contribution_requests RLS to filter sent_at IS NOT NULL
--      on the recipient policy.
--
-- The destructive cleanup of legacy columns (submitted_by, retracted_by,
-- retracted_at, fulfilled_at), legacy RPCs (21 staff-draft RPCs from
-- Slices A and B), and enum value retirements (draft_status, notification_type)
-- happens in PR 5b of the rollout, NOT here. PR 1 is purely additive.

-- ============================================
-- 1. contribution_requests.sent_at + index update
-- ============================================

alter table public.contribution_requests
  add column sent_at timestamptz;

-- Backfill: every existing v0.4.0 request was sent at creation.
update public.contribution_requests
  set sent_at = created_at
  where sent_at is null;

-- Recipient-facing reads filter on sent_at IS NOT NULL.
create index idx_contribution_requests_sent
  on public.contribution_requests(recipient_id, sent_at desc)
  where sent_at is not null and recipient_id is not null;

-- Sender outbox reads.
create index idx_contribution_requests_outbox
  on public.contribution_requests(sender_id)
  where sent_at is null;

-- Update recipient RLS policy: outbox rows must remain hidden from recipient.
drop policy if exists cr_recipient_read on public.contribution_requests;

create policy cr_recipient_read on public.contribution_requests
  for select using (
    recipient_id = auth.uid()
    and cleared_at is null
    and sent_at is not null
  );

-- Sender + staff policies unchanged (cr_sender_read sees own rows in any state;
-- cr_staff_read unchanged).

-- ============================================
-- 2. notifications.metadata jsonb
-- ============================================

alter table public.notifications
  add column metadata jsonb;

comment on column public.notifications.metadata is
  'Render-time hints for notification body copy. Used by send_request to '
  'attach { draft_count, kind } so renderers pick the singular/plural variant '
  'without a new notification_type enum value.';

-- ============================================
-- 3. draft_kind enum
-- ============================================

create type public.draft_kind as enum (
  'performers_note',
  'interpretive_school',
  'piece_description',
  'landmark'
);

-- ============================================
-- 4. contribution_request_drafts
-- ============================================

create table public.contribution_request_drafts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.contribution_requests(id) on delete cascade,
  kind public.draft_kind not null,
  payload jsonb not null,
  ordinal integer not null,
  created_at timestamptz not null default now(),

  -- Soft disposition. NULL = live for recipient.
  -- accepted_as_id is nullable because the after-delete trigger on the four
  -- content tables nulls it out when the recipient later removes their own
  -- published content. The original disposition timestamp + 'accepted' flag
  -- still record that this draft was accepted; the pointer just degrades to
  -- NULL when the target row no longer exists.
  dispositioned_at timestamptz,
  disposition text,
  accepted_as_id uuid,

  -- Inline-render dismissal (Add to Todo). NULL = render inline + on todos.
  -- NON-NULL = render only on todos.
  inline_dismissed_at timestamptz,

  constraint disposition_value check (
    disposition is null or disposition in ('accepted', 'declined')
  ),
  constraint disposition_pair check (
    (dispositioned_at is null and disposition is null)
    or (dispositioned_at is not null and disposition is not null)
  ),
  constraint declined_has_no_target check (
    disposition is distinct from 'declined' or accepted_as_id is null
  ),
  constraint one_draft_per_kind_per_request unique (request_id, kind)
);

create index idx_crd_request on public.contribution_request_drafts(request_id);

create index idx_crd_recipient_live
  on public.contribution_request_drafts(request_id)
  where dispositioned_at is null;

comment on table public.contribution_request_drafts is
  'Bundled drafts attached to a contribution request. Sender (staff only) '
  'composes 0+ drafts in outbox state; recipient triages each on the piece '
  'page. Soft-disposition rows persist for the sender''s archive copy after '
  'the auto-close trigger removes the live request.';

-- ============================================
-- 5. sent_request_archive (immutable sender copy)
-- ============================================
-- The auto-close trigger hard-deletes the contribution_requests row when all
-- drafts are dispositioned (so the recipient's notification clears via cascade).
-- That deletion would erase the sender's "what I sent" record. To preserve the
-- email-semantic property (sender keeps a copy), send_request snapshots the
-- request + drafts into this table BEFORE any disposition can happen.

create table public.sent_request_archive (
  id uuid primary key default gen_random_uuid(),
  -- Not an FK: the live row may be gone by the time anything reads this.
  original_request_id uuid not null,
  piece_id text not null,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete set null,
  recipient_display_name text,
  sent_at timestamptz not null,
  note text,
  drafts jsonb not null
);

create index idx_sra_sender on public.sent_request_archive(sender_id, sent_at desc);

alter table public.sent_request_archive enable row level security;

create policy sra_sender_read on public.sent_request_archive
  for select using (sender_id = auth.uid());

create policy sra_staff_read on public.sent_request_archive
  for select using (public.is_staff());

comment on table public.sent_request_archive is
  'Immutable snapshot written by send_request. Survives the auto-close trigger '
  'that deletes the live contribution_requests row when fully dispositioned. '
  'Sender''s read-only Requests admin tab queries this table for the Sent list.';

-- ============================================
-- 6. _validate_draft_payload(p_kind, p_payload)
-- ============================================
-- Per-kind shape check. Mirrors the _validate_landmark_payload pattern from
-- Slice C. Called by propose_draft and update_outbox_draft and act_on_draft
-- (edit_and_accept variant).

create or replace function public._validate_draft_payload(
  p_kind public.draft_kind,
  p_payload jsonb
)
  returns void
  language plpgsql
  set search_path = public
as $$
declare
  v_body text;
  v_name text;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object';
  end if;

  if p_kind = 'performers_note' then
    v_body := p_payload->>'body';
    if v_body is null or char_length(trim(v_body)) = 0 then
      raise exception 'payload.body required';
    end if;
    if char_length(v_body) > 40000 then
      raise exception 'payload.body exceeds 40000 chars';
    end if;

  elsif p_kind = 'piece_description' then
    v_body := p_payload->>'body';
    if v_body is null or char_length(trim(v_body)) = 0 then
      raise exception 'payload.body required';
    end if;
    if char_length(v_body) > 40000 then
      raise exception 'payload.body exceeds 40000 chars';
    end if;

  elsif p_kind = 'interpretive_school' then
    v_name := p_payload->>'name';
    if v_name is null or char_length(trim(v_name)) = 0 then
      raise exception 'payload.name required';
    end if;
    if char_length(v_name) > 200 then
      raise exception 'payload.name exceeds 200 chars';
    end if;
    v_body := p_payload->>'body';
    if v_body is null or char_length(trim(v_body)) = 0 then
      raise exception 'payload.body required';
    end if;
    if char_length(v_body) > 40000 then
      raise exception 'payload.body exceeds 40000 chars';
    end if;
    if p_payload ? 'tempo_cues'
       and jsonb_typeof(p_payload->'tempo_cues') not in ('object', 'null') then
      raise exception 'payload.tempo_cues must be a JSON object if provided';
    end if;

  elsif p_kind = 'landmark' then
    -- Delegate to the existing landmark validator. Landmark drafts carry the
    -- full LandmarkPacket payload: label, description?, flags[], practice_notes[].
    -- Movement + measure_start + measure_end + ordinal also live in payload but
    -- aren't validated here (they're checked at acceptance time when the row
    -- is created in the landmarks table).
    perform public._validate_landmark_payload(
      p_payload->>'label',
      p_payload->>'description',
      coalesce(p_payload->'flags', '[]'::jsonb),
      coalesce(p_payload->'practice_notes', '[]'::jsonb)
    );
    if (p_payload->>'movement_id') is null then
      raise exception 'payload.movement_id required for landmark drafts';
    end if;
    if (p_payload->>'measure_start') is null then
      raise exception 'payload.measure_start required for landmark drafts';
    end if;

  else
    raise exception 'unknown draft kind: %', p_kind;
  end if;
end;
$$;

comment on function public._validate_draft_payload(public.draft_kind, jsonb) is
  'Per-kind payload shape validator for contribution_request_drafts. Raises on '
  'missing required fields, invalid types, or length-cap violations. Landmark '
  'drafts delegate body shape to _validate_landmark_payload.';

-- ============================================
-- 7. _null_accepted_as_id_on_content_delete trigger
-- ============================================
-- When a recipient deletes their own published content row that was accepted
-- from a draft, the draft's accepted_as_id pointer becomes dangling. This
-- trigger nulls it out. The disposition stays 'accepted' — the audit trail
-- still records that this draft was accepted, the target row just no longer
-- exists.

create or replace function public._null_accepted_as_id_on_content_delete()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.contribution_request_drafts
    set accepted_as_id = null
    where accepted_as_id = old.id;
  return null;
end;
$$;

create trigger trg_null_accepted_as_id_pn
  after delete on public.performers_notes
  for each row execute function public._null_accepted_as_id_on_content_delete();

create trigger trg_null_accepted_as_id_is
  after delete on public.interpretive_schools
  for each row execute function public._null_accepted_as_id_on_content_delete();

create trigger trg_null_accepted_as_id_pd
  after delete on public.piece_descriptions
  for each row execute function public._null_accepted_as_id_on_content_delete();

create trigger trg_null_accepted_as_id_lm
  after delete on public.landmarks
  for each row execute function public._null_accepted_as_id_on_content_delete();

-- ============================================
-- 8. _auto_close_request_on_full_disposition trigger
-- ============================================
-- After a draft transitions to dispositioned (accept or decline), check if all
-- drafts on the parent request are now dispositioned. If yes, hard-delete the
-- request — cascading drafts and auto-clearing the recipient's notification
-- via the existing notifications cascade pattern. The sender's archive copy
-- in sent_request_archive survives because that table has no FK to
-- contribution_requests.

create or replace function public._auto_close_request_on_full_disposition()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_remaining int;
begin
  -- Only fire when dispositioned_at flips from NULL to NON-NULL.
  if old.dispositioned_at is null and new.dispositioned_at is not null then
    select count(*) into v_remaining
      from public.contribution_request_drafts
      where request_id = new.request_id
        and dispositioned_at is null
        and id <> new.id;

    if v_remaining = 0 then
      -- All drafts dispositioned. Delete the live request.
      -- Cascade removes the remaining draft rows; notification cleanup
      -- happens via the existing clear_notifications_on_subject_delete
      -- pattern from Slice B (subject_table='contribution_requests',
      -- subject_id=request_id).
      delete from public.contribution_requests where id = new.request_id;
    end if;
  end if;
  return null;
end;
$$;

create trigger trg_auto_close_request
  after update on public.contribution_request_drafts
  for each row execute function public._auto_close_request_on_full_disposition();

-- ============================================
-- 9. Notifications cleanup on contribution_requests delete
-- ============================================
-- The auto-close trigger deletes contribution_requests rows. Recipient's
-- notification (subject_table='contribution_requests', subject_id=<request_id>)
-- needs to clear too. The existing Slice B cascade pattern handles per-subject
-- removal on UPDATE-of-status, but contribution_requests doesn't have a status
-- column — it's deleted outright. Add an explicit AFTER DELETE trigger that
-- mirrors the pattern.

create or replace function public._clear_notifications_on_contribution_request_delete()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.notifications
    set cleared_at = now()
    where subject_table = 'contribution_requests'
      and subject_id = old.id
      and cleared_at is null;
  return null;
end;
$$;

create trigger trg_clear_notifications_on_cr_delete
  after delete on public.contribution_requests
  for each row execute function public._clear_notifications_on_contribution_request_delete();

-- ============================================
-- 10. RLS for contribution_request_drafts
-- ============================================
-- Recipient: SELECT live drafts on sent requests addressed to them.
-- Sender: SELECT denied at base table; sender reads via sender_drafts_archive_v.
-- Staff: SELECT for moderation (mirrors cr_staff_read on contribution_requests).
-- INSERT/UPDATE/DELETE: only via security-definer RPCs.

alter table public.contribution_request_drafts enable row level security;

create policy crd_recipient_read on public.contribution_request_drafts
  for select using (
    exists (
      select 1 from public.contribution_requests cr
      where cr.id = request_id
        and cr.recipient_id = auth.uid()
        and cr.sent_at is not null
    )
    and dispositioned_at is null
  );

create policy crd_staff_read on public.contribution_request_drafts
  for select using (public.is_staff());

-- ============================================
-- 11. sender_drafts_archive_v (security-invoker view that omits leak columns)
-- ============================================
-- The view enforces the no-feedback principle at the storage layer: sender
-- reads through this view, which only exposes id, request_id, kind, payload,
-- ordinal, created_at. Disposition columns are intentionally absent.
-- security_invoker = true so the view runs with the calling user's RLS context;
-- combined with the owner's separate SELECT grant on contribution_request_drafts,
-- the view's SELECT works for the sender even though direct SELECT on the
-- base table is denied.
--
-- Implementation: use a SECURITY DEFINER function instead of a view so the
-- column-level filter is enforced regardless of RLS configuration on the base
-- table. View with security_invoker would still be blocked by base-table RLS.

create or replace function public.fetch_sender_drafts_archive(
  p_request_id uuid default null
)
  returns table (
    id uuid,
    request_id uuid,
    kind public.draft_kind,
    payload jsonb,
    ordinal integer,
    created_at timestamptz
  )
  language plpgsql
  security definer
  set search_path = public
  stable
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'unauthenticated';
  end if;
  return query
    select d.id, d.request_id, d.kind, d.payload, d.ordinal, d.created_at
    from public.contribution_request_drafts d
    join public.contribution_requests r on r.id = d.request_id
    where r.sender_id = v_caller
      and (p_request_id is null or d.request_id = p_request_id)
    order by d.request_id, d.ordinal;
end;
$$;

revoke all on function public.fetch_sender_drafts_archive(uuid) from public;
grant execute on function public.fetch_sender_drafts_archive(uuid) to authenticated;

comment on function public.fetch_sender_drafts_archive(uuid) is
  'Sender-safe read of contribution_request_drafts. Returns only the columns '
  'that don''t leak recipient disposition (id, request_id, kind, payload, '
  'ordinal, created_at). Optional p_request_id narrows to a single request. '
  'Enforces the no-feedback principle at the storage layer.';
