# TODOS

Tracked work for Irregular Pearl, organized by component and sorted by priority. See PRD.md for tier definitions and DESIGN.md for the design system.

---

## Data model (PRD Tier 1)

### Contributor pipeline — Slice C (landmarks + PracticeNote + flags)

**What:** Add `landmarks` (movement, measure range, label, ordinal), `flags` (controlled vocabulary, severity, instrument specificity), and `practice_notes` (signed prose attached to landmarks). PracticeNotes route through the Slice A pipeline; landmarks + flags are editorially-owned structural data (not contributor-signed per-row).

**Why:** Landmarks is "the densest information surface on the piece page and the place where the site's expertise is most visibly load-bearing" (PRD). Without these entities there is no Tier 1 piece page.

**Context:** Flag vocabulary is governed by the Editorial Director per PRD — start with the PRD list (stamina, bow control, stretch, voicing, double stops, sustained bowing, articulation, rhythmic lift, intonation, ensemble coordination) and keep it as a code-defined enum, not a user-editable table. Signed practice notes reuse Slice A's pipeline — the approval queue and bell already show "a draft awaits your review" for any subject type added to the `notification_type` enum.

**Effort:** L
**Priority:** P1
**Depends on:** Slice A (shipped), Slice B (shipped)

---

## Piece page (PRD Tier 1)

### Recordings CRUD UI (wiki-edit)

**What:** Extend `RecordingsList.tsx` with the end-of-row pencil/×/↑/↓ controls and an "+ Add recording" modal. Backing RPCs (`create_external_link`, `update_external_link`, `delete_external_link`, `swap_external_link_ordinals`) already shipped in `20260508000000_external_links_wiki_crud.sql`. Filter rows to the recording subset of link types (`youtube | vimeo | spotify | internet_archive | soundcloud | bandcamp`).

**Why:** Deferred from the Slice-C-Step-4 / wiki-edit push (the parallel PR brought CRUD to Editions + External references). Recordings is next in the same pattern and shares the underlying `external_links` schema + RPCs.

**Context:** `RecordingsList.tsx` currently collapses each recording row and mounts an iframe on expand. Layering CRUD in-place needs care: edit/delete controls should live on the header row (visible when collapsed) and not reach inside the iframe panel. Follow `ExternalRefsList.tsx` for the pattern; reuse the same shared `SignInPrompt` and `ed-ctrls` CSS.

**Effort:** S
**Priority:** P2
**Depends on:** None (schema + RPCs shipped)

### Pedagogical arc CRUD UI + piece picker

**What:** Build `PedagogicalArcList.tsx` (two subsections: "Prepare with" and "Natural next") with CRUD affordances per row. Needs a piece-picker autocomplete over `public.pieces` so contributors can select the related piece. Backing schema (`pedagogical_connections` table) and RPCs (`create_pedagogical_connection`, `update_pedagogical_connection`, `delete_pedagogical_connection`, `swap_pedagogical_ordinals`) already shipped in `20260509000000_pedagogical_arc.sql`.

**Why:** Piece page Tier 1 calls for the pedagogical arc. Schema + RPCs landed in the Slice-C-Step-4 / wiki-edit push; UI was deferred because the picker UX deserves its own design pass.

**Context:** Autocomplete matches existing `Autocomplete.tsx` pattern (if it covers pieces) or a new piece-scoped search. Per-row layout: `→ {related_piece.title}` with optional short note line below; reorder within section only (not across prepare/natural-next).

**Effort:** M
**Priority:** P2
**Depends on:** None (schema + RPCs shipped)



### Redesign piece page per PRD revision 2

**What:** Restructure the piece page into the sections PRD describes: header + difficulty panel, signed performer's notes, structural landmarks with flags and practice notes, interpretive schools grid, editions with passage comparison, recordings around landmark tempi, pedagogical arc.

**Why:** The Claude-kit port (v0.1.0) stood up the 9-section shell and Slices A + B lit up signed performer's notes, interpretive schools, and signed piece descriptions with real data. Still missing: structural landmarks + flags + practice notes (Slice C), edition passage comparison, recordings-around-landmark-tempi wiring, and the pedagogical arc. It is the atomic surface of the product per PRD.

**Context:** One responsive page, not two. Content, ordering, and hierarchy shared across viewports; narrow viewports reflow multi-column sections into stacks. Cold-start to structural landmarks under one second on a three-year-old phone on cellular is a Tier 1 perf target. Use `/design-shotgun` or `@agent-designer` to generate layout mockups honoring DESIGN.md tokens before coding.

**Effort:** L
**Priority:** P1
**Depends on:** Structural landmarks + flags schema (Slice C)

### Edition comparison at measure level

**What:** Passage-level comparison UI. Initially two or three iconic passages per piece, each column shows one edition's editorial reading with signed observations. "At a glance" band characterizes each edition's stance.

**Why:** "Lets a musician make an informed edition choice for a piece they are preparing." The signed observations are the core of the value, not the passage images.

**Context:** No image reproduction of engraved pages — we describe editions, we do not reproduce them. Sample references are editorial observations. Contributor-proposed passage additions are Tier 2.

**Effort:** M
**Priority:** P2
**Depends on:** Contributor approval pipeline

---

## Personal library (PRD Tier 1)

### Extend `working_on` into the personal library dashboard

**What:** Expand the existing `working_on` concept into the full library: pieces currently preparing (pinned), assigned by teacher, upcoming performances with dates, pieces performed, chronological feed of private reflections.

**Why:** The library "replaces their paper notebook, their iPad margins, their Google Sheet of upcoming performances, and their scattered browser tabs." It is the personal-memory layer and the long-run contributor pipeline.

**Context:** Reflections are piece-attached, optionally measure-range anchored, private by default, with a publish pipeline that routes through the contributor approval flow. UI must make jotting a reflection take under thirty seconds from the relevant piece page.

**Effort:** L
**Priority:** P2
**Depends on:** Contributor approval pipeline

---

## Cleanup

### Remove `discussions` table and code references

**What:** Drop the `discussions` table, RLS policies, and any remaining discussion-surface code.

**Why:** PRD "What Irregular Pearl is not": "Not a social network... a public discussion feed, forum, or comment section" is on the "will not build, in any tier" list. The table contradicts a load-bearing PRD invariant.

**Context:** Earlier cleanup in PR #17 removed most legacy features but left this table. Write a migration (drop table + related policies + any dead realtime entries) and delete related seed helpers if any remain.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Adopt DESIGN-REFERENCES.md as the taste compass companion

**What:** Create `DESIGN-REFERENCES.md` from the references doc (NYT graphics desk, Stripe docs, Grove Music, museum catalogs, anti-references, anchor phrases for prompting). Cross-link from DESIGN.md and CLAUDE.md.

**Why:** The system defines rules, the references define the feeling. Having both documented gives future design sessions a clear second source of truth and specific verbatim anchor phrases that reliably pull AI toward the right register.

**Context:** Source material is at `/Users/jspkm/Downloads/design-references.docx`. Complementary, not replacement. Keep DESIGN.md authoritative for tokens; DESIGN-REFERENCES.md authoritative for taste.

**Effort:** S
**Priority:** P3
**Depends on:** None

---

## Contributor pipeline (post-Slice-A)

### Drop vestigial `is_contributor` + `contributor_active` columns on `users`

**What:** Cleanup migration to drop `users.is_contributor` and `users.contributor_active`. Both are now unused as gates — Slice C governance (PR #56, 20260513000000_open_self_authoring.sql) rewrote `_require_active_contributor()` to require only auth, and the 3 staff-drafts-for-other RPCs check only that the target user exists. The columns remain purely as an editorial marker that nothing reads.

**Why:** The old flagged-contributor posture is gone — any registered user can self-author. Keeping vestigial columns invites regression (a future code path might re-adopt them). Dropping them makes the schema state match the governance state.

**Context:** Audit `supabase/migrations/` and `src/` for any remaining `is_contributor` / `contributor_active` references before dropping. `scripts/seed-contributor.ts` currently sets them; keep the script but have it set only the bio fields and `role`. One migration, one script patch, grep sweep to verify zero runtime references.

**Effort:** S
**Priority:** P3
**Depends on:** Slice C governance (shipped in #56)

### Diff block in NotificationsQueue

**What:** Render a line-level diff in the approval queue against the most recently approved version of the same note. Uses the `diff` npm package (tree-shakes cleanly). Visible when a pending draft is a revision after a prior rejection or an earlier published state.

**Why:** Deferred from Slice A per Codex review — for v1 with H. only, diff block adds dep + test surface for limited decision value. Once rejections become common enough that H. wants a direct comparison against the prior reading, the diff block shortens the review cycle.

**Context:** Add to `src/components/NotificationsQueue.tsx`. Fetch prior version body via an `/api/performers-notes/[id]/versions` endpoint (new, read-only, gated by owner contributor + staff). Render inline above the current body. Small enough for a follow-up PR, large enough it didn't belong in Slice A.

**Effort:** S
**Priority:** P3
**Depends on:** Slice A (shipped first)

---

## Completed

### Profile sidebar + Settings (Appearance theme picker) + Logout

**What:** Avatar click on the navbar now opens `/profile/:id` inside a new [ProfileShell.tsx](src/components/ProfileShell.tsx) — left vertical nav (Profile / Setting / Logout) plus the existing `ArtistProfile` on the right. Anonymous or other-user views bypass the shell and render the single-column profile unchanged. Setting → Appearance shows three SVG preview cards ([AppearanceSettings.tsx](src/components/AppearanceSettings.tsx)): Light / System (split-diagonal preview) / Dark. Choice persists in `localStorage.theme`; a pre-paint inline script in [Layout.astro](src/layouts/Layout.astro) applies `html[data-theme="dark"]` before render to avoid FOUC. Logout calls `supabase.auth.signOut()` (added to [useAuth.ts](src/lib/useAuth.ts)) and redirects home. Profile header swapped from initials-in-cream-circle to `GenerativeAvatar` + `email.split('@')[0]` display name so the page header matches the navbar avatar/tooltip.

**Why:** User ask — a dedicated place to change appearance and sign out, without crowding the navbar.

**Context:** Dark palette in [global.css](src/styles/global.css) is provisional (DESIGN.md called out Phase 2); `piece-page.css` `.diff-panel` / `.school` / `.ed` flipped from `background: #fff` to `var(--bg)` so they render on the dark surface. Other components using hardcoded hex will need per-surface migration as they're touched. `accent-soft` was dropped from `#F2EEF5` → `#F4F3F5` (near-neutral grey) so the active sidebar item reads quiet rather than lavender.

**Effort:** S
**Priority:** P1
**Completed:** 2026-04-20

### Open self-authoring to any registered user (Slice C governance relaxation)

**What:** Rewrote `_require_active_contributor()` to require only `auth.uid() is not null` — 19 self-publish + approval-queue RPCs inherited the relaxation automatically. The 3 staff-draft-for-other RPCs dropped their "target must be flagged contributor" check in favor of "target must exist in public.users". On the UI side, the `canWrite` gate in [PerformersNotes.tsx](src/components/PerformersNotes.tsx), [InterpretiveSchools.tsx](src/components/InterpretiveSchools.tsx), and [SignedPieceDescription.tsx](src/components/SignedPieceDescription.tsx) dropped the `isContributor` check; write entries render unconditionally; anon click opens `SignInPanel` (shared pattern with MovementsList / EditionsList / VoteThumbs).

**Why:** PRD rev 2 and [PLAN-contributor-pipeline-slice-c.md §1.0](PLAN-contributor-pipeline-slice-c.md) moved the site from "one-flagged-contributor" to "any-registered-user === contributor". Slice C Step 1 (#48) shipped the cleanup half; this PR ships the governance half. Ownership is still enforced inside each edit/remove RPC via `where contributor_id = auth.uid()`, so relaxing the caller gate doesn't let user A edit user B's row.

**Context:** One migration ([20260513000000_open_self_authoring.sql](supabase/migrations/20260513000000_open_self_authoring.sql)), three React components, three integration tests flipped from "normal user cannot publish" to "any registered user can publish" (with `contributor_id + status` verification). `users.is_contributor` + `contributor_active` columns remain in the schema as an unused editorial marker — tracked as P3 follow-up above.

**Effort:** S
**Priority:** P1
**Completed:** 2026-04-20 (PR #56)

### Backfill seed movements so wiki-edit renders

**What:** Hotfix migration ([20260512000000_backfill_seed_movements.sql](supabase/migrations/20260512000000_backfill_seed_movements.sql)) that inserts the 69 seed movements across 18 pieces plus their version-1 rows. Slice C Step 2 (#51) shipped the `movements` table as schema-only with population deferred to `bun run supabase/seed.ts`; CI applies migrations but never ran seed.ts, so production's table stayed empty and every piece page fell back to the read-only `seedMovements` branch in [MovementsList.tsx](src/components/MovementsList.tsx). The pencil / ↑↓ / × controls never appeared anywhere.

**Why:** Surface bug — the wiki-edit capability shipped in #52 was invisible in production. Fix had to be self-applying (CI auto-apply) rather than a manual seed run so every env stays correct.

**Context:** Temp table with the 69 literal rows, three DML statements (CTE races made a single `WITH ... UPDATE` return `UPDATE 0` on first try, split explicitly), fully idempotent via `NOT EXISTS (piece_id, ordinal) WHERE deleted_at IS NULL` — safe to re-run, cannot overwrite any movement a user edited between deploys.

**Effort:** S
**Priority:** P0 (live bug)
**Completed:** 2026-04-20 (PR #55)

### Drop vestigial `notifications.performers_note_id` + remove dual-write (Slice C Step 1)

**What:** Post-Slice-B cleanup migration ([20260426000000_drop_vestigial_performers_note_id.sql](supabase/migrations/20260426000000_drop_vestigial_performers_note_id.sql)) that dropped the narrow FK column kept vestigial during the polymorphic pivot, plus a sweep through the three performer's-notes submit RPCs to strip the `performers_note_id` insert. Every notification row now lives on `(subject_table, subject_id)` only.

**Why:** The Slice B pivot landed dual-write so existing rows kept working during the vestigial window. Once both codepaths resolved cleanly, the column became pure scaffolding and blocked clean landmark notifications in Slice C.

**Context:** One migration, one RPC sweep. Shipped as Slice C Step 1 (PR #48) before any of the subsequent movements / voting / wiki-edit work.

**Effort:** S
**Priority:** P2
**Completed:** 2026-04-20 (PR #48)

### Contributor approval pipeline — Slice B (InterpretiveSchool + signed PieceDescription)

**What:** Two more signed content types now flow through the Slice A pipeline. New tables `interpretive_schools` + `interpretive_school_versions` and `piece_descriptions` + `piece_description_versions`, each with the same six-audit-column trail and append-only versioning. 23 new security-definer RPCs (11 per subject + a school-metadata updater) reuse the Slice A state machine unchanged. Polymorphic notifications pivot — `notifications.performers_note_id` stays vestigial alongside new `subject_table text + subject_id uuid` columns with a partial unique index; Slice A RPCs dual-write during the vestigial window. Queue, bell, admin, and daily digest all went subject-agnostic in one pass (Step 3 refactor). The old `PerformersNotesAdmin` was extracted into a generic `ContributorContentAdmin` component mounted from three admin pages. New piece-page sections: `InterpretiveSchools` grid + `SignedPieceDescription`, both in the DESIGN.md signed-notes pattern. Integration test tier grew from 30 to 78 tests covering the new state machines, RLS, mixed-subject queue rendering, and the pivot invariants.

**Why:** Schools are the plural-voices surface PRD names as the site's editorial signature — "when two respected musicians disagree, both show signed, neither as canonical." Without them, the piece page was one voice per piece. Signed piece descriptions give long-form interpretive judgment its own home without collapsing the short unsigned reference copy. The polymorphic pivot was paid now because three subject types by end-of-slice made narrow-FK notifications ugly to extend.

**Context:** Full design in [PLAN-contributor-pipeline-slice-b.md](PLAN-contributor-pipeline-slice-b.md). Shipped as 6 rollout steps across PRs #42–#45, each independently reviewable: (1) schema + dual-write, (2) shared RPC helpers + both RPC families, (3) queue/bell/digest refactor to subject-agnostic reads, (4) schools admin + queue card + piece-page section, (5) piece-description admin + queue card + piece-page section + unsigned-metadata-strip treatment, (6) dev fixtures. Follow-up tracked: drop vestigial `notifications.performers_note_id` and remove dual-write after one week of live traffic.

**Effort:** M (shipped as 6 rollout steps)
**Priority:** P1
**Completed:** v0.1.0 (2026-04-20)

### Contributor approval pipeline — Slice A (PerformersNote)

**What:** End-to-end pipeline for the first signed content type. Three tables (`performers_notes`, `performers_note_versions`, `notifications`), one audit view, 12 security-definer RPCs with integrated auth + state-machine + versioning + notification lifecycle, an approval queue at `/notifications`, a staff admin view at `/admin/performers-notes`, piece-page render in the signed-notes pattern with contributor self-authoring + edit + remove affordances, a navbar bell with badge + popover, and a daily email digest via new Supabase Edge Function + GitHub Actions cron at 13:00 UTC. 30 integration tests + 20 email-template unit tests all green. Haji Kim seeded as the first active contributor.

**Why:** The PRD invariant "no content publishes under a contributor's byline without explicit in-app approval" was the gating item for every other signed-content surface. Slice A proves the pattern on the simplest subject (performer's notes, piece-level, no landmarks dependency); Slice B (schools + substantive descriptions) and Slice C (landmarks + practice notes) reuse the same RPCs, notification layer, bell, and queue with new subject tables.

**Context:** Full design in [PLAN-contributor-pipeline-slice-a.md](PLAN-contributor-pipeline-slice-a.md). The Plan + PRD passed interactive engineering review plus an independent Codex challenge before any code landed. Side-wins: local Supabase dev workflow now documented and works end-to-end (closed a separate TODO); four pre-existing migrations patched to be replayable from a fresh DB; shared email template in Claude-kit aesthetic now consumed by both weekly digest (re-skinned from amber) and new daily digest. PRs #27–#40 (#36 was a parallel pre-existing-test-failure cleanup).

**Effort:** L (shipped as 8 rollout steps, each independently reviewable)
**Priority:** P1
**Completed:** v0.1.0 (2026-04-20)

### Port Claude kit piece page + adopt kit aesthetic tokens

**What:** Adopted the Claude design kit's aesthetic direction as canonical: purple accent, white primary, Source Serif 4 editorial, 0.5px borders, eight-size type scale. Swept inline hex and font references across `src/` and email templates. Ported the kit's piece page HTML into `PiecePageLayout.astro` with `piece-page.css`, wiring the curated 19-piece catalog into the 9 PRD Tier 1 sections. Sections without schema (performer's notes, per-movement landmarks, schools, pedagogical arc) show empty-state copy.

**Why:** Building the piece-page redesign against the kit's IA + tokens is cleaner than reskinning. Kit's museum-catalog register fits the PRD "reference surface, not product chrome" posture. Unblocks the Tier 1 piece page without waiting for the contributor + landmark + school schemas — those sections render empty states until the data layer catches up.

**Effort:** L
**Priority:** P1
**Completed:** v0.1.0 (2026-04-19)

### Catalog reset to curated editorial spine (PRD rev 2)

**What:** Wiped the OpenOpus-imported breadth catalog (~7,829 scraped stubs) and replaced with 19 hand-authored cello-forward pieces. Deleted the seed-expansion files and scraper scripts that produced the breadth catalog. Supabase `pieces` truncate-cascades on deploy; FK-linked rows drop with it.

**Why:** PRD rev 2 "narrow scope, deep craft" — H.'s daily-use loop is cellist repertoire, not a 7,829-piece scrape. Building the piece-page redesign against 19 real target pieces forces depth-first design (landmarks, performer's notes, schools populated for real), not breadth-first empty-state patterns.

**Effort:** L
**Priority:** P1
**Completed:** v0.1.0 (2026-04-19)

### Sans family switch to Inter + wordmark rendered as `IrregularPearl`

**What:** Body/UI sans family moved from DM Sans to Inter. Wordmark switched from Instrument Serif italic `Irregular Pearl` to Inter medium non-italic `IrregularPearl` across navbar, layout footer, admin header, emails, and `public/logo.svg`. Landing and About pages cleaned of residual italic + `font-display`.

**Why:** User preference. Consolidates the interface voice into one family and clarifies the wordmark/prose split (`IrregularPearl` as brand mark, `Irregular Pearl` in prose).

**Effort:** M
**Priority:** P1
**Completed:** v0.1.0 (2026-04-19)

### Piece page documented as one responsive surface

**What:** Reversed DESIGN.md principle 7 and merged PRD "Piece page, desktop" + "Piece page, mobile" into a single "Piece page" entry. The `<1s` landmarks cold-start target moved into the shared page as a Tier 1 perf target.

**Why:** Maintaining two piece-page products doubles the work and drifts the information architecture. One responsive surface keeps content, ordering, and hierarchy shared across viewports.

**Effort:** S
**Priority:** P2
**Completed:** v0.1.0 (2026-04-19)

### Guard realtime publication drops in legacy-features migration

**What:** Rewrote the five `alter publication supabase_realtime drop table if exists ...` lines as a `do $$` block that checks `pg_publication_tables` before each drop.

**Why:** Postgres does not accept `IF EXISTS` on `ALTER PUBLICATION ... DROP TABLE`. The migration was applied to prod on 2026-04-19; this commit aligned the file with what was actually executed.

**Effort:** S
**Priority:** P0
**Completed:** v0.1.0 (2026-04-19)

### PRD revision 2 scope cleanup — remove legacy features

**What:** Removed applause, discussions (UI only, table still exists), activity log, events, community directory. Artist profile reduced to minimal bio + instruments.

**Why:** Scope narrowed to the piece-page-centric knowledge base per PRD revision 2.

**Effort:** L
**Priority:** P1
**Completed:** v0.1.0 (2026-04-19)
