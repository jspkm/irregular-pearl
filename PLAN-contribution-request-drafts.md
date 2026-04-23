# PLAN — Contribution-request drafts (staff bootstrap surface)

> **Status: Draft 2, 2026-04-22.** Draft 1 was reviewed by `/codex` outside voice, surfacing 18 findings across hard blockers, RLS contract violations, migration footguns, scope inconsistencies, and strategic miscalibration. Draft 2 incorporates all 17 findings the user accepted plus four explicit user decisions on items where codex and the original plan diverged.
>
> Reuses the request-a-contribution table + RPCs shipped in v0.4.0 ([20260522 migrations](supabase/migrations/20260522000000_request_contribution_scaffolding.sql)) and the polymorphic notifications + subject-agnostic consumer pattern from Slices A and B. Read those first if you haven't.

## 0. Revision history

- **Draft 1 (2026-04-22):** Initial plan after interactive design session. Sender gate locked to staff (admin or moderator). Email-semantic: sent is final, sender keeps a copy for their own records, no recall, no edit-after-send. "Drafting for" treated as bootstrap-rare — utilitarian UI, no batch ops, no templates.
- **Draft 2 (2026-04-22):** Codex outside-voice review applied. Substantive changes:
  - **Locking added** to `send_request` and `act_on_draft` (row-level for safety against dual-tab races).
  - **Sender data leak closed** — sender reads via security-definer view that omits `disposition`, `dispositioned_at`, `inline_dismissed_at`, `accepted_as_id`. The "no feedback" property is now enforced at the storage layer, not just the UI.
  - **Staff-only check moved onto every outbox-mutation RPC**, not just creation. Demoted ex-staff cannot act on existing outbox rows.
  - **`request_contribution` (v0.4.0) updated to stamp `sent_at = now()`** so plain requests stay visible under new RLS.
  - **Replacement lifecycle for retired `fulfilled_at`:** trigger that hard-deletes the request row when all drafts are dispositioned. Recipient's Messages queue auto-clears; sender's archive copy is preserved via a separate snapshot strategy (see §3.5).
  - **Migration safety:** PR 5 reorders to delete admin pages first, deploy, then run migration in a follow-up commit. Closes the drain-then-create-new-legacy-row race.
  - **`outbox_has_recipient` CHECK dropped** (it contradicted `ON DELETE SET NULL`). NULL-recipient outbox handled in UI.
  - **Notification metadata, not a new type.** New `notifications.metadata jsonb` column added in PR 1; `contribution_request_with_drafts` enum value retired from the design. Reduces migration complexity.
  - **Landmark drafting unambiguously in scope** (resolved Draft 1 contradiction).
  - **Effort recalibrated** from 3.5 hr CC to 6-8 hr CC across the 6 PRs.
  - **User decisions:** dangling `accepted_as_id` is cleaned up via after-delete triggers; destructive enum/column drops happen in PR 5 (not deferred); one-draft-per-kind-per-request lock holds; metadata-on-notification approach confirmed.
- **Draft 3 (2026-04-23):** Recipient surface simplified mid-PR-3 ("Option C"). User feedback during PR 3 browser verification surfaced a UX ambiguity: the "Add to Todo" action filtered drafts off the piece page but kept them on the Drafts tab, leaving recipients confused about where a given draft "lives." Resolved by dropping the hide-from-piece-page action entirely. Substantive changes:
  - **No more 4th action.** Recipient cards now expose three actions only: Accept as-is / Edit & accept / Decline. The "Add to Todo" button (Drafts 1+2 design) is removed from `PendingDraftCard`. Decline gains an inline confirmation chip ("Decline? [Yes, decline] [Cancel]") because it's the only destructive terminal action.
  - **Tab renamed.** /notifications tabs are now Messages | **Open items** (was Messages | Drafts). The new label matches the comprehensive-inbox semantic — every undecided draft addressed to the viewer is listed there, not just ones explicitly saved-for-later.
  - **No filtering on `inline_dismissed_at`.** All four piece-page section components (`PerformersNotes`, `InterpretiveSchools`, `SignedPieceDescription`, `StructuralLandmarks`) drop their `!d.inlineDismissedAt` filter. The same draft now renders on both surfaces simultaneously (piece page in its native section + Open items tab cross-piece).
  - **`hideAddToTodo` prop removed** from `PendingDraftCard`. `RecipientDraftsTab` no longer passes it. The `dismissDraftInline` lib wrapper is removed from the client.
  - **Backend dead code accepted, deferred to PR 5b cleanup.** `dismiss_draft_inline` RPC and `contribution_request_drafts.inline_dismissed_at` column remain in the database (shipped in PR 1) but have no client caller. Both join the PR 5b destructive cleanup migration alongside the legacy enum values + columns.
  - **PR 6 PRD revision absorbs the action-count change** — § 478 amendment drops the four-action recipient model and references three.
  - **Drive-by during PR 3 browser verification:** unified all four private routes (`/admin`, `/maestro`, `/notifications`, `/settings`) on a single `redirectFromPrivateRoute(isSignedIn)` helper that silently redirects anon viewers to `/?signin=1` (modal pop) or signed-in-but-unauthorized viewers to `/`. No leak about what any private page contains. `AdminPage` drops its prior "Access denied" block; `EmailPreferences` drops its inline gate copy. `AuthButton` reads `?signin=1` on mount → opens `SignInPanel`.
  - **Drive-by during PR 3 browser verification:** `NavbarBell` subscribes to `supabase.auth.onAuthStateChange` so the bell appears immediately after sign-in instead of waiting for `visibilitychange` or `notifications:changed`.

## 1. Scope and non-goals

### 1.0 What this is replacing

Today's staff workflow for getting content under a contributor's byline lives in three admin pages: [/admin/performers-notes](src/pages/admin/performers-notes.astro), [/admin/interpretive-schools](src/pages/admin/interpretive-schools.astro), [/admin/piece-descriptions](src/pages/admin/piece-descriptions.astro). Each is a per-content-type "compose draft → send to contributor's queue → wait for approve/edit-and-approve/reject" funnel. The composer lives in [ContributorContentAdmin.tsx](src/components/admin/ContributorContentAdmin.tsx) (608 lines, dispatched by tab name). The contributor receives one notification per drafted item.

The v0.4.0 request-a-contribution flow ([20260522 migrations](supabase/migrations/20260522000000_request_contribution_scaffolding.sql)) made the *plain ask* path piece-level and content-type-agnostic. This plan completes the pivot by making the *drafted-on-behalf* path also piece-level and bundle-shaped, then retiring the per-content-type admin surface. Staff stops authoring in the admin panel and starts drafting inline on the actual piece page — same section editors a contributor uses to self-author, in a "drafting for [recipient]" mode.

### 1.1 Sender model

**Drafting mode** is a piece-page state available **only to staff** (`role IN ('admin', 'moderator')`). Not to regular registered users. Plain "request a contribution" stays open to anyone with the existing send gate (auth + ≥ 1 published signed contribution; staff bypass).

Entry: any "Request a contribution" CTA (navbar search → piece, recipient ribbon CTA, pre-piece "Request" button) opens the existing [RequestContributionDialog.tsx](src/components/RequestContributionDialog.tsx). For staff users, the dialog grows a secondary button: **"Compose drafts inline →"**. Plain "Send request" remains the primary button for both staff and non-staff.

Click "Compose drafts inline" → an outbox `contribution_requests` row is created with `sent_at = NULL` → page reloads at `/piece/[slug]?compose=<request_id>` → drafting mode activates.

**Drafting mode behavior:**

- Sticky banner across the top of the piece page: *"Drafting for Ben Cellist — 2 drafts ready — [Send drafts] [Save & exit] [Delete request]"*.
- Each section's existing "+ Add ..." authoring affordance creates a `contribution_request_drafts` row scoped to the outbox request, NOT a published content row.
- Composed drafts render inline in their respective sections styled distinct from published content (faint border, "you proposed (will send to Ben)" kicker).
- Sender can edit or remove their own in-progress drafts before sending (delete-own-draft on the outbox request only).
- Sender CANNOT publish under their own name from drafting mode. To self-author, exit drafting mode (Save & exit preserves the outbox), self-author normally, re-enter drafting mode if needed. Drafting mode is monomodal.
- **Send drafts** stamps `sent_at = now()` on the request, fires one recipient notification (see §3.4 for copy + metadata), exits drafting mode.
- **Save & exit** leaves the outbox request as-is (`sent_at = NULL`). Sender resumes from the Requests admin tab. The piece page returns to normal view.
- **Delete request** prompts a confirmation; on confirm, deletes the outbox request + cascades drafts.

**Send is allowed even with 0 drafts.** A 0-draft send is functionally identical to a plain "Send request" — the recipient gets a notification with the note and no proposal cards. Send button copy adapts: "Send (0 drafts)" / "Send (3 drafts)".

**Staff-only is checked on every outbox-state mutation,** not just on creation. If a sender is demoted from staff between creating an outbox and sending it, every subsequent RPC (`propose_draft`, `update_outbox_draft`, `delete_outbox_draft`, `delete_outbox_request`, `send_request`) rejects with `'staff_role_required'`. The outbox row persists as orphaned data until either staff role is restored or the user (or an admin) deletes it.

**One-draft-per-kind-per-request rule** (locked per user decision after codex pushback). If H. wants to draft two contrasting performer's notes for Ben, that's two separate requests. Reasoning: drafting one note is high-friction in a bootstrap-rare flow; the realistic case is "one draft of one or two kinds," not "three drafts of the same kind." Holding the rule keeps the recipient's piece-page UI unambiguous (one "Proposed by H." card per section per request) and avoids a per-card ordinal differentiator.

### 1.2 Recipient model

Recipient receives **one notification per request**, regardless of how many drafts are attached. Lands on the piece page via the existing recipient-ribbon path.

Each section that has at least one pending draft for this recipient renders the proposal card inline:

```
┌─ ✦ Proposed by H. ───────────────────────────────────────┐
│ "The opening should be felt as one long downbow…"        │
│                                                            │
│ [Accept as-is] [Edit & accept] [Decline]                  │
└────────────────────────────────────────────────────────────┘
```

Three actions per draft (Draft 3 amendment — was four; see §0):

- **Accept as-is:** creates a published content row in the appropriate table under the recipient's `contributor_id`, with `drafted_by = sender_id`, body copied from the draft payload. Stamps `dispositioned_at = now()`, `disposition = 'accepted'`, `accepted_as_id = <new content row id>` on the draft.
- **Edit & accept:** opens the section's existing editor pre-loaded with the draft body. Recipient edits, saves. Same row-creation as accept-as-is, but with the edited body. Stamps `disposition = 'accepted'` on the draft.
- **Decline:** swaps the button for an inline confirm chip ("Decline? [Yes, decline] [Cancel]"). On confirm: stamps `dispositioned_at = now()`, `disposition = 'declined'` on the draft. No row created. No notification to sender. Card disappears for recipient.

After every disposition action, a trigger checks whether all drafts on the parent request are now dispositioned. If yes, the request row is hard-deleted (cascading the drafts) and the recipient's notification is auto-cleared. See §3.6 for the lifecycle trigger spec.

**Recipient's Open items tab** (new surface, was "Drafts" pre-Draft-3) lives at `/notifications` as a new tab alongside the existing Messages list. Lists every undecided draft for this recipient across all pieces. Same three actions on each row, plus an "Open piece page →" link out for context. The same draft simultaneously renders inline on the piece page in its native section — no hide-from-page action; comprehensive inbox semantic.

### 1.3 No-feedback principle (enforced at storage layer)

After Send, the sender has **zero feedback loop**. No notification on accept, on decline, on edit-and-accept, on add-to-todo. The sender's Requests admin tab shows what was sent (read-only).

The "no feedback" property is enforced at the storage layer via a security-definer view, NOT just at the UI:

- Sender RLS DENIES SELECT on `contribution_request_drafts` directly.
- Sender SELECT goes through `sender_drafts_archive_v` — a security-definer view that exposes only `id, request_id, kind, payload, ordinal, created_at`. It does NOT expose `disposition`, `dispositioned_at`, `inline_dismissed_at`, or `accepted_as_id`.
- Sender's Requests admin tab queries the view, never the base table.

Sender CAN infer acceptance by visiting the piece page and seeing content matching their draft body under the recipient's byline — that leak is unavoidable because published content is public. Decline and add-to-todo are silent and not reconstructible.

`fulfilled_at` on `contribution_requests` and the `contribution_fulfilled` notification type are dropped entirely. Replacement lifecycle in §3.6.

### 1.4 PRD revisions required

**PRD § 304** (and parallel for `PerformersNote`, `PieceDescription`, `PracticeNote`):
> drafted by (reference to the staff member or AI role that produced the draft, distinct from the contributor whose byline it will carry)

Stays. The draft model now flows through `contribution_request_drafts` instead of the per-content-type tables, but the `drafted_by` audit column on the published content row preserves the same audit trail.

**PRD § 478** (Notifications + Approval surface):
> For staff producing drafts on a contributor's behalf, the draft status is visible in a staff dashboard (not in Tier 1 UI, but in the data model and an admin view).

Revise to:
> For staff producing drafts on a contributor's behalf, drafting happens inline on the piece page in a "drafting for [recipient]" mode. The proposed drafts ride attached to a single contribution request and are routed to the recipient as a bundle. The staff dashboard ("Requests" tab in /admin) shows what was sent, when, and to whom — read-only, with no recipient-disposition information surfaced. Drafts are immutable once sent; the sender can compose, save-and-resume, or delete the request entirely while in outbox state, but cannot edit or recall drafts after sending. Recipient disposition (accept / decline / add-to-todo) is not surfaced to the sender at the storage layer or in the UI.

Doc-only PR. Lands as PR 6.

### 1.5 Bootstrap-rare posture

This is an **early-stage bootstrap surface**. Volume assumption: a handful of "drafting for" sessions per month, not per day. Design implications:

- No batch operations (no "send 5 requests at once," no CSV import)
- No drafting templates ("save this draft skeleton for reuse")
- No recurring-draft schedules
- No fancy filters on the Requests tab — a chronological list with piece + recipient + sent-date is enough
- No realtime / polling on the piece page during drafting — stale-until-refresh
- Tests cover correctness of the state model, not load or concurrency at scale
- The drafting-mode banner is functional, not decorative

If volume ever justifies more, that's a future plan.

### 1.6 In scope

- New `contribution_request_drafts` table with kind enum, JSONB payload, soft-disposition columns
- Schema additions: `contribution_requests.sent_at` (nullable, NULL = outbox), `notifications.metadata jsonb` (for draft-count rendering and similar future use cases)
- Five new RPCs: `create_outbox_request`, `propose_draft`, `update_outbox_draft`, `delete_outbox_draft`, `delete_outbox_request`, `send_request`
- Two recipient RPCs: `act_on_draft`, `dismiss_draft_inline`
- One new view: `sender_drafts_archive_v` (security-definer, exposes only sender-safe columns)
- Update existing `request_contribution` RPC to stamp `sent_at = now()` (additive — keeps v0.4.0 plain requests visible under new RLS)
- Drop ~12 staff-draft RPCs from Slices A and B (`create_*_draft`, `update_*_draft`, `submit_*`, `retract_*` per content type) plus `approve_*`, `approve_and_edit_*`, `reject_*`
- Drop `contribution_fulfilled` notification type, `fulfilled_at` column on `contribution_requests`, and the fulfillment trigger
- Drop `submitted_by`, `retracted_by`, `retracted_at` columns and `awaiting_contributor_approval` + `draft` enum values from the three content tables (per user decision: aggressive cleanup, not deferred)
- Drop the three admin pages and `ContributorContentAdmin.tsx`
- Add: drafting mode + pending-drafts overlay mode to all four piece-page section components (`PerformersNotes`, `InterpretiveSchools`, `SignedPieceDescription`, `StructuralLandmarks`)
- Add: Recipient Todos screen as a new tab on `/messages`
- Add: Sender's Requests admin tab (read-only archive, queries via `sender_drafts_archive_v`)
- Add: replacement lifecycle trigger that auto-deletes fully-dispositioned requests
- Add: after-delete triggers on the four content tables that null out `accepted_as_id` on draft rows (per user decision A: clean up dangling pointers)
- PRD revisions per §1.4

### 1.7 Out of scope

- Realtime / polling on the piece page (use stale-until-refresh)
- Edit-after-send and delete-after-send (email semantic — see §1.3)
- Sender notifications on recipient action (no-feedback principle)
- Multiple drafts of the same kind in a single request (one draft per (request, kind) — per user decision C)
- Drafting templates / batch operations / CSV imports
- Migration of existing in-flight drafts in the Slice A/B/C tables — see §5.1 for the cutover strategy (delete admin pages first, then drain remaining sessions, then migrate)
- Changes to the self-author flow or the per-section editor components beyond the new mode awareness

## 2. Schema changes

All schema changes land in PR 1 *except* the destructive drops (column drops, enum value drops, RPC drops) which land in PR 5 after a freeze step (admin pages deleted, deployed, drained).

### 2.1 Add `sent_at` to `contribution_requests`, update existing RPC (PR 1)

```sql
alter table public.contribution_requests
  add column sent_at timestamptz;

-- Backfill: every existing v0.4.0 request was sent at creation
update public.contribution_requests
  set sent_at = created_at
  where sent_at is null;

-- Recipient-facing reads filter on sent_at IS NOT NULL.
create index idx_contribution_requests_sent
  on public.contribution_requests(recipient_id, sent_at desc)
  where sent_at is not null;

-- Sender outbox reads
create index idx_contribution_requests_outbox
  on public.contribution_requests(sender_id)
  where sent_at is null;
```

**Critical:** also update [request_contribution](supabase/migrations/20260523000000_request_contribution_link_path_to_notifications.sql) RPC in PR 1 to stamp `sent_at = now()` on insert. Without this, plain v0.4.0 requests inserted post-migration will have NULL `sent_at` and become invisible to recipients under the new RLS. Add one line to the existing INSERT statement.

RLS policy update on `contribution_requests`:

- Recipient SELECT: `recipient_id = auth.uid() AND sent_at IS NOT NULL` — outbox rows hidden from recipient.
- Sender SELECT: `sender_id = auth.uid()` — sender sees own rows in any state.

**NO `outbox_has_recipient` CHECK constraint** (Draft 1 had this; codex flagged the contradiction with `ON DELETE SET NULL`). If a recipient is deleted, `recipient_id` becomes NULL on outbox rows. Sender's drafting-mode banner shows "Drafting for [deleted user]" with the Send button disabled. UI handles the orphan gracefully; sender can Save & exit or delete the orphan request. The send_request RPC rejects on NULL recipient.

### 2.2 New table `contribution_request_drafts` (PR 1)

```sql
create type public.draft_kind as enum (
  'performers_note',
  'interpretive_school',
  'piece_description',
  'landmark'
);

create table public.contribution_request_drafts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.contribution_requests(id) on delete cascade,
  kind public.draft_kind not null,
  payload jsonb not null,
  ordinal integer not null,
  created_at timestamptz not null default now(),

  -- Soft disposition. NULL = live for recipient.
  dispositioned_at timestamptz,
  disposition text check (disposition in ('accepted', 'declined')),
  accepted_as_id uuid,  -- nulled out by after-delete triggers on content tables

  -- Inline-render dismissal (was: Add to Todo, retired in Draft 3).
  -- Column kept by PR 1 ship; PR 5b destructive cleanup drops it.
  -- NULL = render inline + on todos.
  -- NON-NULL = render only on todos.
  inline_dismissed_at timestamptz,

  constraint disposition_consistency check (
    (dispositioned_at is null and disposition is null and accepted_as_id is null)
    or (dispositioned_at is not null and disposition is not null)
  ),
  constraint accepted_has_target check (
    (disposition <> 'accepted' or accepted_as_id is not null)
  ),
  constraint declined_has_no_target check (
    (disposition <> 'declined' or accepted_as_id is null)
  ),
  constraint one_draft_per_kind_per_request unique (request_id, kind)
);

create index idx_crd_request on public.contribution_request_drafts(request_id);
create index idx_crd_recipient_live
  on public.contribution_request_drafts(request_id)
  where dispositioned_at is null;
```

**Why one draft per (request, kind):** locked per user decision C. If sender wants two drafts of the same kind, that's two requests. Holding the rule keeps the recipient's piece-page UI unambiguous — one "Proposed by H." card per section per request.

**Payload validation:** a `_validate_draft_payload(kind, payload)` security-definer function checks shape per kind. Mirrors the existing `_validate_landmark_payload` pattern from Slice C [20260514](supabase/migrations/20260514000000_contributor_pipeline_slice_c_landmarks.sql).

Per-kind payload shape (all keys required unless noted):

| kind | payload shape |
|---|---|
| `performers_note` | `{ body: text (1..40000) }` |
| `interpretive_school` | `{ name: text (1..200), body: text (1..40000), tempo_cues: jsonb (optional) }` |
| `piece_description` | `{ body: text (1..40000) }` |
| `landmark` | full LandmarkPacket payload — `{ label, description?, movement_id, measure_start, measure_end?, ordinal, flags: [...], practice_notes: [...] }` matching `_validate_landmark_payload` shape |

**accepted_as_id polymorphic FK + null-out triggers (per user decision A):**

`accepted_as_id` cannot be a database FK because it points polymorphically at four tables. Instead:

1. A `before update` trigger on `contribution_request_drafts` checks that when `disposition = 'accepted'`, the row referenced by `accepted_as_id` exists in the table matching `kind`.
2. **Four `after delete` triggers** — one on each of `performers_notes`, `interpretive_schools`, `piece_descriptions`, `landmarks` — null out `accepted_as_id` on any draft row where it pointed at the deleted content row.

```sql
create or replace function public._null_accepted_as_id_on_content_delete()
  returns trigger language plpgsql security definer set search_path = public as $$
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
-- Repeat for interpretive_schools, piece_descriptions, landmarks
```

**Why null out:** keeps the `accepted_has_target` invariant true (no dangling pointer to a non-existent row). Recipient's right to delete their own published content is preserved; the audit trail in the draft row gracefully degrades to "this draft was accepted, then later removed by the contributor" without a constraint violation.

### 2.3 RLS for `contribution_request_drafts` (PR 1)

Two policies:

- **Recipient SELECT:** `EXISTS (SELECT 1 FROM contribution_requests cr WHERE cr.id = request_id AND cr.recipient_id = auth.uid() AND cr.sent_at IS NOT NULL AND dispositioned_at IS NULL)` — recipient sees only live drafts on sent requests addressed to them.
- **Sender SELECT: DENIED.** Sender reads through `sender_drafts_archive_v` only.
- **INSERT/UPDATE/DELETE:** only via security-definer RPCs. No direct policy.

### 2.4 Sender archive view `sender_drafts_archive_v` (PR 1)

```sql
create or replace view public.sender_drafts_archive_v
  with (security_invoker = false) as
select
  d.id,
  d.request_id,
  d.kind,
  d.payload,
  d.ordinal,
  d.created_at
  -- INTENTIONALLY OMITTED: dispositioned_at, disposition, accepted_as_id, inline_dismissed_at
from public.contribution_request_drafts d
join public.contribution_requests r on r.id = d.request_id
where r.sender_id = auth.uid();

grant select on public.sender_drafts_archive_v to authenticated;
```

The view runs as the security-definer (the view's owner role) but the WHERE clause filters by `auth.uid()` so each session only sees its own sender-archive. Codex's "data layer leak" finding is closed: sender cannot reconstruct disposition state via direct query.

The Requests admin tab in PR 5 reads from this view, never from the base table.

### 2.5 Add `metadata jsonb` to `notifications` (PR 1)

```sql
alter table public.notifications
  add column metadata jsonb;
```

Used by the new `send_request` RPC to attach `{ "draft_count": N }` to the notification row. Renderers (NavbarBell, NotificationsQueue, MessagesPage) read `metadata->>'draft_count'` to choose the body copy. **NO new notification type value** — the existing `contribution_requested` type is reused, with metadata distinguishing plain-vs-with-drafts. Per user decision D, this avoids the enum rebuild (which has its own risks; see §2.6).

### 2.6 Destructive cleanup (PR 5)

Per user decision B, the destructive cleanup happens in PR 5, not deferred. PR 5 lands as **two commits** to close the freeze-step gap codex identified:

**Commit A (PR 5a) — delete admin pages, deploy.** Removes the codepaths that can create new legacy rows.

- Delete [src/pages/admin/performers-notes.astro](src/pages/admin/performers-notes.astro), [interpretive-schools.astro](src/pages/admin/interpretive-schools.astro), [piece-descriptions.astro](src/pages/admin/piece-descriptions.astro)
- Delete [ContributorContentAdmin.tsx](src/components/admin/ContributorContentAdmin.tsx)
- Update [AdminPage.tsx:71-73](src/components/admin/AdminPage.tsx) to remove the three tab entries
- Add the new "Requests" tab pointing at the read-only Requests admin component (depends on `sender_drafts_archive_v` from PR 1)
- After Commit A deploys, no new code path can write `awaiting_contributor_approval` or `draft` status, can write `submitted_by`, `retracted_by`, `retracted_at`, can write `contribution_fulfilled` notifications, or can call the staff-draft RPCs.

**Commit B (PR 5b) — drain assertion + destructive migration.** Lands at least one deploy cycle after Commit A.

```sql
-- Drain assertion: no rows in retired states (impossible after Commit A deploy)
do $$
declare
  v_bad_count int;
begin
  select coalesce(sum(c), 0) into v_bad_count from (
    select count(*) c from performers_notes where status in ('awaiting_contributor_approval', 'draft')
    union all
    select count(*) c from interpretive_schools where status in ('awaiting_contributor_approval', 'draft')
    union all
    select count(*) c from piece_descriptions where status in ('awaiting_contributor_approval', 'draft')
    union all
    select count(*) c from landmarks where status in ('awaiting_contributor_approval', 'draft')
  ) bad;

  if v_bad_count > 0 then
    raise exception 'Cannot retire draft_status values: % rows still in awaiting_contributor_approval or draft state. Verify Commit A deployed and no out-of-band inserts happened.', v_bad_count;
  end if;
end $$;

-- Auto-clear any historical contribution_fulfilled notifications (pre-cleanup)
update public.notifications
  set cleared_at = now()
  where type = 'contribution_fulfilled' and cleared_at is null;

-- Auto-clear historical *_drafted notifications (Slices A and B legacy)
update public.notifications
  set cleared_at = now()
  where type in ('performers_note_drafted', 'interpretive_school_drafted', 'piece_description_drafted')
    and cleared_at is null;

-- Drop fulfilled_at column + the trigger that stamps it
alter table public.contribution_requests drop column fulfilled_at;
drop function if exists public._stamp_contribution_request_fulfilled() cascade;

-- Drop the inline-dismissed mechanism (Draft 3 retired Add-to-Todo).
-- The column + RPC remain after PR 1 ship; the client never calls the
-- RPC and never reads the column. Drop both as part of cleanup.
alter table public.contribution_request_drafts drop column inline_dismissed_at;
drop function if exists public.dismiss_draft_inline(uuid) cascade;

-- Drop draft_status enum values 'awaiting_contributor_approval' and 'draft'
-- (Postgres requires enum rebuild)
alter type public.draft_status rename to draft_status_old;
create type public.draft_status as enum ('published', 'removed');

alter table public.performers_notes
  alter column status drop default,
  alter column status type public.draft_status using status::text::public.draft_status,
  alter column status set default 'published';
alter table public.interpretive_schools
  alter column status drop default,
  alter column status type public.draft_status using status::text::public.draft_status,
  alter column status set default 'published';
alter table public.piece_descriptions
  alter column status drop default,
  alter column status type public.draft_status using status::text::public.draft_status,
  alter column status set default 'published';
alter table public.landmarks
  alter column status drop default,
  alter column status type public.draft_status using status::text::public.draft_status,
  alter column status set default 'published';

drop type public.draft_status_old;

-- Drop notification_type enum values 'contribution_fulfilled' and the *_drafted trio
-- First, enumerate ALL existing values in production via prior grep:
--   contribution_requested, contribution_fulfilled, performers_note_drafted,
--   interpretive_school_drafted, piece_description_drafted, landmark_drafted
-- (Verify via SELECT DISTINCT type FROM notifications + check enum_range on each migration)
alter type public.notification_type rename to notification_type_old;
create type public.notification_type as enum (
  'contribution_requested',
  'landmark_drafted'  -- KEEP — Slice C still uses for self-author landmark notifications
);

alter table public.notifications
  alter column type type public.notification_type using type::text::public.notification_type;
drop type public.notification_type_old;

-- Drop vestigial columns from content tables
alter table public.performers_notes
  drop column submitted_by,
  drop column retracted_by,
  drop column retracted_at;
alter table public.interpretive_schools
  drop column submitted_by,
  drop column retracted_by,
  drop column retracted_at;
alter table public.piece_descriptions
  drop column submitted_by,
  drop column retracted_by,
  drop column retracted_at;
alter table public.landmarks
  drop column submitted_by,
  drop column retracted_by,
  drop column retracted_at;

-- Drop staff-draft RPCs from Slices A and B
drop function if exists public.create_performers_note_draft(uuid, text, text, text);
drop function if exists public.update_performers_note_draft(uuid, text);
drop function if exists public.submit_performers_note(uuid);
drop function if exists public.retract_performers_note(uuid);
drop function if exists public.approve_performers_note(uuid);
drop function if exists public.approve_and_edit_performers_note(uuid, text);
drop function if exists public.reject_performers_note(uuid, text);
-- ... repeat for interpretive_school, piece_description (consult [contributorSubjects.ts](src/lib/contributorSubjects.ts) for the full list — currently 7 RPCs × 3 subjects = 21 functions to drop)
```

**Pre-migration checklist (PR 5b commit body must reference):**
1. Confirm Commit A is deployed and has been live ≥ 24 hours (verify in production logs that no `submit_*` / `approve_*` / `reject_*` RPC calls have happened).
2. Re-run the drain assertion locally against a fresh prod-like dump.
3. Confirm `enum_range` on `notification_type` matches the rebuild list (no value omitted).
4. Run the migration in a staging environment first.
5. Schedule the production migration during low-traffic window — enum rebuilds take a brief exclusive lock on the affected tables.

**Why this aggressive cleanup is OK now (per user decision B):** the user prefers "drop dead code now" to "carry deprecated cruft." Codex's risk concerns (#10, #19) are mitigated by the two-commit structure (#12 fix), the freeze step (Commit A removes write paths before Commit B drops storage), and the explicit drain assertion. Risk is bounded; reward is a clean schema.

## 3. RPCs

### 3.1 New RPCs (PR 1)

All security-definer with `set search_path = public`. All check `auth.uid() IS NOT NULL` first. **All staff-mutation RPCs additionally call `_require_staff()` to defend against demoted-mid-session edits** (codex finding #2 fix).

#### `create_outbox_request(p_piece_id text, p_recipient_id uuid, p_note text default null) returns uuid`

- `_require_staff()` — caller must have role admin or moderator.
- `_check_sender_eligible(p_recipient_id)` — refactored shared helper from `request_contribution` that enforces sender gate (≥ 1 published signed contribution OR staff bypass) and rate limits.
- Recipient must exist in `public.users`. Sender ≠ recipient.
- Inserts a row in `contribution_requests` with `sent_at = NULL`.
- Returns the new request id. Caller redirects to `/piece/[slug]?compose=<id>`.

#### `propose_draft(p_request_id uuid, p_kind draft_kind, p_payload jsonb) returns uuid`

- `_require_staff()`.
- Caller must be the request's `sender_id`.
- Request must be in outbox state (`sent_at IS NULL`).
- `_validate_draft_payload(p_kind, p_payload)` must pass.
- Computes `ordinal` as `coalesce(max(ordinal) + 1, 0)` for the request.
- Inserts the draft row. Unique constraint enforces one-per-kind.
- Returns the new draft id.

#### `update_outbox_draft(p_draft_id uuid, p_payload jsonb) returns void`

- `_require_staff()`.
- Caller must be the request's `sender_id` (joined via draft → request).
- Request must be in outbox state.
- `_validate_draft_payload(draft.kind, p_payload)` must pass.
- Updates the draft row.

#### `delete_outbox_draft(p_draft_id uuid) returns void`

- `_require_staff()`.
- Caller must be the request's `sender_id`.
- Request must be in outbox state.
- Deletes the draft row.

#### `delete_outbox_request(p_request_id uuid) returns void`

- `_require_staff()`.
- Caller must be the request's `sender_id`.
- Request must be in outbox state.
- Deletes the request (cascades drafts).

#### `send_request(p_request_id uuid) returns void`

- `_require_staff()`.
- Caller must be the request's `sender_id`.
- **Locks the request row** with `SELECT ... FOR UPDATE` to serialize against concurrent `propose_draft` / `update_outbox_draft` (codex finding #3).
- Re-reads `sent_at` post-lock; if not NULL, return `'already_sent'` (idempotent no-op).
- Re-reads `recipient_id` post-lock; if NULL (recipient was deleted between create and send), return `'recipient_no_longer_exists'`.
- Counts drafts on the request → `v_draft_count`.
- Stamps `sent_at = now()`.
- Inserts a notification row for the recipient:
  - `type = 'contribution_requested'` (existing enum value, not a new one — codex finding #17 / decision D)
  - `body` formatted per §3.4 below
  - `metadata = jsonb_build_object('draft_count', v_draft_count)`
  - `link_path = '/piece/<slug>'` (resolved from piece_id)

#### `act_on_draft(p_draft_id uuid, p_action text, p_payload_override jsonb default null) returns uuid`

- `_require_authenticated()` (any role; recipient might not be staff).
- Caller must be the recipient (`auth.uid() = request.recipient_id`).
- Request must be sent (`sent_at IS NOT NULL`).
- **Locks the draft row** with `SELECT ... FOR UPDATE` to serialize dual-tab concurrent acts (codex finding #4).
- Re-reads `dispositioned_at` post-lock; if not NULL, return error code `'draft_already_dispositioned'`.
- `p_action` must be one of `'accept_as_is'`, `'edit_and_accept'`, `'decline'`.
- For `accept_as_is`: insert a published row in the table matching `kind`, body from draft payload. **Explicit assertion: `INSERT ... contributor_id = request.recipient_id` (codex finding #7)** — guarantees byline matches recipient.
- For `edit_and_accept`: same as accept_as_is, but body from `p_payload_override` (must pass `_validate_draft_payload(kind, override)`).
- For `decline`: no row created.
- Stamps `dispositioned_at = now()`, `disposition = 'accepted' | 'declined'`, `accepted_as_id = <new content row id or NULL>`.
- After stamping, fires the lifecycle trigger (§3.6).
- Returns the new content row id (or NULL on decline).

#### `dismiss_draft_inline(p_draft_id uuid) returns void`

- `_require_authenticated()`.
- Caller must be the recipient.
- Request must be sent. Draft must be live.
- Stamps `inline_dismissed_at = now()`.
- Idempotent — second call is a no-op.

### 3.2 Updated existing RPC

#### `request_contribution` (existing, in PR 1)

Add `sent_at = now()` to the INSERT statement at [20260523000000:134](supabase/migrations/20260523000000_request_contribution_link_path_to_notifications.sql#L134). Without this, plain v0.4.0 requests are inserted with NULL `sent_at` and become invisible under new RLS (codex finding #1).

Also: refactor the sender-gate check (rate limits + ≥ 1 published signed contribution + staff bypass) into `_check_sender_eligible(p_recipient_id)` so `create_outbox_request` can reuse it.

### 3.3 Idempotent error handling

Every recipient-side and sender-side RPC handles the row-not-found and already-acted cases gracefully:

- Draft row doesn't exist → `'draft_no_longer_available'` → soft toast "this draft was retracted" + remove card
- Draft already dispositioned → `'draft_already_dispositioned'` → soft toast "you already responded to this draft"
- Request not in outbox state → `'request_already_sent'` (sender side) or `'request_no_longer_exists'` (deleted)
- Outbox request with NULL recipient → `'recipient_no_longer_exists'` → toast "recipient no longer exists, delete this request"

### 3.4 Notification body copy (per user decision on Variant A)

Renderers (NavbarBell, NotificationsQueue, MessagesPage Open items tab) read `metadata->>'draft_count'` and select copy:

- **draft_count = 0** (plain ask, also the existing v0.4.0 behavior): `"H. asked you to contribute to Bach Suite No. 1."` — unchanged from current.
- **draft_count = 1** (one draft attached): `"H. asked you to contribute to Bach Suite No. 1, with a draft performer's note to start from."` — kind-named for the singular case. Kind label resolved from a small client-side map: `performers_note → "performer's note"`, `interpretive_school → "interpretive school"`, `piece_description → "piece description"`, `landmark → "landmark"`.

  Resolving the kind requires the renderer to also know which kind the single draft is. Two options:
  - **a)** Stuff `kind` into metadata too: `{ "draft_count": 1, "kind": "performers_note" }` for N=1 case.
  - **b)** Renderer queries `contribution_request_drafts` for the kind on demand.

  (a) is cheaper at render time. Going with (a).

- **draft_count > 1**: `"H. asked you to contribute to Bach Suite No. 1, with 3 drafts to start from."` — count, no kind detail.

`send_request` writes `metadata = jsonb_build_object('draft_count', v_draft_count, 'kind', case when v_draft_count = 1 then v_only_kind else null end)`.

### 3.5 RPCs being retired (PR 5b)

After Commit A deploys, all the following RPCs become unreachable. Drop in Commit B:

For each of `performers_note`, `interpretive_school`, `piece_description`:
- `create_*_draft`, `update_*_draft`, `submit_*`, `retract_*`
- `approve_*`, `approve_and_edit_*`, `reject_*`

That's **7 × 3 = 21 functions** to drop. The `publish_contributor_*`, `update_contributor_*`, `remove_*` RPCs (the self-author family) are unchanged. The landmark RPCs from Slice C are unchanged (landmarks self-author, didn't have a staff-draft path that's being retired — landmark drafts are net-new via `propose_draft`).

### 3.6 Replacement lifecycle trigger (PR 1)

`fulfilled_at` and the `contribution_fulfilled` notification type are dropped, but the recipient still needs the request to auto-clear from their Messages queue when they're done. Replacement: a trigger that hard-deletes the request row when all drafts are dispositioned.

```sql
create or replace function public._auto_close_request_on_full_disposition()
  returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_remaining int;
begin
  -- Only fires on UPDATE when dispositioned_at transitions from NULL to NON-NULL.
  if (old.dispositioned_at is null and new.dispositioned_at is not null) then
    select count(*) into v_remaining
    from public.contribution_request_drafts
    where request_id = new.request_id and dispositioned_at is null;

    if v_remaining = 0 then
      -- All drafts dispositioned. Delete the request — cascades the drafts.
      -- Recipient's notification auto-clears via the existing notification cleanup
      -- pattern (notification.subject_id references the request).
      delete from public.contribution_requests where id = new.request_id;
    end if;
  end if;
  return null;
end;
$$;

create trigger trg_auto_close_request
  after update on public.contribution_request_drafts
  for each row execute function public._auto_close_request_on_full_disposition();
```

**Codex correctly raised a tension here** (finding #15): if we delete the request + cascade drafts, the sender loses their archive copy of what they sent. **Resolution:** snapshot the request + drafts into a `sent_request_archive` table at `send_request` time, BEFORE the live row can be auto-deleted by the lifecycle trigger.

```sql
create table public.sent_request_archive (
  id uuid primary key default gen_random_uuid(),
  original_request_id uuid not null,  -- not an FK; the live row may be gone
  piece_id text not null,
  sender_id uuid not null,
  recipient_id uuid,                    -- null if recipient was deleted
  recipient_display_name text,          -- denormalized at send time
  sent_at timestamptz not null,
  note text,
  drafts jsonb not null                 -- array of { kind, payload } at send time
);

create index idx_sent_request_archive_sender on public.sent_request_archive(sender_id, sent_at desc);

-- RLS: sender SELECT only on own rows
alter table public.sent_request_archive enable row level security;
create policy sender_reads_own on public.sent_request_archive
  for select to authenticated using (sender_id = auth.uid());
```

`send_request` writes the archive row inline:

```sql
insert into public.sent_request_archive (
  original_request_id, piece_id, sender_id, recipient_id, recipient_display_name,
  sent_at, note, drafts
) select
  r.id, r.piece_id, r.sender_id, r.recipient_id,
  (select display_name from users where id = r.recipient_id),
  now(), r.note,
  coalesce((
    select jsonb_agg(jsonb_build_object('kind', d.kind, 'payload', d.payload) order by d.ordinal)
    from contribution_request_drafts d where d.request_id = r.id
  ), '[]'::jsonb)
from contribution_requests r where r.id = p_request_id;
```

The Requests admin tab in PR 5 reads from `sent_request_archive`, NOT from `sender_drafts_archive_v` (which I had Draft 1 propose). The view served the no-feedback enforcement; the archive table serves the durable sender-copy requirement. Both are needed, and they have different responsibilities:

- `sender_drafts_archive_v` — for outbox-state drafts (still being composed, sender can edit). Reads from live `contribution_request_drafts`.
- `sent_request_archive` — for sent requests (immutable copy). Reads from this dedicated archive table. Survives the auto-close trigger that deletes the live request.

This is a Draft 2 addition codex's review surfaced. The original Draft 1 had a hidden bug: dropping `fulfilled_at` without a replacement made sender's "view what I sent" promise unfulfillable once auto-close fired.

## 4. UX

### 4.1 Sender entry flow

```
NAVBAR SEARCH                           PRE-PIECE PAGE
"bach suite no 1"                       (NOT YET CURATED state)
  ↓                                       ↓
[piece in catalog]                      [Request a contribution] CTA
  ↓                                       ↓
piece page                              opens RequestContributionDialog
  ↓                                       ↓
[Request a contribution] CTA            (if staff: Compose drafts inline button visible)
  ↓
opens RequestContributionDialog
  ├── Recipient autocomplete
  ├── Optional 280-char note (with LLM-draft helper for staff — already shipped in v0.4.0)
  ├── [Send request] (primary, all users — calls request_contribution)
  └── [Compose drafts inline →] (secondary, staff only — calls create_outbox_request)
       ↓
       create_outbox_request(piece_id, recipient_id, note)
       ↓
       redirect to /piece/[slug]?compose=<request_id>
```

### 4.2 Drafting mode banner

Sticky, anchored to the top of the piece page below the navbar. Visible whenever `?compose=<request_id>` is in the URL AND the current user is the request's sender AND the request is in outbox state AND the current user still has staff role.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ✎ Drafting for Ben Cellist (3 drafts ready)    [Send drafts] [Save & exit]    │
│                                                              [Delete request]  │
└────────────────────────────────────────────────────────────────────────────────┘
```

- "Drafting for [name]" — recipient's display name from the request row. If `recipient_id IS NULL` (recipient deleted), shows "Drafting for [deleted user]" and Send button is disabled with tooltip "Recipient no longer exists. Delete this request to start fresh."
- "(N drafts ready)" — count of drafts on the request, updates live as sender adds/removes.
- **Send drafts** — calls `send_request`, exits drafting mode, redirects to `/piece/[slug]` (no `?compose`). Toast: "Sent. Ben will get a notification."
- **Save & exit** — redirects to `/piece/[slug]` (no `?compose`). Outbox preserved.
- **Delete request** — opens an inline confirmation chip ("Delete this request and all 3 drafts? [Delete] [Cancel]"). On Delete, calls `delete_outbox_request` and redirects to home.

If sender navigates to a different piece while in drafting mode, the URL parameter doesn't follow — drafting mode applies only to the piece the request was created for. The banner won't show on other pieces. Outbox preserved.

If sender is demoted from staff between Save & exit and resume, re-entering drafting mode for the orphan outbox shows the banner with all mutation buttons disabled and an explanation strip: "You no longer have staff role. This outbox is read-only; an admin can clean it up."

### 4.3 Section component modes

Each of `PerformersNotes.tsx`, `InterpretiveSchools.tsx`, `SignedPieceDescription.tsx`, `StructuralLandmarks.tsx` grows two new modes via a prop:

```typescript
type SectionMode =
  | 'view'                         // current default
  | 'self-author'                  // current "+ Add" affordances
  | 'compose-draft'                // sender in drafting mode
  | 'review-pending-drafts';       // recipient with undecided drafts
```

The `view` and `self-author` modes are existing behavior. The two new modes:

#### `compose-draft` mode (sender, drafting)

- Section's "+ Add ..." button visible. If a draft of this kind already exists on the request, button changes to "Edit your draft" and opens the form pre-loaded.
- On save, instead of calling `publish_contributor_*`, the form calls `propose_draft(request_id, kind, payload)`.
- The composed draft renders in the section as an in-progress card: dashed border, "you proposed (will send to Ben)" kicker, [Edit] [Remove] affordances per draft (calling `update_outbox_draft` / `delete_outbox_draft`).
- Existing published content in this section renders normally — sender sees the current state of the piece while composing.

#### `review-pending-drafts` mode (recipient)

- Section renders normally PLUS an inline pending-draft card for any draft of this kind on a sent request to this recipient that isn't dispositioned. Draft 3 dropped the `inline_dismissed_at` filter — drafts render on both surfaces simultaneously now.
- Card UI (3 actions per draft, Draft 3 — was 4):

```
┌─ ✦ Proposed by H. ───────────────────────────────────────┐
│ <body preview, full body on click>                        │
│                                                            │
│ [Accept as-is] [Edit & accept] [Decline]                  │
└────────────────────────────────────────────────────────────┘
```

- **Accept as-is** → `act_on_draft(draft_id, 'accept_as_is')`. New content row appears in the section under the recipient's byline. Card disappears.
- **Edit & accept** → opens the section's existing editor pre-loaded with the draft body. On save, calls `act_on_draft(draft_id, 'edit_and_accept', { body: editedBody })`. New content row appears with edited body. Card disappears.
- **Decline** → swaps for inline confirm chip ("Decline? [Yes, decline] [Cancel]"). On confirm: `act_on_draft(draft_id, 'decline')`. Card disappears. Soft toast: "Declined."

### 4.4 Recipient Open items tab

New surface at `/notifications` as a tab alongside the existing Messages list (renamed from "Drafts" in Draft 3).

Tab structure on `/notifications`:
- **Messages** (existing) — incoming requests, dismiss/auto-clear, etc.
- **Open items** (new) — every undecided draft for this recipient across all pieces

Open items tab UI: chronological list (newest first), each row:

```
┌──────────────────────────────────────────────────────────────────────┐
│ PERFORMER'S NOTE · Bach Cello Suite No. 1 in G major — J.S. Bach    │
│ ┌─ ✦ Proposed by H. ────────────────────────────────────────────┐   │
│ │ "The opening should be felt as one long downbow…"             │   │
│ │ [Accept as-is] [Edit & accept] [Decline]   Open piece page →  │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

- Accept / Edit & accept / Decline call the same RPCs as the inline cards on the piece page.
- "Open piece page →" sits inline in the action row (right-aligned, accent purple); navigates to the piece where the recipient sees the same draft in its native section.
- Empty state: "Nothing in your inbox. Anyone you've collaborated with would land their proposed drafts here."

### 4.5 Sender's Requests admin tab (PR 5a)

New tab in `/admin` for staff users (admin or moderator). Reads from `sender_drafts_archive_v` for outbox + `sent_request_archive` for sent (per §3.6).

```
┌────────────────────────────────────────────────────────────────────┐
│ Requests                                                             │
├────────────────────────────────────────────────────────────────────┤
│ Outbox (in progress)                                                 │
│   Bach Suite No. 1 → Ben Cellist            2 drafts   [Resume →]   │
│                                                                       │
│ Sent (archive)                                                        │
│   Apr 22  Bach Suite No. 1 → Ben          3 drafts   [View]         │
│   Apr 18  Dvořák Concerto → Anna          1 draft    [View]         │
│   Apr 14  Schumann Adagio → Lin           note only  [View]         │
└────────────────────────────────────────────────────────────────────┘
```

- **Outbox** section: `sender_drafts_archive_v` joined to `contribution_requests` filtered on `sent_at IS NULL`. "Resume" navigates to `/piece/[slug]?compose=<id>`.
- **Sent** section: `sent_request_archive` filtered on `sender_id = auth.uid()`, ordered by `sent_at DESC`. "View" expands to show: original note, the proposed draft bodies (read-only), recipient name. **No disposition info, no actions** (codex finding #5 closed by storage layer + UI).
- Pagination: 20 sent requests per page. Outbox shows all (low volume).

### 4.6 Tabs to remove from /admin (PR 5a)

In [AdminPage.tsx:71-73](src/components/admin/AdminPage.tsx#L71), drop:

- `{ id: 'performers-notes' as Tab, label: "Performer's notes", show: isAdmin }`
- `{ id: 'interpretive-schools' as Tab, label: 'Schools', show: isAdmin }`
- `{ id: 'piece-descriptions' as Tab, label: 'Descriptions', show: isAdmin }`

Add:

- `{ id: 'requests' as Tab, label: 'Requests', show: isStaff }`

Delete files:

- [src/pages/admin/performers-notes.astro](src/pages/admin/performers-notes.astro)
- [src/pages/admin/interpretive-schools.astro](src/pages/admin/interpretive-schools.astro)
- [src/pages/admin/piece-descriptions.astro](src/pages/admin/piece-descriptions.astro)
- [src/components/admin/ContributorContentAdmin.tsx](src/components/admin/ContributorContentAdmin.tsx)

## 5. State machines + concurrency

### 5.1 Request lifecycle

```
                 create_outbox_request
                          ↓
                ┌────────────────────┐
                │  outbox            │
                │  sent_at = NULL    │
                └────────────────────┘
                  │              │
       send_request          delete_outbox_request
       [SELECT FOR             │
        UPDATE]                ↓
                  │      (deleted, drafts cascade)
                  ↓
       ┌────────────────────┐
       │  sent              │
       │  sent_at = NOW()   │
       │  archive snapshot  │
       │  notification      │
       │  fired             │
       └────────────────────┘
                  │
       (drafts dispositioned over time)
                  │
                  ↓
       ┌────────────────────┐
       │  fully dispositioned│
       │  → trigger deletes  │
       │    request row      │
       │  → cascades drafts  │
       │  → notification     │
       │    auto-clears      │
       │  → archive survives │
       └────────────────────┘
```

### 5.2 Draft lifecycle

```
            propose_draft (sender, while outbox)
                          ↓
                ┌────────────────────┐
                │  pending           │
                │  dispositioned_at  │
                │  = NULL            │
                └────────────────────┘
                  │     │     │       │
        update_   │     │     │   delete_outbox_draft (sender)
        outbox_   │     │     │   delete_outbox_request (cascade)
        draft     │     │     │       ↓
                  │     │     │  (deleted)
                  │     │     │
        send_request    │     │
            │           │     │
       (request now sent)     │
                              │
       ┌──────────────────────┴──────────────────────┐
       ↓                      ↓                       ↓
       act_on_draft           act_on_draft            dismiss_draft_inline
       'accept_as_is'         'decline'                    │
       'edit_and_accept'           │                        ↓
       [SELECT FOR UPDATE]         │              ┌──────────────────┐
            │                       │              │ inline_dismissed │
            ↓                       ↓              │ (still pending)  │
       ┌────────────────┐    ┌────────────────┐    └──────────────────┘
       │  accepted      │    │  declined      │              │
       │  + content row │    │                │              │  (act on later
       │  exists        │    │                │              │   from Todos)
       └────────────────┘    └────────────────┘              ↓
            │                       │                  (accept/decline,
            └────────┬──────────────┘                   stamps disposition)
                     │
              (lifecycle trigger:
               if all drafts on request dispositioned,
               delete request + cascade drafts;
               archive copy survives in sent_request_archive)
```

### 5.3 Concurrency cases

**Case A — sender deletes draft / request mid-recipient-review.**

Sender's `delete_outbox_*` RPCs only fire on outbox-state requests. After Send, sender has no delete affordance. So this case can't happen post-send. Pre-send, the recipient never sees the request (notification hasn't fired). Safe.

**Case B — recipient acts on a draft while another tab also acts.**

Possible: recipient has the piece page in tab A and the Todos screen in tab B. Both render the same draft. Tab A user clicks Accept; tab B user clicks Decline before tab B re-fetches.

`act_on_draft` locks the draft row with `SELECT ... FOR UPDATE`. First call wins, stamps `dispositioned_at`. Second call acquires lock, re-reads, sees `dispositioned_at IS NOT NULL`, returns `'draft_already_dispositioned'`. React component shows soft toast "you already responded to this draft" and removes the card.

**Case C — sender mutating outbox while concurrent send.**

Possible: sender has the piece page in tab A composing, tab B also open showing the drafting banner. Tab A clicks "+ Add" (calls `propose_draft`); tab B clicks "Send drafts" (calls `send_request`).

`send_request` locks the request row with `SELECT ... FOR UPDATE`. If tab A's `propose_draft` acquires the lock first, the new draft is added; tab B's send sees N+1 drafts. If tab B's send acquires the lock first, it stamps `sent_at`; tab A's propose then acquires the lock, re-reads, sees `sent_at IS NOT NULL`, returns `'request_already_sent'`. Tab A shows soft toast "this request was already sent in another tab."

**Case D — third party publishes content on the piece while sender is composing or recipient is reviewing.**

Both surfaces are stale-until-refresh. The third party's published content doesn't appear in the sender's drafting view or the recipient's review view until refresh. This is fine — drafts are independent rows, and the piece page renders all current content on next load.

**Case E — outbox request with stale recipient (recipient deleted from users).**

`contribution_requests.recipient_id` references `public.users(id) ON DELETE SET NULL`. If recipient is deleted while sender's request is in outbox state, `recipient_id` becomes NULL. The drafting-mode banner detects this and disables Send.

`send_request` re-checks `recipient_id IS NOT NULL` after acquiring its lock; if NULL, returns `'recipient_no_longer_exists'`. UI shows "Recipient no longer exists. Delete this request to start fresh."

Sender's only path forward is to delete the orphan outbox.

**Case F — sender demoted from staff between create and act.**

If H. is admin when she creates an outbox, then loses admin role, then later tries to call any outbox-mutation RPC, every RPC's `_require_staff()` check rejects with `'staff_role_required'`. Sender's banner detects via a server-side role check on page load and disables all mutation buttons with an inline explanation strip. The orphan outbox persists until staff role is restored or an admin (via direct DB or future admin tooling) deletes it.

**Case G — recipient deletes their own published content row that came from an accepted draft.**

Recipient accepts a draft → content row created with `accepted_as_id` pointing at it. Months later, recipient deletes the content row via the existing self-author `remove_*` RPC. The `_null_accepted_as_id_on_content_delete` after-delete trigger fires, sets `accepted_as_id = NULL` on the draft row. The `accepted_has_target` CHECK constraint uses `disposition <> 'accepted' OR accepted_as_id IS NOT NULL` — but disposition stays `'accepted'` while accepted_as_id is now NULL. The CHECK violates.

**Resolution:** the CHECK is `deferrable initially deferred`, and the trigger updates inside an explicit transaction. Or simpler: the CHECK is dropped, replaced by the assertion in `act_on_draft` (which only fires at insert time). Choosing the simpler path — drop the CHECK in PR 1's migration.

### 5.4 RLS

`contribution_request_drafts`:

- Recipient SELECT: `EXISTS (SELECT 1 FROM contribution_requests cr WHERE cr.id = request_id AND cr.recipient_id = auth.uid() AND cr.sent_at IS NOT NULL AND dispositioned_at IS NULL)` — recipient sees only live drafts on sent requests addressed to them.
- Sender SELECT: **DENIED.** Sender reads through `sender_drafts_archive_v` only.
- INSERT/UPDATE/DELETE: only via security-definer RPCs. No direct policy.

`contribution_requests` (additions to existing policies):

- Recipient SELECT: `recipient_id = auth.uid() AND sent_at IS NOT NULL` — recipient never sees outbox rows.
- Sender SELECT: `sender_id = auth.uid()` — sender sees own rows in any state.

`sent_request_archive`:

- Sender SELECT: `sender_id = auth.uid()` — own rows only.
- INSERT: only via `send_request` RPC.
- No UPDATE or DELETE policy — archive rows are immutable.

## 6. Test plan

### 6.1 Coverage diagram

```
NEW CODE PATHS                                       USER FLOWS
─────────────────                                    ──────────────

[+] supabase/migrations/<new>_create_drafts.sql
  └── _validate_draft_payload(kind, payload)         [+] Sender: enter drafting mode
      ├── [GAP] performers_note shape                  ├── [GAP] [→E2E] navbar search → CTA → dialog
      ├── [GAP] interpretive_school shape              │           → "Compose drafts inline" → page reload
      ├── [GAP] piece_description shape               ├── [GAP] outbox request created with sent_at NULL
      └── [GAP] landmark payload (delegates to        ├── [GAP] banner renders, "+ Add" buttons in section
          existing _validate_landmark_payload)        │         wired to propose_draft
                                                       └── [GAP] non-staff caller cannot enter drafting mode
[+] supabase RPCs (with locking specs)
  ├── create_outbox_request                          [+] Sender: compose drafts
  │   ├── [GAP] non-staff caller rejected              ├── [GAP] add performer's note draft → render with kicker
  │   ├── [GAP] staff caller succeeds                  ├── [GAP] try add second performer's note → button changes
  │   ├── [GAP] sender ≠ recipient enforced            │         to "Edit your draft" (one-per-kind enforced)
  │   └── [GAP] sender gate (≥1 contribution OR       ├── [GAP] add school draft → renders alongside note draft
  │       staff bypass) reused via shared helper       ├── [GAP] edit a composed draft → update_outbox_draft
  ├── propose_draft                                    ├── [GAP] remove a composed draft → delete_outbox_draft
  │   ├── [GAP] _require_staff enforced                └── [GAP] all four kinds compose-able (incl. landmark)
  │   ├── [GAP] sender-only
  │   ├── [GAP] outbox-state-only                    [+] Sender: send / save / delete
  │   ├── [GAP] payload validates                      ├── [GAP] Save & exit → outbox preserved, banner gone
  │   ├── [GAP] one-per-kind enforced                  ├── [GAP] Delete request → confirm → cascades drafts
  │   └── [GAP] ordinal monotone                       ├── [GAP] Send → sent_at stamped, archive snapshot
  ├── update_outbox_draft                              │         created, notification fires with metadata
  ├── delete_outbox_draft                              ├── [GAP] Send with 0 drafts → behaves as plain request
  ├── delete_outbox_request                            └── [GAP] Send with NULL recipient → rejected with
  ├── send_request                                              clear error
  │   ├── [GAP] FOR UPDATE lock acquired
  │   ├── [GAP] idempotent on already-sent           [+] Recipient: review and act
  │   ├── [GAP] rejects on NULL recipient              ├── [★★★ TESTED — to write] [→E2E]
  │   ├── [GAP] notification metadata.draft_count     │       receive request → land on piece → see cards
  │   ├── [GAP] notification metadata.kind for N=1   ├── [GAP] Accept as-is → content row appears,
  │   ├── [GAP] copy variants per draft_count         │         draft soft-disposition'd, card gone
  │   └── [GAP] sent_request_archive snapshot         ├── [GAP] contributor_id = recipient_id assertion
  │       written atomically with sent_at stamp       ├── [GAP] Edit & accept → editor opens pre-loaded,
  ├── act_on_draft                                    │         save creates content with edited body
  │   ├── [GAP] FOR UPDATE lock acquired              ├── [GAP] Decline → soft toast, draft disposition'd
  │   ├── [GAP] recipient-only                        ├── [GAP] decline → confirm chip → Yes,
  │   ├── [GAP] sent-state-only                       │         draft disposition'd
  │   ├── [GAP] live-state-only                       └── [GAP] lifecycle trigger fires when all drafts
  │   ├── [GAP] accept_as_is creates content row              dispositioned → request row + drafts deleted,
  │   │         with contributor_id = recipient_id            notification auto-clears, archive survives
  │   ├── [GAP] edit_and_accept uses override
  │   ├── [GAP] decline does not create row          [+] Recipient: Open items tab
  │   ├── [GAP] disposition stamping correct           ├── [GAP] empty state copy
  │   ├── [GAP] accepted_as_id polymorphic check       ├── [GAP] drafts across multiple pieces listed
  │   └── [GAP] idempotency on already-dispositioned   ├── [GAP] act from Todos screen → same outcome
  └── dismiss_draft_inline                             └── [GAP] "Open piece page →" navigation
      ├── [GAP] recipient-only
      ├── [GAP] sent-state, live-state               [+] Sender: Requests tab
      └── [GAP] idempotent                             ├── [GAP] Outbox section lists outbox via view
                                                       │         (only safe columns visible)
[+] Triggers                                           ├── [GAP] Resume navigates with ?compose=<id>
  ├── _auto_close_request_on_full_disposition         ├── [GAP] Sent section lists from archive table
  │   ├── [GAP] fires on dispositioned_at flip        ├── [GAP] expand row shows note + draft bodies
  │   ├── [GAP] no-op when remaining > 0              ├── [GAP] no disposition info shown anywhere
  │   ├── [GAP] hard-deletes request when remaining=0 └── [GAP] sender SELECT on contribution_request_drafts
  │   ├── [GAP] notification auto-clears via cascade           DENIED at RLS layer
  │   └── [GAP] archive row survives
  └── _null_accepted_as_id_on_content_delete         [+] Concurrency
      ├── [GAP] fires on each of 4 content tables      ├── [GAP] [→E2E] two tabs, one accepts, other gets
      └── [GAP] handles dangling pointer gracefully    │           soft toast on action
                                                       ├── [GAP] sender retracts outbox → recipient never saw
[+] React: section components (4 of them)              ├── [GAP] recipient deleted mid-outbox → send rejected
  ├── compose-draft mode rendering                     ├── [GAP] sender demoted mid-session → mutations
  │   ├── [GAP] in-progress card style                │         rejected at every RPC
  │   ├── [GAP] Edit/Remove affordances                └── [GAP] race: propose_draft + send_request
  │   └── [GAP] one-per-kind constraint UI                       (lock serializes)
  ├── review-pending-drafts mode rendering
  │   ├── [GAP] proposal card with 4 actions         [+] Migration cutover (PR 5)
  │   └── [GAP] integrates with existing edit flow     ├── [GAP] Commit A removes write paths
  └── existing view/self-author modes unchanged       ├── [GAP] Commit B drain assertion succeeds
                                                       ├── [GAP] Commit B enum rebuild handles all values
[+] Drafting mode banner                               ├── [GAP] Commit B drops 21 staff-draft RPCs
  ├── [GAP] mounts on ?compose=<id> + sender match    └── [GAP] [REGRESSION] equivalence test:
  ├── [GAP] disabled state on demoted role                       new flow produces identical content rows
  ├── [GAP] disabled state on NULL recipient                     to retired submit_*+approve_* flow
  ├── [GAP] shows recipient name + count
  ├── [GAP] Send / Save & exit / Delete              [+] Notification metadata
  └── [GAP] Delete confirmation chip                   ├── [GAP] notifications.metadata column added
                                                       ├── [GAP] body copy renders per draft_count
[+] Sender archive view + table                       ├── [GAP] kind name appears for N=1
  ├── [GAP] sender_drafts_archive_v omits             └── [GAP] generic count for N>1
  │   disposition columns
  ├── [GAP] sender SELECT through view works
  └── [GAP] sent_request_archive write atomic
      with send_request

COVERAGE: 0/N tested  |  GAPS: ~70  |  ALL TO WRITE
```

This whole feature is greenfield — every code path is a GAP to be written alongside the implementation per slice plan convention. Two regression tests required (codex finding #16 fix):
1. New `act_on_draft accept_as_is` produces a content row identical in shape to retired `submit_* → approve_*` flow.
2. Plain v0.4.0 `request_contribution` RPC still produces visible-to-recipient requests post-PR 1 (sent_at backfill check).

### 6.2 Test file structure

- `test/contribution-request-drafts.outbox.test.ts` — outbox lifecycle + sender RPCs + payload validation per kind + staff-only enforcement on every RPC
- `test/contribution-request-drafts.recipient.test.ts` — `act_on_draft`, `dismiss_draft_inline`, idempotency, RLS, contributor_id assertion
- `test/contribution-request-drafts.send.test.ts` — `send_request` notification metadata + copy variants + archive snapshot atomicity
- `test/contribution-request-drafts.concurrency.test.ts` — two-tab disposition race, locking spec verification, cascade on outbox delete, recipient-deleted edge, demoted-staff edge
- `test/contribution-request-drafts.lifecycle.test.ts` — auto-close trigger fires on full disposition, archive survives, notification auto-clears
- `test/contribution-request-drafts.archive-view.test.ts` — sender_drafts_archive_v omits disposition columns, sender SELECT base table denied
- `test/contribution-request-drafts.cutover.test.ts` — migration drain check, content-row equivalence regression, plain-request still works post-sent_at backfill

### 6.3 Test plan artifact

Will be written to `~/.gstack/projects/jspkm-irregular-pearl/jspkm-main-eng-review-test-plan-<datetime>.md` after this plan is approved, listing affected URLs (`/piece/[slug]?compose=*`, `/notifications` Open items tab, `/admin/requests`), key interactions to verify, edge cases, and critical paths.

## 7. Rollout — six PRs (PR 5 is two commits)

Each PR is independently shippable. The cutover commits in PR 5 have a hard ordering: Commit A first, deploy + observe ≥ 24 hours, then Commit B.

### PR 1 — Schema + RPCs + lifecycle

- Migrations: `contribution_request_drafts` table, `draft_kind` enum, `_validate_draft_payload`, `sent_at` column on `contribution_requests` with backfill, `notifications.metadata` column, `sent_request_archive` table, `sender_drafts_archive_v` view, indexes, RLS policies.
- Triggers: `_auto_close_request_on_full_disposition`, four `_null_accepted_as_id_on_content_delete` triggers (one per content table), `accepted_as_id` polymorphic insert-time check.
- New RPCs (8) with locking specs.
- Update existing `request_contribution` to stamp `sent_at = now()` and refactor sender gate into `_check_sender_eligible(p_recipient_id)`.
- Integration tests for each RPC + view + trigger.
- No UI changes. Old admin pages still work.

Effort: ~1.5 hr CC (was 45 min in Draft 1; codex's safety additions roughly doubled it).

### PR 2 — Recipient piece-page UX

- `review-pending-drafts` mode added to all four section components (incl. landmark, per resolved scope).
- Inline proposal cards with 3 actions (Draft 3 — was 4), wired to `act_on_draft`. Decline gets an inline confirm chip.
- Soft-toast handling for `draft_no_longer_available` and `draft_already_dispositioned`.
- Tests: recipient interaction flows, idempotency, two-tab race.

Effort: ~1.5 hr CC.

### PR 3 — Recipient Open items tab + project-wide private-route redirect

- `/notifications` mounts a new `MessagesPageShell` with tabs (Messages | Open items). Open items tab lists every undecided draft for this recipient cross-piece, same 3 actions as the inline cards, plus an "Open piece page →" link.
- Private-route consistency drive-by: `/admin`, `/maestro`, `/notifications`, `/settings` all use the new `lib/privateRoute.ts:redirectFromPrivateRoute(isSignedIn)` helper. Anon viewers silently redirect to `/?signin=1` (modal pop via new query-param trigger in `AuthButton`); signed-in-but-unauthorized to `/`. No leak about what any private page contains.
- Tests: cross-piece read, lib error-code mapping.
- Drive-by: `NavbarBell` subscribes to `supabase.auth.onAuthStateChange` so the bell appears immediately on sign-in.

Effort: ~1 hr CC (was ~30 min — Option C amendment + private-route consolidation expanded scope).

### PR 4 — Sender drafting mode + Send

- Drafting mode banner component, mounted conditionally on `?compose=<id>` + sender check + role check.
- `compose-draft` mode added to all four section components (incl. landmark — landmark composer reused from Slice C self-author UI).
- `RequestContributionDialog` grows the staff-only "Compose drafts inline" button.
- One-per-kind constraint surfaced in UI (button changes to "Edit your draft").
- Inline confirm chip on Delete request.
- NULL-recipient state: Send disabled with explanation.
- Demoted-role state: all mutations disabled with explanation.
- Tests: end-to-end sender flow, Save & exit + resume, Delete cascade, banner mounting + disabled states.

Effort: ~1.5 hr CC.

### PR 5a — Delete admin pages + Requests tab

- Delete the three admin astro pages.
- Delete `ContributorContentAdmin.tsx`.
- Update [AdminPage.tsx](src/components/admin/AdminPage.tsx) tab list.
- New Requests admin tab (§4.5) — read-only outbox + sent list.
- Outbox reads via `sender_drafts_archive_v`; sent reads via `sent_request_archive` table.
- Tests: Requests tab rendering, view-only enforcement (no DOM elements that could mutate), staff-role gating.

Effort: ~45 min CC.

### PR 5b — Destructive cleanup migration

**Lands ≥ 24 hours after PR 5a deploys.** Verify in production logs that no `submit_*` / `approve_*` / `reject_*` / `create_*_draft` / `update_*_draft` / `retract_*` RPC calls have happened since PR 5a deploy.

- Drain assertion (defensive — should be impossible to fail after Commit A).
- Auto-clear historical `contribution_fulfilled` and `*_drafted` notifications.
- Drop `fulfilled_at` column + fulfillment trigger.
- Rebuild `draft_status` enum without `awaiting_contributor_approval` and `draft`.
- Rebuild `notification_type` enum (after grep of all live values to enumerate completely).
- Drop `submitted_by`, `retracted_by`, `retracted_at` columns from 4 content tables.
- Drop 21 staff-draft RPCs.
- Tests: migration drain assertion succeeds, content-row equivalence regression, plain-request post-cleanup still works.

Effort: ~45 min CC plus deployment caution.

### PR 6 — PRD revision + CHANGELOG

- Update PRD § 478 per §1.4 of this plan.
- CHANGELOG entry per §10.
- Update README and CLAUDE.md if any references to retired admin pages.

Effort: ~15 min CC. Doc-only.

### Total

**~6.75 hours CC across six PRs (seven commits).** Codex was right about Draft 1's 3.5 hr estimate being fantasy. The locking specs, security-definer view, archive table + lifecycle trigger, complete test coverage including regression tests, and two-commit migration safety roughly double the original sizing. Honest sizing matters.

## 8. NOT in scope

- **Realtime / polling on piece page during drafting.** Stale-until-refresh. If volume justifies later, add Supabase channel subscription per section.
- **Edit-after-send / delete-after-send / recall.** Email semantic. If sender wants to revise, they suck it up and live with the original.
- **Sender notifications on recipient action.** No-feedback principle. Storage layer + UI both enforce.
- **Multiple drafts of same kind per request.** One per (request, kind) — locked per user decision C.
- **Drafting templates / batch ops / CSV import.** Bootstrap-rare. Not justified.
- **Migration of existing in-flight Slice A/B drafts to the new table.** Drain via the existing admin pages first (PR 5a deletes the pages, no new legacy rows can be created), then PR 5b runs the destructive migration. Cleaner than a complex data migration.
- **Self-author flow changes.** The existing self-author RPCs and flows are unchanged. This plan only adds new modes; it does not modify the existing happy-path content-creation flow.
- **Any future admin tooling for cleaning up orphan outbox requests** (where sender was demoted from staff). For v1, an admin can clean them up via direct DB if it ever happens. Bootstrap-rare suggests this rarely matters.

## 9. What already exists

| Sub-problem | Existing code | Action |
|---|---|---|
| Piece-level contribution request | `contribution_requests` + `request_contribution` RPC + `RequestContributionDialog` (v0.4.0) | Extended — add `sent_at`, refactor sender gate into shared helper, update RPC to stamp `sent_at` |
| Polymorphic notifications | `notifications.subject_table` + `subject_id` (Slice B pivot) | Reused — add `metadata jsonb` column for draft-count rendering |
| Subject registry | [src/lib/contributorSubjects.ts](src/lib/contributorSubjects.ts) + `SUBJECT_CONFIG` | Reused — add `draft_kind` parallel registry for draft payload shapes |
| Per-section editors | `PerformersNotes.tsx`, `InterpretiveSchools.tsx`, `SignedPieceDescription.tsx`, `StructuralLandmarks.tsx` | Extended — add `compose-draft` and `review-pending-drafts` modes |
| Recipient ribbon | Already shipped in v0.4.0 | Reused as the entry surface for recipients with pending drafts |
| Messages page | `/notifications` with dismiss/auto-clear (v0.4.0) | Extended — add Open items tab |
| Admin tab framework | `AdminPage.tsx` tab list + dispatch | Extended — drop 3 tabs, add 1 |
| Recipient gate / sender gate | `request_contribution` RPC enforces sender gate, recipient existence | Refactored — `_check_sender_eligible(p_recipient_id)` shared helper |
| Inline confirm chip | `InlineConfirm.tsx` (Slice C) | Reused for Delete request confirmation |
| `_validate_landmark_payload` pattern | Slice C [20260514](supabase/migrations/20260514000000_contributor_pipeline_slice_c_landmarks.sql) | Mirrored — `_validate_draft_payload(kind, payload)` follows the same shape |

Nothing about this plan rebuilds existing code. The new table and RPCs are additive; the existing ones get retired in PR 5b after the cutover migration.

## 10. Failure modes

For each new code path, the production failure scenario, current mitigation, and what the user sees:

| Codepath | Failure mode | Test? | Error handling? | User sees? |
|---|---|---|---|---|
| `create_outbox_request` | Sender gate edge case (race on count of published contributions) | yes | RPC returns clear error code | Toast: "You need at least 1 published signed contribution to send a request." |
| `propose_draft` | Concurrent sender adds same-kind draft in two tabs | yes | One-per-kind constraint at DB; second insert fails with unique violation | Toast: "You already have a draft of this kind on this request. Edit it instead." |
| `act_on_draft` (accept) | Polymorphic FK insert fails (target table OOM, etc.) | yes (mocked) | Transaction rolls back, draft NOT dispositioned | Toast: "Could not save the contribution. Try again." |
| `act_on_draft` (accept) | Recipient acts on a draft already declined in another tab | yes | RPC returns `'draft_already_dispositioned'` | Soft toast: "You already responded to this draft." Card removed. |
| `act_on_draft` (accept) | Race between two tabs both calling accept | yes | FOR UPDATE lock serializes; second call sees disposition'd state | Soft toast: "You already responded to this draft." |
| `act_on_draft` (decline) | Same as above | yes | Same | Same |
| `dismiss_draft_inline` | Idempotent re-call | yes | RPC is no-op on already-dismissed | Nothing — silent success |
| `send_request` | Recipient deleted between outbox creation and send | yes | Constraint blocks send, locking re-checks NULL | Toast: "Recipient no longer exists. Delete this request and start over." |
| `send_request` | Race between propose_draft and send | yes | FOR UPDATE lock serializes | First tab wins; second sees `'request_already_sent'` |
| `send_request` | Archive snapshot insert fails mid-transaction | yes | Whole transaction rolls back, sent_at not stamped | Toast: "Could not send. Try again." Outbox preserved. |
| `delete_outbox_request` | Already deleted in another tab | yes | RPC is idempotent (deletion of non-existent row is no-op) | Nothing — page redirects to home regardless |
| Drafting mode banner mount | URL `?compose=<id>` for a request not owned by current user | yes | Server-side check denies; banner not rendered | Page renders normally with no banner; URL parameter ignored |
| Drafting mode banner mount | URL `?compose=<id>` for an already-sent request | yes | Banner not rendered (only outbox triggers it) | Page renders normally; sender's Requests tab shows the sent request in archive |
| Drafting mode banner mount | Sender role demoted between save and resume | yes | Banner shows with mutations disabled + explanation strip | Sender sees banner but cannot mutate; admin can clean up |
| Section's `compose-draft` mode | Composing while concurrently another tab in `self-author` mode publishes content | yes (manual) | Both succeed independently — different submit targets | Sender sees own draft + the other tab's published content on next refresh |
| `_auto_close_request_on_full_disposition` trigger | Last draft dispositioned race | yes | Trigger uses transactional read; deletes only if remaining = 0 | Recipient sees notification auto-clear; sender's archive copy survives |
| `_null_accepted_as_id_on_content_delete` trigger | Recipient deletes accepted content row | yes | Trigger nulls out pointer; CHECK constraint NOT triggered (it's drop-only-at-insert) | Sender's archive copy still shows original draft body; pointer is NULL but disposition stays 'accepted' |
| Migration: cutover Commit B | Pre-check finds rows still in retired states | yes | Migration aborts with descriptive message | Operator drains via direct DB and re-runs |
| Migration: enum rebuild | Cast fails because a value was omitted | yes | Migration fails fast in staging; pre-check enumerates all values via `SELECT DISTINCT type FROM notifications` | Operator updates enum value list and re-runs |

**Critical gaps to flag:** none — every failure mode has a test plan slot, error handling defined, and a clear user-visible message. If the implementation skips any of those, this section becomes the audit trail for what to add.

## 11. Worktree parallelization

| Step | Modules touched | Depends on |
|---|---|---|
| PR 1 schema + RPCs | `supabase/migrations/`, `src/lib/database.types.ts` | — |
| PR 2 recipient piece-page UX | 4 section components, `src/styles/piece-page.css` | PR 1 |
| PR 3 Todos screen | `src/components/MessagesPage.tsx`, `src/lib/contributionDrafts.ts` | PR 1 |
| PR 4 sender drafting + Send | Same 4 section components, `RequestContributionDialog.tsx`, new `DraftingModeBanner.tsx`, `src/lib/contributionDrafts.ts` | PR 1 |
| PR 5a delete admin + Requests tab | `src/pages/admin/*.astro` (deletes), `AdminPage.tsx`, new `RequestsAdmin.tsx` | PRs 1-4 |
| PR 5b destructive migration | `supabase/migrations/<cutover>` | PR 5a deploy + observe |
| PR 6 PRD revision | `PRD.md`, `CHANGELOG.md`, possibly `README.md`, `CLAUDE.md` | — |

**Parallel lanes:**

- **Lane A** (sequential): PR 1 → PR 2 → PR 4 (PR 2 + PR 4 both touch the section components — sequence them)
- **Lane B** (after PR 1, parallel with Lane A): PR 3 (independent — only touches Messages page + lib)
- **Lane C** (after Lane A + B complete): PR 5a → 24h observe → PR 5b
- **Lane D** (anytime): PR 6 (doc-only)

**Recommended execution order:** PR 1 → (PR 2 || PR 3) → PR 4 → PR 5a → 24h observe → PR 5b → PR 6.

Total wall time if PR 2 and PR 3 run in parallel: ~5 hours CC (excluding the 24h observation between 5a and 5b). Sequential: ~6.75 hours CC.

## 12. PRD section revisions

Apply in PR 6:

**§ 478 (Notifications + Approval surface)** — replace the current paragraph about staff-produced drafts with the language in §1.4 above. Net change: editorial dashboard moves from per-content-type admin pages to the Requests tab + inline drafting on the piece page. Email-semantic posture explicit. No-feedback principle explicit.

**§ 304, § 322, § 354** (drafted_by language across PerformersNote, InterpretiveSchool, PracticeNote, PieceDescription) — no change. The `drafted_by` field is preserved on every content row and populated by `act_on_draft` when accepted from a draft. Audit trail is identical.

No changes to invariants (§ 444-446). Plurality, signed-content, version retention all preserved.

## 13. CHANGELOG entry (PR 6)

```markdown
## [next] - <date>

### Contribution-request drafts (staff bootstrap surface)

Staff-drafted contributions now compose inline on the piece page in a "drafting for [recipient]" mode and ride attached to a single contribution request. Recipients triage each draft on the piece page or via the new Open items tab on /notifications. Three admin pages retired (Performer's notes, Schools, Descriptions) — staff drafts inline, no separate admin surface.

**Email-semantic:** sent is final. Sender keeps a read-only archive in /admin/requests; cannot edit, delete, or recall after sending. Recipient disposition (accept / decline / add-to-todo) is not surfaced to the sender at any layer.

**Sender flow:** click "Compose drafts inline" in the request dialog → land on the piece page in drafting mode → use the same section editors a contributor uses for self-authoring → "Send drafts" bundles the proposed content + the request and routes to the recipient. Save & exit preserves the outbox for later resume.

**Recipient flow:** receive one notification per request → land on the piece page → see "Proposed by H." cards inline in each section with [Accept as-is] [Edit & accept] [Decline] per draft (Decline opens an inline confirm chip). Acted-on drafts disappear. The same drafts also list cross-piece on the Open items tab at /notifications. When all drafts are dispositioned, the request auto-clears.

**Schema:** new `contribution_request_drafts` and `sent_request_archive` tables. `contribution_requests` gains `sent_at` (NULL = outbox). `notifications` gains `metadata jsonb` for draft-count rendering. Retired: `fulfilled_at`, `submitted_by`, `retracted_by`, `retracted_at`, `awaiting_contributor_approval` and `draft` enum values, 21 staff-draft RPCs from Slices A and B.

**Tests:** ~70 new test gaps covered including locking specs (FOR UPDATE serialization on send + accept), demoted-staff edge, recipient-deleted edge, lifecycle trigger correctness, archive snapshot atomicity, and a regression test asserting equivalence between the new `act_on_draft accept_as_is` and the retired `submit_* + approve_*` flow.
```

---

## Open questions for review

None remaining as of Draft 2. All previous open questions resolved by codex review + user decisions. Ready to begin PR 1.
