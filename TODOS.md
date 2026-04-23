# TODOS

Tracked work for Irregular Pearl, organized by component and sorted by priority. See PRD.md for tier definitions and DESIGN.md for the design system.

---

## Piece page (PRD Tier 1)

### Redesign piece page per PRD revision 2

**What:** Restructure the piece page into the sections PRD describes: header + difficulty panel, signed performer's notes, structural landmarks with flags and practice notes, interpretive schools grid, editions with passage comparison, recordings around landmark tempi, pedagogical arc.

**Why:** The Claude-kit port (v0.1.0) stood up the 9-section shell and Slices A + B lit up signed performer's notes, interpretive schools, and signed piece descriptions with real data. Slice C added structural landmarks with flags + practice notes + votes + stacking, wiki-edit movements, wiki-edit recordings, and the pedagogical arc UI. Still missing: edition passage comparison and recordings-around-landmark-tempi wiring. It is the atomic surface of the product per PRD.

**Context:** One responsive page, not two. Content, ordering, and hierarchy shared across viewports; narrow viewports reflow multi-column sections into stacks. Cold-start to structural landmarks under one second on a three-year-old phone on cellular is a Tier 1 perf target. Use `/design-shotgun` or `@agent-designer` to generate layout mockups honoring DESIGN.md tokens before coding.

**Effort:** M
**Priority:** P2
**Depends on:** None (landmarks shipped in Slice C)

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

## Canonical piece index + request-a-contribution

See [jspkm-main-design-request-contribution-20260421-183606.md](~/.gstack/projects/jspkm-irregular-pearl/jspkm-main-design-request-contribution-20260421-183606.md) for the full design.

### Initial multi-source import into `canonical_piece_index`

**What:** One-time import populating `canonical_piece_index` with works scoped to instrumentation covering the repertoire H. and near-term contributors are likely to work in. Source set in priority order: MusicBrainz API (primary, works + recordings), Wikidata SPARQL (primary, cross-reference + multilingual titles + VIAF composer IDs), IMSLP XML dumps (secondary, edition/publisher metadata + obscure works MB misses), VIAF (disambiguation only, not primary metadata). Collected fields per entry: source IDs (`musicbrainz_work_id`, `wikidata_qid`, `viaf_id` for composer, `imslp_work_id`), canonical title, native title, composer, catalog number, era, instrumentation, movements when surfaces expose them cleanly. Everything else is deferred — no difficulty, no duration, no description, no signed content.

**Decision rule:** an entry is written to the index when **two independent sources agree** on composer + title + catalog, OR MusicBrainz alone has high confidence (exact catalog match + at least one recording reference on file). Ambiguous entries are skipped and logged for manual review.

**Why:** The canonical index is the site's piece identity source. The initial import is the difference between "catalog has 18 pieces" and "catalog covers real working repertoire." Without a broad initial import, new-user onboarding hits the `NOT YET CURATED` wall immediately on almost everything. Multi-source-with-agreement protects against single-source errors (MB has rough spots; Wikidata is cleaner on canonical naming; IMSLP fills niche gaps).

**Context:** Bun script under `scripts/import-canonical-index.ts`. Runs locally with rate-limited clients per source (MB 1 req/sec per their policy, Wikidata SPARQL documented limits, IMSLP dump is local file parse — no live queries). Identifies the site as `IrregularPearl/0.x (https://irregularpearl.org; contact@irregularpearl.org)` in User-Agent headers. Writes to a local Supabase, commits a seed SQL file, applies to prod via normal migration path. Sample-quality pass on 50 works H. knows well before bulk import. License check: MB facts CC0; Wikidata CC0; Wikipedia CC-BY-SA (not imported — used only for disambiguation signals); IMSLP metadata generally free-to-use for catalog purposes (review their terms for the dumps specifically before shipping).

**Explicitly excluded sources:** Grove Music Online, Oxford Music, AllMusic, Classical Archives, sheet-music-vendor catalogs, any site requiring scraping or TOS-violating bot access.

**Effort:** M–L
**Priority:** P1
**Depends on:** `canonical_piece_index` table migration (part of the request-a-contribution PR1)

### Automated canonical-index worker (GitHub Action or Claude routine)

**What:** Scheduled worker that consumes the top entries from the `search_misses` admin view, queries MusicBrainz for each, and opens a pull request adding high-confidence matches to `canonical_piece_index` via a SQL migration. Each PR is a reviewable batch (10–50 candidates per run). Low-confidence or ambiguous matches are skipped with a one-line reason logged in the PR description. Human reviewer (staff) approves and merges; the migration applies on deploy. No direct writes to prod from the worker.

**Shape:** Scheduled GitHub Action, weekly cadence initially. The action:
1. Reads `search_misses` aggregate via a read-only Supabase service key.
2. For each unique query at frequency ≥ threshold, queries the source set (MusicBrainz first; Wikidata and IMSLP dumps as cross-check and fill-in).
3. Applies the decision rule: write the entry when two sources agree on composer + title + catalog, or when MB alone is high-confidence (exact catalog + recording reference). Skip and log otherwise.
4. Invokes Claude (via API) or codex for ambiguous cases with a structured prompt: "Here is the user query, the MB match, the Wikidata match, and the IMSLP match. Do these refer to the same work? If yes, which is canonical? If no, which (if any) should be accepted?" Returns accept/reject with confidence and a one-line rationale. The AI is the tiebreaker for real ambiguity, not the primary decision layer.
5. Writes a new migration file `YYYYMMDDHHMMSS_canonical_index_update_YYYY_MM_DD.sql` containing the accepted entries as INSERTs.
6. Opens a PR with the migration + a markdown summary (accepted with source-agreement trail, rejected with reason, unique query counts, cost of the AI tiebreakers).

**Why:** Every addition to the canonical index is a reviewable commit. Provenance is traceable (search query that triggered it, MB ID, AI confidence, reviewer who merged). No AI writes go to prod without a human pass. Matches the existing editorial discipline of the project — nothing ships without review.

**Context:** Alternative to a GitHub Action is a `/loop`-scheduled Claude routine that does the same thing, but GitHub Action has better audit trail (everything is a commit) and doesn't require a running Claude instance. Can start as a one-file Bun script (`scripts/index-worker.ts`) run manually, then wrap in GitHub Action once the pattern proves out. Don't ship the Action until the script has produced 2-3 clean PRs manually. Staff (H. plus any moderator) reviews and merges.

**Effort:** M
**Priority:** P2
**Depends on:** Initial MusicBrainz import (shipped first), `search_misses` logging (shipped first), `canonical_piece_index` schema stable

---

## Completed

### Request a contribution + pre-piece surface + editorial signals

**What:** End-to-end request-a-contribution flow — navbar typeahead with grouped IN THE CATALOG / NOT YET CURATED results, seed-to-materialized piece on first CTA click via `materialize_piece_from_index` (race-safe, idempotent), recipient ribbon on piece page, unified Messages page with dismiss/auto-clear, username autocomplete, LLM-drafted personal notes (staff-only, rate-limited). Sender gate (>= 1 published signed contribution), per-recipient-30d + per-sender-24h rate limits (`app_config`-tunable), staff bypass. Email invites staff-only. New tables: `canonical_piece_index`, `contribution_requests`, `piece_redirects`, `search_misses`, `piece_views`, `draft_note_requests`, `app_config`. Admin Signals tab surfaces unmatched-query leaderboard + most-viewed-no-contribution pieces. Recent Curation section on admin dashboard (union across all four signed-content tables). `/piece/[slug]` uses one layout (`PiecePageLayout` with `mode` prop); `StubPageLayout` retired.

**Completed:** v0.4.0 (2026-04-22)

### Seed-description voting + piece-page UI polish

**What:** Users can now thumbs up/down the unsigned `pieces.description` (seed card at the end of the signed-description stack) via a new deterministic vote subject. Migration [20260516](supabase/migrations/20260516000000_seed_description_votes.sql) adds `pieces.seed_description_vote_id uuid`, widens the `votes` + `vote_tallies` subject_table CHECK to accept `'pieces_seed_description'`, and installs a before-delete trigger on pieces that clears the synthetic votes when the piece goes away. [20260517](supabase/migrations/20260517000000_cast_vote_seed_description.sql) widens the `cast_vote` RPC whitelist to match. [VoteThumbs.tsx](src/components/VoteThumbs.tsx) + [src/lib/votes.ts](src/lib/votes.ts) pick up the new subject; [SignedPieceDescription.tsx](src/components/SignedPieceDescription.tsx) renders thumbs on the active seed card.

Alongside: empty-state copy removed across five wiki-edit surfaces (performer's notes, interpretive schools, editions, recordings, external references, pedagogical arc); control clusters aligned flush with content across all of them (`align-items: center`, disabled reorder buttons collapse to `display: none`); signed description byline split into left user-info + right controls; flag-pill hover legend showing three pills (● significant, ○ notable, informational) in their severity colors; thumbs-up celebration animation (900ms scale bounce + success-colored glow, up-only, respects `prefers-reduced-motion`); pedagogical subsections always render their header + add button even when empty.

**Why:** The seed description carries the reference voice on pieces without a signed description yet; users should still be able to register a reaction. The UI polish closes the visual gap between the wiki-edit surfaces now that Recordings and Pedagogical CRUD joined the family.

**Context:** supabase/seed.ts also picked up a fix for a long-standing seed bug — it was inserting editions and external_links without setting `ordinal`, so every row past the first per piece collided on the partial unique index added by Slice C Step 4. Switched to the movements-block check-then-skip pattern so re-runs no-op and preserve user edits.

**Effort:** M
**Priority:** P2
**Completed:** 2026-04-21 (on branch `slice-c-recordings-pedagogical-ui`, awaiting browser sign-off)

### Recordings CRUD UI (wiki-edit)

**What:** Extended [RecordingsList.tsx](src/components/RecordingsList.tsx) with the same end-of-row controls (↑ ↓ ✎ ×) + "+ Add recording" modal that movements / editions / external refs use, layered on top of the existing collapse-to-play disclosure. Header row split: the toggle button covers chevron + label + source chip; the control cluster is a sibling that stops click propagation so editing never also opens or closes the iframe. `recordingEmbedUrl` moved from `PiecePageLayout.astro` into [src/lib/externalLinks.ts](src/lib/externalLinks.ts) so the client-side list can recompute embeds after a wiki edit without a server round-trip.

**Why:** Closed out the wiki-edit coverage across all piece-page link-type surfaces. Editions + external references already had CRUD; recordings was the last holdout.

**Context:** Backing RPCs (`create_external_link`, `update_external_link`, `delete_external_link`, `swap_external_link_ordinals`) already shipped in [20260508000000_external_links_wiki_crud.sql](supabase/migrations/20260508000000_external_links_wiki_crud.sql), so UI-only. `PiecePageLayout.astro` now derives recordings from the live `external_links` DB rows (filtered by `RECORDING_TYPES`) instead of the seed in-memory copy, matching the editions + references pattern.

**Effort:** S
**Priority:** P2
**Completed:** 2026-04-21 (on branch `slice-c-recordings-pedagogical-ui`)

### Pedagogical arc CRUD UI + piece picker

**What:** New [PedagogicalArcList.tsx](src/components/PedagogicalArcList.tsx) lights up the previously empty-state Pedagogical arc section. Two always-rendered subsections (Prepare with / Natural next) with per-row ↑/↓/✎/× and an "+ Add …" button each. Clicking Add opens a modal with a new small picker ([PiecePicker.tsx](src/components/PiecePicker.tsx), ~140 lines) that pre-fetches the catalog once on the server, filters on title + composer + catalog as the user types, navigates with ↑/↓ + Enter, and excludes the current piece + any already-connected pieces from suggestions. Selected state renders as a summary card with a "Change" affordance. [src/lib/pedagogical.ts](src/lib/pedagogical.ts) owns the read helpers: `fetchPedagogicalConnections` joins `pieces` via the `related_piece_id` FK so each row carries title + composer + catalog inline.

**Why:** Piece page Tier 1 calls for the pedagogical arc. The picker UX was the design wrinkle that had deferred this; a piece-specific autocomplete (not the string-only `Autocomplete.tsx`) turned out to be the cleanest fit.

**Context:** Backing schema (`pedagogical_connections` table) + RPCs already shipped in [20260509000000_pedagogical_arc.sql](supabase/migrations/20260509000000_pedagogical_arc.sql). Seed script seeds one sample connection (Bach Suite No. 1 → No. 2 "natural next") so the section has live data on first boot.

**Effort:** M
**Priority:** P2
**Completed:** 2026-04-21 (on branch `slice-c-recordings-pedagogical-ui`)

### Slice C Step 9 — seed fixtures for stacked landmarks

**What:** Extended [scripts/seed-local-queue.ts](scripts/seed-local-queue.ts) to seed a second contributor (Ben Cellist, `ben@local.test`), two landmarks from haji + ben at m. 1-4 of the Bach Suite No. 1 Prélude (haji's with two flags + two practice notes; ben's sparser), cross-votes via `cast_vote` (Haji +1, Ben −1) so the stack has a clear top, and a `tempo_indication` edit on the Prélude movement via `update_movement` to populate the change log + version history.

**Why:** Closes Slice C end to end. Without fixtures, every fresh local stack rendered landmark sections empty and the stacking pattern was invisible to reviewers + new contributors. Also unblocks visual QA of the stack cycle chevron and the change-log feed.

**Context:** Idempotent — landmarks hard-reset on each run (with their vote rows + version rows) so re-running doesn't accumulate; the movement edit only fires if the current tempo differs from the target so re-runs don't pile up history. Verified end to end: published landmarks visible, vote tallies show net +1 / -1, movement_versions has v1 (initial seed) + v2 (the tempo edit).

**Effort:** S
**Priority:** P2
**Completed:** 2026-04-21

### Slice C Step 8 — Structural landmarks UI on piece pages

**What:** New [StructuralLandmarks.tsx](src/components/StructuralLandmarks.tsx) island renders published landmarks grouped by movement, with measure range, label, signed contributor footer, vote thumbs, colored flag pills (informational / notable / significant), and inline practice notes in the DESIGN.md signed-notes pattern. Owner-only edit + delete affordances per card; stacking inline when more than one author lands at the same measure range. Page-load reads in [src/lib/landmarks.ts](src/lib/landmarks.ts). Wired into [PiecePageLayout.astro](src/components/PiecePageLayout.astro). Confirm chips across [MovementsList.tsx](src/components/MovementsList.tsx), editions, and landmarks unified into a single subtle pill outline with underlined Yes / No links.

**Why:** Closes the Tier 1 piece page redesign for landmarks — the densest information surface per PRD, the section the rest of the page was waiting on.

**Context:** Stack rendering ships inline inside `StructuralLandmarks` rather than as a separate `LandmarkStack.tsx` (the plan called for two files; one component was cleaner). 436-line component covers SSR + island augmentation + edit/create modes + inline confirm. Companion CSS expansion in [src/styles/piece-page.css](src/styles/piece-page.css) (+391 lines) carries flag-pill colors, stack chevron, and the unified confirm chip.

**Effort:** M
**Priority:** P1
**Completed:** 2026-04-21 (PR #58)

### Slice C Step 7 — Landmark aggregate schema + 10 RPCs

**What:** Lands the LandmarkPacket aggregate as a single signed subject. Tables `landmarks` + `landmark_versions` ([20260514000000_contributor_pipeline_slice_c_landmarks.sql](supabase/migrations/20260514000000_contributor_pipeline_slice_c_landmarks.sql)) carry the same six-audit-column trail and append-only versioning Slices A and B established. Flags and practice notes ride inside the versioned payload as JSONB so every approve / reject / retract / remove transition acts atomically on the whole landmark and its children. CHECK enforces array shape and length; `_validate_landmark_payload` enforces per-element rules CHECK can't (enum values, body length 1..4000). Code-defined `flag_type` and `flag_severity` enums lock the PRD vocabulary in place. Notifications subject_table CHECK widened to include `'landmarks'`; the polymorphic pivot picks up the new subject for free. 10 RPCs ([20260515000000_contributor_pipeline_slice_c_landmark_rpcs.sql](supabase/migrations/20260515000000_contributor_pipeline_slice_c_landmark_rpcs.sql)): self-author (`publish_contributor_landmark` + `_edit` + `remove_landmark`), staff-drafted (`create_landmark_draft`, `update_landmark_draft`, `submit_landmark`, `retract_landmark`), contributor approval (`approve_landmark`, `approve_and_edit_landmark`, `reject_landmark`).

**Why:** Closes the Slice C data-model gap. With the schema + RPCs in place, Step 8 (UI) became a thin React layer over the same RPC + RLS surface Slices A and B already proved.

**Context:** Verified via `supabase db reset` + full state-machine smoke test: self-publish, edit, payload validation (bad flag enum, over-cap practice notes, invalid measure_start), soft-remove, staff draft → submit (notification appears) → contributor approve (notification cleared). Rate limits reuse `_check_rate_limit` + `rate_limit_log` from the movements wiki infra: 30/hr on publish + edit, 20/hr on staff submit. Governance-aligned with #56: `_require_active_contributor` = any authenticated user; `_require_staff` still gates draft-for-another-user.

**Effort:** M
**Priority:** P1
**Completed:** 2026-04-20

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
