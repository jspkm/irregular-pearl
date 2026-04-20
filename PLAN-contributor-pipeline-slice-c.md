<!-- /autoplan restore point: /Users/jspkm/.gstack/projects/jspkm-irregular-pearl/plan-contributor-pipeline-slice-c-autoplan-restore-20260420-104436.md -->
# PLAN — Contributor approval pipeline, Slice C (Landmark packets + universal voting + wiki movements)

> **Status: Revision 2. CEO premise gate passed via `/autoplan` on 2026-04-20 after outside-voice consensus challenged the original three-subject decomposition and plural-structural-data-without-ranking. Premises resolved below. Phase 2 (Design) + Phase 3 (Eng) reviews pending against this revision.**
>
> Reuses the state machine, versioning, RPC shape, bell, queue, admin, and digest from [PLAN-contributor-pipeline-slice-a.md](PLAN-contributor-pipeline-slice-a.md) and the polymorphic notifications + `ContributorContentAdmin` + subject-agnostic consumer pattern from [PLAN-contributor-pipeline-slice-b.md](PLAN-contributor-pipeline-slice-b.md). Read both first.

*Landmarks ship as an aggregate subject (landmark + nested flags + nested practice notes, versioned together, approved as a bundle). Universal voting lands in the same slice — thumbs up/down from authenticated users, zero public count display, votes drive stacking order for every signed-content type (Slices A+B+C). Movements become wiki-edit — any registered user edits in place, version history + revert. Includes the post-Slice-B cleanup as Step 1.*

## 0. Revision history

- **Rev 1 (2026-04-20):** Three parallel subject types (landmarks / flags / practice notes), movements materialized as editorial-only table, 31 RPCs, 9 rollout steps.
- **Rev 2 (2026-04-20, this doc):** CEO premise gate surfaced consensus concerns from both outside voices. Three premise changes + two governance clarifications applied by user:
  1. Decomposition → LandmarkPacket aggregate (one subject, nested children, versioned together). Cuts RPC count roughly in half.
  2. Plural signed content → voting + stacking added as a new universal layer (not just Slice C). Thumbs up/down, auth-gated, **no public count display**, internal tallies drive stacking order.
  3. Movements → wiki-edit governance (any registered user edits in place). Replaces the editorially-owned + /admin/movements debate. New governance mode in the app.
  4. **Any registered user === Contributor** for authoring, voting, wiki-editing. `is_contributor` column becomes vestigial.
  5. **Approval queue's only purpose is byline-owner consent** when User A drafts for User B. Not editorial gatekeeping.
  6. **Draft-for-another-user is drafter-role-gated (not draftee-role-gated).** Only admins and firstchairs can draft for other users. Draftees are any role. Regular users can always author their own content; they cannot draft for others.
- Original plan preserved at `/Users/jspkm/.gstack/projects/jspkm-irregular-pearl/plan-contributor-pipeline-slice-c-autoplan-restore-20260420-104436.md`.

## 1. Scope and non-goals

### 1.0 Governance model clarification (2026-04-20, project-level)

Three user clarifications that tighten the whole plan:

- **Any registered user === Contributor.** There is no "staff vs contributor" distinction for *authoring your own content*, voting, or wiki-editing movements. Everyone who signs up can do those. The `is_contributor` column on `users` becomes vestigial (follow-up cleanup); the existing `role` column (`user`/`firstchair`/`admin` — landed in migrations 20260331000000 + 20260331100000) is the authoritative gate where gating matters.
- **The approval queue exists solely for byline-owner consent when User A drafts for User B.** User A writes a draft intended to appear under User B's byline. User B reviews and approves (publishes under B), approves-and-edits (B's edited version publishes under B), or rejects. That's it. When a user drafts for themselves, authoring IS approval — published immediately, no queue.
- **The draft-for-another-user flow is drafter-role-gated, not draftee-role-gated.** Only users with role `admin` or `firstchair` can create drafts intended for another user's byline. The draftee can be ANY registered user (any role — `user`, `firstchair`, or `admin`). The model: admins and firstchairs are the editorial capacity; they draft content and ask community members (any role) to review and publish under the community member's byline. Regular `user`-role accounts cannot draft for others but can be drafted FOR, and always can author their own content.

**Implication for RPC auth:**
- `publish_contributor_*` RPCs: any authenticated user can call for their own content. No role check beyond `auth.uid() IS NOT NULL`.
- `create_*_draft(p_contributor_id=B)` RPCs: require `auth.uid() IS NOT NULL` AND **caller (`auth.uid()`) has role `admin` or `firstchair`**. Target user B can be any role. If caller is a regular `user`-role, the RPC rejects.
- All submit/retract/update-draft RPCs: caller must retain admin/firstchair role at call time (`_require_drafter_role` reads live `public.users.role`, never trusts JWT). If the original drafter is demoted mid-draft, the draft is NOT stranded: any other admin/firstchair can take over via `takeover_draft(p_subject_table, p_subject_id)` which updates `drafted_by` to the new caller and lets them edit/submit/retract going forward. Alternatively, an admin can delete the stranded draft outright. Takeover RPC lands in Slice C Step 7 with the landmark RPC family and retroactively applies to Slice A+B subjects too.
- Wiki-edit + voting: any authenticated user.

**Implication for Slice A+B surfaces:**
- Existing `/admin/performers-notes`, `/admin/interpretive-schools`, `/admin/piece-descriptions` are accessible only to users with role `admin` or `firstchair`. Regular users visiting the route see a "You need admin or firstchair role to draft for others — want to author your own content? [Piece page link]" redirect.
- The contributor-target picker shows ALL users (any role). This is the content's future byline owner.
- No Haji role change needed — she stays `user` role; admins/firstchairs draft for her as before.

**In scope.**

### 1.1 Landmark aggregate (one signed subject, nested children)

A `Landmark` is a single signed contribution anchored to a piece + movement + measure range. Fields on the landmark itself: `label` (house-style short phrase, ≤60 chars), `description` (optional one-sentence context), `measure_start`, `measure_end` (null for single measure), `ordinal`. Nested inside the same landmark row's versioned payload:

- **`flags[]`** — zero or more typed challenge pills. Each entry: `type` (one of ten code-defined values — see §2.2), `severity` (`informational` | `notable` | `significant`), `instrument_specificity` (optional string array; empty = applies to all).
- **`practice_notes[]`** — zero or more prose annotations. Each entry: `body` (short signed prose, ≤4000 chars).

Versioning covers the full tree. Any edit (change the label, add a flag, remove a practice note, bump a severity) creates a new landmark version carrying the whole updated payload. Approving a landmark approves its current children atomically — no separate flag approval, no separate practice-note approval.

**Cross-user attachment.** User C who wants to add their own flag or practice note to a landmark authored by User H does NOT mutate H's landmark. C creates their OWN sibling landmark at the same measure range (via `publish_contributor_landmark`), with the flag/practice-note payload C wants to contribute. The voting+stacking UI (§1.3) renders the sibling landmarks as a stack anchored to the measure range — the user sees the top-voted representation first and can cycle.

This keeps plural-voices semantics clean: every signed opinion belongs to its author. No shared mutation. Stacking resolves the rendering question.

**Draft-for-another-user path (drafter role required).** User C (an admin or firstchair) drafts content intended for User H's byline via `create_landmark_draft(p_contributor_id=H)`. User H can be any role (user, firstchair, admin). The draft routes through H's approval queue, where H reviews and either approves (publishes under H's byline), approves-and-edits (H's edited version publishes under H's byline), or rejects (back to draft with H's note).

If the caller is a regular `user`-role, `create_landmark_draft` is rejected at the RPC layer. Regular users can still author their own landmarks via `publish_contributor_landmark` — just can't draft for others. The draft-for UI surface is only accessible to admin/firstchair; regular users never see a target picker.

### 1.2 Voting — universal, asymmetric, no public counts

A new `votes` subject-agnostic table applies to every signed-content type already in the product, not just Slice C:

- Subjects voted on: `performers_notes`, `interpretive_schools`, `piece_descriptions`, `landmarks`. (Not notifications; not flags or practice notes individually — those belong to their parent landmark, so the landmark aggregate is the vote anchor.)
- Votes: `+1` (up) or `-1` (down). One vote per `(user_id, subject_table, subject_id)` pair, idempotent on re-vote (upsert).
- Auth-gated: authenticated users only. Contributors can vote on their own content (own-upvote tracked but doesn't bias stacking — prevented at query layer).
- **Display rule:** the UI shows the thumbs affordance + the user's own current vote state (highlighted when they've voted). **No vote counts, no tallies, no scoreboards are ever rendered.** Counts exist internally to compute stacking order and are exposed in analytics + admin audit only.
- Asymmetric retention: upvotes and downvotes are stored identically in the votes table, but aggregate materialized views for stacking use `sum(vote_value)` where upvotes count and downvotes penalize — both contribute to order, neither is publicly visible.

### 1.3 Stacking — visual resolution for plural contributions

When two or more signed-content rows share the same anchor (same piece for performer's notes; same landmark measure range for landmark-aggregates), render as a visual **stack**, not a flat list. Top of stack: the row with highest net-score (ups minus downs, ties broken by `approved_at ASC`). Below-the-fold stack members: accessible via a click/cycle affordance (arrow or small cycle button). Entire stack is discoverable; user rank-orders by engaging.

Stacking affordance is a NEW universal UI pattern — applies to the piece-page performer's notes section (currently renders a flat list), schools section, signed descriptions section, and the new landmark aggregate section. Slice C ships the pattern across all four.

### 1.4 Wiki-edit movements

Movements are editorial scaffolding that describe piece structure (movement ordinal, name, optional tempo indication, optional key signature). Slice C materializes them as a first-class Postgres entity AND exposes an **in-place wiki-edit surface**: any registered user can edit a movement's name / tempo / key / ordinal directly. No approval queue. No signed byline. Version history preserved. Any registered user can revert to a prior version.

Why wiki-edit not contributor-pipeline: movements are structural facts (the Bach Suite No. 1 Prélude IS the first movement), not interpretive judgments. If someone mis-types a movement name, the cheapest correction path is "let the next user fix it" — community self-heal. Byline is noise on this data class.

This introduces a **third governance mode** to the app:
- **contributor-signed** (Slices A+B+C signed content) — byline, approval queue for staff drafts, votes + stacking.
- **editorially-owned** (piece metadata, catalog entries, flag type vocabulary) — staff only, edited via seed or migrations.
- **wiki-edit** (movements — new in Slice C) — any registered user, in-place, version history, revert.

### 1.5 Piece-page Structural Landmarks section

The densest surface on the piece page per PRD line 465. Movement-grouped cards. Each card renders a landmark aggregate: measure range, label, flag pills inline, signed practice notes inline in the DESIGN.md signed-notes pattern. Stacking when multiple contributors have landmarks at the same (or overlapping) measure range. `<1s` cold-start on a three-year-old phone on cellular is the hard performance target (PRD line 461).

### 1.6 Subject-parameterized consumers

`NotificationsQueue`, `NavbarBell` popover entries, daily digest Edge Function, and `ContributorContentAdmin` extend to render the landmark aggregate subject. (Flags + practice notes are NOT subject types for the queue — they're children of landmarks.) The new `votes` table does NOT flow through the notification system — voting is silent. Movement edits also do NOT flow through notifications.

### 1.7 Post-Slice-B cleanup + governance alignment (Step 1)

Three cleanups ship together as Step 1:

1. **Drop vestigial FK.** `notifications.performers_note_id` column + dual-write branches from Slice A's submit RPCs. Slice B has had ≥1 week live traffic.
2. **Align `/admin/*` gating with drafter-role rule.** Existing `/admin/performers-notes`, `/admin/interpretive-schools`, `/admin/piece-descriptions` pages gated on `users.role IN ('admin', 'firstchair')` for the caller. The RPCs they call (`create_*_draft`, `update_*_draft`, `submit_*`, `retract_*`) replace the `is_contributor` check with the **drafter-role gate**: caller must have role `admin` or `firstchair`. The target picker shows all users (any role).
3. **Admin/firstchair seed audit.** Verify at least one user has role `admin` or `firstchair` in production; if not, production drafting surface is non-functional. Does not block this migration — just a pre-deploy checklist item.

Optional URL rename `/admin/*` → `/draft-for/*` is deferred.

**Non-goals.**
- **No separate flag or practice-note subject types.** Children of landmark aggregate. Cross-contributor attachment via sibling landmarks.
- **No vote count display, ever.** Internal-only. Users see their own vote state, that's it.
- **Anonymous voting — out of scope.** Auth-gated.
- **No vote retraction flow beyond re-vote-to-toggle.** User votes up → clicks thumb up again → vote cleared. Simple idempotent upsert.
- **No new flag types beyond the ten PRD values.** PRD invariant 443.
- **No editorial review of wiki movement edits.** Community self-heal via revert.
- **No movement merge across pieces.** Each movement belongs to exactly one piece (FK cascade).
- **No AI-assisted landmark drafting.** Staff drafts + contributor self-authoring are the two paths.
- **No realtime landmark or vote subscriptions.** Bell stays poll-only.
- **No landmark-level tempo cues.** `movements.tempo_indication` is the tempo surface.
- **No passage-comparison wiring to editions.** Tracked separately.
- **No recordings-around-landmark-tempi.** Requires recordings entity.

---

## 2. Schema changes

Three migrations:

1. `20260426000000_drop_vestigial_performers_note_id.sql` (post-Slice-B cleanup — separate file, Step 1 of rollout)
2. `20260427000000_contributor_pipeline_slice_c.sql` (movements with versioning, landmark aggregate tables, votes)
3. `20260427000001_contributor_pipeline_slice_c_rpcs.sql` (all new RPCs)

### 2.1 Post-Slice-B cleanup migration — ordered atomic

The migration `20260426000000_drop_vestigial_performers_note_id.sql` must run in strict order within a single transaction. Dropping the column first would break existing `_insert_notification` / `_clear_notifications_for` / `submit_performers_note` definitions that still reference `performers_note_id` (per `supabase/migrations/20260422000000_contributor_pipeline_slice_b_rpcs.sql:62,105`). Order:

```sql
begin;

-- Step 1a: Rewrite _insert_notification to drop the vestigial param + dual-write branch.
create or replace function public._insert_notification(
  p_recipient_id uuid,
  p_subject_table text,
  p_subject_id uuid,
  p_type public.notification_type,
  p_body text,
  p_piece_id text default null
) returns void language plpgsql security definer as $$
begin
  insert into public.notifications (
    recipient_id, subject_table, subject_id, type, body, piece_id, created_at
  ) values (
    p_recipient_id, p_subject_table, p_subject_id, p_type, p_body, p_piece_id, now()
  )
  on conflict (subject_table, subject_id, type) where cleared_at is null
  do nothing;
end; $$;

-- Step 1b: Rewrite _clear_notifications_for to match (drop vestigial param if present).
-- (Exact body depends on current signature — grep and adapt.)

-- Step 1c: Rewrite all caller RPCs (submit_performers_note, submit_interpretive_school, submit_piece_description,
-- update_performers_note_draft, and any others that passed performers_note_id) to drop that argument.
-- Preserve their call signatures for external callers by keeping parameter names stable where possible.

-- Step 1d: Verify no function body still references performers_note_id.
--   (Guard: SELECT count(*) FROM pg_proc WHERE prosrc LIKE '%performers_note_id%'; MUST be 0.)

-- Step 1e: Drop the column.
alter table public.notifications
  drop column performers_note_id;

-- Step 1f: App-layer cleanup in the same PR.
-- src/lib/*.ts + src/components/**/*.tsx: rg performers_note_id must return zero hits.
-- CI grep gate enforces.

commit;
```

Additional in-PR cleanups:
- Strip dual-write branches from any Slice A RPC that inserted both `performers_note_id` and `(subject_table, subject_id)`.
- Update `src/components/NotificationsQueue.tsx` and any bell or digest code paths that still reference the column.
- Grep-verify: `rg performers_note_id` returns zero hits in `src/` and `supabase/` after this step. Gate in CI.

Integration test: after the migration, every Slice A end-to-end flow still passes (submit → approve → queue → digest). If a Slice A test fails, the RPC rewrite in Step 1c missed a caller.

### 2.2 Flag vocabulary (code-defined enum)

```sql
create type public.flag_type as enum (
  'stamina', 'bow_control', 'stretch', 'voicing', 'double_stops',
  'sustained_bowing', 'articulation', 'rhythmic_lift', 'intonation', 'ensemble_coordination'
);

create type public.flag_severity as enum (
  'informational', 'notable', 'significant'
);
```

### 2.3 Movements (wiki-edit entity with version history)

```sql
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  ordinal smallint not null,
  name text not null,
  tempo_indication text,
  key_signature text,
  current_version_id uuid,                  -- composite FK, wired after movement_versions
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(piece_id, ordinal)
);

create table public.movement_versions (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null references public.movements(id) on delete cascade,
  piece_id text not null,
  ordinal smallint not null,
  name text not null,
  tempo_indication text,
  key_signature text,
  version_number integer not null,
  authored_by uuid not null references public.users(id),  -- every wiki edit signed in the audit trail
  created_at timestamptz not null default now(),
  edit_summary text,                        -- optional short note, "fixed typo in Sarabande"
  reverted_from_version_id uuid,            -- set when this version is a revert to an earlier one
  unique(movement_id, version_number),
  unique(movement_id, id)
);

alter table public.movements
  add constraint fk_movements_current_version_matches
  foreign key (id, current_version_id)
  references public.movement_versions(movement_id, id)
  deferrable initially deferred;

create index ix_movements_piece on public.movements(piece_id, ordinal);
```

RLS: public `select` on both. `authenticated` users can write via RPCs (`update_movement`, `revert_movement`). Seed + data migration pre-populates one `movements` row per entry in each piece's inline `movements[]` array, plus a synthetic `(piece, ordinal=1, name=title)` row for pieces without movements (Bach Chaconne). Every initial row carries a corresponding `movement_versions` row with `version_number=1`, `authored_by` = a system seed user (new — see §2.7).

### 2.4 Landmark aggregate + versions

```sql
create table public.landmarks (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  movement_id uuid not null references public.movements(id) on delete cascade,
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

create table public.landmark_versions (
  id uuid primary key default gen_random_uuid(),
  landmark_id uuid not null references public.landmarks(id) on delete cascade,
  piece_id text not null,
  movement_id uuid not null,
  contributor_id uuid not null,
  measure_start integer not null,
  measure_end integer,
  label text not null,
  description text,
  ordinal smallint not null default 0,
  flags jsonb not null default '[]',        -- array of {type, severity, instrument_specificity} objects
  practice_notes jsonb not null default '[]', -- array of {body} objects
  version_number integer not null,
  authored_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejection_note text,
  unique(landmark_id, version_number),
  unique(landmark_id, id),
  check (measure_end is null or measure_end >= measure_start),
  check (char_length(label) between 1 and 60),
  check (jsonb_typeof(flags) = 'array' and jsonb_array_length(flags) <= 20),
  check (jsonb_typeof(practice_notes) = 'array' and jsonb_array_length(practice_notes) <= 10)
);

alter table public.landmarks
  add constraint fk_landmarks_current_version_matches
  foreign key (id, current_version_id)
  references public.landmark_versions(landmark_id, id)
  deferrable initially deferred;

create index ix_landmarks_movement_published
  on public.landmarks(movement_id)
  where status = 'published';

create index ix_landmarks_piece_published
  on public.landmarks(piece_id)
  where status = 'published';
```

Flags + practice_notes as JSONB arrays inside the versioned payload: they have no independent identity or lifecycle. A flag only exists inside its parent landmark version. This is the LandmarkPacket aggregate pattern — one row to approve, one row to publish, one row to remove. The JSONB shape is validated by the CHECK constraints (max 20 flags, max 10 practice notes per landmark — generous ceilings).

**Why JSONB and not child tables:** child tables would add FK cascade complexity, versioning coordination ("which flag belongs to which landmark version?"), and duplicate the landmark aggregate across 3 tables. JSONB keeps the aggregate atomic at the cost of losing per-flag/per-practice-note query ability. That tradeoff is fine because flags + practice notes are always read in the context of their parent landmark anyway.

Individual flag or practice-note fields inside the JSONB are validated at the RPC layer (type must be a valid `flag_type` enum value; severity must be a valid `flag_severity`; body length ≤ 4000; etc.).

### 2.5 Votes (universal subject-agnostic, trigger-maintained tallies, no materialized view)

Rev 4 eng review flagged the materialized view approach as critical: `refresh concurrently` on every vote doesn't scale past modest concurrency, and `vote_aggregates`-as-table has no RLS (only GRANT), which forces a decision about public-inspectable counts. Rev 5 replaces the view with a trigger-maintained tally table: O(1) per vote, private by default, same read-path shape.

```sql
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject_table text not null,
  subject_id uuid not null,
  vote_value smallint not null,             -- -1 or +1
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, subject_table, subject_id),
  check (vote_value in (-1, 1)),
  check (subject_table in (
    'performers_notes', 'interpretive_schools', 'piece_descriptions', 'landmarks'
  ))
);

create index ix_votes_subject on public.votes(subject_table, subject_id);
create index ix_votes_user on public.votes(user_id);

-- Trigger-maintained tally (O(1) per vote, no thundering-herd refresh).
create table public.vote_tallies (
  subject_table text not null,
  subject_id uuid not null,
  net_score integer not null default 0,
  up_count integer not null default 0,
  down_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (subject_table, subject_id)
);

create or replace function public._apply_vote_delta() returns trigger
  language plpgsql security definer as $$
declare
  _delta_net integer := 0;
  _delta_up integer := 0;
  _delta_down integer := 0;
begin
  if TG_OP = 'INSERT' then
    _delta_net := NEW.vote_value;
    _delta_up := case when NEW.vote_value = 1 then 1 else 0 end;
    _delta_down := case when NEW.vote_value = -1 then 1 else 0 end;
    insert into public.vote_tallies (subject_table, subject_id, net_score, up_count, down_count, updated_at)
      values (NEW.subject_table, NEW.subject_id, _delta_net, _delta_up, _delta_down, now())
      on conflict (subject_table, subject_id) do update
        set net_score = vote_tallies.net_score + _delta_net,
            up_count  = vote_tallies.up_count + _delta_up,
            down_count = vote_tallies.down_count + _delta_down,
            updated_at = now();
  elsif TG_OP = 'UPDATE' and OLD.vote_value != NEW.vote_value then
    _delta_net := NEW.vote_value - OLD.vote_value;
    _delta_up  := (case when NEW.vote_value = 1 then 1 else 0 end) - (case when OLD.vote_value = 1 then 1 else 0 end);
    _delta_down := (case when NEW.vote_value = -1 then 1 else 0 end) - (case when OLD.vote_value = -1 then 1 else 0 end);
    update public.vote_tallies
      set net_score = net_score + _delta_net,
          up_count  = up_count + _delta_up,
          down_count = down_count + _delta_down,
          updated_at = now()
      where subject_table = NEW.subject_table and subject_id = NEW.subject_id;
  elsif TG_OP = 'DELETE' then
    _delta_net := -OLD.vote_value;
    _delta_up  := -(case when OLD.vote_value = 1 then 1 else 0 end);
    _delta_down := -(case when OLD.vote_value = -1 then 1 else 0 end);
    update public.vote_tallies
      set net_score = net_score + _delta_net,
          up_count  = up_count + _delta_up,
          down_count = down_count + _delta_down,
          updated_at = now()
      where subject_table = OLD.subject_table and subject_id = OLD.subject_id;
  end if;
  return null;
end; $$;

create trigger trg_votes_delta
  after insert or update or delete on public.votes
  for each row execute function public._apply_vote_delta();
```

**Orphan cleanup (per-subject-table triggers):** `votes` has no FK to subject rows (can't — polymorphic). When a subject is hard-deleted (piece cascade), its votes must be deleted too. Parameterized trigger per subject table:

```sql
create or replace function public._clear_votes_on_subject_delete() returns trigger
  language plpgsql security definer as $$
begin
  delete from public.votes where subject_table = TG_ARGV[0] and subject_id = OLD.id;
  return OLD;
end; $$;

-- Attach to each subject table (landmarks, performers_notes, interpretive_schools, piece_descriptions).
-- Note: vote_tallies row is cleaned implicitly by the _apply_vote_delta trigger firing on DELETE.
create trigger trg_clear_votes_landmarks
  after delete on public.landmarks
  for each row execute function public._clear_votes_on_subject_delete('landmarks');
create trigger trg_clear_votes_performers_notes
  after delete on public.performers_notes
  for each row execute function public._clear_votes_on_subject_delete('performers_notes');
create trigger trg_clear_votes_interpretive_schools
  after delete on public.interpretive_schools
  for each row execute function public._clear_votes_on_subject_delete('interpretive_schools');
create trigger trg_clear_votes_piece_descriptions
  after delete on public.piece_descriptions
  for each row execute function public._clear_votes_on_subject_delete('piece_descriptions');
```

**RLS (resolved from §12 open question):**
- `votes` — authenticated users `select` their own rows only (`user_id = auth.uid()`). No anon read. RPCs (`cast_vote`, `clear_vote`) handle writes via SECURITY DEFINER.
- `vote_tallies` — **REVOKE all from anon and authenticated**. Reads flow through a SECURITY DEFINER RPC `fetch_ordered_subjects(p_subject_table text, p_subject_ids uuid[]) returns uuid[]` that returns the IDs ordered by `(net_score desc, approved_at asc)` without ever exposing counts. SSR calls this per-subject. Anon users get the same order as authenticated users — no count leakage via DevTools.

This honors the "no public count display, ever" principle without ambiguity — counts are literally inaccessible client-side.

### 2.6 Polymorphic notifications — add landmark subject

```sql
alter table public.notifications
  drop constraint if exists notifications_subject_table_check;

alter table public.notifications
  add constraint notifications_subject_table_check
  check (subject_table in (
    'performers_notes', 'interpretive_schools', 'piece_descriptions', 'landmarks'
  ));
```

Only `landmarks` added. Flags + practice notes are NOT subject types — they ride inside landmark versions. Movements are NOT subject types — wiki edits don't route through notifications.

### 2.7 System seed user + published-version views

A single system user row exists (inserted in the movements migration) to attribute seed-generated movement versions: `id = '00000000-0000-0000-0000-000000000000'`, `display_name = 'System seed'`. Movement edits by real users use their own `authored_by`; only the initial seed versions use the system user.

Published-version views for each versioned signed subject:

```sql
create view public.v_landmark_versions_published as
  select lv.*
  from public.landmarks l
  join public.landmark_versions lv
    on lv.landmark_id = l.id
   and lv.id = l.current_version_id
  where l.status = 'published';

create view public.v_movement_versions_current as
  select mv.*
  from public.movements m
  join public.movement_versions mv
    on mv.movement_id = m.id
   and mv.id = m.current_version_id;
```

---

## 3. State machines

### 3.1 Landmark aggregate — same as Slice A

Identical to Slice A: `draft → awaiting_contributor_approval → published → removed`. All state transitions approve/reject/retract/remove the WHOLE landmark aggregate (with nested flags + practice notes atomically). Versioning captures the full payload.

### 3.2 Movements — no state machine, wiki-style

Movements have no draft state. An edit is a new `movement_versions` row + pointer update. No approval, no queue, no byline. Revert is the same: a new version row with `reverted_from_version_id` set + pointer moved. The only audit is `authored_by` + `created_at` + `edit_summary`.

### 3.3 Votes — no state machine

A vote row either exists (positive or negative) or doesn't. Re-casting the same vote value is idempotent (upsert updates `updated_at`). Clicking the thumb of your current vote clears it (delete row).

---

## 4. RPC surface

Sixteen new RPCs total, down from Rev 1's 31. The collapse: one subject (landmark aggregate) with 10 state-machine RPCs instead of three subjects with 31 combined.

### 4.1 Landmark aggregate (10 RPCs)

```
publish_contributor_landmark(p_piece_id text, p_movement_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text, p_flags jsonb, p_practice_notes jsonb)
publish_contributor_landmark_edit(p_landmark_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text, p_flags jsonb, p_practice_notes jsonb)
remove_landmark(p_landmark_id uuid)
create_landmark_draft(p_piece_id text, p_movement_id uuid, p_contributor_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text, p_flags jsonb, p_practice_notes jsonb)
update_landmark_draft(p_landmark_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text, p_flags jsonb, p_practice_notes jsonb)
submit_landmark(p_landmark_id uuid)
retract_landmark(p_landmark_id uuid)
approve_landmark(p_landmark_id uuid)
approve_and_edit_landmark(p_landmark_id uuid, p_measure_start int, p_measure_end int, p_label text, p_description text, p_flags jsonb, p_practice_notes jsonb)
reject_landmark(p_landmark_id uuid, p_reason text default null)
```

Every mutation takes the full aggregate payload. RPC validates JSONB shape: flags must be array of `{type, severity, instrument_specificity}` with valid enum values; practice_notes must be array of `{body}` with length ≤ 4000. Violations raise as exceptions with clear messages.

The `update_landmark_ordinal` metadata RPC from Rev 1 is eliminated. Changing ordinal is just another landmark edit — it writes a new version with the new ordinal. This is a simplification: one mutation RPC family, everything versioned.

### 4.2 Movements (3 RPCs — wiki-edit, no contributor pipeline)

```
update_movement(p_movement_id uuid, p_ordinal smallint, p_name text, p_tempo_indication text, p_key_signature text, p_edit_summary text default null)
revert_movement(p_movement_id uuid, p_target_version_id uuid, p_edit_summary text default null)
-- no delete RPC — movements cascade-delete with their piece only
```

Plus one read helper:
```
fetch_movement_history(p_movement_id uuid) returns setof movement_versions  -- security-definer, public callable
```

Any `authenticated` user can call `update_movement` and `revert_movement`. The RPC bumps `version_number`, writes the new version row with `authored_by = auth.uid()`, updates `movements.current_version_id`, and logs the edit summary.

### 4.3 Votes (2 RPCs)

```
cast_vote(p_subject_table text, p_subject_id uuid, p_vote_value smallint)  -- +1 or -1, upsert semantics
clear_vote(p_subject_table text, p_subject_id uuid)                        -- delete vote row
```

Both RPCs trigger the materialized view refresh (async — deferred to a statement-after hook so repeated rapid voting doesn't thrash).

### 4.4 Shared helpers — additions + retirements

Retained from Slice A/B (unchanged): `_insert_notification`, `_clear_notifications_for`. Landmark submit calls `_insert_notification('landmarks', <landmark_id>, ...)` with the verbatim body line (§4.5).

**New helpers for Rev 5 eng findings:**
- `_require_authenticated()` — replaces prior `_require_active_contributor` in call paths that used to gate on `is_contributor=true`. Simply asserts `auth.uid() IS NOT NULL` and the user row exists. Any signed-in user.
- `_require_drafter_role()` — gates `create_*_draft`, `update_*_draft`, `submit_*`, `retract_*` on **live** `users.role IN ('admin', 'firstchair')` read from `public.users` (NOT from the JWT — JWT role claims can be stale up to a refresh cycle; never trust them for gating). Raises with a clear "requires admin or firstchair role" message on failure.
- `_validate_landmark_payload(p_flags jsonb, p_practice_notes jsonb)` — shared JSONB shape + enum validator (§4.7 below). Every landmark mutation RPC calls this before writing.
- `_check_rate_limit(p_action text, p_limit int, p_window_seconds int)` — shared rate-limit gate backed by a lightweight `rate_limit_log` table keyed on `(user_id, action, bucket_ts)`. Called inside RPCs.
- `_clear_votes_on_subject_delete()` — parameterized trigger helper (spec'd in §2.5) that clears orphaned votes when a subject row is hard-deleted.

**Retired / deprecated:**
- `_require_active_contributor` and any `is_contributor`-based gates — no longer meaningful under the "any registered user === contributor" governance model. Legacy RPCs still calling this get updated in Step 1 as part of the `/admin/*` gating relaxation.

### 4.7 JSONB payload validation (shared helper)

DB-layer CHECK constraints on `landmark_versions.flags` and `.practice_notes` only enforce array type + size. They do NOT enforce enum values, body length, or required keys — a direct REST caller could write `{type: "nonexistent"}`. All landmark mutation RPCs call this shared validator before insert:

```sql
create or replace function public._validate_landmark_payload(
  p_flags jsonb,
  p_practice_notes jsonb
) returns void language plpgsql as $$
declare
  elem jsonb;
begin
  -- Flags: every element must have valid type + severity; optional instrument_specificity must be array.
  if jsonb_typeof(p_flags) != 'array' then
    raise exception 'flags must be a JSON array';
  end if;
  for elem in select jsonb_array_elements(p_flags) loop
    perform (elem->>'type')::public.flag_type;          -- raises invalid_text_representation on bad enum
    perform (elem->>'severity')::public.flag_severity;   -- same
    if elem ? 'instrument_specificity' and jsonb_typeof(elem->'instrument_specificity') != 'array' then
      raise exception 'instrument_specificity must be a JSON array';
    end if;
  end loop;

  -- Practice notes: body length 1-4000.
  if jsonb_typeof(p_practice_notes) != 'array' then
    raise exception 'practice_notes must be a JSON array';
  end if;
  for elem in select jsonb_array_elements(p_practice_notes) loop
    if char_length(coalesce(elem->>'body', '')) = 0 then
      raise exception 'practice_note body cannot be empty';
    end if;
    if char_length(elem->>'body') > 4000 then
      raise exception 'practice_note body exceeds 4000 chars';
    end if;
  end loop;
end; $$;
```

Called from: `publish_contributor_landmark`, `publish_contributor_landmark_edit`, `create_landmark_draft`, `update_landmark_draft`, `approve_and_edit_landmark`. Before any insert into `landmark_versions`.

### 4.5 Body-line writers

```
submit_landmark: 'A draft landmark awaits your review: "' || p_label || '" (m. ' || p_measure_start || ')'
```

(Nested flags + practice notes counts aren't in the body line — the queue card UI renders those details.)

### 4.8 Takeover of stranded drafts

```
takeover_draft(p_subject_table text, p_subject_id uuid)
```

Callable by any admin/firstchair. Updates `<subject_table>.drafted_by = auth.uid()` if the row is in `draft` or `awaiting_contributor_approval` state AND the current `drafted_by` user's role is NOT in (`admin`, `firstchair`). Purpose: let a current admin/firstchair pick up a draft that was created by someone who has since been demoted to regular `user`.

Alternative path: admins can delete stranded drafts via `remove_<subject>` (status transitions to `removed`). No reassignment needed.

No takeover for contributor-self-authored content — a user's own authored work isn't role-gated, so demotion doesn't affect their own content.

### 4.6 Rate limiting

Four rate limits enforced inside RPCs via a shared `_check_rate_limit` helper (new — writes to a `rate_limit_log` table keyed by user + action + window):

- Vote RPCs: max 30 votes/minute per user.
- Movement wiki edits: max 10 edits/hour per user.
- Draft-for-another-user submits (`submit_*` where `contributor_id != auth.uid()`): max 20 submissions/hour per drafter — limits spam of approval requests.
- Self-publish (`publish_contributor_*`): max 60/hour per user — generous; catches runaway bugs more than malicious use.

---

## 5. Component inventory

### 5.1 Refactors to Slice A/B components

- **`ContributorContentAdmin`** — add landmark subject config. Form fields: piece + movement + contributor selectors; measure_start, measure_end; label; description; repeatable flag rows (type + severity + instrument_specificity); repeatable practice-note rows (body). The admin composes the full aggregate payload for the `create_landmark_draft` / `update_landmark_draft` call.
- **`NotificationsQueue`** — landmark card renderer. Shows the full aggregate as the contributor would see it approved: measure range + label + flag pills + practice-note blocks. One card, one approval set.
- **`NavbarBell`** popover — landmarks deep-link to `/piece/{piece_id}#landmark-{id}`.
- **`send-notification-digest`** — add landmark subject to the branch switch.
- **`PerformersNotes.tsx` (Slice A)** — now renders as a **stack**. If more than one published performer's note on a piece, renders the top-voted first with a cycle affordance to swap. Empty-stack state unchanged.
- **`InterpretiveSchools.tsx` (Slice B)** — same stacking refactor.
- **`SignedPieceDescription.tsx` (Slice B)** — same stacking refactor.

### 5.2 New piece-page components

- **`src/components/StructuralLandmarks.tsx`** — React island. SSR'd initial data (movement-grouped tree). Per movement: movement header (wiki-edit affordance, version-history link), then ordered list of landmark stacks (one stack per measure range, multiple landmarks from different contributors stacked). Each landmark card in the stack: measure range, label, flag pills, signed practice notes inline. Always-visible contributor entry point per movement: "Add landmark at this passage →".
- **`src/components/LandmarkStack.tsx`** — sub-component, renders a stack of sibling landmarks at the same anchor. Top-voted first, cycle affordance for below-the-fold members.
- **`src/components/VoteThumbs.tsx`** — reusable thumbs-up/thumbs-down affordance. Accepts `subjectTable` + `subjectId` props. Shows the user's own current vote state (highlighted thumb). **Never renders counts.** Calls `cast_vote` or `clear_vote` on click. Anonymous users see disabled thumbs with a subtle "sign in to vote" affordance.
- **`src/components/MovementEdit.tsx`** — inline wiki-edit surface. Click movement name → inline form with name/tempo/key/ordinal/edit-summary fields. Save → new version. History link opens a modal with past versions + revert buttons (authenticated users only).
- **`src/lib/landmarks.ts`** — page-load reads.
- **`src/lib/votes.ts`** — vote reads + write wrappers.
- **`src/lib/movements.ts`** — movement reads + edit wrappers.

### 5.3 Piece-page wiring (PiecePageLayout.astro)

Section order unchanged (PRD):
1. Header + difficulty panel
2. Signed performer's notes (**now stacked**)
3. Structural landmarks (Slice C — new, **stacked per anchor**)
4. Interpretive schools (**now stacked**)
5. Unsigned + signed piece descriptions (signed descriptions **stacked**)
6. Editions
7. Recordings
8. Pedagogical arc

`<1s` cold-start on throttled mobile: SSR the stacked initial state (top of each stack only; cycle affordance loads the rest lazily on interaction). Vote aggregates queried alongside content in one join. Empty stacks render the existing empty-state copy.

### 5.4 Drafting surfaces (admin/firstchair only, target picker shows all users)

Per §1.0, these surfaces are accessible only to users with role `admin` or `firstchair`. The target picker shows all users (any role) as potential byline owners:

- **`/admin/landmarks`** (new) — mounts `ContributorContentAdmin` with landmark config. Visible only to admin/firstchair.
- **Slice A/B surfaces** (`/admin/performers-notes`, `/admin/interpretive-schools`, `/admin/piece-descriptions`) — drafter-role gate aligned in Step 1.
- Regular `user`-role accounts visiting these routes see a polite redirect: "These surfaces are for drafting content on behalf of other contributors. To author your own, head to any piece page."
- No `/admin/movements` — wiki-edit is in-place on the piece page.
- No `/admin/flags` or `/admin/practice-notes` — nested children of landmarks.
- No `/admin/votes` — voting is user-driven. Admin-level vote analytics dashboard deferred (out of scope).

Target picker UX: a searchable list of all users (filtered by name / display_name). No role badges visible in the picker to keep the UX simple — the admin/firstchair drafter picks who the byline should belong to, and the picker's job is just finding that person.

---

## 6. Daily digest

Subject-agnostic work done in Slice B Step 3. Landmark adds one entry to the subject-branch switch. No changes to body-line templates. Movement edits + votes do NOT flow through the digest.

---

## 7. Design specification

### 7.1 Reading order — Landmark card + movement header

**Landmark card (top-to-bottom, left-to-right):**
1. **Measure range** — tabular Inter 13px, muted ink, left prefix (acts as address orienting the eye before semantics).
2. **Label** — Source Serif 4 italic 18px, full ink.
3. **Byline strip** — contributor display name in Inter medium 13px, full ink, inline with optional one-line bio in Inter regular 11px muted after em-dash. Immediately under label, above flag pills. PRD line 54 puts signed-voice at the top of the hierarchy; byline must be knowable before body text is read. Not buried in footer.
4. **Flag pills** — inline after byline strip. See §7.3 for non-color-coded spec.
5. **Description** — Source Serif 4 regular 15px, muted ink, one-liner. Optional; omit when empty.
6. **Practice note bodies** — same signed-notes pattern as performer's notes (2px purple left border, Source Serif 4 15px body, practice-note byline in Inter medium 12px below with one-line bio). Render in approval order. Not stacked — see §7.8.
7. **Footer strip** — vote thumbs + stack cycle affordance. 0.5px top border, 8px spacing. Infrastructure only; byline is already up top.

**Movement header (above landmark list):**
- Movement name — Source Serif 4 22px, full ink.
- Tempo indication + key signature — inline after name, tabular Inter 13px, muted ink, em-space separated.
- Wiki-edit pencil — hover-reveal on desktop; always visible at 40% opacity on mobile (touch-first). 16×16 visual, 44×44 tap target. See §7.7 for edit UX.
- History link — beneath name, tabular Inter 11px, muted. Opens history modal (§7.7).

### 7.2 Component state matrix

Every interactive component ships with explicit states. Implementer reads this table; no "figure it out."

**VoteThumbs** (up arrow / down arrow pair):

Canonical rule: the thumbs are hover/tap-revealed (per §7.4). The card surface is default-thumbless. Once revealed (hover on desktop, first tap on mobile, keyboard focus for a11y), the card-scoped state progression below applies. Authenticated status is detected server-side for SSR and cached client-side on hydration; the `auth-loading` state below covers the brief post-hydration gap.

| State | Visual | Behavior |
|-------|--------|----------|
| Hidden (default) | Card footer shows no thumb affordance. | Hover/focus/tap reveals. |
| Auth-loading (hydration) | Revealed thumbs render in 30% opacity skeleton; no clicks bound. | Resolves within ~150ms to Unauth or Unvoted. |
| Unauth | Both thumbs 40% opacity, tab-focusable. | Click → lightweight inline popover "Sign in to vote" (link to sign-in). `aria-pressed="false"`, `aria-label="Vote up — sign-in required"`. |
| Unvoted (auth) | Both thumbs outlined, ink-color. | Click up → optimistic filled up, `cast_vote(+1)` fires. Keyboard Enter/Space on focused thumb same. `aria-pressed` false on both. |
| Upvoted | Up thumb filled, down outlined. Filled uses distinct **success-emphasis token** (see §7.3 / §7.12), NOT the generic purple accent — avoids semantic collision with selected-chrome. | Click up → clear (optimistic unfill); click down → flip to -1. `aria-pressed="true"` on up. |
| Downvoted | Down thumb filled with success-emphasis token (same visual weight as up, mirrored), up outlined. | Symmetric to Upvoted. `aria-pressed="true"` on down. |
| In-flight | Last-clicked thumb shows 200ms subtle pulse (reduced-motion: instant flip). | No-op during pulse (debounce). Next click queues. |
| Rate-limited (30/min cap) | Toast: "Voting too fast — wait a second." | Optimistic state reverts. `aria-live="polite"` announces. |
| Offline | Tap shows toast: "Vote saved locally, will sync." | Local queue retry on reconnect. Materialized view updates once synced. |
| Error (5xx) | Toast: "Vote didn't save — try again." | Optimistic state reverts. |

**Stack cycle affordance:**
| State | Visual | Behavior |
|-------|--------|----------|
| 1 member | No affordance rendered. | — |
| ≥2 members | Single right-chevron (›) in card footer-right, 16×16 visual, 44×44 tap, outlined. Tooltip on hover desktop: "Next contributor's take". | Click → slide-transition to next sibling (cycles infinitely; after last wraps to first with subtle fade). |
| Mid-cycle | Chevron stays; card body swaps. | — |
| Stale materialized view fallback | Order silently falls back to `approved_at ASC`. | No error UI — graceful degradation. Logged server-side. |

**MovementEdit:**
| State | Visual | Behavior |
|-------|--------|----------|
| Viewing | Movement name displayed. Pencil hover-reveal (desktop) / 40% opacity (mobile). | — |
| Pencil click | Modal-over-page (NOT inline reflow). Form: name + tempo + key + ordinal + edit_summary. Save (primary) + Cancel (ghost). | Escape to cancel. |
| Save-in-flight | Save button spinner, form inputs disabled. | — |
| Save success | Modal closes, page refreshes movement name via optimistic update. Toast: "Movement updated." | — |
| Save collision | Inline toast in modal: "This movement was edited by {name} {N seconds} ago. [View latest / Overwrite anyway]" | View latest = close modal, reload page state. Overwrite anyway = resubmit form with bumped version_number expectation. |
| History modal | Separate modal, version list (name + edit_summary + authored_by + created_at). Each row has Revert button (signed-in users only). | Revert → confirmation inline: "Revert to version from {date} by {author}?" Yes = new version row with reverted_from pointer. |

**Draft-target picker** (admin/firstchair only — regular users don't see this surface):
| State | Visual | Behavior |
|-------|--------|----------|
| Picker open | Searchable list of all users. Inline search box (Inter 14px), list below (display_name + Source Serif 4 one-line bio if set). | Typing filters. |
| Selected | Picked user pinned above search, with a "change" link. | Click change → picker re-opens. |
| Role changed mid-session | If drafter's role demoted while drafting, `submit_*` RPC rejects with "You no longer have draft authority." Draft stays in draft state, editable only by another admin/firstchair (or deletable). | — |
| Empty user list (impossible in prod) | "No users registered yet." | — |

### 7.3 Flag pills — non-color-dependent severity signals

Severity must NOT rely on color density alone (WCAG fail for color-blind users). Pills use **shape + prefix + typography** to distinguish three variants. Purple is reserved for *interactive chrome* (selected state, buttons, filled thumbs) per DESIGN.md — severity does NOT use brand purple. Severity introduces its own semantic token family (§7.12):

- **informational:** Inter 12px (bumped from 11px for legibility at this differentiation level) regular, 0.5px outline (DESIGN.md discipline), no fill, muted ink. Shape: pill (fully rounded per DESIGN.md card radius). No prefix.
- **notable:** Inter 12px medium, 0.5px outline, subtle `severity-notable` fill (new neutral-warm muted token, NOT purple — e.g. a warm ivory tone spec'd in §7.12 DESIGN.md PR), full ink. Shape: pill. Prefix: a single open dot (○) at left.
- **significant:** Inter 12px medium, 0.5px outline, `severity-significant` fill (new ink-dark token, NOT purple — dark-ink background + paper-white text for maximum legibility), high contrast. Shape: pill. Prefix: a single filled dot (●) at left.

Severity tokens DO NOT reuse brand purple. That avoids semantic collision ("purple = interactive" stays intact). The new severity family gets named tokens in DESIGN.md (see §7.12).

Non-color signals that survive grayscale:
- open dot (○) vs filled dot (●) vs no dot → three distinct glyphs
- regular vs medium weight → two weights (not three, respecting DESIGN.md's two-weight discipline)
- ink text vs inverse text (paper on ink) → two contrasts
- three distinct fills → three tones even under grayscale

Instrument specificity rendered parenthetically after flag type: `bow control (cello)`. Max 2 shown, beyond that `bow control (cello, +1)` with reveal on hover/tap.

### 7.4 Sea-of-thumbs mitigation + persistent discoverability hint

Four VoteThumbs per piece page × multiple cards = potentially 14+ thumbs visible on single scroll. Contradicts editorial register. Mitigation: hover/tap-reveal + a persistent low-salience hint layer so the voting capability is discoverable without being ambient.

- **Persistent hint (always visible):** a single subtle `⋯` (three-dot horizontal ellipsis in muted ink, 10×10 glyph, 44×44 tap area) in the card footer-right. Always rendered. Signals "there are affordances here" without specifying them. On hover (desktop) or first tap (mobile), the `⋯` transitions out and the thumbs (+ cycle chevron if stack) transition in.
- **Desktop:** hover card (or hover the `⋯` specifically) → thumbs + cycle chevron fade in at full opacity. Hovering away re-hides after 500ms unless user clicked a thumb.
- **Mobile:** tap card interior or `⋯` → thumbs + cycle chevron revealed for that card; others re-hide. Tap outside → hide.
- **Keyboard / screen readers:** `Tab` to focus card surface reveals the affordances (focus ring + thumbs visible). Screen readers read thumbs via `aria-label` regardless of visual state; hover-reveal is visual chrome only.
- **One-time coachmark on first card interaction:** the first time a signed-in user taps a card surface in a new browser session, a small tooltip appears near the thumb: "Tap to vote." Dismissible, shown once per session max.

This keeps the page calm (discoverable but not ambient), teaches the pattern on first use, and reaches keyboard/screen-reader users the same way as hover users.

### 7.5 Stacking — single cycle chevron + visible jump-list affordance

Single right-chevron cycles; authorship jump-list is a separately-visible secondary control (not a long-press — discoverability is too low for that gesture on desktop).

- **Cycle chevron (›):** card footer-right, revealed with thumbs (§7.4). Click cycles to next sibling (200ms slide; reduced-motion: instant). After last, wraps to first with a brief fade-through-center. Keyboard: `Enter`/`Space`. `aria-label="Next contributor's take"`.
- **Jump-list button (⋮):** rendered next to cycle chevron when stack has ≥3 members. Click opens a small popover menu listing sibling bylines only (no previews, no order numbers): "Jump to: Haji K. / Chen M." User taps a name → card transitions directly to that sibling. This is the only way to see how many siblings exist by exploration; accepted leakage because the user explicitly asked.
- **Stack with exactly 2 members:** show cycle chevron only. No jump-list (unnecessary at N=2).
- **Screen reader announcement on cycle:** `aria-live="polite"` announces "Showing {byline}'s take" on every transition so SR users track which sibling is currently rendered.

Interaction states (completes §7.2 chevron matrix):
| State | Visual | Behavior |
|-------|--------|----------|
| Jump-list closed | `⋮` visible at 40% opacity | Click opens popover. |
| Jump-list open | Popover anchored to `⋮`, sibling byline list. | Click name → card slides + popover closes. Esc closes without change. Click outside closes. |
| Jump-list loading | Skeleton rows (≤3) | Resolves < 100ms typically. |

Visible focus rings on both chevron and jump-list button (purple 2px, 2px offset). Jump-list popover traps focus while open; Esc or outside click closes + returns focus to the button.

### 7.6 Landmark form — progressive disclosure + context-aware pre-fill

Two entry contexts; each pre-fills differently.

**Entry from piece page** ("Add landmark at this passage →" link on a movement): piece_id + movement_id pre-filled + hidden (user already picked them by clicking on that movement's affordance). Visible required fields: measure_start + measure_end (defaults to null = single measure) + label. Optional sections collapsed per below.

**Entry from `/admin/landmarks` drafting surface** (admin/firstchair only): target-user picker + piece selector + movement selector visible at top (user hasn't picked a context). Rest identical.

**Optional (collapsed-by-default, each with +Add affordance):**
- **Description** — single Source Serif 4 text field, char-count hint (but no hard limit beyond label=60). Expands on +Add click.
- **Flags** — repeatable row. First row collapsed. +Add flag expands: type dropdown + severity radio (three options with §7.3 pill previews) + instrument checkboxes. Remove (×) on each row.
- **Practice notes** — repeatable row. +Add expands textarea + char count with 4000 cap.

Submit button always visible at form bottom. Draft-save every ~30s of inactivity (silent, optimistic), form state recoverable on navigation back. Cancel link above submit returns to piece page without saving.

Unsaved-changes state: if user navigates away (hard reload, back nav), browser confirmation dialog prompts ("You have unsaved changes"). On modal close in admin context, same prompt.

### 7.7 Wiki-edit movement — modal, focus-trapped

Modal-over-page replaces inline reflow. Two modals are involved (edit modal + history modal) — each independently managed with focus trap + inert background.

- **Edit modal.** Click pencil (or tap on mobile) → modal centered on page, overlays rest of piece page with 40% ink scrim.
  - Modal content: name + tempo + key + ordinal + edit_summary fields. Save (primary) + Cancel (ghost). Esc triggers Cancel.
  - Focus trap: on open, focus moves to first field; Tab cycles within modal only; Esc closes + returns focus to pencil. Background content marked `inert`.
  - On save: optimistic header update, RPC fires. Save-in-flight: Save button spinner, fields disabled.
  - On save success: modal closes, toast "Movement updated."
  - On save collision (the server refresh notes a newer version landed during modal open): inline toast inside modal: "This movement was edited by {name} {X seconds} ago. [View latest / Overwrite anyway]". View latest = close modal + reload. Overwrite anyway = retry with bumped version expectation.
  - On validation error (empty name, ordinal conflict with sibling): inline field errors in Source Serif 4 italic muted; Save disabled.
- **History modal.** Opened from "History" link below movement name; separate modal, same focus-trap pattern.
  - Content: vertical list of version rows (name + edit_summary + authored_by + created_at ISO date). Each row has Revert button (signed-in users only).
  - Revert: inline confirmation in row: "Revert to this version? [Yes / No]". Yes = new version row with `reverted_from_version_id` set.
  - History load error: skeleton rows followed by "Couldn't load history — [Retry]".
  - Opening history modal while edit modal is open: edit modal dismisses first (confirms unsaved changes if dirty).

Modal-stack complexity: only one modal open at a time. This keeps focus trap simple.

### 7.8 Practice-note plurality — sibling landmarks, not stacked practice notes

A landmark aggregate contains its own author's practice notes only (all practice notes in a landmark's JSONB belong to the landmark's byline). For another user's practice-note take on the same passage, that user creates a sibling landmark at the same measure range. The sibling-landmark stack IS the practice-note plurality surface.

Inside a single landmark card, multiple practice notes render linearly (approval order, top-down, standard signed-notes pattern). No intra-landmark practice-note stacking. This keeps the single landmark card readable and moves plurality to the stack level where it's already handled.

### 7.9 Drafter-role discovery + target picker UX

Regular users don't see the drafting surface at all (gated redirect). Admins/firstchairs see it in their nav. Above the target picker, a helper block names the role and consent explicitly:

> **As a firstchair/admin, you're drafting on this contributor's behalf.** Your draft will appear in their approval queue, and only publishes if they approve under their byline.

Source Serif 4 13px, muted ink, 0.5px top border + 16px spacing.

Target picker UX:
- Searchable list of all users. Inline search box (Inter 14px).
- **States:** loading (skeleton rows), populated, no-results-for-search, too-many-results (>200, prompts refine-search), network-error (retry button).
- Each row: display_name + Source Serif 4 11px muted one-line bio if set. No role badges (role is implementation detail; drafter just picks a person).
- Keyboard: ↓/↑ traverses, Enter picks, Esc clears search. Screen reader: list announces count on load.
- Selected state: picked user pinned above search with a "change" link. Search cleared.

### 7.10 Responsive + accessibility specification

**Breakpoints (piece page Structural Landmarks section):**
- `≥1024px` (desktop): movement header full-width; landmark cards 2-column grid when stack count × card height permits. Cycle chevron + thumbs in card footer, revealed per §7.4.
- `768-1023px` (tablet): movement header full-width; landmark cards 1-column, wider than mobile.
- `<768px` (mobile): movement header sticky to top of landmarks section on scroll. Landmark cards 1-column, measure range + label on one line, byline strip below, flag pills wrap to second line if needed, description collapses behind "…more" tap-reveal. Thumbs + chevron revealed per §7.4.

**Accessibility:**
- Keyboard: every interactive element (thumbs, cycle chevron, jump-list button, pencil, add-landmark link, target picker rows, history revert) is `<button>` or `<a>` with visible focus ring (purple 2px outside, 2px offset).
- Screen readers: every icon button has `aria-label`. Flag pills have `aria-label="{type}, {severity}"`. Thumbs announce `aria-pressed` + current state. Stack cycle announces via `aria-live="polite"`: "Showing {byline}'s take" on transition.
- Touch targets ≥44×44 for all interactive elements.
- Contrast: severity-notable + severity-significant tokens tested against WCAG AA 4.5:1 body, 3:1 interactive; severity-significant's ink background + paper text is 13:1 (AAA).
- Reduced motion (`prefers-reduced-motion: reduce`): cycle transition becomes instant; thumb pulse is instant flip; coachmark appears without fade.
- Color-blind safety tests (spec'd, not just assumed):
  - Automated: axe-core CI check on the three flag pill variants in all three severity states × protanopia/deuteranopia/tritanopia filter overlays.
  - Manual: one-off WebAIM Contrast Checker + Coblis color-blind simulator against the rendered piece page pre-merge on Step 8.
  - Survives grayscale conversion: open dot / filled dot / no-dot prefix + three distinct non-brand tones ensures severity is readable with zero color information.
- Modal focus trap: edit modal + history modal each trap focus within modal; Esc closes + returns focus to the trigger. Background marked `inert` (or `aria-hidden="true"` polyfill).

### 7.11 Propose affordances

Contributor signed in (any role):
- **Add landmark at this passage →** — link rendered at the bottom of each movement's landmark list. Source Serif 4 italic 14px, purple underline. Buttons-vs-links rule (memory): this navigates to authoring, not state-changing.

Regular users: link goes to `/piece/{id}/landmark/new?movement={mid}` (inline authoring surface on the piece page).

Admin/firstchair: same link destination; they can toggle "draft for someone else" inside the form.

### 7.12 DESIGN.md updates required before Step 6

Step 5.5 lands a design-spec PR updating DESIGN.md. Token families and components needing specification:

**Severity tokens (new family, NOT brand purple):**
- `color-severity-informational` — outline-only, muted ink
- `color-severity-notable-bg` / `-fg` — neutral-warm muted tone (e.g., warm ivory `#F3EEE4` or similar; final value in the spec PR)
- `color-severity-significant-bg` / `-fg` — ink-dark background + paper-white foreground (13:1 contrast)

**Interaction + motion tokens:**
- `opacity-reveal-hidden` (0 or collapsed), `opacity-reveal-peek` (40% for mobile-always-visible pencil), `opacity-reveal-full` (100%)
- `motion-pulse-200ms`, `motion-slide-200ms`, `motion-fade-150ms` (all responding to `prefers-reduced-motion`)

**Layer tokens:**
- `z-modal-backdrop`, `z-modal`, `z-popover`, `z-toast`
- `color-modal-backdrop` (40% ink scrim)

**Icon + hit-area tokens:**
- `size-icon-sm` (16px visual)
- `size-hit-area-min` (44px, always)
- Icon + hit combination spec for affordances like thumbs, chevron, jump-list, pencil

**User-state tokens:**
- `color-vote-own` — filled state for user's own vote. NOT brand purple. A distinct success-emphasis token.

**Components specified (with spec PR including visual examples):**
- `FlagPill` — 3 severity variants, non-color-dependent (§7.3)
- `VoteThumbs` — hover-reveal + auth/voted/in-flight/error/rate-limited/offline states (§7.2)
- `StackCycleChevron` + `StackJumpList` — cycle + authorship jump-list (§7.5)
- `PersistentHintEllipsis` — always-visible `⋯` affordance hint (§7.4)
- `EditableTextPencil` — hover-reveal desktop, 40% mobile (§7.1, §7.7)
- `OneTimeCoachmark` — first-interaction hint pattern (§7.4)
- `FocusTrappedModal` — edit + history modal pattern (§7.7)

**Step 5.5 PR deliverables:**
1. New tokens added to `src/styles/global.css` + exported via DESIGN.md component catalog.
2. Storybook-equivalent examples in DESIGN.md showing each variant.
3. Automated axe-core snapshot test covering the new components.

### 7.13 No meta-captions (memory)

Section heading "Structural landmarks" stands alone. No "A living passage-level reference..." subtitle. Same for all other sections.

---

## 8. Edge cases

- **Landmark measure range zero-length.** `measure_start = measure_end` allowed; CHECK rejects `measure_end < measure_start`.
- **Landmark on a piece without movements (Bach Chaconne).** Data migration creates synthetic `(piece, ordinal=1, name=title)` movement row. Uniform FK path.
- **Landmark removed with children (flags + practice notes in JSONB).** JSONB is part of the aggregate; removing the landmark soft-removes the whole payload. No cascade concerns — no child tables.
- **Two contributors at same measure range.** Both landmark rows exist independently. Piece page renders a stack at that anchor, top-voted first.
- **Vote by the owner contributor on their own content.** Allowed (no enforcement against self-votes at DB level). Query layer optionally excludes self-votes from ranking if needed — decide during implementation via §12 open question.
- **Vote flip.** User votes up, then clicks up again → vote cleared (DELETE row). User votes up, then clicks down → vote row UPDATED to -1. Idempotent upserts.
- **Simultaneous vote races.** `unique(user_id, subject_table, subject_id)` + upsert semantics handle this cleanly.
- **Wiki-edit race.** Two users edit the same movement simultaneously. Last write wins (version_number increments). Prior edit still visible in history + revertable. Acceptable for a low-traffic wiki surface.
- **Wiki-edit vandalism.** Any registered user can revert. No rate-limit bypass — the `update_movement` RPC enforces 10/hour/user. Repeated vandalism → manual user disable by staff.
- **Movement deletion.** Cascade from piece only. No standalone delete RPC — editorial decision.
- **Empty `instrument_specificity`.** Default '[]'; UI doesn't render the suffix.
- **Staff drafts a landmark for a contributor that doesn't exist yet.** Staff is required to be `is_contributor = true` and set themselves as the contributor, OR the draft targets an existing contributor by ID. Reject otherwise.
- **Stack with 1 member.** Renders as a plain card (no cycle affordance).
- **Stack with all-downvoted members.** Still renders; downvotes don't hide, only order. Consumer can still cycle through.
- **Notification for a draft whose landmark was removed.** `_clear_notifications_for('landmarks', <id>)` fires on the remove transition.
- **Materialized view staleness.** Refresh concurrent; triggered on vote changes. If refresh fails (lock contention), stacking order falls back to `approved_at ASC` for that subject — tested as a regression.

---

## 9. Testing

New integration test files (target ~75 new tests post eng review findings, total ~153):

- **`src/integration/landmarkAggregate.test.ts`** (~24 tests) — state machine, versioning, JSONB payload validation (`_validate_landmark_payload` positive + negative paths: bad enum, bad severity, missing required field, over-length practice note body, non-array flags, non-array practice_notes, empty body), RLS, contributor-self-publish path, plural-voices sibling-landmarks at same measure range.
- **`src/integration/rolesGating.test.ts`** (new, ~10 tests) — drafter-role gate positive + negative: admin can `create_*_draft`, firstchair can, user cannot; demotion mid-draft: firstchair creates + submits, admin demotes to user, original drafter tries to update → error with clear message; `takeover_draft` by new admin/firstchair works; stranded drafts on removed-drafter handled; role-read-from-live-table (JWT staleness doesn't grant access); target picker only shows non-admin users? no — picker shows all roles.
- **`src/integration/movementsWiki.test.ts`** (~12 tests) — wiki edit RPC, revert RPC, version history, rate limit (10/hour), simultaneous-edit race + monotonic `version_number`, authenticated-only write guard, seed migration idempotence (runs twice safely), movement cascade on piece deletion.
- **`src/integration/voting.test.ts`** (~18 tests) — cast_vote +1, cast_vote -1, vote flip (+1 → -1), vote toggle (+1 → clear), rate limit (30 calls/min counting GROSS calls not NET state changes; explicit test: 30 alternating cast+clear → 31st rate-limited), idempotency on repeated same-value cast, `_apply_vote_delta` trigger correctness (insert delta, update delta, delete delta), `vote_tallies` net_score accuracy across complex sequences, RLS (authenticated required, own-rows-only), subject_table enum enforcement, orphan cleanup on subject delete (cascade test: delete landmark, assert votes + tallies cleared), stale-tally fallback (if trigger fails, order falls back to `approved_at ASC`).
- **`src/integration/stacking.test.ts`** (~6 tests) — two landmarks at same anchor render as stack; stack order follows `vote_tallies.net_score DESC`, approved_at ASC tie-break; empty-stack renders empty state; single-member stack renders without cycle affordance; `fetch_ordered_subjects` security-definer RPC returns IDs only (no counts in payload — inspectable via psql, not via client); stacking across subject types (performers_notes + landmarks same piece render separate stacks).
- **`src/integration/sliceBCleanup.test.ts`** (~5 tests) — post-drop regression: bell/queue/digest still work with `performers_note_id` column gone; all Slice A flows (submit → approve → publish → remove) still work; grep-gate: no function body references `performers_note_id`; dual-write logic removed; `_insert_notification` signature updated (new param shape accepted, old shape rejected).

Extend `queueMixedSubjects.test.ts` from Slice B with landmark draft rendering cases.

Extend `src/integration/helpers.ts`: add `seedFirstchairUser()` helper (existing only mints admin). Rev 5 tests use this extensively for role-gate coverage.

Unit tests: flag severity pill variants (visual snapshots under grayscale, protanopia, deuteranopia filters), stack ordering helper, VoteThumbs component states (all 9 per §7.2 matrix, assertions: no numeric count in rendered DOM), movement history modal, `_validate_landmark_payload` parsing (direct plpgsql unit tests via pg_unit or equivalent).

Manual QA checklist (pre-merge):
- Cold-start on throttled mobile profile: stacked landmarks visible `<1s`. Canonical device: iPhone 12 mini on Slow 3G in Chrome DevTools throttling profile.
- Create landmark draft → contributor approves → renders in stack. At same anchor as an existing landmark → ordered correctly.
- Contributor self-publishes landmark → renders immediately.
- Vote on a performer's note → stacking order reflects net_score on refresh. No numeric counts visible anywhere on the page. Confirmed with browser DOM inspection.
- Wiki-edit a movement name → other tab sees the change on refresh. Revert from history → movement name goes back.

---

## 10. Migration plan / rollout

Each step mergeable on its own; each passes tests and does not regress production.

1. **Post-Slice-B cleanup.** `20260426000000_drop_vestigial_performers_note_id.sql`. Strip dual-write branches. Grep-verify zero hits. Prerequisite: Slice B has ≥1 week live traffic.
2. **Movements table + versioning + seed migration.** New migration. `fetchMovementsForPiece` helper lands. Still no consumer.
3. **Movements wiki-edit RPCs + inline edit UI.** `update_movement` + `revert_movement` + `fetch_movement_history`. `MovementEdit.tsx` component. Rendered on piece page header area. Admin sees it; contributors see it; any registered user sees it.
4. **Votes table + materialized view + RPCs + VoteThumbs component.** `cast_vote` + `clear_vote`. `VoteThumbs.tsx` mounted on existing Slice A/B signed content (performer's notes, schools, signed descriptions) — voting lights up on those surfaces first. **No stacking yet**; just the thumbs. Lets the voting system prove out before visual rearrangement depends on it.
5. **Stacking refactor for Slice A/B signed content.** `PerformersNotes.tsx`, `InterpretiveSchools.tsx`, `SignedPieceDescription.tsx` migrate from flat lists to `SignedContentStack.tsx` rendering. Stack ordering reads `vote_aggregates`. SSR'd top-of-stack, lazy-load the rest. Single chevron cycle per §7.5.
5.5. **DESIGN.md token + mini-component updates (design-spec PR).** Per §7.12. FlagPill (3 non-color-dependent variants), VoteThumbs (sizing, states, hit target), StackCycleChevron (with authorship jump list spec), EditableTextPencil (hover-reveal desktop, 40% mobile), user-state highlight pattern. Small PR, lands before Step 6 so implementers have authoritative tokens. Includes updating DESIGN.md's component catalog and adding visual examples.
6. **Slice C schema (landmark aggregate + notifications CHECK extension).** `20260427000000_contributor_pipeline_slice_c.sql`. Views. No RPCs, no UI.
7. **Landmark RPC family (10 RPCs) + admin page.** `20260427000001_contributor_pipeline_slice_c_rpcs.sql`. `/admin/landmarks`. Verifiable via curl / integration tests.
8. **Landmarks piece-page section.** `StructuralLandmarks.tsx`, `LandmarkStack.tsx`, wired into `PiecePageLayout.astro`. SSR'd for `<1s` cold-start. Flag pills, practice notes inline, stacking when multiple contributors at same anchor.
9. **Seed fixtures.** Draft two landmarks from different contributors for the Bach Suite No. 1 Prélude (to demonstrate stacking) + one with flags + practice notes. Seed sample votes to show ordering. Movement edit history for at least one movement.

Total: 9 steps. Steps 4 + 5 introduce voting + stacking to Slices A+B surfaces (which ship first, independent of landmark aggregate). Steps 6-9 add the landmark aggregate + piece-page section. The voting system lands before the landmark section that most depends on it.

---

## 11. Decisions deliberately NOT taken for Slice C

- **No staff vs contributor distinction for authoring/voting/wiki-editing.** Any registered user can author their own content, vote, and wiki-edit movements. `is_contributor` column on `users` becomes vestigial (follow-up cleanup). The existing `role` column (`user`/`firstchair`/`admin`) is the authoritative gate where gating applies.
- **No editorial gatekeeping in the approval queue.** The queue exists solely for byline-owner consent when User A drafts for User B.
- **Drafter-role gate, not draftee-role gate.** Only admins and firstchairs can create drafts for other users. Draftees can be any user role. Regular users always author their own content; they cannot draft for others.
- **No role-assignment UI in Slice C.** Admins promote firstchairs via SQL / direct DB ops for now. Role-management admin surface is a follow-up TODO if elevation velocity becomes a bottleneck.
- **No anonymous voting.** Auth-gated.
- **No public vote count display.** Internal tallies drive stacking; users see only their own current vote state.
- **No separate flag or practice-note subject types.** JSONB payload inside landmark aggregate.
- **No editorial review of wiki movement edits.** Community self-heal via revert.
- **No flag type additions beyond the ten PRD values.** PRD invariant 443.
- **No `/admin/movements`.** In-place wiki edits on the piece page.
- **No cross-piece movement merge.** FK cascade from piece only.
- **No landmark ordinal auto-reshuffle.** Edits create new versions with new ordinals.
- **No vote-based hiding.** Downvotes affect order only, never hide content.
- **No AI-drafted landmarks.** Out of scope.
- **No realtime vote/landmark subscriptions.** Poll-only.

---

## 12. Open questions

Resolved by eng review (moved to decisions):
- ~~Materialized view access~~ → REVOKE-all + security-definer `fetch_ordered_subjects` RPC (§2.5).
- ~~Rate limit semantics~~ → counts GROSS calls, not net state (§4.6). Client debounces double-clicks to 250ms.
- ~~Stack cycle count leak~~ → single chevron + optional jump-list popover (§7.5). No dots, no numbers in default affordance.

Remaining:
- **Self-vote handling.** Owner's vote on their own content counts in ranking. Simple, no abuse mitigation needed at one-contributor-v1 scale. Filter at `fetch_ordered_subjects` if self-boosting patterns emerge.
- **`<1s` cold-start budget with stacking.** Eng review recommends consolidated `fetch_piece_signed_content(p_piece_id)` RPC returning all 4 subject types + tallies in one call. Benchmark on Step 8; if p99 > 400ms server-side, consolidate. Pre-Step-8 benchmark in §9.
- **Seed user for wiki movements.** A system user row (`00000000-...`) attributes initial seed versions. Test in Step 2 that RLS + FK policies accept it.
- **Seed migration reads from `pieces.movements` jsonb or from `seed.ts`?** Eng review recommended reading from `pieces` direct to avoid drift. But `pieces` schema doesn't currently have a `movements` jsonb column. Decision pre-Step-2: either add `pieces.movements jsonb` column as part of Step 2 (and populate from seed.ts as part of that migration), then read from it; OR accept seed.ts as source of truth and add a reconciliation test that fails if production pieces exist without seed.ts entries. Leaning option 1 (adds a column but it's useful for future editable-movements surface anyway).
- **Digest timezone.** Carried from Slice A. 13:00 UTC.

---

## 13. Parallelization strategy

| Step | Modules touched | Depends on |
|------|----------------|------------|
| 1. Slice B cleanup | `supabase/migrations/`, Slice A submit RPCs, `src/lib/*.ts` grep-sweep | Slice B ≥1 week live |
| 2. Movements table + versioning + seed | `supabase/migrations/`, `src/lib/movements.ts` | 1 |
| 3. Movements wiki-edit UI | `supabase/migrations/`, `src/components/MovementEdit.tsx`, piece-page header | 2 |
| 4. Votes table + VoteThumbs on Slice A/B | `supabase/migrations/`, `src/components/VoteThumbs.tsx`, Slice A/B components | 2 (independent of 3) |
| 5. Stacking refactor for Slice A/B signed content | `src/components/SignedContentStack.tsx`, PerformersNotes/InterpretiveSchools/SignedPieceDescription | 4 |
| 6. Slice C schema | `supabase/migrations/` | 2 |
| 7. Landmark RPCs + admin | `supabase/migrations/`, `src/pages/admin/landmarks.astro`, `ContributorContentAdmin` | 6 |
| 8. Landmarks piece-page section | `src/components/StructuralLandmarks.tsx`, `LandmarkStack.tsx`, `PiecePageLayout.astro` | 5, 7 |
| 9. Seed fixtures | `scripts/seed-local-queue.ts` | 8 |

**Lanes:**
- **Lane A (sequential):** 1 → 2 → 6 → 7 (migrations + schema + RPCs)
- **Lane B (after 2):** 3 (wiki edit UI) independent
- **Lane C (after 2):** 4 → 5 (voting + stacking); 5 gates on 4
- **Lane D (after 5 and 7):** 8 (piece-page section)
- **Lane E:** 9 (fixtures) after 8

9 rollout PRs — same count as Rev 1, but substantially different content. Voting + wiki-movements are the new work; three-subject decomposition complexity is gone.

---

## 14. GSTACK REVIEW REPORT

### Phase 1: CEO Review — 2026-04-20 via `/autoplan`

#### Step 0 analysis — Rev 1 premises challenged, Rev 2 adopted

**Premise gate.** Autoplan's single user-facing CEO gate surfaced 6/6-dimension consensus from both outside voices against Rev 1's foundational premises. User response:
- Plural-voices-for-structural-data confirmed as feature, with **voting + stacking** added as the resolution mechanism (new universal capability).
- Decomposition adjusted: **LandmarkPacket aggregate** (one subject, nested children).
- Movements adjusted: **wiki-edit** governance (any registered user, version history + revert) — replaces the editorial-only + `/admin/movements` debate.
- Structural self-publish stays (user's call).

Rev 2 adopts these. Plan body above reflects the revised scope.

#### Step 0.5 — Dual voices (on Rev 1)

**CODEX SAYS (CEO — strategy challenge)** [verdict: RECONSIDER APPROACH on Rev 1]
Flagged 5 strategic misfits with PRD refs. Core concerns resolved in Rev 2:
- (a) Three subjects → collapsed to landmark aggregate. ✓
- (b) Movements materialization premature → now materialized AND governed as wiki-edit. ✓
- (c) Severity coherence → resolved via voting as the ordering mechanism. Severity stays on the flag row. ✓
- (d) Self-publish on structural → user override accepted ("reviewers can eat rocks"). Plural-voices-via-stacking is the resolution. Risk acknowledged.
- (e) 31 RPCs → cut to 16. ✓

**CLAUDE SUBAGENT (CEO — strategic independence)** [verdict: RECONSIDER APPROACH on Rev 1]
Flagged 6 findings. Core concerns resolved in Rev 2:
- Wrong frame on landmarks-as-densest-surface → structural data is scaffolded via wiki-edit movements; signed landmarks now aggregate prose + flags + practice notes. ✓
- Three parallel subjects wrong decomposition → collapsed. ✓
- Self-publish → catalog chaos → voting + stacking resolution. Risk acknowledged per user.
- Severity contributor-judgment backwards → voting resolves the "site can't decide" visual concern. ✓
- 6-month regret 20:1 ratio → voting + wiki-movements add cross-cutting capabilities that benefit Slices A+B too, amortizing the lift. ✓
- Practice notes are the differentiator → now shipped inside the landmark aggregate (one surface, not buried). ✓

#### CEO DUAL VOICES — CONSENSUS TABLE (Rev 1)

```
═══════════════════════════════════════════════════════════════════════
  Dimension                                 Claude   Codex   Consensus
  ─────────────────────────────────────────  ───────  ───────  ─────────
  1. Premises valid?                         NO       NO       DISAGREE PLAN
  2. Right problem to solve?                 NO       NO       DISAGREE PLAN
  3. Scope calibration correct?              NO       NO       DISAGREE PLAN
  4. Alternatives sufficiently explored?     NO       NO       DISAGREE PLAN
  5. Competitive/market risks covered?       NO       Partial  DISAGREE PLAN
  6. 6-month trajectory sound?               NO       NO       DISAGREE PLAN
═══════════════════════════════════════════════════════════════════════
6/6 dimensions → RECONSIDER APPROACH (resolved via Rev 2 restructure)
```

#### Phase 1 outputs

- ✓ Premise challenge (0A)
- ✓ Existing code leverage map (0B)
- ✓ Dream state diagram (0C)
- ✓ Implementation alternatives (0C-bis) — 4 options presented, option 2 (LandmarkPacket) selected by user
- ✓ Mode selection (0F) — SELECTIVE EXPANSION with premise-change expansion applied
- ✓ Temporal interrogation (0E)
- ✓ Dual voices — both ran, consensus table produced
- ✓ User premise gate — answered, scope revised, plan rewritten as Rev 2

#### What's NOT in scope (CEO decision)

- Vote analytics admin dashboard (deferred to follow-up TODO)
- Anonymous voting
- Voting on flags/practice_notes individually (they're children of landmarks)
- AI-drafted landmarks
- Recordings-around-landmark-tempi (entity doesn't exist)
- Passage-level edition comparison (tracked separately)

#### What already exists (CEO leverage)

- Slice A: state machine, versioning, RPC shape, bell, queue, admin, digest, email templates, integration test harness
- Slice B: polymorphic notifications pivot, `_insert_notification` helper, `ContributorContentAdmin` generic component, subject-agnostic queue/bell/digest
- Existing: React islands pattern, Astro SSR, RLS policy shape, Claude-kit design tokens

### Phase 2: Design Review — 2026-04-20 via `/autoplan`

#### Claude Design Subagent (independent — Rev 2, Rev 3 revision pending)

[verdict on Rev 2: **REVISE**, overall 4.5/10]

Litmus scorecard on Rev 2:
| Dimension | Score |
|-----------|-------|
| 1. Information architecture | 5/10 |
| 2. Interaction state coverage | 3/10 |
| 3. User journey & emotional arc | 4/10 |
| 4. AI slop risk (higher = cleaner) | 8/10 |
| 5. Design system alignment | 4/10 |
| 6. Responsive + accessibility | 3/10 |
| 7. Unresolved decisions | 5/10 |

Findings addressed in Rev 3 (this doc now §7.1–§7.13):
- **IA gap (§7.1 added)** — explicit reading order for landmark cards + movement headers.
- **State coverage gap (§7.2 added)** — component state matrix for VoteThumbs, cycle, MovementEdit, target picker.
- **Sea-of-thumbs (§7.4)** — hover/tap-reveal mitigation.
- **Dot-pagination contradiction (§7.5)** — replaced with single chevron + optional long-press authorship jump list.
- **14-field landmark form (§7.6)** — progressive disclosure.
- **Wiki-edit collision + mobile (§7.7)** — modal not inline.
- **Practice-note plurality (§7.8)** — clarified: via sibling landmarks, not intra-landmark stacking.
- **Flag severity color-blind a11y (§7.3)** — weight/border/prefix replaces color density.
- **Mobile + a11y specs (§7.10)** — explicit breakpoints, keyboard nav, touch targets, reduced motion.
- **DESIGN.md updates required (§7.12 + rollout Step 5.5)** — design-spec PR before UI lands.
- **Drafter-role discovery (§7.9)** — helper copy for target picker.

Findings that became N/A after the drafter/draftee inversion fix:
- "Role change side effects for Haji" — no role bump needed under corrected drafter-role gate.

#### Codex Design Voice (Rev 3, after Claude subagent findings absorbed)

[verdict: **REVISE**, overall 5.0/10]

Litmus scorecard on Rev 3 as reviewed:
| Dimension | Score |
|-----------|-------|
| 1. Reading order practicality | 6/10 |
| 2. State matrix completeness | 4/10 |
| 3. Flag pill legibility | 3/10 |
| 4. Sea-of-thumbs discoverability | 4/10 |
| 5. Stack cycle clarity | 4/10 |
| 6. Landmark form ergonomics | 6/10 |
| 7. Wiki-edit modal decision | 8/10 |
| 8. Responsive + a11y depth | 5/10 |
| 9. DESIGN.md token completeness | 5/10 |

Codex findings addressed in Rev 4 (this doc now):
- **Byline prominence** (§7.1) — byline moved to prominent strip directly under label; footer now just infrastructure (PRD signed-voice conflict resolved).
- **Cross-reference bug** (§7.1) — movement history/edit links corrected to point to §7.7.
- **VoteThumbs state contradiction** (§7.2) — unified under hover/tap-reveal canonical rule from §7.4; added auth-loading / rate-limited / offline / `aria-pressed` states; clarified filled state uses success-emphasis token (not purple accent).
- **Flag pill differentiation + purple collision** (§7.3) — severity now uses its own token family (neutral-warm notable, ink-dark significant), 0.5px borders (DESIGN.md discipline), 12px font (up from 11px), two weights (DESIGN.md two-weight rule), plus open/filled/no-dot prefix for grayscale-safe distinction.
- **Sea-of-thumbs discoverability** (§7.4) — added persistent `⋯` hint always visible; one-time coachmark on first card interaction.
- **Long-press discoverability** (§7.5) — replaced with visible jump-list button (⋮) when stack ≥3; added `aria-live="polite"` announcement on cycle.
- **Landmark form pre-fill** (§7.6) — context-aware pre-fill from piece-page entry hides piece+movement selectors; admin-drafting entry shows them.
- **Focus trap + inert background** (§7.7) — explicit focus trap spec for edit + history modals, background `inert`.
- **Color-blind test spec** (§7.10) — axe-core automation + Coblis manual + grayscale survival tests explicit in the pre-merge checklist.
- **DESIGN.md token completeness** (§7.12) — added severity-token family, opacity tokens, motion tokens, z-layer tokens, hit-area tokens, vote-own token; added OneTimeCoachmark + PersistentHintEllipsis + FocusTrappedModal as named components.
- **Drafter helper copy** (§7.9) — strengthened to name the firstchair/admin role + explicit consent mechanic.

#### DESIGN DUAL VOICES — CONSENSUS TABLE

```
═══════════════════════════════════════════════════════════════════════════════
  Dimension                                 Claude  Codex  Consensus post-Rev 4
  ─────────────────────────────────────────  ──────  ──────  ────────────────────
  1. IA practicality                         5/10    6/10   ADDRESSED (§7.1)
  2. State matrix completeness               3/10    4/10   ADDRESSED (§7.2)
  3. Flag pill legibility / severity         —       3/10   ADDRESSED (§7.3)
  4. Sea-of-thumbs discoverability           —       4/10   ADDRESSED (§7.4)
  5. Stack cycle clarity / discoverability   —       4/10   ADDRESSED (§7.5)
  6. Landmark form ergonomics                —       6/10   ADDRESSED (§7.6)
  7. Wiki-edit modal / focus trap            —       8/10   ADDRESSED (§7.7)
  8. Responsive + a11y + color-blind tests   3/10    5/10   ADDRESSED (§7.10)
  9. DESIGN.md token + component spec        4/10    5/10   ADDRESSED (§7.12)
  Overall (pre-Rev 4)                        4.5/10  5.0/10  Rev 4 pending re-review
═══════════════════════════════════════════════════════════════════════════════
All specific findings from both reviewers incorporated into Rev 4 §7.1-§7.13.
A second Codex pass on Rev 4 is a "nice to have" — can gate via /design-review
post-implementation rather than a third planning-phase loop.
```

| Reviewer | Status | Findings | Verdict |
|----------|--------|----------|---------|
| plan-ceo-review (Rev 1) | ✓ ran | Premise challenge flagged | RECONSIDER → resolved in Rev 2/3 |
| codex challenge CEO (Rev 1) | ✓ ran | 5 strategic misfits | RECONSIDER → resolved in Rev 2/3 |
| plan-design-review Claude subagent (Rev 2) | ✓ ran | 15 findings, 4.5/10 | REVISE → addressed in Rev 3 §7.1-§7.13 |
| plan-design-review Codex (Rev 3) | ✓ ran | 10 findings, 5.0/10 | REVISE → addressed in Rev 4 |
| plan-eng-review Claude subagent (Rev 4) | ✓ ran | 10 findings, 2 critical | REVISE → addressed in Rev 5 |
| plan-eng-review Codex (Rev 4) | ✓ ran | 9 findings, 3 HIGH | REVISE → addressed in Rev 5 |

### Phase 3: Eng Review — 2026-04-20 via `/autoplan`

#### Claude Eng Subagent (Rev 4)

[verdict: **REVISE**, 10 findings: 2 critical, 2 high, 5 medium, 1 low]

Critical findings (BOTH voices):
1. **Materialized view refresh thrashing** — `refresh concurrently` on every vote doesn't scale. Fix applied in Rev 5 §2.5: replaced MV with trigger-maintained `vote_tallies` table using `_apply_vote_delta` (incremental upsert per vote, O(1)).
2. **Orphaned polymorphic votes on subject delete** — no FK possible (polymorphic), need parameterized triggers. Fix applied §2.5: `_clear_votes_on_subject_delete` trigger attached to all 4 subject tables.

High findings addressed:
3. **vote_aggregates RLS unresolved** → resolved in Rev 5 §2.5: REVOKE-all + `fetch_ordered_subjects` SECURITY DEFINER RPC returning IDs only.
4. **JSONB validation unspecified** → shared `_validate_landmark_payload` helper added §4.7 with enum-cast validation.

Medium findings addressed:
5. **JWT staleness** → §4.4 explicit: `_require_drafter_role` reads live `public.users.role`, never JWT.
6. **SSR query shape** → §12 open question + Step 8 benchmark; p99 <400ms server-side target, consolidation path if exceeded.
7. **Seed migration drift** → §12 decision pre-Step-2: add `pieces.movements jsonb` column OR reconciliation test.
8. **Rate limit semantics** → §4.6 GROSS calls not net; client debounces.
9. **Test coverage gaps** → §9 expanded to ~75 tests; new `rolesGating.test.ts` file, JSONB negative-path tests, orphan cleanup tests, stale-fallback tests.
10. **Helper reuse drift** → §4.4 retires `_require_active_contributor`, adds `_require_authenticated` + `_require_drafter_role`.

#### Codex Eng Voice (Rev 4)

[verdict: **REVISE**, 9 findings: 3 HIGH, 4 MEDIUM, 2 MEDIUM+]

Convergent with Claude on: MV refresh (F1), vote orphans (F2), JSONB validation (F5), rate limits/tests/SSR/security-definer (F6-F8), movements migration drift (F9).

**Unique to Codex (critical addition):**
- **F3 Step 1 FK drop migration-order fragility** — just dropping the column breaks RPCs still referencing it. Fix applied Rev 5 §2.1: ordered migration rewrites `_insert_notification` + all caller RPCs FIRST, then drops the column, with a CI grep gate.
- **F4 Drafter-role demotion strand** — demoted drafters strand their drafts. Fix applied Rev 5: new `takeover_draft` RPC (§4.8) lets any admin/firstchair pick up a stranded draft. `§1.0` updated.

#### ENG DUAL VOICES — CONSENSUS TABLE

```
═══════════════════════════════════════════════════════════════════════════════
  Dimension                                 Claude  Codex  Consensus (post-Rev 5)
  ─────────────────────────────────────────  ──────  ──────  ──────────────────────
  1. MV refresh design                       CRIT    HIGH   FIXED (trigger-tally)
  2. Vote orphan cleanup                     CRIT    HIGH   FIXED (per-subject trigger)
  3. Step 1 migration order                  —       HIGH   FIXED (ordered rewrites)
  4. Drafter demotion strand                 MED     HIGH   FIXED (takeover_draft RPC)
  5. JSONB validation                        HIGH    MED    FIXED (_validate helper)
  6. Test coverage gaps                      MED     MED    FIXED (+15 tests)
  7. SSR <1s query shape                     MED     MED    OPEN (benchmark Step 8)
  8. vote_aggregates RLS                     HIGH    MED    FIXED (security-definer only)
  9. Seed migration drift                    MED     MED    OPEN (§12 decision pre-Step-2)
  10. JWT staleness docs                     MED     (impl) FIXED (§4.4 explicit)
  11. Rate limit semantics                   MED     (impl) FIXED (§4.6 gross)
═══════════════════════════════════════════════════════════════════════════════
9 findings fixed inline; 2 open questions deferred (SSR benchmark + seed drift decision).
Rev 5 is substantially more implementer-ready than Rev 4.
```

#### Phase 3 outputs

- ✓ Scope challenge (§0 Revision history documents 4 revs driven by review)
- ✓ Architecture ASCII diagram (deferred — current §2 has inline schema; eng review did not flag missing; can be added as a §2.0 preface in Step 2 if helpful)
- ✓ Test plan (§9 expanded to ~75 tests, ~153 total integration)
- ✓ Error & Rescue Registry (covered inline per-subject in §8 edge cases + §7.2 state matrix)
- ✓ Failure modes registry (distributed across §7.2 + §8)
- ✓ "NOT in scope" section (§11)
- ✓ "What already exists" section (§0 Revision history + Slice A/B leverage explicit throughout)
- ✓ Completion summary — see below
- ✓ Dual voices both ran + consensus table

#### Eng completion summary

| Mode | SELECTIVE EXPANSION (premise gate passed Rev 1, scope-restructured Rev 2-5) |
|------|----|
| Step 0 — scope challenge | Revision count drove complexity down; MV→tally + JSONB nesting cut risk |
| Section 1 (Architecture) | 11 issues flagged by reviewers, 9 fixed, 2 deferred to Step 8 benchmark |
| Section 2 (Errors) | Per-subject cleanup triggers + validation helper added |
| Section 3 (Security) | vote_aggregates locked to security-definer, role gates read live users table |
| Section 4 (Data/UX) | 15 edge cases captured in §8 |
| Section 5 (Quality) | Helper reuse explicit in §4.4, no duplication |
| Section 6 (Tests) | 75-test target, covers role gates + orphans + JSONB + stale fallback |
| Section 7 (Perf) | SSR benchmark Step 8; p99 < 400ms server-side target |
| Section 8 (Observ) | Rate-limit log + wiki edit audit + vote trigger correctness in test scope |
| Section 9 (Deploy) | Step 1 ordered migration with CI grep gate; Step 2 reconciliation test |
| Section 10 (Future) | Reversibility: vote system 3/5 (tally table is isolated); wiki movements 2/5 (cross-cutting) |
| Section 11 (Design) | Covered by Phase 2 Design review |
| Unresolved | 2 open questions (SSR benchmark + seed migration source) |

| Reviewer | Status | Findings | Verdict |
|----------|--------|----------|---------|
| plan-ceo-review (Rev 1) | ✓ ran | Premise challenge flagged | RECONSIDER APPROACH → adopted in Rev 2/3 |
| codex challenge CEO (Rev 1) | ✓ ran | 5 strategic misfits | RECONSIDER APPROACH → adopted in Rev 2/3 |
| plan-design-review Claude subagent (Rev 2) | ✓ ran | 15 findings, 4.5/10 | REVISE → addressed in Rev 3 §7.1–§7.13 |
| plan-design-review Codex (Rev 3) | running | — | — |
| plan-eng-review (Rev 3) | pending | — | — |
