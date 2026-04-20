# PLAN — Contributor approval pipeline, Slice C (Landmarks + Flags + PracticeNotes)

> **Status: draft. Awaiting `/plan-eng-review` + `/codex` challenge before implementation.**
> Reuses the state machine, versioning, RPC shape, bell, queue, admin, and digest from [PLAN-contributor-pipeline-slice-a.md](PLAN-contributor-pipeline-slice-a.md) and the polymorphic notifications + `ContributorContentAdmin` + subject-agnostic consumer pattern from [PLAN-contributor-pipeline-slice-b.md](PLAN-contributor-pipeline-slice-b.md). Read both first.

*Three more content types through the same pipeline, forming the densest information surface on the piece page. Includes the post-Slice-B cleanup (drop vestigial `notifications.performers_note_id` + remove dual-write) as Step 1. Materializes `movements` as a first-class Postgres entity so landmarks have a stable FK — Slice C can't ship without that spine.*

## 1. Scope and non-goals

**In scope.** Three content types added to the approval pipeline:

- **`Landmark`** — a named passage within a movement. Fields: `piece_id`, `movement_id`, `measure_start`, `measure_end`, `label` (house-style short phrase: "opening bariolage", "pedal-point climax"), `description` (optional one-sentence context), `ordinal` (display order within movement). Signed by the contributor who authored the interpretation of "this is the passage worth naming."
- **`Flag`** — a typed technical or musical challenge attached to a landmark. Fields: `landmark_id`, `type` (one of ten code-defined values — see §2.2), `severity` (`informational` | `notable` | `significant`), `instrument_specificity` (optional, array of instrument names; empty = applies to all). Signed by the contributor saying "this passage is hard in this way for me."
- **`PracticeNote`** — signed prose attached to a landmark, giving practice or interpretive guidance for that specific passage. Fields: `landmark_id`, `body` (short prose). Same signed-notes visual pattern as performer's notes.

All three reuse the Slice A state machine end-to-end: `draft → awaiting_contributor_approval → published → removed`. Versioning via parallel `*_versions` tables. Audit columns (`drafted_by`, `submitted_by`, `approved_by`, `rejected_by`, `retracted_by`, `removed_by` + timestamps). RLS on read. Security-definer RPCs on mutate.

**Iron rule carried from Slices A+B and restated for Slice C (project memory, 2026-04-20):**
Every subject type in the pipeline has two RPC families:
- `submit_*` — staff drafts for contributor review, creates a notification.
- `publish_contributor_*` — contributor authors directly, publishes immediately, no notification.

When the bylined contributor is the hands on the keyboard, authoring IS approval. Landmarks, flags, and practice notes all carry this dual path. There is no "editorially-owned" row that bypasses the pipeline — staff author landmarks for pieces a contributor hasn't touched yet, but the landmark still carries the staff user's byline until a contributor authors their own or co-signs via `approve_and_edit_*`.

**Also in scope:**
- **Post-Slice-B cleanup (Step 1 of rollout).** Drop the vestigial `notifications.performers_note_id` column. Strip dual-write branches from Slice A's submit RPCs. Slice B has had more than a week of live traffic by the time Slice C lands; the narrow FK is load-bearing only on backfilled rows that already have `(subject_table, subject_id)` populated.
- **Movements as a first-class entity (Step 2 of rollout).** New `public.movements` table with FK to `pieces`. Data migration seeds rows from existing `seed.ts` `movements[]` inline data. Gives landmarks a stable FK instead of an unreferenced `movement_index int`. Unblocks future features (per-movement difficulty, per-movement recordings, per-movement schools).
- **Piece-page Structural Landmarks section.** Movement-grouped cards with measure ranges, flag pills, signed practice notes inline. The densest surface on the piece page per PRD line 465. `<1s` cold-start on a three-year-old phone on cellular is the hard performance target (PRD line 461) — the landmarks section gates Tier 1 perf for the shared responsive page.
- **Subject-parameterized consumers.** `NotificationsQueue`, `NavbarBell` popover entries, daily digest Edge Function, and `ContributorContentAdmin` extend to render landmark + flag + practice-note drafts. One more iteration of the genericization that Slice B proved.
- **Admin pages.** Three new pages: `/admin/landmarks`, `/admin/flags`, `/admin/practice-notes`. Each mounts `ContributorContentAdmin` with a subject-type config.

**Non-goals.**
- **No new flag types.** The ten-value vocabulary is code-defined (§2.2). Adding an eleventh is a PRD revision, not an admin form.
- **No cross-instrument flag inheritance logic.** `instrument_specificity` is a simple string array; downstream UI respects it but does not propagate flags across "the cello part" of a chamber work.
- **No editorial-board review of landmarks.** Contributors only see their own queue, as in Slices A+B.
- **No landmark merging.** If two contributors author overlapping landmarks (both label measure 24–47 as "second-subject return"), both rows exist side-by-side. The plural-voices posture applies here as much as to schools.
- **No passage-comparison wiring to editions.** That's the edition-comparison TODO, P2, tracked separately.
- **No recordings-around-landmark-tempi wiring.** That requires a recordings entity which doesn't exist yet.
- **No realtime landmark-count badge.** Bell stays poll-only.
- **No `movements` UI management.** The movements table is seeded from `seed.ts` and edited there; no `/admin/movements` route.

---

## 2. Schema changes

Migration `supabase/migrations/20260427000000_contributor_pipeline_slice_c.sql` (single file, additive). A second RPC-only migration `20260427000001_contributor_pipeline_slice_c_rpcs.sql` holds the 31 new RPCs across three subjects (see §4).

The post-Slice-B cleanup ships as a separate earlier migration: `20260426000000_drop_vestigial_performers_note_id.sql` (Step 1 of rollout, not Slice C schema proper).

### 2.1 Post-Slice-B cleanup migration (Step 1, separate file)

```sql
-- 20260426000000_drop_vestigial_performers_note_id.sql

-- Drop the narrow FK kept vestigial during the Slice B polymorphic pivot window.
-- Every row already has (subject_table, subject_id) populated via the Slice B
-- backfill + dual-write; nothing reads performers_note_id in the app anymore.
alter table public.notifications
  drop column performers_note_id;
```

Application-layer cleanup (same PR):
- Remove dual-write branches from `submit_performers_note`, `update_performers_note_draft`, and any other Slice A RPC that inserted both `performers_note_id` and `(subject_table, subject_id)`. The shared `_insert_notification` helper (Slice B) already handles polymorphic-only inserts; just delete the vestigial branches.
- Grep-verify: `rg performers_note_id` returns zero hits in `src/` and `supabase/` after this step.

### 2.2 Flag vocabulary (code-defined enum)

```sql
create type public.flag_type as enum (
  'stamina',
  'bow_control',
  'stretch',
  'voicing',
  'double_stops',
  'sustained_bowing',
  'articulation',
  'rhythmic_lift',
  'intonation',
  'ensemble_coordination'
);

create type public.flag_severity as enum (
  'informational',
  'notable',
  'significant'
);
```

Any proposal to add an eleventh value goes through PRD revision + a migration `alter type flag_type add value '...'`. The plan enforces PRD invariant line 443: "A Flag type cannot be introduced without an editorial decision."

### 2.3 Movements table

```sql
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  ordinal smallint not null,                -- 1-based within the piece
  name text not null,                       -- e.g. "Prélude", "Sarabande"
  tempo_indication text,                    -- optional, e.g. "Adagio sostenuto"
  key_signature text,                       -- optional, e.g. "G major"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(piece_id, ordinal)
);

create index ix_movements_piece on public.movements(piece_id, ordinal);

alter table public.movements enable row level security;

create policy movements_select_public on public.movements
  for select to anon, authenticated using (true);

-- Mutations happen through the existing editorial-only path (seed + staff admin).
-- No contributor-facing movement editing in Slice C.
```

A data-migration step in the same file inserts one row per entry in each piece's seed `movements[]` array. Pieces without movements (Chaconne, Vox Balaenae) get a single movement row with `ordinal = 1` and `name = pieces.title` — this keeps downstream joins uniform without special-casing "piece-level" landmarks.

### 2.4 Landmarks table

```sql
create table public.landmarks (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  movement_id uuid not null references public.movements(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  measure_start integer not null,
  measure_end integer,                      -- null = single measure
  label text not null,                      -- house-style short phrase, <= 60 chars
  ordinal smallint not null default 0,      -- display order within movement
  status draft_status not null default 'draft',
  current_version_id uuid,                  -- composite FK wired after versions table
  drafted_by uuid references public.users(id),
  submitted_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  rejected_by uuid references public.users(id),
  retracted_by uuid references public.users(id),
  retracted_at timestamptz,
  removed_by uuid references public.users(id),
  removed_at timestamptz,
  approved_by_contributor_at timestamptz,
  metadata_updated_by uuid references public.users(id),  -- Slice B 4A pattern
  metadata_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (measure_end is null or measure_end >= measure_start),
  check (char_length(label) between 1 and 60)
);

create table public.landmark_versions (
  id uuid primary key default gen_random_uuid(),
  landmark_id uuid not null references public.landmarks(id) on delete cascade,
  piece_id text not null,
  movement_id uuid not null,
  contributor_id uuid not null,
  measure_start integer not null,
  measure_end integer,
  label text not null,
  description text,                         -- optional one-sentence context
  version_number integer not null,
  authored_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejection_note text,
  unique(landmark_id, version_number),
  unique(landmark_id, id)                    -- composite FK target
);

alter table public.landmarks
  add constraint fk_landmarks_current_version_matches
  foreign key (id, current_version_id)
  references public.landmark_versions(landmark_id, id)
  deferrable initially deferred;

create index ix_landmarks_movement_ordinal
  on public.landmarks(movement_id, ordinal)
  where status = 'published';

create index ix_landmarks_piece_published
  on public.landmarks(piece_id)
  where status = 'published';
```

RLS: public `select` on `status = 'published'`. Owner contributor + staff read all. No direct client insert/update — mutations flow through RPCs.

### 2.5 Flags table

```sql
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  landmark_id uuid not null references public.landmarks(id) on delete cascade,
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
  updated_at timestamptz not null default now()
);

create table public.flag_versions (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references public.flags(id) on delete cascade,
  landmark_id uuid not null,
  contributor_id uuid not null,
  type public.flag_type not null,
  severity public.flag_severity not null default 'notable',
  instrument_specificity text[] not null default '{}',
  version_number integer not null,
  authored_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejection_note text,
  unique(flag_id, version_number),
  unique(flag_id, id)
);

alter table public.flags
  add constraint fk_flags_current_version_matches
  foreign key (id, current_version_id)
  references public.flag_versions(flag_id, id)
  deferrable initially deferred;

create index ix_flags_landmark_published
  on public.flags(landmark_id)
  where status = 'published';
```

Flag state is small but mutable (a contributor may change their severity judgment after more practice). Versioning matches the Slice A/B pattern; `flag_type` is immutable across versions by convention (changing type = new flag, enforced at the RPC layer, not a DB constraint, because expressing "type cannot change across versions" in SQL is ugly and the RPC is the only mutator).

**Plural-voices invariant:** two contributors can each flag the same landmark with the same flag type and different severities. The UI renders both. There is no uniqueness constraint on `(landmark_id, contributor_id, type)` — removing it preserves the plural-voices ethos.

### 2.6 PracticeNotes table

```sql
create table public.practice_notes (
  id uuid primary key default gen_random_uuid(),
  landmark_id uuid not null references public.landmarks(id) on delete cascade,
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
  updated_at timestamptz not null default now()
);

create table public.practice_note_versions (
  id uuid primary key default gen_random_uuid(),
  practice_note_id uuid not null references public.practice_notes(id) on delete cascade,
  landmark_id uuid not null,
  contributor_id uuid not null,
  body text not null,
  version_number integer not null,
  authored_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejection_note text,
  unique(practice_note_id, version_number),
  unique(practice_note_id, id),
  check (char_length(body) between 1 and 4000)
);

alter table public.practice_notes
  add constraint fk_practice_notes_current_version_matches
  foreign key (id, current_version_id)
  references public.practice_note_versions(practice_note_id, id)
  deferrable initially deferred;

create index ix_practice_notes_landmark_published
  on public.practice_notes(landmark_id)
  where status = 'published';
```

### 2.7 Polymorphic notifications — add three subject tables

```sql
-- extend the CHECK to allow the three new subject_tables
alter table public.notifications
  drop constraint if exists notifications_subject_table_check;

alter table public.notifications
  add constraint notifications_subject_table_check
  check (subject_table in (
    'performers_notes',
    'interpretive_schools',
    'piece_descriptions',
    'landmarks',
    'flags',
    'practice_notes'
  ));
```

No changes to the partial unique index — `(subject_table, subject_id, type) where cleared_at is null` keeps the per-subject invariant uniformly.

### 2.8 Published-version views

One per subject, mirroring Slice A's `v_performers_note_versions_published`:

```sql
create view public.v_landmark_versions_published as
  select ln.*
  from public.landmarks l
  join public.landmark_versions ln
    on ln.landmark_id = l.id
   and ln.id = l.current_version_id
  where l.status = 'published';

-- analogous views for flags + practice_notes
create view public.v_flag_versions_published as ...;
create view public.v_practice_note_versions_published as ...;
```

Public `select` granted on all three; downstream pages read from these instead of joining the base tables.

---

## 3. State machine — unchanged

Identical to Slice A: `draft → awaiting_contributor_approval → published → removed`. All three new subject tables reuse the `draft_status` enum. No new states. No new transitions. The diagram in [PLAN-contributor-pipeline-slice-a.md](PLAN-contributor-pipeline-slice-a.md) §3 applies verbatim to landmarks, flags, and practice notes.

---

## 4. RPC surface

Thirty-one new RPCs across three subjects. Each subject gets the same ten core state-machine RPCs from Slice A (renamed for its subject). Landmarks gets an extra `update_landmark_ordinal` metadata RPC (Slice B 4A pattern, like schools' `tempo_cues`). Flags and practice notes have no non-versioned editable fields, so no metadata RPCs. The `clear_notification` + `clear_all_notifications` RPCs from Slice A are already subject-agnostic and do not need duplication.

### 4.1 Landmarks (11 RPCs: 10 state-machine + 1 metadata updater)

```
publish_contributor_landmark(p_piece_id text, p_movement_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text)
publish_contributor_landmark_edit(p_landmark_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text)
remove_landmark(p_landmark_id uuid)
create_landmark_draft(p_piece_id text, p_movement_id uuid, p_contributor_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text)
update_landmark_draft(p_landmark_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text)
submit_landmark(p_landmark_id uuid)
retract_landmark(p_landmark_id uuid)
approve_landmark(p_landmark_id uuid)
approve_and_edit_landmark(p_landmark_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text)
reject_landmark(p_landmark_id uuid, p_reason text default null)
update_landmark_ordinal(p_landmark_id uuid, p_ordinal smallint)   -- metadata-only, writes metadata_updated_by + metadata_updated_at, no new version
```

### 4.2 Flags (10 RPCs)

```
publish_contributor_flag(p_landmark_id uuid, p_type flag_type, p_severity flag_severity, p_instrument_specificity text[] default '{}')
publish_contributor_flag_edit(p_flag_id uuid, p_severity flag_severity, p_instrument_specificity text[])
remove_flag(p_flag_id uuid)
create_flag_draft(p_landmark_id uuid, p_contributor_id uuid, p_type flag_type, p_severity flag_severity, p_instrument_specificity text[] default '{}')
update_flag_draft(p_flag_id uuid, p_severity flag_severity, p_instrument_specificity text[])
submit_flag(p_flag_id uuid)
retract_flag(p_flag_id uuid)
approve_flag(p_flag_id uuid)
approve_and_edit_flag(p_flag_id uuid, p_severity flag_severity, p_instrument_specificity text[])
reject_flag(p_flag_id uuid, p_reason text default null)
```

Flag type is immutable across versions (see §2.5) — `publish_contributor_flag_edit` and `update_flag_draft` do not accept `p_type`. Changing the type means remove + create a new flag.

### 4.3 Practice notes (10 RPCs — identical signature shape to Slice A performers_notes)

```
publish_contributor_practice_note(p_landmark_id uuid, p_body text)
publish_contributor_practice_note_edit(p_practice_note_id uuid, p_body text)
remove_practice_note(p_practice_note_id uuid)
create_practice_note_draft(p_landmark_id uuid, p_contributor_id uuid, p_body text)
update_practice_note_draft(p_practice_note_id uuid, p_body text)
submit_practice_note(p_practice_note_id uuid)
retract_practice_note(p_practice_note_id uuid)
approve_practice_note(p_practice_note_id uuid)
approve_and_edit_practice_note(p_practice_note_id uuid, p_body text)
reject_practice_note(p_practice_note_id uuid, p_reason text default null)
```

### 4.4 Shared helpers (from Slice B)

`_insert_notification`, `_clear_notifications_for`, and the `_require_*` guard helpers (auth, ownership, status-at) are reused as-is. No changes needed to handle three new subject tables — they accept `subject_table text + subject_id uuid` and the CHECK in §2.7 governs validity.

### 4.5 Body-line writers

Each `submit_*` RPC writes a human-readable `notifications.body` line per eng-review 6A (digest reads verbatim, never interpolates):

- Landmarks: `'A draft landmark awaits your review: "' || p_label || '" (m. ' || p_measure_start || ')'`
- Flags: `'A draft flag awaits your review: ' || p_type || ' on "' || p_landmark_label || '"'`
- Practice notes: `'A draft practice note awaits your review on "' || p_landmark_label || '" (m. ' || p_measure_start || ')'`

The landmark label + measure are fetched inside the RPC via a join — one extra lookup, single-digit ms overhead, keeps the digest function dumb.

---

## 5. Component inventory

### 5.1 Refactors to existing components

- **`ContributorContentAdmin`** — add three new subject-type configs:
  - `landmarks` — piece + movement + contributor selectors, then measure_start, measure_end, label, description fields.
  - `flags` — landmark selector (piece → movement → landmark cascade), contributor, type (dropdown of enum values), severity (radio group), instrument_specificity (checkbox list).
  - `practice_notes` — landmark selector, contributor, body textarea.
- **`NotificationsQueue`** — subject-card renderer registry gains three entries. Each card shows the subject's current state as a contributor would see it when approved (landmark card shows measure range + label; flag card shows flag pill with severity; practice-note card shows signed-notes body). Action row matches Slice A (Approve / Edit and approve / Reject).
- **`NavbarBell` popover** — deep-link paths:
  - `landmarks` → `/piece/{piece_id}#landmark-{ordinal}`
  - `flags` → `/piece/{piece_id}#flag-{id}` (or landmark anchor; decide in Step 4)
  - `practice_notes` → `/piece/{piece_id}#practice-note-{id}`
- **`send-notification-digest` Edge Function** — add three subject-table branches to the subject-grouping loop. `notifications.body` is the single source for body text per subject (no per-subject templating).

### 5.2 New piece-page components

- **`src/components/StructuralLandmarks.tsx`** — React island. Fetches landmarks grouped by movement (SSR'd initial data, island for interactivity). Renders per movement: movement name + tempo indication, then ordered list of landmark cards. Each card: measure range, label, flag pills (severity color), signed practice notes inline in the DESIGN.md signed-notes pattern. Contributor sees Edit + Remove affordances on their own landmarks and practice notes, always-visible entry points to propose a new landmark or flag or practice note per movement.
- **`src/components/LandmarkCard.tsx`** — sub-component (or inline — size will decide). Renders one landmark row.
- **`src/lib/landmarks.ts`** — page-load reads (`fetchLandmarksForPiece(pieceId)` returns movement-grouped tree).
- **`src/lib/flags.ts`** — flag vocab + severity pill helpers.
- **`src/lib/practiceNotes.ts`** — practice-note reads.

### 5.3 Piece-page wiring (PiecePageLayout.astro)

Landmarks section currently renders an empty state. Replace with SSR'd `<StructuralLandmarks pieceId={...} initialData={...} />`. Section anchor `#structural-landmarks`.

Section order (PRD §Piece page surface):
1. Header + difficulty panel
2. Signed performer's notes
3. **Structural landmarks** (Slice C — the densest surface)
4. Interpretive schools
5. Unsigned + signed piece descriptions
6. Editions
7. Recordings
8. Pedagogical arc

Cold-start budget for landmarks: `<1s` on a three-year-old phone on cellular (PRD line 461). Implications:
- SSR the initial landmark tree inline in the HTML. No client-side fetch for the first paint.
- Movement-grouped tree query is one query joining landmarks + movements + flags + practice_notes, filtered by `status = 'published'`. Indexes in §2.3–2.6 make this O(landmarks-per-piece) on the read path.
- React island hydrates for interactivity but never for initial content.

---

## 6. Daily digest

Subject-agnostic work already done in Slice B Step 3. Three new `subject_table` values get three new entries in the subject-branch switch in `send-notification-digest/index.ts`. Body lines come from `notifications.body`. Link paths from §5.1.

No template changes. No per-subject HTML. The digest stays one email grouping all pending drafts across all six subject types for a given recipient.

---

## 7. Design touches

- **Flag pills.** Inline after the landmark label. Severity → color:
  - `informational` → neutral gray pill, `var(--color-border)` border.
  - `notable` → purple-tint pill, matches accent-subtle tokens.
  - `significant` → purple solid pill, matches accent token.
- **Instrument specificity.** Rendered parenthetically after the flag type pill when non-empty: `bow control (cello)`.
- **Landmark card.** Measure range in Inter tabular, label in Source Serif 4 italic, description in Source Serif 4 regular one-liner. 0.5px border, 16px vertical rhythm.
- **Practice notes inside landmarks.** Same signed-notes pattern as performer's notes — 2px purple left border, Source Serif 4 body, byline in Inter medium below with one-line bio.
- **Propose affordances (contributor signed in).** One per movement: "Add landmark →" at the bottom of the movement's list. Within a landmark: "Add flag →" and "Add practice note →" below the card. Buttons-vs-links rule (memory): these are navigational to an inline authoring surface, so they render as links, not buttons.
- **No meta-captions under section headings** (memory). Section heading "Structural landmarks" stands alone.

---

## 8. Edge cases

- **Landmark measure range zero-length.** `measure_start = measure_end` allowed; CHECK in §2.4 rejects `measure_end < measure_start`.
- **Landmark on a piece without movements (e.g. Bach Chaconne in the current catalog).** Data migration creates a `(piece, ordinal=1, name=title)` movement row for every such piece so the FK constraint stays uniform. No special-case code paths in `StructuralLandmarks.tsx`.
- **Flag type on a landmark that later has its movement reassigned.** Permitted by schema. If a staff admin moves a landmark across movements, flags + practice notes follow via FK.
- **Contributor removes a landmark with published practice notes attached.** FK cascade on `practice_notes.landmark_id` drops them. Adds a pre-remove warning in the UI: "This landmark has N practice notes from M contributors. Removing the landmark removes them too." Contributor has to confirm.
- **Flag with empty `instrument_specificity` on a solo piece.** Default '{}' renders as "applies to everyone" which for a solo cello piece is trivially the cellist. UI does not render the specificity suffix when empty.
- **Staff drafts a landmark but no contributor exists yet.** Creates a draft with the creating staff user as `contributor_id`. Staff user has to be `is_contributor = true` or the RPC rejects. (Future: a "house landmark" byline — out of scope for Slice C.)
- **Two contributors authoring same-label landmarks on the same measure range.** Both rows exist. `ordinal` determines display order; tie-break by `approved_at ASC`.
- **Orphaned versions on reject.** `reject_*` RPC keeps the rejected version row (`rejection_note` preserved). Status returns to `draft`. Re-edit creates a new version; history preserved.
- **Notification for a draft whose landmark was deleted.** FK from notifications to subjects is polymorphic — no cascade. `_clear_notifications_for(subject_table, subject_id)` fires on any terminal transition (remove / reject-to-draft / retract), closing this loop.

---

## 9. Testing

- **New integration test files** (target: +45 tests, queue total ~123):
  - `src/integration/landmarks.test.ts` (~18 tests — state machine, versioning, RLS, contributor-self-publish path, ordinal updates via metadata RPC, plural-voices invariant)
  - `src/integration/flags.test.ts` (~15 tests — type immutability, severity edits, instrument_specificity array handling, plural-voices on same landmark, cascade on landmark removal)
  - `src/integration/practiceNotes.test.ts` (~10 tests — state machine clone of performer's notes, landmark-attachment, cascade behavior)
  - `src/integration/movements.test.ts` (~5 tests — data migration integrity, FK cascade from pieces, RLS allows public read)
  - `src/integration/sliceBCleanup.test.ts` (~3 tests — post-drop regression: bell/queue/digest still work with `performers_note_id` column gone, dual-write logic removed)
- **Extend `queueMixedSubjects.test.ts`** from Slice B — add landmark, flag, and practice-note drafts to the mixed-subject rendering cases.
- **New unit tests** — flag severity pill color resolver, movement-grouping helper in `src/lib/landmarks.ts`, landmark-tree SSR snapshot.
- **Manual QA checklist** (pre-merge):
  - Cold-start on throttled mobile profile: landmarks visible `<1s`. Use `/browse` skill with network throttling.
  - Create-draft → contributor approves → renders. Per subject.
  - Contributor self-publishes → renders immediately, no queue card. Per subject.
  - Staff draft on a landmark that doesn't exist yet (requires landmark draft to reference a real `movement_id`).

---

## 10. Migration plan / rollout

Each step mergeable on its own; each passes tests and does not regress production.

1. **Post-Slice-B cleanup.** Migration `20260426000000_drop_vestigial_performers_note_id.sql`. App-layer cleanup of dual-write branches in Slice A RPCs. Grep-verify zero hits. No UI changes. One week of live Slice B traffic is prerequisite.
2. **Movements table + data migration.** New migration, new `public.movements` table, data migration seeds one row per movement across all 18 pieces. Existing `StructuralLandmarks` empty-state renders unchanged. `fetchMovementsForPiece` helper lands but nothing consumes it yet.
3. **Slice C schema (landmarks + flags + practice_notes + notifications CHECK extension).** Migration `20260427000000_contributor_pipeline_slice_c.sql`. Views land. No RPCs, no UI.
4. **RPC families (31 RPCs, 3 subjects).** Migration `20260427000001_contributor_pipeline_slice_c_rpcs.sql`. Unit + RLS tests for all three subjects. Verifiable via `curl` / integration tests; no UI.
5. **Queue + digest extend to three new subjects.** `NotificationsQueue` gains landmark + flag + practice-note card renderers. Digest function's subject-branch switch extends. Mixed-subject queue tests updated.
6. **Landmarks admin + landmarks piece-page section (MVP).** `/admin/landmarks`, `StructuralLandmarks.tsx` with landmark rendering only (no flags or practice notes yet), SSR'd inline for `<1s` cold-start. Movement-grouped.
7. **Flags admin + flag pills on landmarks.** `/admin/flags`, flag pills render in landmark cards on the piece page. Flag severity colors. Instrument specificity suffix.
8. **Practice notes admin + inline practice notes on landmarks.** `/admin/practice-notes`, practice notes render inline within landmark cards using the DESIGN.md signed-notes pattern.
9. **Seed fixtures.** Draft at least two landmarks, three flags, and two practice notes for the Bach Suite No. 1 Prélude in the dev fixture so the piece page has meaningful landmarks section data immediately after running migrations.

---

## 11. Decisions deliberately NOT taken for Slice C

- **No contributor-editable flag vocabulary.** The ten values are an enum, not a lookup table. PRD invariant 443 blesses this.
- **No flag type changes across versions.** To change a flag's type, remove and re-create. Expressing "type is immutable" in SQL is ugly; enforced at the RPC layer.
- **No per-movement difficulty axes.** The four-axis difficulty panel stays piece-level. Per-movement difficulty is a separate design conversation.
- **No landmark-level tempo cues.** The `movements.tempo_indication` column is the only tempo surface in Slice C. Landmark-level tempo belongs with the recordings entity once that lands.
- **No `/admin/movements`.** Movements are editorial-owned and managed via `seed.ts`. Adding a UI is extra scope without a user ask.
- **No landmark ordinal auto-reshuffle.** Moving landmark A above landmark B via `update_landmark_ordinal` does not renumber sibling ordinals. Ordinals are sparse ints; conflicts handled by tie-breaking on `approved_at ASC`. Re-numbering utility is a P3 follow-up if ordinals get crowded.
- **No inline flag severity editing from the piece page.** Severity is edited via the admin or through the `publish_contributor_flag_edit` path, which lands the user on a minimal edit surface. Avoids misclicks on a high-information-density surface.
- **No cross-contributor landmark co-authoring.** Two contributors authoring the same passage create two landmark rows; they do not merge. Same plural-voices principle as schools.
- **No realtime landmark-count badges or collab indicators.** Bell stays poll-only.
- **No AI-drafted landmarks.** Staff drafts for contributor review are the only non-contributor authoring path. AI-assisted drafting is out of scope.

---

## 12. Open questions

- **Movement resolution for pieces that feel structurally different from `movements[]` in seed.** Bach Chaconne is "one movement" yet 64 variations. Do we materialize variations as sub-movements? Default: no — one `movements` row for the Chaconne, landmarks use `measure_start/end` to name variation blocks.
- **Flag pills on the landing page?** The "In Focus" block shows a recently approved signed work. If a significant flag lands on a high-profile landmark, does it bubble up? Default: no in Slice C. Revisit after landmarks section is live.
- **`<1s` cold-start budget with flags + practice notes.** The full tree (landmarks → flags → practice notes) grows. If the Bach Suite No. 1 Prélude ends up with 20 landmarks, 60 flags, 40 practice notes, the SSR'd HTML gets heavy. Measure before shipping; lazy-load practice-note bodies below-the-fold if needed.
- **Notification type extensibility.** Enum `notification_type` has one value (`draft_awaiting_approval`). Still fine in Slice C. `alter type add value` path open for later.
- **Digest grouping inside a subject.** Recipient has 5 landmark drafts + 2 practice-note drafts. Current Slice B digest: one bullet per notification, grouped by subject table. Acceptable vs batch summary? Default: keep the per-notification bullet — the queue is the precision surface.
- **Flag severity defaults.** Should `create_flag_draft` default severity to `notable`? Current §2.5 defaults to `notable` at the DB level. Revisit if staff find the default wrong in practice.
- **Landmark label character budget.** 60 chars from §2.4 is a guess. PRD examples ("opening bariolage", "pedal-point climax") are under 25. Monitor for labels that hit the limit.

---

## 13. Parallelization strategy

Implementation lanes for worktree parallelization:

| Step | Modules touched | Depends on |
|------|----------------|------------|
| 1. Slice B cleanup | `supabase/migrations/`, Slice A submit RPCs, `src/lib/*.ts` grep-sweep | Slice B in production 1 week+ |
| 2. Movements table + data migration | `supabase/migrations/`, `src/lib/movements.ts` | 1 |
| 3. Slice C schema + notifications CHECK | `supabase/migrations/` | 2 |
| 4. RPCs (31 across 3 subjects) | `supabase/migrations/` (new RPCs file), `src/lib/*` helper types | 3 |
| 5. Queue + digest extend | `src/components/NotificationsQueue.tsx`, `src/components/admin/ContributorContentAdmin.tsx`, `supabase/functions/send-notification-digest/index.ts` | 4 |
| 6. Landmarks admin + landmarks piece-page (MVP) | `src/pages/admin/landmarks.astro`, `src/components/StructuralLandmarks.tsx`, `src/components/PiecePageLayout.astro` | 5 |
| 7. Flags admin + flag pills | `src/pages/admin/flags.astro`, `StructuralLandmarks.tsx` (flag pill integration) | 6 |
| 8. Practice-notes admin + inline practice notes | `src/pages/admin/practice-notes.astro`, `StructuralLandmarks.tsx` (practice-note integration) | 6 |
| 9. Seed fixtures | `scripts/seed-local-queue.ts` | 7, 8 |

**Parallelization lanes:**
- **Lane A (sequential):** Steps 1 → 2 → 3 → 4. Schema + RPC foundation.
- **Lane B (after 4):** Step 5. Queue + digest can extend in parallel with schema/RPCs landing as long as Step 5 merges after Step 4.
- **Lanes C + D (after 5 + 6):** Step 7 (flags) and Step 8 (practice notes) can run in parallel in separate worktrees. Both edit `StructuralLandmarks.tsx` at different integration points (pill row vs. inline notes sub-component); careful merges expected. Consider squashing them into a single step if the conflicts prove nasty.
- **Lane E:** Step 9 (fixtures) after C + D.

Total: 9 rollout PRs. Historical precedent: Slice A was 8, Slice B was 6. Slice C is the largest slice — the landmark + flag + practice-note triad forms the densest surface on the piece page per PRD, and Step 1 (post-Slice-B cleanup) carries its own migration.

---

## 14. GSTACK REVIEW REPORT

_To be populated by `/plan-eng-review` and `/codex challenge` before implementation starts. Expected runs:_

| Reviewer | Status | Findings | Verdict |
|----------|--------|----------|---------|
| plan-eng-review | pending | — | — |
| codex challenge | pending | — | — |
| plan-ceo-review | pending | — | — |
| plan-design-review | pending | — | — |

**Gates before Step 1 lands:** plan-eng-review + codex challenge both clear. Slice A and B precedent — no code writes until two independent reviewers sign the plan.
