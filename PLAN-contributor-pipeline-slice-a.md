# PLAN — Contributor approval pipeline, Slice A (PerformersNote)

*Draft for review. One content entity end-to-end. Slice B and Slice C follow this shape without schema rewrites.*

## 1. Scope and non-goals

**In scope.** One content type — `PerformersNote` — round-tripped through the full pipeline: staff drafts on behalf of a contributor, contributor reviews in an in-app approval queue, approves or rejects, approved notes render on the piece page with the signed-notes pattern, and un-cleared notifications nag via bell badge and a daily email digest. All new tables carry RLS. Versioning retains prior approved bodies; in-place edits of published notes are disallowed.

**Non-goals.** InterpretiveSchool, PracticeNote, substantive piece descriptions, edition observations — all Slice B/C. No multi-contributor queue generality, no staff admin polish beyond a working authoring form, no mobile-specific branches, no contributor onboarding flow (H. is seeded directly), no library-reflection publish path, no rejection-reason workflow beyond a freeform note, no retry/backoff inside the edge function.

## 2. Schema changes

Migration `supabase/migrations/20260420000000_contributor_pipeline_slice_a.sql`. Single file; one migration is easier to review and to roll back than four tiny ones for the same landing.

**Decision — extend `users`, don't add `contributors`.** A contributor is a role on a user, not a separate identity. v1 has one. A separate table would force joins everywhere and double-write on signup. When plurality arrives in Slice B+, the model still fits: being a contributor is about the fields, not the row.

```sql
-- contributor columns on users
alter table public.users add column is_contributor boolean not null default false;
alter table public.users add column contributor_display_name text; -- byline form, nullable
alter table public.users add column contributor_bio_short text;   -- one-liner
alter table public.users add column contributor_bio_long text;
alter table public.users add column contributor_agreement_signed_at timestamptz;
alter table public.users add column contributor_active boolean not null default false;

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
  current_version_id uuid,                       -- FK filled after insert into versions
  drafted_by uuid references public.users(id),   -- staff who authored the draft (nullable = contributor self-authored)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_by_contributor_at timestamptz,        -- null until explicit approval; set at publish
  removed_at timestamptz
);

create index idx_performers_notes_piece on public.performers_notes(piece_id) where status = 'published';
create index idx_performers_notes_contributor_queue
  on public.performers_notes(contributor_id)
  where status = 'awaiting_contributor_approval';

-- versions: append-only, one row per submitted/approved revision
create table public.performers_note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.performers_notes(id) on delete cascade,
  body text not null,
  authored_by uuid not null references public.users(id),  -- staff or contributor
  created_at timestamptz not null default now(),
  approved_at timestamptz,                                 -- set when this version becomes current & status=published
  version_number integer not null,
  rejection_note text
);

create index idx_pnv_note on public.performers_note_versions(note_id, version_number desc);

alter table public.performers_notes
  add constraint fk_current_version foreign key (current_version_id)
  references public.performers_note_versions(id) deferrable initially deferred;

-- notifications (polymorphic subject, starts with draft-awaiting-approval)
create type notification_type as enum ('draft_awaiting_approval');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users(id) on delete cascade,
  type notification_type not null,
  subject_table text not null,     -- e.g. 'performers_notes'
  subject_id uuid not null,        -- row id in that table
  body text not null,              -- short system-generated line
  link_path text not null,         -- in-app path to the review surface
  created_at timestamptz not null default now(),
  cleared_at timestamptz,
  last_digest_sent_at timestamptz
);

create index idx_notifications_recipient_active
  on public.notifications(recipient_id, created_at desc)
  where cleared_at is null;
```

**RLS.**
- `performers_notes`: `select` where `status = 'published'` for all; plus full `select` where `contributor_id = auth.uid()` or `public.is_staff()`. `insert/update` only for staff (`public.is_staff()`) except the contributor may `update` rows where they're the `contributor_id` (for approve/reject/edit-and-approve via RPC — see §5, which uses `security definer` so policy stays narrow).
- `performers_note_versions`: `select` visible when parent note is visible to the caller; `insert` via RPC only.
- `notifications`: `select/update` only where `recipient_id = auth.uid()`; no public `select`; staff may `insert` via RPC (server-side trigger preferred — see §3).

## 3. State machine

```
         staff creates
     ┌────────────────────► draft
     │                        │ staff submits
     │                        ▼
     │              awaiting_contributor_approval  ◄─── notification row inserted
     │                    │    │    │
     │      contributor   │    │    │  contributor rejects
     │      approves      │    │    └────────────► draft   (notification cleared_at set)
     │      (or edit-     │    │
     │       and-approve  │    │  staff retracts
     │       → new ver)   │    └─────────────────► draft   (notification cleared_at set)
     │                    ▼
     │                 published
     │                    │
     │                    │  contributor removes
     │                    ▼
     └──────────────► removed  (public render drops it next request)
```

**Transitions (who / what).**
- `draft → awaiting_contributor_approval`: staff only. Inserts a `notifications` row (via `after update` trigger keyed on status change) for the contributor. Sets nothing on `approved_by_contributor_at`.
- `awaiting_contributor_approval → published`: contributor only, via `approve_performers_note(note_id)` RPC. Sets `approved_by_contributor_at = now()`, sets `current_version_id` to the pending version, sets that version's `approved_at`. Trigger clears the matching notification (`cleared_at = now()`).
- `awaiting_contributor_approval → draft` (reject): contributor only, via `reject_performers_note(note_id, reason)` RPC. Clears the notification. Stores freeform reason on the version row (`rejection_note`).
- `awaiting_contributor_approval → draft` (staff retract): staff only, RPC. Clears the notification.
- Edit-and-approve: contributor only, single RPC that inserts a new version with the contributor's edited body and immediately publishes (one user action, one audit row). No separate notification — the approval closes the existing one.
- `published → removed`: contributor only (or staff at contributor's written request, which is a Slice B concern). Public render filters `status = 'published'`.
- Editing a published note: contributor inserts a new version via RPC, which moves status back to `awaiting_contributor_approval` against themselves (self-approval one-click). This keeps the audit honest — every published body ties to an approval event.

## 4. Versioning

**Decision — separate `performers_note_versions` table, with `current_version_id` pointing at the row whose body is public.** Alternative was a JSON history column on the note row; rejected because per-version audit fields (authored_by, approved_at, rejection_note) belong in rows, and querying "what text was live on 2026-05-01" is trivial with rows, awkward with JSON.

A published note is never mutated in place. Any edit is a new version row + status transition. The public body comes from `current_version_id`. Prior approved versions retain `approved_at` so historical audit is lossless.

## 5. API / route surface

All under `src/pages/api/`. Astro endpoints, session auth via `supabase.auth.getUser()` from request cookies. State-changing endpoints call Postgres RPCs (`security definer`) that encapsulate the transition + notification side effects atomically.

| Path | Method | Auth | Body | Purpose |
|---|---|---|---|---|
| `api/admin/performers-notes` | POST | staff | `{piece_id, contributor_id, body}` | Create draft (status=draft, inserts v1). |
| `api/admin/performers-notes/[id]/submit` | POST | staff | — | `draft → awaiting_contributor_approval`. |
| `api/admin/performers-notes/[id]/retract` | POST | staff | — | Retract to draft. |
| `api/performers-notes/[id]/approve` | POST | contributor (owner) | — | Approve & publish current pending version. |
| `api/performers-notes/[id]/edit-and-approve` | POST | contributor (owner) | `{body}` | Insert new version + publish in one call. |
| `api/performers-notes/[id]/reject` | POST | contributor (owner) | `{reason?}` | Back to draft, notification cleared. |
| `api/performers-notes/[id]/remove` | POST | contributor (owner) | — | `published → removed`. |
| `api/notifications` | GET | any authed | — | List un-cleared for bell/queue. Small payload. |
| `api/notifications/[id]/clear` | POST | recipient | — | Set `cleared_at`. |

No DELETE verbs — removal is a state transition, not a row delete.

## 6. Component inventory

All components consume existing DESIGN.md tokens. Astro where static, React where there's local state.

- **`src/components/NavbarBell.tsx`** — React island inside `Navbar.astro`, placed immediately left of `AuthButton`. Props: none (self-fetches via supabase client). Polls `/api/notifications` on mount + on `visibilitychange`; realtime subscription to `notifications` filtered by `recipient_id` upgrades count live. Badge rules: hidden at 0, `1`–`9` as the literal count, `9+` at 10 or more. Popover on click, click-outside closes. Popover items are links (to `/notifications` review page or the piece page with anchor) + an inline `Clear` button per row. A `Clear all` button at the popover footer.
- **`src/pages/notifications.astro`** — hosts `<NotificationsQueue client:load />`. For v1 this page *is* the contributor approval queue (un-cleared notifications all happen to be drafts). Title "Your queue".
- **`src/components/NotificationsQueue.tsx`** — React. For each pending draft: piece title, byline-to-be, current proposed body (serif, signed-notes pattern), a diff block against the prior approved version if any (minimal line-level diff; `diff` npm package, tree-shaken). Action row: `Approve`, `Edit and approve` (toggles an inline textarea), `Reject` (inline confirmation, not a dialog).
- **`src/pages/admin/performers-notes.astro`** + **`src/components/admin/PerformersNotesAdmin.tsx`** — staff authoring. Select piece (existing `Autocomplete`), select contributor (in v1 effectively H. preselected), textarea, `Save draft` and `Send to contributor` buttons. List of existing drafts with status and `Retract` where relevant. Deliberately unpolished — PRD says Tier 1 is data-model + admin view, not styled product.
- **`src/components/PerformersNotes.astro`** — renders approved notes on the piece page. Fetches via `getPieceFull` extension. Uses DESIGN.md signed-notes pattern: 2px left border (purple accent), serif body at 1.68 line-height, byline in Inter medium underneath with the contributor's short bio. Replaces the empty state in `PiecePageLayout.astro`. Multi-contributor treatment exists in markup (data-attribute selector for "contrasting voice" border color) even though v1 ships one voice.

## 7. Daily digest Edge Function

`supabase/functions/send-notification-digest/index.ts`. Cloned structure from `send-weekly-digest`. Runs daily at 13:00 UTC (H.'s morning) via the same GitHub Actions cron pattern the weekly digest uses — wrangler/supabase scheduled triggers would work, but matching the existing pattern is one less moving part.

**Logic.**
1. Select `notifications` where `cleared_at is null` and (`last_digest_sent_at is null` or `last_digest_sent_at < created_at` — treat an un-changed notification as done once mailed).
2. Group by `recipient_id`. Skip recipients with zero rows or who have opted out via email prefs. Skip if the user's auth email is missing.
3. For each recipient, fetch the subject rows for body-line templating. Render an HTML email with Source Serif 4 + Inter treatment matching DESIGN.md (email-safe fallback: Georgia + Arial). Link back shape: `https://irregularpearl.org/notifications` for the bell popover mirror; each item also deep-links to `/piece/{id}#performers-notes`.
4. On Resend success, update `last_digest_sent_at = now()` for each included notification id.
5. If Resend fails for a recipient: log error, do not update `last_digest_sent_at`, so the next run retries. No internal retry loop — the cron cadence is the retry cadence.

## 8. Design touches

**Bell.** Inter, icon stroke 1.5, neutral ink default, purple on hover/open. Badge: small Inter medium, purple background, white text, pill radius, hidden at zero. Popover: 320px wide desktop, 100% on mobile with the same escape-to-close mechanism `Navbar.astro` already uses for search.

**Approval queue.** White card with 0.5px border, 12px radius, 16px padding — the Cards pattern from DESIGN.md. Body text uses Source Serif 4 (it *is* the byline-bound prose). Action buttons secondary style (transparent, 0.5px border) except the primary `Approve` which uses the dark-ink solid treatment.

**Piece page render.** Signed-notes pattern exactly as specified in DESIGN.md §Components.

**Gap to flag.** DESIGN.md has no spec for popover chrome (border, shadow, arrow). Default: 0.5px border, 8px radius, no shadow, no arrow. Confirm with design before merge.

## 9. Edge cases

- **Contributor rejects.** Status → draft, `cleared_at = now()` on the notification, rejection reason stored on the version row. Staff sees it in the admin list.
- **Edit-and-approve.** New version inserted, `version_number + 1`, `approved_at = now()`, `current_version_id` updated, old notification cleared. No second notification — the pending one closed.
- **Staff retracts.** Status → draft, notification cleared. If already approved, retract is disallowed (API 409); a contributor remove is the correct path.
- **Contributor deletes a published note.** `published → removed`. Public render filters. `performers_note_versions` stays for audit. If the contributor later restores via staff, it's a new draft.
- **Multiple drafts against the same piece by different contributors.** Allowed — each is a separate `performers_notes` row, each own lifecycle. Public render on the piece page enumerates all `published` rows for the piece. v1 ships one; the query already supports N.
- **Notification cleared but not acted on.** Acceptable; clearing is explicit intent. The draft remains in the admin list and is also reachable from `/notifications` (which surfaces both un-cleared *and* any active pending drafts for the user as a safety net — two-pane: "New" above cleared "Still pending").
- **Digest retry.** If the function errors mid-run, some recipients got mail, others didn't. The ones who got mail have `last_digest_sent_at` set and won't re-receive. The ones who didn't will be picked up by the next daily run. Idempotent by design.

## 10. Testing

All tests use real Supabase (local via `supabase start`); only Resend is mocked.

- **`bun test` (unit + integration).**
  - State machine: every valid transition, every forbidden transition (staff-as-contributor, contributor-as-staff, double-approve, retract-after-publish). `src/lib/performersNotes.test.ts`.
  - RLS: verify a non-owner contributor cannot `select` another's pending draft body, cannot approve, cannot see another user's notifications. `src/lib/rls.performersNotes.test.ts`.
  - Bell count rendering: 0 → no badge, 1 → `1`, 9 → `9`, 10 → `9+`, 999 → `9+`. Component test. `src/components/NavbarBell.test.tsx`.
  - Digest de-dupe: running the function twice on the same data sends exactly one email. Resend mocked. `supabase/functions/send-notification-digest/index.test.ts`.
- **`bun test:e2e` (Playwright).** One golden path: staff signs in → drafts a note on behalf of H. → sends to contributor → H. signs in → bell shows `1` → opens popover → navigates to queue → clicks `Approve` → visits the piece page → sees the signed note with correct byline. `src/e2e/performers-note-pipeline.spec.ts`.

## 11. Migration plan / rollout

Every step mergeable on its own; each passes tests and does not regress production.

1. **Schema migration + seed.** Run `20260420000000_contributor_pipeline_slice_a.sql`. Mark H.'s user row `is_contributor=true, contributor_active=true`, populate display_name/bio. No UI yet.
2. **RPCs + API endpoints.** Ship with unit + RLS tests. Verifiable via curl; no UI needed.
3. **Staff admin view** at `/admin/performers-notes`. H. and staff can create drafts end-to-end via the API, but approval is still API-only.
4. **Contributor queue** at `/notifications`. H. can approve/reject in-browser.
5. **Piece page render.** Replace the empty state in `PiecePageLayout.astro` with `<PerformersNotes />`. Once this lands, the first signed content appears on irregularpearl.org.
6. **Navbar bell.** Ships after queue exists (otherwise the link target is empty).
7. **Daily digest Edge Function + cron.** Last because it has the longest feedback loop and depends on everything else being stable.

## 12. Open questions

- **Contributor edits published note — does self-approval count as a new approval event, or a silent patch?** Plan above assumes it moves through `awaiting_contributor_approval` so the audit row is honest. Confirm this matches the PRD invariant's intent.
- **Rejection reason visibility.** Stored on the version row. Should it email back to staff, or only appear in the admin list? Plan assumes admin list only for v1.
- **Digest timezone.** 13:00 UTC is 6am Pacific / 9am Eastern / 3pm CET. Pick one, not per-user — which is H.'s morning?
- **Notification type extensibility.** Enum `notification_type` has one value. Adding `draft_revision_requested` in Slice B is an `alter type add value`. Confirm that's acceptable versus a lookup table.
- **Popover chrome (border, shadow, arrow).** DESIGN.md doesn't specify. Defaulting to 0.5px border / 8px radius / no shadow; needs designer sign-off.
- **Does the bell popover's "Clear all" also mark `cleared_at`, or only dismiss the visual popover?** Plan says it sets `cleared_at` — matches "clearing is explicit."
