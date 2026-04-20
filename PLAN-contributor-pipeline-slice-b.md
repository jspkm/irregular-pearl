# PLAN — Contributor approval pipeline, Slice B (InterpretiveSchool + substantive PieceDescription)

> **Status: eng-review cleared + Codex challenge cleared. Ready for implementation.**
> Reuses the state machine, versioning pattern, RPC shape, bell, queue, admin, and digest from [PLAN-contributor-pipeline-slice-a.md](PLAN-contributor-pipeline-slice-a.md). Read that first.

*Two more content types through the same pipeline. No state-machine rewrites. Pivots the notifications table from narrow FK to polymorphic subject — paid now because three subject types by end-of-slice makes narrow-FK ugly, and PRD line 434 blesses polymorphic.*

## 1. Scope and non-goals

**In scope.** Two content types added to the approval pipeline:
- `InterpretiveSchool` — named family of interpretive choices per piece (name, signed paragraph description, optional tempo cues). PRD is explicit: schools are plural by design, multiple per piece, no ranking, no canonical framing.
- `PieceDescription` — long-form signed piece description carrying interpretive or pedagogical judgment. Distinct from the existing unsigned `pieces.description` column (short house-style reference copy, 150–300 words). The signed description is additive, one or many per piece, routes through the approval pipeline.

Both reuse the Slice A state machine end-to-end: `draft → awaiting_contributor_approval → published → removed`, versioning via a parallel `*_versions` table, audit columns (`drafted_by`, `submitted_by`, `approved_by`, `rejected_by`, `retracted_by`, `removed_by` + timestamps), RLS on read, security-definer RPCs on mutate.

Also in scope:
- **Polymorphic notifications pivot** — `notifications.performers_note_id` gains siblings `subject_table text + subject_id uuid`. Per eng-review **decision 1A**, `performers_note_id` stays vestigial (not dropped) until a later cleanup migration lands after Slice B proves out in production. Per Codex tension **CM1**, Slice A notification-inserting RPCs dual-write during the vestigial window: `performers_note_id` AND `(subject_table='performers_notes', subject_id=<same>)` are both populated. Consumers flip to reading `subject_table` in Step 3.
- **Subject-parameterized NotificationsQueue** — one UI that renders any supported subject type.
- **Subject-parameterized daily digest** — one email function grouping across all subject types per recipient.
- **Piece page: schools grid section + signed-description section** — DESIGN.md signed-notes pattern. Schools section is the multi-column grid PRD describes; collapses to stacked cards on narrow viewports.
- **Admin view expansion** — extract a generic `ContributorContentAdmin` component (eng-review **5A**); mount it from three admin pages (`/admin/performers-notes`, `/admin/interpretive-schools`, `/admin/piece-descriptions`) with a subject-type config prop.

**Non-goals.**
- Structural landmarks, flags, practice notes — Slice C.
- Edition observations — later.
- Library reflection publish path — later Tier 1 surface.
- Realtime bell subscription — still poll-only.
- Representative-recording column on `interpretive_schools` — per eng-review **3A**, the column is omitted until the recordings entity lands. When recordings arrive (Slice C or later), the migration that creates the recordings table adds the column with a proper FK.
- Retry/backoff in the digest — cron cadence remains the retry cadence.
- Cross-contributor review surfaces — no "reviewer X approves contributor Y's draft" queues; every contributor only sees their own queue, as in Slice A.
- Mobile-specific UI branches.

## 2. Schema changes

Migration `supabase/migrations/20260421000000_contributor_pipeline_slice_b.sql`. Single file covering the additive pivot (no destructive drops). A follow-up cleanup migration in Slice C drops the vestigial column after the pivot has live traffic.

### 2.1 New tables

```sql
-- interpretive_schools
create table public.interpretive_schools (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  name text not null,
  tempo_cues jsonb,                     -- optional; freeform for now, e.g. {"opening": "quarter=72", "finale": "dotted-quarter=112"}
  status draft_status not null default 'draft',
  current_version_id uuid,
  drafted_by uuid references public.users(id),
  submitted_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  rejected_by uuid references public.users(id),
  retracted_by uuid references public.users(id),
  retracted_at timestamptz,
  removed_by uuid references public.users(id),
  removed_at timestamptz,
  approved_by_contributor_at timestamptz,
  metadata_updated_by uuid references public.users(id),   -- eng-review 4A: audit for metadata-only updates
  metadata_updated_at timestamptz,                         -- eng-review 4A
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_school_has_version
    check ((status <> 'published') or (current_version_id is not null)),
  constraint school_name_nonempty check (length(trim(name)) > 0)
);

create table public.interpretive_school_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.interpretive_schools(id) on delete cascade,
  piece_id text not null references public.pieces(id) on delete cascade,         -- denormalized immutable
  contributor_id uuid not null references public.users(id) on delete restrict,   -- denormalized immutable
  body text not null,
  authored_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  version_number integer not null,
  rejection_note text,
  constraint uq_isv_school_version unique (school_id, version_number),
  constraint uq_isv_school_id unique (school_id, id)
);

alter table public.interpretive_schools
  add constraint fk_is_current_version_matches_school
  foreign key (id, current_version_id)
  references public.interpretive_school_versions(school_id, id)
  deferrable initially deferred;

create index idx_interpretive_schools_piece_published
  on public.interpretive_schools(piece_id) where status = 'published';
create index idx_interpretive_schools_contributor_queue
  on public.interpretive_schools(contributor_id)
  where status = 'awaiting_contributor_approval';
create index idx_isv_school on public.interpretive_school_versions(school_id, version_number desc);
create index idx_isv_contributor on public.interpretive_school_versions(contributor_id);

-- piece_descriptions (the signed long-form sibling of pieces.description)
create table public.piece_descriptions (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  status draft_status not null default 'draft',
  current_version_id uuid,
  drafted_by uuid references public.users(id),
  submitted_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  rejected_by uuid references public.users(id),
  retracted_by uuid references public.users(id),
  retracted_at timestamptz,
  removed_by uuid references public.users(id),
  removed_at timestamptz,
  approved_by_contributor_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_description_has_version
    check ((status <> 'published') or (current_version_id is not null))
);

create table public.piece_description_versions (
  id uuid primary key default gen_random_uuid(),
  description_id uuid not null references public.piece_descriptions(id) on delete cascade,
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  body text not null,
  authored_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  version_number integer not null,
  rejection_note text,
  constraint uq_pdv_description_version unique (description_id, version_number),
  constraint uq_pdv_description_id unique (description_id, id)
);

alter table public.piece_descriptions
  add constraint fk_pd_current_version_matches_description
  foreign key (id, current_version_id)
  references public.piece_description_versions(description_id, id)
  deferrable initially deferred;

create index idx_piece_descriptions_piece_published
  on public.piece_descriptions(piece_id) where status = 'published';
create index idx_piece_descriptions_contributor_queue
  on public.piece_descriptions(contributor_id)
  where status = 'awaiting_contributor_approval';
create index idx_pdv_description on public.piece_description_versions(description_id, version_number desc);
create index idx_pdv_contributor on public.piece_description_versions(contributor_id);

-- Published-versions views (audit/owner reads)
create view public.v_interpretive_school_versions_published as
  select v.* from public.interpretive_school_versions v
  join public.interpretive_schools s on s.id = v.school_id
  where s.status = 'published';

create view public.v_piece_description_versions_published as
  select v.* from public.piece_description_versions v
  join public.piece_descriptions d on d.id = v.description_id
  where d.status = 'published';
```

### 2.2 Polymorphic notifications pivot (additive)

Existing `notifications.performers_note_id` stays (eng-review **1A**). Add `subject_table text + subject_id uuid` alongside, backfill, lock NOT NULL, add CHECK. No drop in this migration.

```sql
-- 1. Add new columns, nullable at first
alter table public.notifications add column subject_table text;
alter table public.notifications add column subject_id uuid;

-- 2. Backfill from the existing narrow FK
update public.notifications
  set subject_table = 'performers_notes',
      subject_id = performers_note_id
  where performers_note_id is not null;

-- 3. Lock in
alter table public.notifications alter column subject_table set not null;
alter table public.notifications alter column subject_id set not null;

alter table public.notifications
  add constraint subject_table_allowed
  check (subject_table in ('performers_notes', 'interpretive_schools', 'piece_descriptions'));

-- 4. Idempotency guard (Codex tension CM3): one un-cleared notification per (subject, type) at a time
create unique index uq_notifications_live_per_subject
  on public.notifications(subject_table, subject_id, type)
  where cleared_at is null;

-- 5. Parameterized clearing function (eng-review 2A) replaces the old narrow-FK function
create or replace function public.clear_notifications_on_subject_removal() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_subject_table text := TG_ARGV[0];
begin
  if new.status = 'removed' and (old.status is distinct from new.status) then
    update public.notifications
      set cleared_at = now()
      where subject_table = v_subject_table
        and subject_id = new.id
        and cleared_at is null;
  end if;
  return new;
end;
$$;

-- 6. BEFORE DELETE function (Codex tension CM2): hard-delete cleanup
create or replace function public.clear_notifications_on_subject_delete() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_subject_table text := TG_ARGV[0];
begin
  delete from public.notifications
    where subject_table = v_subject_table
      and subject_id = old.id;
  return old;
end;
$$;

-- 7. Replace the Slice A trigger (now parameterized) and add for the two new subject tables
drop trigger if exists trg_clear_notifications_on_pn_removal on public.performers_notes;
create trigger trg_clear_notifications_on_pn_removal
  after update of status on public.performers_notes
  for each row execute function public.clear_notifications_on_subject_removal('performers_notes');
create trigger trg_clear_notifications_on_is_removal
  after update of status on public.interpretive_schools
  for each row execute function public.clear_notifications_on_subject_removal('interpretive_schools');
create trigger trg_clear_notifications_on_pd_removal
  after update of status on public.piece_descriptions
  for each row execute function public.clear_notifications_on_subject_removal('piece_descriptions');

-- 8. Hard-delete cleanup triggers (CM2)
create trigger trg_clear_notifications_on_pn_delete
  before delete on public.performers_notes
  for each row execute function public.clear_notifications_on_subject_delete('performers_notes');
create trigger trg_clear_notifications_on_is_delete
  before delete on public.interpretive_schools
  for each row execute function public.clear_notifications_on_subject_delete('interpretive_schools');
create trigger trg_clear_notifications_on_pd_delete
  before delete on public.piece_descriptions
  for each row execute function public.clear_notifications_on_subject_delete('piece_descriptions');
```

**Why polymorphic over narrow FK for Slice B.**
- PRD §Notification line 434 explicitly: "references one subject entity, polymorphic by type."
- Three subject types this slice, plus PracticeNote + Edition observation coming in Slice C = five nullable FK columns with a `num_nonnulls(...) = 1` CHECK. That shape doesn't pay off.
- App-layer subject lookups are already parameterized by `subject_table` in the queue fetch and digest fetch — no branching code paths to maintain.
- Loss of DB-level referential integrity is covered by the `AFTER UPDATE` soft-removal trigger + the `BEFORE DELETE` hard-delete trigger (CM2) + the partial unique index for idempotency (CM3).

### 2.3 RLS

Mirror Slice A:
- `interpretive_schools`, `piece_descriptions`: public `select` where `status = 'published'`; owner contributor + staff see all. No direct insert/update from clients.
- `interpretive_school_versions`, `piece_description_versions`: owner contributor + staff `select` on immutable denormalized columns; public cannot read version rows directly (piece-page queries join via the notes-side `status = 'published'` filter).
- `notifications`: unchanged — `select/update` where `recipient_id = auth.uid()`.

## 3. State machine — unchanged

Identical to Slice A. All three subject types traverse the same states with the same transition set. Each content type has its own parallel RPC surface but the state-machine guarantees are shared and tested the same way.

**Slice A's iron-rule regression test applies to both new types:** contributor self-authored paths must NOT create notifications. Re-assert for both `publish_contributor_interpretive_school` and `publish_contributor_piece_description`.

## 4. RPC surface

Three parallel sets, named `performers_note` / `interpretive_school` / `piece_description`:

| RPC family | Args delta |
|---|---|
| `publish_contributor_interpretive_school` | `p_piece_id, p_name, p_body, p_tempo_cues?` |
| `publish_contributor_interpretive_school_edit` | `p_school_id, p_body` (body-only edit; bumps version) |
| `update_interpretive_school_metadata` | `p_school_id, p_name?, p_tempo_cues?` — **owner contributor only** (Codex tension CM4); not callable by staff. Updates non-versioned fields without bumping version. Sets `metadata_updated_by = auth.uid(), metadata_updated_at = now()` (eng-review 4A). Writes to published rows are permitted (contributor-on-own-content). On draft rows, the staff draft-update RPC handles metadata. |
| `remove_interpretive_school` | `p_school_id` |
| `create_interpretive_school_draft` | `p_piece_id, p_contributor_id, p_name, p_body, p_tempo_cues?` |
| `update_interpretive_school_draft` | `p_school_id, p_body?, p_name?, p_tempo_cues?` — staff edits draft (pre-publish), any field |
| `submit_interpretive_school` | `p_school_id` |
| `retract_interpretive_school` | `p_school_id` |
| `approve_interpretive_school` | `p_school_id` |
| `approve_and_edit_interpretive_school` | `p_school_id, p_body` |
| `reject_interpretive_school` | `p_school_id, p_reason?` |

Repeat the same set for `piece_description` minus the metadata RPC (no name/tempo_cues to edit). `publish_contributor_piece_description(p_piece_id, p_body)` and friends.

**Shared internal helpers.** Add once; all three subject families consume:

```sql
create function public._require_contributor_owner(p_contributor_id uuid) returns void ...
create function public._require_staff() returns void ...
create function public._insert_notification(
  p_recipient uuid,
  p_subject_table text,
  p_subject_id uuid,
  p_body text,
  p_link_path text
) returns uuid ...
-- inserts a notification row. ON CONFLICT (subject_table, subject_id, type) WHERE cleared_at IS NULL
-- DO NOTHING — idempotent per CM3. Returns existing id if one is live for this (subject, type).
create function public._clear_notifications_for(
  p_subject_table text,
  p_subject_id uuid
) returns void ...
```

**Dual-write during vestigial window (Codex tension CM1).** Slice A RPCs that insert notifications (`submit_performers_note`) update in this migration's companion RPC file: when inserting the notification, populate BOTH `performers_note_id` (for Slice A-era consumers still reading the narrow FK) AND `(subject_table='performers_notes', subject_id=<note_id>)`. Once Step 3 refactors consumers to read `subject_table`, a later cleanup migration drops `performers_note_id` and removes the dual-write.

**Per-subject notification body copy (eng-review 6A).** The submit RPC writes the full body line into `notifications.body` on insert:
- `submit_performers_note` → `"A draft performer's note on <piece_title> is ready for your review"`
- `submit_interpretive_school` → `"A draft interpretive school ('<school_name>') on <piece_title> is ready for your review"`
- `submit_piece_description` → `"A draft piece description on <piece_title> is ready for your review"`

Bell popover and digest email both render `notifications.body` verbatim — single source of truth, no client-side templating.

**Why not a single polymorphic RPC set.** Each subject type has different input shape (schools take a `name`, descriptions don't). Per-subject RPCs keep inputs typed and the state machine traceable. The shared helpers are where deduplication happens.

## 5. Component inventory

### 5.1 Refactors to Slice A components

- **`NotificationsQueue.tsx`** — today fetches `performers_notes` directly. Refactor: fetch all un-cleared notifications for the user (one query), group by `subject_table`, issue one batched `select` per subject table (O(tables), not O(notifications)), render each via a subject-type-aware card subcomponent. Action handlers dispatch to the correct RPC set based on `subject_table`.
- **`NavbarBell.tsx`** — no change needed; already content-type agnostic.
- **`send-notification-digest` edge function** — parameterize the subject fetch: collect all `(subject_table, subject_id)` pairs for a recipient, issue one `where id = any($1::uuid[])` per subject table, join piece title for each. Body line comes from `notifications.body` (written by RPC per 6A). Link-path per subject_table:
  - `performers_notes` → `/piece/{piece_id}#performers-notes`
  - `interpretive_schools` → `/piece/{piece_id}#interpretive-schools`
  - `piece_descriptions` → `/piece/{piece_id}#signed-description`
- **`ContributorContentAdmin.tsx`** (new extraction, eng-review **5A**) — generic React component containing today's `PerformersNotesAdmin` behavior, parameterized by a `subjectType` prop and a `fields` config describing per-subject form inputs (schools get `name` + `tempo_cues`; descriptions and performer's notes are body-only). Three admin pages (`/admin/performers-notes`, `/admin/interpretive-schools`, `/admin/piece-descriptions`) are thin wrappers that mount this component with their config. The existing `PerformersNotesAdmin.tsx` is deleted in favor of the generic.

### 5.2 New piece-page components

- **`InterpretiveSchools.astro`** — published schools for the piece, **ordered by `approved_at ASC`** (Codex tension **CM6**: chronological/publication-order, non-ranking). Multi-column grid at ≥ 1024px (3-col if ≥ 3 schools present, else 2-col), single column < 768px. Each card: school name in Inter medium uppercase mini-header, signed paragraph body in Source Serif 4, byline in Inter medium. **Self-author entry ALWAYS visible** for eligible contributors (Codex tension **CM5**: drops the "has-no-school" gate). Button label adapts: "Write a school" when none exist, "Add another school" when some exist. Edit + remove affordances on own published cards.
- **`SignedPieceDescription.astro`** — published `piece_descriptions` for the piece, ordered by `approved_at ASC` (CM6). Renders as the editorial essay below the header. Typically one per piece, but markup supports N.

### 5.3 Piece-page wiring (unsigned + signed coexistence, eng-review 7A)

`PiecePageLayout.astro` update:
- **Unsigned `pieces.description`** renders as a small italic metadata strip near the header — reads as reference copy, not editorial voice. Single paragraph, Inter italic.
- **`SignedPieceDescription.astro`** renders below the header as the signed editorial essay — Source Serif 4, byline, full visual weight.
- Coexistence matrix:
  - Both present: metadata strip + essay, both visible.
  - Signed present, unsigned absent: essay only.
  - Unsigned present, signed absent: metadata strip in its place; essay slot shows empty state ("No signed description yet").
  - Neither: empty states on both.

## 6. Daily digest

See §5.1 above — the digest reads `notifications.body` verbatim (per 6A) and resolves subjects via batched per-subject-table fetches (O(tables)). No subject-type branching inside the template.

## 7. Design touches

- **Schools grid.** Desktop: 2-column grid at ≥ 768px, 3-column at ≥ 1024px only if three or more schools present (2 schools always 2-column). Source Serif 4 body, 0.5px cell borders, generous whitespace — museum-catalog register. Mobile: single column, cards stack with 24px gap. Explicit non-ranking treatment: no ordinal numbering, no "top"/"featured" framing. Order = chronological by `approved_at`.
- **Signed description.** Treated as the piece's editorial essay — full-width, Source Serif 4 at 1.72 line-height, drop cap optional (defer decision to design review), byline anchored bottom-right of the card.
- **Unsigned metadata strip.** One paragraph, Inter italic, small size (14px), muted ink, just below the piece header. Reads as catalog/Grove-style metadata.
- **Admin form deltas.** Schools admin adds `name` + optional `tempo_cues` fields above the body textarea. Description admin is body-only.
- **Queue cards.** Subject-type label in Inter uppercase mini-cap above piece title ("INTERPRETIVE SCHOOL · Dvořák Cello Concerto"). Body preview from `notifications.body` (6A). Action row identical across subjects.

**Gap to flag.** Drop-cap decision on the signed piece description — confirm with design review before implementation.

## 8. Edge cases

All Slice A edge cases apply unchanged. New ones:

- **Schools — multiple per piece, same contributor.** Allowed. A single contributor may hold multiple published schools on one piece. The piece page renders all of them, ordered by `approved_at ASC`. The self-author entry stays visible (CM5) so the contributor can add a second school.
- **Schools — name uniqueness.** No DB-level uniqueness constraint on `(piece_id, name)`. Editorial rule, not a schema rule. Queue cards disambiguate by byline.
- **Metadata-only school edit.** `update_interpretive_school_metadata` is **owner contributor only** (CM4). Staff cannot rename a published school. The RPC sets `metadata_updated_by = auth.uid(), metadata_updated_at = now()` (4A audit). Version row is not bumped — metadata changes are orthogonal to body history.
- **Signed + unsigned description coexistence.** Rendered per 7A: unsigned = metadata strip near header; signed = essay below. Independent slots, each with its own empty state.
- **Contributor removes a school.** `removed` status, soft-removal trigger clears pending notifications. Version history retained. `BEFORE DELETE` trigger handles the hard-delete path (CM2) if the row is ever force-deleted via cascade.
- **Polymorphic subject lookup failure.** Hard-delete trigger prevents most orphans. Belt+suspenders: if a notification's subject_id doesn't resolve at render, the queue UI renders a muted "Referenced content no longer available — clear this notification" card; digest logs + skips.
- **Duplicate submit.** Partial unique index `uq_notifications_live_per_subject` (CM3) makes the insert idempotent. `submit_interpretive_school` called twice returns the same notification id; queue + digest show one card, one line.

## 9. Testing

All Slice A tests continue passing unchanged. New tests (eng-review **8A** boil-the-lake coverage):

- **`src/lib/interpretiveSchools.test.ts`** — state machine for schools. Metadata-only update does not bump version. Two rows with same `(piece_id, name)` allowed. Multiple published schools per (piece, contributor) allowed.
- **`src/lib/pieceDescriptions.test.ts`** — state machine for descriptions.
- **`src/lib/rls.interpretiveSchools.test.ts`** + **`src/lib/rls.pieceDescriptions.test.ts`** — RLS parity.
- **`src/lib/notifications.polymorphic.test.ts`** — one notification type, three subject tables: queue fetch returns the right rows per subject; clearing one doesn't clear others.
- **`src/lib/notifications.parameterized-trigger.test.ts`** (eng-review **8A**) — soft-removal trigger (UPDATE status='removed') fires only for its own subject table; no cross-subject false positives. Hard-delete trigger (BEFORE DELETE, CM2) clears orphan notifications on cascade delete.
- **`src/lib/notifications.idempotency.test.ts`** (CM3) — `submit_performers_note` called twice produces exactly one live notification; after clearing, a re-submit can produce a new one.
- **`src/lib/notifications.body-copy.test.ts`** (eng-review **6A**, **8A**) — the `.body` column values produced by `submit_performers_note`, `submit_interpretive_school`, `submit_piece_description` match the expected sentence format per subject_table.
- **`src/lib/schools.metadata-audit.test.ts`** (eng-review **4A**, **8A**) — `update_interpretive_school_metadata` sets `metadata_updated_by` + `metadata_updated_at` correctly. Non-owner and staff cannot call it (CM4). Owner call on published row succeeds.
- **`src/lib/notifications.dual-write.test.ts`** (CM1, **8A**) — during the vestigial window, `submit_performers_note` populates BOTH `performers_note_id` AND `(subject_table, subject_id)`. Slice A queue consumers (pre-Step-3) continue to read `performers_note_id` successfully.
- **REGRESSION (iron rule, extended):** contributor self-authored paths for both new subject types must NOT create notifications. `src/lib/notifications.self-edit-silence.test.ts` extended.
- **REGRESSION (iron rule):** after the Slice B migration, Slice A end-to-end still works (bell count, queue render, approve flow, piece page render) against pre-existing performers_notes + notifications data. `src/lib/slice-a.regression-after-slice-b-pivot.test.ts`.
- **Migration test** — run the Slice B migration against a DB populated with Slice A state; assert backfill populates `subject_table = 'performers_notes'` + `subject_id = performers_note_id` for every existing row; assert `performers_note_id` stays intact (1A vestigial); assert CHECK rejects unknown subject_table values.
- **`NotificationsQueue.test.tsx`** — renders mixed-subject queue correctly, dispatches to the right RPC family per card, action handlers update local state without cross-contamination.
- **`PiecePageDescription.test.tsx`** (eng-review **7A**, **8A**) — renders all four coexistence states (both, signed-only, unsigned-only, neither) with correct visual slots.
- **`src/e2e/contributor-pipeline-slice-b.spec.ts`** — three golden paths:
  - School end-to-end: staff drafts a school on behalf of H. → sends to contributor → bell `1` → H. opens queue → sees card labeled INTERPRETIVE SCHOOL → approves → school appears in the schools grid on the piece page with her byline.
  - Signed description end-to-end: H. self-authors a signed description via the piece-page entry → renders immediately with her byline, no notification fires.
  - Reject + revise loop for a school: staff drafts → sends → H. rejects with reason → staff revises → re-submits → H. approves → school on piece page.

## 10. Migration plan / rollout

Each step mergeable on its own; each passes tests and does not regress production.

1. **Schema migration + Slice A dual-write (CM1).** `20260421000000_contributor_pipeline_slice_b.sql`. New tables, views, parameterized triggers (soft + hard delete), polymorphic additive pivot with backfill, partial unique index (CM3), 4A audit columns. Update `submit_performers_note` + any other Slice A RPCs that insert notifications to dual-write `performers_note_id` AND `(subject_table, subject_id)`. Slice A queue + bell keep reading `performers_note_id` — no consumer changes yet. Verify: Slice A end-to-end regression still green; defensive triggers fire for each subject table under UPDATE and DELETE; CHECK and partial unique index reject the bad cases.
2. **Shared RPC helpers + both new RPC families.** Land `_insert_notification` (idempotent via ON CONFLICT), `_clear_notifications_for`, `_require_*`. Land the 11 RPCs per new subject type (12 for schools including metadata). Unit + RLS tests. Verifiable via curl; no UI needed.
3. **Refactor NotificationsQueue + digest function to be subject-agnostic.** Flip consumers from `performers_note_id` to `(subject_table, subject_id)`. New tests: mixed-subject queue rendering; digest templates correct body-lines per subject (reads `notifications.body` verbatim per 6A). Behavior unchanged for existing Slice A data (dual-write means both paths resolve).
4. **Schools admin** + **schools queue card rendering** + **`InterpretiveSchools.astro`** on the piece page with contributor self-author (always visible, CM5) + edit + remove affordances.
5. **Piece description admin** + **description queue card rendering** + **`SignedPieceDescription.astro`** + piece-page unsigned-metadata-strip treatment (7A).
6. **Seed fixtures.** Draft at least one school and one signed description for a seeded piece in the dev fixture so future sessions (and QA) have meaningful data on the piece page immediately after running migrations.

**Post-Slice-B cleanup (not part of this plan, track as a Slice C prerequisite):** a later migration drops `notifications.performers_note_id` and removes the dual-write logic from Slice A RPCs after the vestigial window has one week of live traffic.

## 11. Decisions deliberately NOT taken for Slice B

- **No separate `substantive` flag on `pieces.description`.** A signed extension lives in its own table; the unsigned column stays unsigned.
- **No school ordering column.** Rendered order is `approved_at ASC` (CM6). If editorially-authored ordering becomes a need, add it then with a clear rationale.
- **No editorial board / multi-reviewer queue.** Each contributor only sees their own queue.
- **No `notification_type` extension.** Still a single value (`draft_awaiting_approval`). Three subject tables share the same notification type.
- **No drop of `notifications.performers_note_id` in this migration.** Deferred to post-Slice-B cleanup (1A).
- **No representative-recording column on schools.** Omitted until recordings entity exists (3A).
- **No bell-link precision per-subject.** Links go to the piece-page section anchor (`#interpretive-schools`, `#signed-description`). The queue itself is the precision surface.

## 12. Open questions

- **Drop-cap on signed piece description** — design decision. Default to no drop-cap pending design review.
- **`tempo_cues` jsonb schema** — freeform for Slice B. Formalize in Slice C when landmarks + tempo semantics solidify.
- **School name editorial governance** — free-form for now; revisit if names drift.
- **Digest timezone** — carried from Slice A; still 13:00 UTC.

## 13. Parallelization strategy

Implementation lanes for worktree parallelization:

| Step | Modules touched | Depends on |
|------|----------------|------------|
| 1. Schema migration + dual-write | `supabase/migrations/`, Slice A submit RPCs | — |
| 2. New RPC families | `supabase/migrations/` (new RPCs file) | 1 |
| 3. Queue + digest refactor | `src/components/NotificationsQueue.tsx`, `supabase/functions/send-notification-digest/` | 1, 2 |
| 4. Schools UI | `src/components/admin/*`, `src/components/InterpretiveSchools.astro`, `src/pages/admin/interpretive-schools.astro` | 3 |
| 5. Description UI | `src/components/admin/*`, `src/components/SignedPieceDescription.astro`, `src/pages/admin/piece-descriptions.astro`, `src/components/PiecePageLayout.astro` | 3 |
| 6. Seed | `src/data/seed.ts` or migration | 4, 5 |

**Lane A:** Step 1 → Step 2 (sequential, both in DB/RPC layer).
**Lane B:** Step 3 (can start in parallel with Lane A once Step 1 merges, since dual-write lets Slice A keep working).
**Lanes C + D:** Step 4 + Step 5 in parallel after Step 3 (different astro components + different admin pages; no module overlap except `ContributorContentAdmin.tsx` which is mature after Step 3). Minor conflict flag: both lanes add pages under `src/pages/admin/`; coordinate imports.
**Lane E:** Step 6 (fixtures) after C + D.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found (resolved) | 11 findings; 2 invalidated (briefing artifact); 6 surfaced to user as cross-model tensions (CM1–CM6), all resolved; 3 minor (ordering, bell anchor, denorm CHECK) folded in-plan |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 8 decisions taken (1A defer drop, 2A parameterized trigger, 3A omit recording column, 4A metadata audit, 5A extract admin component, 6A RPC-writes-body, 7A unsigned-strip-signed-essay, 8A full test depth) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **OUTSIDE VOICE:** Codex surfaced 6 substantive cross-model tensions (rollout safety, hard-delete cleanup, notification idempotency, metadata-bypasses-approval, UI CTA contradiction, ordering nondeterminism) that eng review missed. All 6 resolved via user AskUserQuestion decisions.
- **CROSS-MODEL:** Eng review independently flagged the metadata-audit gap (4A); Codex independently flagged the deeper metadata-bypasses-approval invariant (CM4). Same symptom, different depth — both applied.
- **UNRESOLVED:** 0
- **VERDICT:** ENG + CODEX CLEARED — ready for implementation in the 6-step rollout above. CEO + Design reviews optional; skip unless scope or visual surfaces shift materially before the first PR.
