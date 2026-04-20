# PLAN — Contributor approval pipeline, Slice A (PerformersNote)

*Draft for review. One content entity end-to-end. Slice B and Slice C follow this shape without schema rewrites.*

## 1. Scope and non-goals

**In scope.** One content type — `PerformersNote` — round-tripped through the full pipeline:
- Staff or AI drafts *on behalf of* the contributor → approval queue → contributor approves / rejects / edits-and-approves → piece page.
- Contributor authors or edits their own content directly → published without any approval gate (per PRD: when the bylined contributor is the hands on the keyboard, authoring is approval).
- Un-cleared notifications nag via bell badge and a daily email digest.
- Versioning retains prior approved bodies; published notes are never mutated in place.
- All new tables carry RLS. Every state-changing transition writes a named actor to an audit column.

**Non-goals.** InterpretiveSchool, PracticeNote, substantive piece descriptions, edition observations — all Slice B/C. No multi-contributor queue generality. No staff admin polish beyond a working authoring form with inline rejection-note display. No mobile-specific branches. No contributor onboarding flow (H. is seeded directly with `is_contributor=true, contributor_active=true`). No library-reflection publish path. No realtime subscription on the bell (poll-only for Slice A). No retry/backoff inside the edge function (the daily cron cadence is the retry cadence).

## 2. Schema changes

Migration `supabase/migrations/20260420000000_contributor_pipeline_slice_a.sql`. Single file; one migration is easier to review and to roll back than four tiny ones for the same landing.

**Decision — extend `users`, don't add `contributors`.** A contributor is a role on a user, not a separate identity. v1 has one. A separate table would force joins everywhere and double-write on signup. When plurality arrives in Slice B+, the model still fits: being a contributor is about the fields, not the row.

```sql
-- contributor columns on users
alter table public.users add column is_contributor boolean not null default false;
alter table public.users add column contributor_display_name text;
alter table public.users add column contributor_bio_short text;
alter table public.users add column contributor_bio_long text;
alter table public.users add column contributor_agreement_signed_at timestamptz;
alter table public.users add column contributor_active boolean not null default false;

alter table public.users add constraint contributor_has_display_name
  check ((is_contributor = false) or (contributor_display_name is not null));

create index idx_users_is_contributor on public.users(id) where is_contributor;

-- draft state machine
create type draft_status as enum (
  'draft',
  'awaiting_contributor_approval',
  'published',
  'removed'
);

-- performers_notes
create table public.performers_notes (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  status draft_status not null default 'draft',
  current_version_id uuid,                       -- filled after insert into versions
  drafted_by uuid references public.users(id),   -- staff or AI actor who authored the draft; null when contributor-authored
  submitted_by uuid references public.users(id), -- staff actor who transitioned draft → awaiting
  approved_by uuid references public.users(id),  -- contributor actor who approved (redundant with contributor_id but explicit)
  rejected_by uuid references public.users(id),  -- contributor actor who last rejected
  retracted_by uuid references public.users(id),
  retracted_at timestamptz,
  removed_by uuid references public.users(id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_by_contributor_at timestamptz,
  constraint published_has_version
    check ((status <> 'published') or (current_version_id is not null))
);

create index idx_performers_notes_piece on public.performers_notes(piece_id) where status = 'published';
create index idx_performers_notes_contributor_queue
  on public.performers_notes(contributor_id)
  where status = 'awaiting_contributor_approval';

-- versions: append-only, one row per submitted/approved revision
-- denormalized piece_id + contributor_id (both immutable) so RLS on versions stays fast
-- parent_status is NOT denormalized — version rows are historical and shouldn't be rewritten on parent transitions.
-- Public reads of published version bodies go through the joined piece-page query on notes; audit reads go through is_staff/owner RLS.
create table public.performers_note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.performers_notes(id) on delete cascade,
  piece_id text not null references public.pieces(id) on delete cascade,         -- denormalized immutable
  contributor_id uuid not null references public.users(id) on delete restrict,   -- denormalized immutable
  body text not null,
  authored_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  version_number integer not null,
  rejection_note text,
  constraint uq_pnv_note_version unique (note_id, version_number),
  constraint uq_pnv_note_id unique (note_id, id)   -- needed for composite FK below
);

create index idx_pnv_note on public.performers_note_versions(note_id, version_number desc);
create index idx_pnv_contributor on public.performers_note_versions(contributor_id);

-- Composite FK: current_version_id must refer to a version whose note_id matches this row's id.
-- Prevents ever pointing a note at a version belonging to another note.
alter table public.performers_notes
  add constraint fk_current_version_matches_note
  foreign key (id, current_version_id)
  references public.performers_note_versions(note_id, id)
  deferrable initially deferred;

-- notifications: narrow FK to performers_notes for Slice A (not polymorphic).
-- Slice B adds a nullable FK per additional subject type + CHECK that exactly one is non-null,
-- or pivots to polymorphic at that point with the lift paid when needed.
create type notification_type as enum ('draft_awaiting_approval');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users(id) on delete cascade,
  type notification_type not null,
  performers_note_id uuid not null references public.performers_notes(id) on delete cascade,
  body text not null,
  link_path text not null,
  created_at timestamptz not null default now(),
  cleared_at timestamptz,
  last_digest_sent_at timestamptz
);

create index idx_notifications_recipient_active
  on public.notifications(recipient_id, created_at desc)
  where cleared_at is null;

-- Defensive trigger: when a note becomes `removed`, auto-clear any un-cleared notifications.
-- The cascade FK already drops notifications on hard delete; this handles the soft `removed` state.
-- Primary clearing for approve/reject/retract happens inside the RPCs, not via trigger.
create function clear_notifications_on_pn_removal() returns trigger language plpgsql as $$
begin
  if new.status = 'removed' and (old.status is distinct from new.status) then
    update public.notifications
      set cleared_at = now()
      where performers_note_id = new.id
        and cleared_at is null;
  end if;
  return new;
end;
$$;

create trigger trg_clear_notifications_on_pn_removal
  after update of status on public.performers_notes
  for each row
  execute function clear_notifications_on_pn_removal();

-- View exposing published version bodies for audit/owner reads without polluting the table with mutable state.
create view public.v_performers_note_versions_published as
  select v.*
  from public.performers_note_versions v
  join public.performers_notes n on n.id = v.note_id
  where n.status = 'published';
```

**RLS.**
- `performers_notes`: `select` where `status = 'published'` for all; plus full `select` where `contributor_id = auth.uid()` or `public.is_staff()`. No direct `insert/update` from the client — all state transitions go through security-definer RPCs.
- `performers_note_versions`: public cannot read version rows directly (they can only see published bodies via the joined piece-page query on notes). `select` allowed where `contributor_id = auth.uid()` or `public.is_staff()` — simple column checks on immutable denormalized fields. Insert via RPC only.
- `notifications`: `select/update` only where `recipient_id = auth.uid()`; no public `select`; inserts happen server-side via RPCs and the defensive-removal trigger.

## 3. State machine

```
CONTRIBUTOR SELF-AUTHORED                          STAFF/AI-DRAFTED
                                                           staff/AI creates
                                                   ┌────────────────────► draft
                                                   │                        │ staff submits
                                                   │                        ▼
                                                   │              awaiting_contributor_approval
                                                   │                    │    │    │              ◄─ notification row inserted
                                                   │      contributor   │    │    │                 (trigger)
                                                   │      approves      │    │    │  contributor rejects
                                                   │      (or approve-  │    │    └────────────► draft
contributor authors                                │       and-edit     │    │                      (notification cleared)
      (publish_contributor_note)                   │       → new ver)   │    │  staff retracts
               │                                   │                    │    └─────────────────► draft
               ▼                                   │                    ▼                          (notification cleared,
    ┌────── published ──────┐                      │                 published ◄────────── approve  retracted_by set)
    │                       │                      │                    │
    │  contributor edits    │                      │                    │  contributor removes
    │  (publish_contributor │                      │                    ▼
    │   _edit → new ver)    │                      └──────────────► removed (notifications auto-
    │                       │                                              cleared via trigger,
    └─ published (new ver) ─┘                                              removed_by set)
       (no intermediate state,
        no notification)
```

**Transitions — contributor-authored path.**
- `publish_contributor_note(piece_id, body)`: contributor creates and publishes in one atomic RPC. Inserts `performers_notes` row with `status = 'published', drafted_by = null, approved_by_contributor_at = now(), contributor_id = auth.uid()`. Inserts version row with `authored_by = auth.uid(), approved_at = now(), version_number = 1`. Sets `current_version_id`. No notification. No admin involvement. PRD invariant is honored: the bylined person is the hands on the keyboard, and authoring is approval.
- `publish_contributor_edit(note_id, body)`: contributor edits their own already-published note. One atomic RPC: inserts new version with `authored_by = auth.uid(), approved_at = now(), version_number = prev + 1`, updates `current_version_id`. Status stays `published`. No intermediate state. No notification.

**Transitions — staff/AI-drafted path.** All version-inserting RPCs compute `version_number` as `coalesce(max(version_number), 0) + 1` under a transaction and rely on the `uq_pnv_note_version` unique constraint as a concurrency guard; on `23505` the RPC retries once.

- `create_performers_note_draft(piece_id, contributor_id, body)`: staff creates `status = 'draft'` with v1. Sets `drafted_by = auth.uid()`. No notification.
- `submit_performers_note(note_id)`: staff transitions `draft → awaiting_contributor_approval`. Sets `submitted_by = auth.uid()`. Inserts a notification row for the contributor (inline in the RPC, not via trigger).
- `approve_performers_note(note_id)`: contributor transitions `awaiting → published`. Sets `approved_by = auth.uid(), approved_by_contributor_at = now()`, sets `current_version_id` to the pending version, sets that version's `approved_at`. Clears the matching notification inline in the RPC.
- `approve_and_edit_performers_note(note_id, body)`: contributor approves a pending staff/AI draft with wording changes, one atomic RPC. Inserts new version with `authored_by = auth.uid(), approved_at = now(), version_number = prev + 1`, sets `current_version_id`, transitions to `published`, sets `approved_by = auth.uid(), approved_by_contributor_at = now()`. Clears the notification inline.
- `reject_performers_note(note_id, reason)`: contributor transitions `awaiting → draft`. Sets `rejected_by = auth.uid()` and stores `rejection_note` on the pending version. Clears the notification inline.
- `retract_performers_note(note_id)`: staff transitions `awaiting → draft`. Sets `retracted_by = auth.uid(), retracted_at = now()`. Clears the notification inline.

**Transitions — shared.**
- `remove_performers_note(note_id)`: contributor (or staff at written request, which is Slice B) transitions `published → removed`. Sets `removed_by = auth.uid(), removed_at = now()`. Trigger auto-clears any un-cleared notifications for this subject. Public render drops it next request.

## 4. Versioning

**Decision — separate `performers_note_versions` table with denormalized immutable fields only (`piece_id`, `contributor_id`). `current_version_id` points at the row whose body is public, with a composite FK guaranteeing that version belongs to the same note.** Alternative was a JSON history column on the note row; rejected because per-version audit fields belong in rows. We do NOT denormalize `parent_status` onto versions — version rows are historical and shouldn't be rewritten on parent transitions. Public reads of the published body happen via the piece-page joined query on notes; version rows themselves are only readable by owner contributor and staff (RLS on immutable columns). Unique `(note_id, version_number)` + RPC retry-once on `23505` handles concurrent edits.

A published note is never mutated in place. Any edit is a new version row + `current_version_id` bump. The public body comes from `current_version_id`. Prior approved versions retain `approved_at` for historical audit.

## 5. API / route surface

All under `src/pages/api/`. Astro endpoints, session auth via `supabase.auth.getUser()` from request cookies. State-changing endpoints call Postgres RPCs (`security definer`) that encapsulate the transition, audit writes, and notification side effects atomically.

| Path | Method | Auth | Body | Purpose |
|---|---|---|---|---|
| `api/performers-notes` | POST | contributor | `{piece_id, body}` | `publish_contributor_note` — self-author, publishes immediately. |
| `api/performers-notes/[id]/edit` | POST | contributor (owner) | `{body}` | `publish_contributor_edit` — new version, stays published. |
| `api/admin/performers-notes` | POST | staff | `{piece_id, contributor_id, body}` | `create_performers_note_draft`. |
| `api/admin/performers-notes/[id]/submit` | POST | staff | — | `draft → awaiting_contributor_approval`. |
| `api/admin/performers-notes/[id]/retract` | POST | staff | — | Retract to draft, sets `retracted_by`. |
| `api/performers-notes/[id]/approve` | POST | contributor (owner) | — | `approve_performers_note`. |
| `api/performers-notes/[id]/approve-and-edit` | POST | contributor (owner) | `{body}` | `approve_and_edit_performers_note`. |
| `api/performers-notes/[id]/reject` | POST | contributor (owner) | `{reason?}` | `reject_performers_note`. |
| `api/performers-notes/[id]/remove` | POST | contributor (owner) | — | `remove_performers_note`, sets `removed_by`. |
| `api/notifications` | GET | any authed | — | List un-cleared for bell/queue. |
| `api/notifications/[id]/clear` | POST | recipient | — | Set `cleared_at`. |

No DELETE verbs — removal is a state transition, not a row delete.

## 6. Component inventory

All components consume existing DESIGN.md tokens. Astro where static, React where there's local state.

- **`src/components/NavbarBell.tsx`** — React island inside `Navbar.astro`, placed immediately left of `AuthButton`. Props: none (self-fetches). Poll-only for Slice A: fetches `/api/notifications` on mount, on `visibilitychange` when the tab becomes visible, and after any local action that could create/clear notifications. Badge rules: hidden at 0, exact count `1`–`9`, `9+` at 10 or more. Popover on click, click-outside closes. Each popover item is a link to the piece page (or `/notifications`) plus an inline `Clear` button. Footer `Clear all` button sets `cleared_at` on every un-cleared notification for the recipient.
- **`src/pages/notifications.astro`** — hosts `<NotificationsQueue client:load />`. For v1 this page *is* the contributor approval queue (un-cleared notifications are all pending drafts). Title "Your queue".
- **`src/components/NotificationsQueue.tsx`** — React. For each pending draft: piece title, byline-to-be, current proposed body (serif, signed-notes pattern). Diff block against prior versions is deferred to v1.1 — Slice A shows the current body only. Action row: `Approve`, `Approve and edit` (toggles an inline textarea), `Reject` (inline confirmation with freeform reason, not a native dialog).
- **`src/pages/admin/performers-notes.astro`** + **`src/components/admin/PerformersNotesAdmin.tsx`** — staff authoring. Select piece (existing `Autocomplete`), select contributor (default to the single `is_contributor=true AND contributor_active=true` user if there's exactly one; require explicit pick otherwise; disable Send button with an inline note if zero contributors). Textarea, `Save draft` and `Send to contributor` buttons. List of existing drafts with status, rejection notes inline on rejected-version rows, and a `Retract` button on `awaiting_contributor_approval` rows. Deliberately unpolished — PRD says Tier 1 is data-model + admin view, not styled product.
- **`src/components/PerformersNotes.astro`** — renders approved notes on the piece page. Fetches published notes for the piece via a single joined query: `performers_notes → performers_note_versions (via current_version_id) → users (for display_name + contributor_bio_short)` with `status = 'published'` on the notes side, returning one row per note with body + byline fields pre-resolved. Avoids N+1 on version and contributor lookups. Uses DESIGN.md signed-notes pattern: 2px purple left border, Source Serif 4 body at 1.68 line-height, byline in Inter medium underneath with the contributor's short bio. Replaces the empty state in `PiecePageLayout.astro`. If the logged-in user is a contributor without a published note on this piece, renders a "Write a note" entry that opens an inline textarea posting to `api/performers-notes` (the `publish_contributor_note` path). If the logged-in user is the bylined contributor on one of the rendered notes, renders `Edit` and `Remove` affordances on that card. Multi-contributor markup is already multi-card ready (v1 ships one card, the pattern supports N).

## 7. Daily digest Edge Function

`supabase/functions/send-notification-digest/index.ts`. Structure cloned from `send-weekly-digest` (GitHub Actions cron + Supabase Edge Function + Resend via `RESEND_API_KEY`). Runs daily at 13:00 UTC (confirm H.'s timezone; open question).

**Shared email template helper.** Extract a shared `supabase/functions/_lib/email-template.ts` module carrying the Claude kit aesthetic (purple accent `#6B4E7C`, Source Serif 4 editorial prose with Georgia fallback, Inter for UI/meta with Arial fallback, 0.5px borders, white background). Both the new daily notification digest and the existing `send-weekly-digest` import from this module. The weekly digest gets re-skinned as part of Slice A — closes the amber-era DESIGN.md drift debt in the same PR.

**Logic.**
1. Select `notifications` where `cleared_at is null` and (`last_digest_sent_at is null` or `last_digest_sent_at < created_at`).
2. Group by `recipient_id`. Skip recipients who've opted out (reuse the `email_preferences` pattern from existing digests) or whose auth email is missing.
3. For each recipient, batch-fetch subject rows — collect all notification `subject_id` values grouped by `subject_table` and issue one `where id = any($1::uuid[])` query per table per recipient, then build a lookup map for body-line templating. Keeps the function at O(recipients + subjects) round-trips, not O(notifications). Render via the shared email template helper. Link back: `https://irregularpearl.org/notifications` for the bell popover mirror; each item also deep-links to `/piece/{id}#performers-notes`.
4. On Resend success, update `last_digest_sent_at = now()` for each included notification id.
5. If Resend fails for a recipient: log error, do not update `last_digest_sent_at`, next run retries. Cron cadence is the retry cadence.

## 8. Design touches

**Bell.** Inter icon, stroke 1.5, neutral ink default, purple accent on hover/open. Badge: small Inter medium, purple background, white text, pill radius, hidden at zero. Popover: 320px wide desktop, full-width on mobile with the same escape-to-close mechanism `Navbar.astro` already uses for search.

**Approval queue.** White card with 0.5px border, 12px radius, 16px padding — the DESIGN.md Cards pattern. Body text uses Source Serif 4 (it *is* the byline-bound prose). Action buttons secondary (transparent, 0.5px border) except the primary `Approve` which uses the dark-ink solid treatment. `Reject` inline confirmation uses the same card pattern, not a native dialog.

**Piece page render.** Signed-notes pattern exactly as specified in DESIGN.md §Components. Contributor self-author entry ("Write a note") uses a muted ghost-button treatment until focus.

**Email template helper.** Mirrors piece-page signed-notes register: purple header rule, Source Serif 4 for body prose, Inter for meta. Email-safe fallbacks Georgia + Arial. Consumed by both weekly and daily digests.

**Gap to flag.** DESIGN.md has no spec for popover chrome (border, shadow, arrow). Defaulting to 0.5px border, 8px radius, no shadow, no arrow. Confirm with design before merge.

## 9. Edge cases

- **Contributor rejects.** Status → draft, `cleared_at = now()` on the notification, `rejection_note` stored on the version row. Staff sees it inline in the admin dashboard on the rejected-version row.
- **Approve-and-edit.** One atomic RPC: new version inserted with `authored_by = contributor_id, approved_at = now()`, `version_number + 1`, `current_version_id` updated, status → published, notification cleared. No second notification — the pending one closed.
- **Staff retracts.** Status → draft, `retracted_by` + `retracted_at` set, notification cleared. If already approved, retract is disallowed (API 409); a contributor remove is the correct path.
- **Contributor authors directly.** `publish_contributor_note` → status = published in one atomic insert. No notification fires for the contributor (they're the author). `drafted_by` is null; this is the marker that the byline holder was the author.
- **Contributor edits a published note.** `publish_contributor_edit` → new version, `current_version_id` bumped, status stays published. No intermediate `awaiting_contributor_approval` state, no self-notification, no trigger fires for notification insert.
- **Contributor deletes a published note.** `remove_performers_note` → status = removed, `removed_by` + `removed_at` set. Trigger auto-clears any (unlikely) un-cleared notifications. Public render filters. `performers_note_versions` stays for audit. If the contributor later restores via staff, it's a new draft.
- **Multiple drafts against the same piece by different contributors.** Allowed — each is a separate `performers_notes` row with its own lifecycle. Public render enumerates all `published` rows for the piece. v1 ships one; the query already supports N.
- **Notification cleared but draft not acted on.** Acceptable; clearing is explicit intent. The draft remains in the admin list and is also reachable from `/notifications`, which surfaces both un-cleared *and* any active pending drafts for the user as a safety net ("New" above "Still pending").
- **Digest retry.** If the function errors mid-run, some recipients got mail, others didn't. Those mailed have `last_digest_sent_at` set and won't re-receive; others get picked up by the next daily run. Idempotent by design.

## 10. Testing

All tests use real Supabase (local via `supabase start`; README already uses `supabase db push` for migrations, confirm CLI workflow available locally before starting); only Resend is mocked. Project e2e convention is `bun test src/e2e` (not Playwright) — plan follows existing convention.

- **`bun test` (unit + integration).**
  - State machine transitions — every valid transition on both contributor-authored and staff/AI-drafted paths, every forbidden transition (staff-as-contributor, contributor-as-staff, double-approve, retract-after-publish, approve-a-removed-note, self-publish-on-someone-else's-draft). `src/lib/performersNotes.test.ts`.
  - RLS — non-owner contributor cannot `select` another's pending-draft body, cannot approve, cannot see another user's notifications; anonymous can only see `published` + non-removed notes. Version RLS: anonymous sees only `parent_status = 'published'` rows. `src/lib/rls.performersNotes.test.ts`.
  - Versioning — contributor edit produces new version with correct `version_number`, `authored_by`, `approved_at`; `current_version_id` updates; prior versions retained; CHECK constraints catch `status='published' AND current_version_id IS NULL`. `src/lib/performersNotes.versioning.test.ts`.
  - Byline CHECK — `is_contributor=true AND contributor_display_name=NULL` rejected. `src/lib/users.contributor.test.ts`.
  - Notification triggers — clearing-on-removal trigger fires correctly for the subject; approve/reject/retract clear the matching notification via RPC. `src/lib/notifications.trigger.test.ts`.
  - **REGRESSION (iron rule):** contributor self-authored paths must NOT create notifications. Assert that after `publish_contributor_note` and `publish_contributor_edit` no `notifications` row exists for the contributor. A bug that wires the notification insert into the contributor-authored path results in H. getting spammed about her own edits. `src/lib/notifications.self-edit-silence.test.ts`.
  - Bell count rendering — 0 → no badge, 1 → `1`, 9 → `9`, 10 → `9+`, 999 → `9+`. Component test. `src/components/NavbarBell.test.tsx`.
  - Digest de-dupe — running the function twice on the same data sends exactly one email; `last_digest_sent_at` updates after success; does not update on Resend failure. Resend mocked. `supabase/functions/send-notification-digest/index.test.ts`.
  - Shared email helper — renders in-brand markup, URL-safe escaping, fallback fonts. `supabase/functions/_lib/email-template.test.ts`.
- **`bun test:e2e`.** Three golden paths in `src/e2e/performers-note-pipeline.spec.ts`:
  - Staff-drafted approval: staff signs in → drafts a note on behalf of H. → sends to contributor → H. signs in → bell shows `1` → opens popover → navigates to queue → clicks `Approve` → visits the piece page → sees the signed note with correct byline.
  - Contributor self-authored: H. signs in → visits a piece with no performer's note → uses "Write a note" entry → types body → submits → note appears on the piece page immediately with her byline; no notification fires.
  - Reject loop: staff drafts → sends to H. → H. opens queue → rejects with a reason → staff signs in → sees the rejection note inline on the rejected-version row → revises body → re-submits → H. approves → note appears on the piece page. Covers the feedback handoff that isolated reject tests miss.

## 11. Migration plan / rollout

Every step mergeable on its own; each passes tests and does not regress production.

1. **Schema migration + seed.** Run `20260420000000_contributor_pipeline_slice_a.sql`. Mark H.'s user row `is_contributor=true, contributor_active=true, contributor_agreement_signed_at=<timestamp>`, populate display_name/bio. No UI yet. Verify CHECK constraints and composite FK catch the bad cases.
2. **RPCs + API endpoints.** Ship with unit + RLS tests. Verifiable via curl; no UI needed.
3. **Shared email template helper + re-skin weekly digest.** Land early; the daily digest depends on it, and it closes the amber drift debt.
4. **Contributor queue** at `/notifications`. Ships before the admin view so H. has an in-browser approval path the moment any draft exists. Seeded with a fixture draft so she can exercise the UI before staff authors anything real.
5. **Staff admin view** at `/admin/performers-notes`. Staff can now create and submit drafts that route to H.'s queue with no stranded-approval window.
6. **Piece page render.** Replace the empty state in `PiecePageLayout.astro` with `<PerformersNotes />`, including the contributor self-author entry and edit/remove affordances. Once this lands, the first signed content appears on irregularpearl.org.
7. **Navbar bell.** Ships after queue exists and real drafts flow.
8. **Daily digest Edge Function + cron.** Last because it has the longest feedback loop and depends on everything else being stable.

## 12. Decisions deliberately NOT taken for Slice A

These came up in review and were explicitly left out. Recording so future readers don't re-debate them:

- **No runtime gate on `contributor_agreement_signed_at`.** Column is populated by seed + any future contributor-onboarding UI. Publish RPCs do not check it; trust is placed in the surfaces that flip `is_contributor=true`. Revisit if a publish path ever bypasses those surfaces.
- **No partial unique on `(piece_id, contributor_id)`.** A single contributor may have multiple active notes on a single piece. Piece page renders all published notes for the piece; the "Write a note" entry remains available even when the contributor already has a published note on the piece. This preserves plurality within a single voice.
- **No realtime subscription on the bell.** Poll-only for Slice A. Revisit if latency ever matters to a user other than H.
- **No diff block in the queue.** Deferred to v1.1. After a reject + revise cycle, H. sees the revised body fresh.

## 13. Open questions

- **Digest timezone.** 13:00 UTC is 6am Pacific / 9am Eastern / 3pm CET. Pick one, not per-user — which is H.'s morning?
- **Notification type extensibility.** Enum `notification_type` has one value. Adding `draft_revision_requested` in Slice B is an `alter type add value`. Acceptable vs a lookup table?
- **Popover chrome (border, shadow, arrow).** DESIGN.md doesn't specify. Defaulting to 0.5px border / 8px radius / no shadow; needs designer sign-off.
- **`supabase start` local workflow.** README documents `supabase db push` (prod) but not the local `supabase start` loop. Confirm the local dev container works before test implementation depends on it; otherwise plan a `supabase init` step.
