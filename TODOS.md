# TODOS

Tracked work for Irregular Pearl, organized by component and sorted by priority. See PRD.md for tier definitions and DESIGN.md for the design system.

---

## Data model (PRD Tier 1)

### Contributor approval pipeline

**What:** Introduce `contributors`, draft/approval status, version history, and in-app approve/edit/delete for bylined content. Every `performers_note`, `interpretive_school`, `practice_note`, and substantive `description` routes through this flow.

**Why:** PRD invariant: "No content publishes under a Contributor's byline without that Contributor's explicit in-app approval of the current text." This is the invariant that makes ghostwriting on behalf of contributors ethically honest. Without it, no signed content can ship.

**Context:** Schema currently has `users` but no `contributors` table, no `drafted_by`/`approved_by_contributor_at` fields, no per-contributor approval queue. Start from PRD "Contributor" and "InterpretiveSchool" / "PerformersNote" / "PracticeNote" field specs. Approval queue UI is Tier 1; staff draft dashboard is data-model-only for v1 per PRD.

**Effort:** XL
**Priority:** P1
**Depends on:** None (but gates every other signed-content surface)

### Structural landmarks + flags schema

**What:** Add `landmarks` (movement, measure range, label, ordinal), `flags` (controlled vocabulary, severity, instrument specificity), and `practice_notes` (signed prose attached to landmarks).

**Why:** Landmarks is "the densest information surface on the piece page and the place where the site's expertise is most visibly load-bearing" (PRD). Without these entities there is no Tier 1 piece page.

**Context:** Flag vocabulary is governed by the Editorial Director per PRD — start with the PRD list (stamina, bow control, stretch, voicing, double stops, sustained bowing, articulation, rhythmic lift, intonation, ensemble coordination) and keep it as a code-defined enum, not a user-editable table. Signed practice notes route through the same approval pipeline above.

**Effort:** L
**Priority:** P1
**Depends on:** Contributor approval pipeline

### InterpretiveSchool + PerformersNote entities

**What:** Add `interpretive_schools` (name, description, representative recording, tempo cues) and `performers_notes` (body, signed by contributor). Both carry draft/approval state.

**Why:** Core editorial surface on every piece page. Schools are plural by design; performer's notes are open-ended reflections.

**Context:** Both entities use the signed-notes visual pattern already specified in DESIGN.md (2px amber left border, Instrument Serif prose, byline in Inter sentence case). Multi-column grid for schools on wide viewports, stacked on narrow, per the responsive piece page principle.

**Effort:** M
**Priority:** P1
**Depends on:** Contributor approval pipeline

---

## Piece page (PRD Tier 1)

### Redesign piece page per PRD revision 2

**What:** Restructure the piece page into the sections PRD describes: header + difficulty panel, signed performer's notes, structural landmarks with flags and practice notes, interpretive schools grid, editions with passage comparison, recordings around landmark tempi, pedagogical arc.

**Why:** Current `src/pages/piece/[id].astro` is ~100 lines with a `PieceTabs` component. Missing landmarks, schools, performer's notes, passage comparison, and pedagogical arc. It is the atomic surface of the product per PRD.

**Context:** One responsive page, not two. Content, ordering, and hierarchy shared across viewports; narrow viewports reflow multi-column sections into stacks. Cold-start to structural landmarks under one second on a three-year-old phone on cellular is a Tier 1 perf target. Use `/design-shotgun` or `@agent-designer` to generate layout mockups honoring DESIGN.md tokens before coding.

**Effort:** L
**Priority:** P1
**Depends on:** Structural landmarks + flags schema, InterpretiveSchool + PerformersNote entities

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

### Spec popover chrome in DESIGN.md

**What:** Add a popover spec to DESIGN.md — border weight, radius, shadow (or lack thereof), arrow (or lack thereof), entrance motion. Locks the default for the navbar bell, future contextual menus, diff-reveal blocks, and any other hover-or-click surfaces that escape the Cards pattern.

**Why:** DESIGN.md covers Cards but not Popovers. Every new popover surface re-debates the same choices (Slice A alone defaults to 0.5px / 8px radius / no shadow / no arrow to keep moving). One-time spec closes the drift.

**Context:** Source of truth is whatever Slice A's bell popover ships. Codify retroactively, then reference the spec from future component specs. Complementary to the existing signed-notes + Cards entries.

**Effort:** S
**Priority:** P3
**Depends on:** Slice A bell ships first

### Confirm Supabase local dev workflow

**What:** Verify `supabase start` works locally against `supabase/config.toml`. If not, run `supabase init`, wire up local ports in `.env.local.example`, and document the dev loop in README under "Running locally."

**Why:** Slice A tests (and any future integration test surface) assume real Supabase via `supabase start`. README only documents `supabase db push` for prod migrations. Without a local dev container, every integration test run is a round-trip to prod or a blocked session.

**Context:** Blocks Slice A step 2 (RPCs + API endpoints) if local doesn't work. Likely a 15-minute confirmation; could be a couple hours if the config is missing. Do before test implementation starts.

**Effort:** S
**Priority:** P2
**Depends on:** None (but blocks Slice A testing)

---

## Contributor pipeline (post-Slice-A)

### Diff block in NotificationsQueue

**What:** Render a line-level diff in the approval queue against the most recently approved version of the same note. Uses the `diff` npm package (tree-shakes cleanly). Visible when a pending draft is a revision after a prior rejection or an earlier published state.

**Why:** Deferred from Slice A per Codex review — for v1 with H. only, diff block adds dep + test surface for limited decision value. Once rejections become common enough that H. wants a direct comparison against the prior reading, the diff block shortens the review cycle.

**Context:** Add to `src/components/NotificationsQueue.tsx`. Fetch prior version body via an `/api/performers-notes/[id]/versions` endpoint (new, read-only, gated by owner contributor + staff). Render inline above the current body. Small enough for a follow-up PR, large enough it didn't belong in Slice A.

**Effort:** S
**Priority:** P3
**Depends on:** Slice A (shipped first)

---

## Completed

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
