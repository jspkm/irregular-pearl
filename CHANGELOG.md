# Changelog

All notable changes to Irregular Pearl are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions track `package.json`.

## [Unreleased]

### Added (contributor pipeline — Slice C landmarks)

- **Structural landmarks now render on every piece page.** New [StructuralLandmarks.tsx](src/components/StructuralLandmarks.tsx) island groups published landmarks by movement and shows each one with its measure range, label, signed contributor byline in the footer, vote thumbs, colored flag pills (informational / notable / significant), and inline practice notes in the DESIGN.md signed-notes pattern. Owners see edit + delete affordances on their own cards; anyone signed in can vote; anon click on a write affordance opens the shared sign-in panel. Wired into [PiecePageLayout.astro](src/components/PiecePageLayout.astro). Page-load reads centralized in [src/lib/landmarks.ts](src/lib/landmarks.ts).
- **Landmark aggregate as a single signed subject.** New tables `landmarks` + `landmark_versions` with the same six-audit-column trail and append-only versioning Slice A and B established. Flags and practice notes ride inside the versioned payload as JSONB, so every approve / reject / retract / remove transition acts atomically on the whole landmark and its children. CHECK enforces array shape and length; an `_validate_landmark_payload` helper enforces per-element rules CHECK can't (enum values, body length 1..4000). Code-defined `flag_type` and `flag_severity` enums lock the PRD vocabulary in place. RLS matches the rest of the pipeline: public reads published, owner sees drafts, staff sees all. Notifications subject_table CHECK widened to include `'landmarks'`; the polymorphic pivot picks up the new subject for free. Full design in [PLAN-contributor-pipeline-slice-c.md](PLAN-contributor-pipeline-slice-c.md).
- **10 new security-definer RPCs** for the landmark family — self-author (`publish_contributor_landmark`, `publish_contributor_landmark_edit`, `remove_landmark`), staff-drafted (`create_landmark_draft`, `update_landmark_draft`, `submit_landmark`, `retract_landmark`), and contributor approval (`approve_landmark`, `approve_and_edit_landmark`, `reject_landmark`). Reuse the same governance posture relaxed in #56 (`_require_active_contributor` = any authenticated user; `_require_staff` still gates draft-for-another-user). Rate limits ride the existing `_check_rate_limit` infra: 30/hr on publish + edit, 20/hr on staff submit.

### Changed (piece page — confirm chip)

- **Confirm chips unified across movements, editions, and landmarks.** Inline destructive confirms (rename, delete, retract) now share a single subtle pill outline with underlined Yes / No text links. Replaces the per-component visual treatments that drifted as wiki-edit shipped across surfaces. See [docs/screenshots/confirm-pill.png](docs/screenshots/confirm-pill.png).

### Added (profile sidebar + appearance settings)

- **Profile page now hosts a sidebar shell for signed-in owners.** Clicking the navbar avatar opens `/profile/:id`; for the owner, a new left vertical nav ([ProfileShell.tsx](src/components/ProfileShell.tsx)) — Profile / Setting / Logout — wraps the existing `ArtistProfile`. Anonymous or other-user views render the single-column profile unchanged (no sidebar leaks).
- **Setting → Appearance** picks between Light / System / Dark ([AppearanceSettings.tsx](src/components/AppearanceSettings.tsx)) with three SVG preview cards (System shown as a diagonal split so both palettes are visible). Choice persists in `localStorage.theme`, and a pre-paint inline script in [Layout.astro](src/layouts/Layout.astro) applies `html[data-theme="dark"]` before render to avoid flash-of-wrong-theme.
- **Logout** calls `supabase.auth.signOut()` (new `signOut` in [useAuth.ts](src/lib/useAuth.ts)) and redirects to `/`.
- **Profile header matches the navbar.** Swapped the initials-in-cream-circle avatar stub for the same `GenerativeAvatar` the navbar uses, and derive the display name the same way (`email.split('@')[0]` when no full name is set).

### Changed (design tokens + dark mode)

- **Dark mode shipped as opt-in.** Supersedes the 2026-03-28 "no dark mode in Phase 1" decision recorded in DESIGN.md. Light stays the default; System follows `prefers-color-scheme`. Palette under `html[data-theme="dark"]` in [global.css](src/styles/global.css) is provisional — derived by inverting the light neutrals and lightening the purple accent; a proper dark kit pass is deferred.
- **`accent-soft` softened** from `#F2EEF5` → `#F4F3F5`. Active sidebar items were reading as an obvious lavender pill; the new value keeps the accent family but sits close to neutral grey. Applied globally via the `--color-accent-soft` / `--color-accent-light` / `--accent-soft` tokens — every selected / soft-accent surface moves with it.
- **Piece-page cards adapt to the theme.** `.diff-panel`, `.school`, `.ed` in [piece-page.css](src/styles/piece-page.css) moved from `background: #fff` to `background: var(--bg)` so the difficulty panel, interpretive schools, and editions list render on the dark surface instead of punching through as white cards. Other components still using hardcoded hex will need per-surface migration as they're touched.

### Changed (contributor pipeline — Slice C governance)

- **Any registered user can now self-author signed content** on a piece: performer's notes, interpretive schools, and signed piece descriptions. Prior posture (Slice A → B) gated every self-publish and approval-queue RPC on a `users.is_contributor` flag granted out-of-band via `scripts/seed-contributor.ts` — in practice, exactly one user. Per PRD rev 2 and [PLAN-contributor-pipeline-slice-c.md](PLAN-contributor-pipeline-slice-c.md) §1.0, the flag is replaced by plain auth: if you have an account, you're an author. Draft-for-another-user (`create_*_draft`) stays admin/firstchair-only, but the draftee can now be any registered user. The `is_contributor` / `contributor_active` columns remain in the schema as an unused editorial marker — a follow-up cleanup will drop them once nothing else references them.
- **Write entries are always visible.** `Write a performer's note →` / `Write a school →` / `Write a signed description →` render for every viewer — signed-in, signed-out, whoever. Anon click opens the shared sign-in panel (same pattern MovementsList + EditionsList + VoteThumbs use) rather than hiding the affordance. Matches the "anon click opens sign-in prompt, never hidden" rule.
- Ownership guards on edit / remove paths are untouched. User A still cannot edit or remove User B's row — the `where contributor_id = auth.uid()` inside each mutation RPC does the enforcement, not the caller gate.

### Fixed

- **Movement wiki-edit was invisible on every piece page** — Slice C Step 2 shipped the `movements` table as schema-only, with row population deferred to `bun run supabase/seed.ts`. CI only applies migrations, not seed.ts, so production's `movements` table stayed empty across all 18 pieces. [MovementsList.tsx](src/components/MovementsList.tsx) correctly fell back to read-only rows from `src/data/seed.ts`, which by design render no edit affordances — pencil, ↑/↓, × were absent everywhere. New migration [20260512000000_backfill_seed_movements.sql](supabase/migrations/20260512000000_backfill_seed_movements.sql) inserts the 69 seed movements across 18 pieces plus their version-1 rows (authored_by null, marked "initial seed from src/data/seed.ts"). Idempotent via `NOT EXISTS (piece_id, ordinal)` guards — safe to re-run and won't overwrite any movement a user edited between ship and apply.

### Added (contributor approval pipeline — Slice B)

Two more signed content types now flow through the pipeline Slice A proved. A contributor can publish named *interpretive schools* (plural-voices-per-piece, no canonical framing) and long-form *signed piece descriptions* carrying interpretive or pedagogical judgment. Schools render on the piece page as a grid that collapses to stacked cards on narrow viewports; signed descriptions render in the same 2px-purple-left-border signed-notes pattern. The navbar bell, approval queue, admin view, and daily digest all light up for every subject type through one codepath.

- **Two new content types** — `interpretive_schools` (name, signed paragraph, optional tempo cues jsonb) and `piece_descriptions` (long-form signed prose). Both have their own `*_versions` tables with append-only versioning and the same six-audit-column trail as performer's notes. Existing unsigned `pieces.description` is untouched — the signed surface is additive. Full design in [PLAN-contributor-pipeline-slice-b.md](PLAN-contributor-pipeline-slice-b.md).
- **23 new security-definer RPCs** across both subject types (11 per subject plus one school-metadata updater), reusing the Slice A state machine (`draft → awaiting_contributor_approval → published → removed`) with zero rewrites. Every mutation path has the same integrated auth guards, state-machine validation, version inserts, and notification lifecycle that Slice A proved.
- **Polymorphic notifications pivot** — `notifications.performers_note_id` gains siblings `subject_table text + subject_id uuid`, with a partial unique index keeping the invariant "at most one open notification per subject". Slice A RPCs dual-write both the narrow FK and the polymorphic pair during the vestigial window; a post-Slice-B cleanup migration (tracked in TODOS) drops the column after one week of live traffic. Consumers (queue + bell + digest) flipped to `(subject_table, subject_id)` in Step 3, while existing data resolves through either path.
- **Schools section on the piece page** — new `InterpretiveSchools` React island. Multi-column grid on wide viewports, stacked cards below the `sm` breakpoint. Contributors see their own Edit + Remove affordances; the "propose a school" entry point is always visible when a contributor is signed in (per the CM5 decision — schools are plural by design, unlike performer's notes which hide the entry after first publish).
- **Signed-description section on the piece page** — new `SignedPieceDescription` React island in the same signed-notes visual pattern, coexisting with the unsigned `pieces.description` metadata strip above it (eng-review 7A: both can render; the unsigned copy stays house-style reference prose).
- **Generic `ContributorContentAdmin` component** — the old `PerformersNotesAdmin` was extracted into one subject-type-parameterized admin. Mounted from three admin pages (`/admin/performers-notes`, `/admin/interpretive-schools`, `/admin/piece-descriptions`), each with its own field config. No duplicate admin UIs to keep in sync.
- **Subject-agnostic queue + bell + digest** — `NotificationsQueue` renders mixed subject types in one stream; bell popover lists all pending drafts regardless of subject; daily digest groups by subject and reads `notifications.body` verbatim so new content types don't need digest template changes.
- **Dev fixtures** — `scripts/seed-local-queue.ts` now seeds at least one school and one signed piece description for a seeded piece so the piece page has meaningful signed content the moment you run migrations locally.

### For contributors
- Integration test tier grew from 30 to 78 tests. New files: `interpretiveSchools.test.ts` (22), `pieceDescriptions.test.ts` (15), `queueMixedSubjects.test.ts` (3), `sliceBStep1.test.ts` (11) cover the new state machines, RLS on the new tables, the polymorphic pivot invariants, the partial unique index, and mixed-subject queue rendering.
- Three new migrations: `20260421000000_contributor_pipeline_slice_b.sql` (tables + pivot + dual-write), `20260421000001_…_rpcs.sql`, `20260422000000_…_rpcs.sql`.
- New `src/lib/` helpers: `contributorSubjects.ts` (shared subject-type constants), `interpretiveSchools.ts`, `pieceDescriptions.ts` — page-load reads.

### Changed
- `NotificationsQueue.tsx` and `send-notification-digest/index.ts` now read `(subject_table, subject_id)` instead of `performers_note_id`. Behavior unchanged for existing Slice A data (dual-write means both codepaths resolve). Vestigial `performers_note_id` column drops in the post-Slice-B cleanup migration.
- `NavbarBell.tsx` popover entries deep-link to the piece-page section anchor for the subject (`#interpretive-schools`, `#signed-description`, or the existing performer's notes anchor) rather than a subject-specific queue route. The queue itself stays the precision surface.
- `PiecePageLayout.astro` wires the two new sections into the piece page body in the PRD Tier 1 order.

## [0.1.0] — 2026-04-20

### Added (contributor approval pipeline — Slice A)

The first piece of signed editorial content is now possible on the site. A working musician (v1: Haji Kim, cellist) can draft performer's notes herself, review staff-authored drafts in an in-app queue, and see the approved prose render under her byline on any piece page. An email reminder fires the first time a draft lands in her queue.

- **Data model** — three new tables (`performers_notes`, `performers_note_versions`, `notifications`), one view (`v_performers_note_versions_published`), two triggers, a composite FK pinning each note's current version to the same note, full audit trail (`drafted_by`, `submitted_by`, `approved_by`, `rejected_by`, `retracted_by`, `removed_by`), and append-only versioning with `unique(note_id, version_number)`. Contributor fields added to `users`: `is_contributor`, `contributor_bio_short`, `contributor_agreement_signed_at`, `contributor_active`. See [PLAN-contributor-pipeline-slice-a.md](PLAN-contributor-pipeline-slice-a.md) for the full design rationale.
- **12 security-definer RPCs** encapsulate every state transition with integrated auth guards, state-machine validation, version inserts with retry-once on unique-violation, and notification lifecycle management. Contributor-authored paths (`publish_contributor_note`, `publish_contributor_edit`) publish immediately without a notification — when the bylined contributor is the hands on the keyboard, authoring IS approval, per the PRD clarification.
- **Contributor approval queue** at `/notifications` — shows pending drafts in the piece-page signed-notes format so she can see exactly what will render once approved. Action row: *Approve* (as-is), *Edit and approve* (inline textarea, publishes her revision as a new version), *Reject* (optional freeform reason stored on the version for staff to learn from).
- **Staff admin view** at `/admin/performers-notes` — create-draft form with piece dropdown and auto-preselected contributor when only one exists, existing-notes list with status filter chips, inline rejection-note display on any version that was sent back, per-row Send / Revise / Retract actions. Deliberately unpolished per the PRD Tier 1 scope (data-model + admin view, not styled product).
- **Piece-page render** — the empty state is replaced with a live list of approved performer's notes in the DESIGN.md signed-notes pattern (2px purple left border, Source Serif 4 body, byline in Inter medium with one-line bio). Contributors see Edit + Remove affordances on their own cards; anyone not yet published on a piece sees a *Write a performer's note →* inline entry. SSR'd initial data + React island augmentation keeps first paint fast and SEO-friendly.
- **Navbar bell** with badge count (hidden at 0, exact 1–9, "9+" at 10+). Popover lists un-cleared notifications with piece titles, deep-links to the queue, and closes on outside click or Esc. Poll-only for Slice A; listens to a window `notifications:changed` event so any surface can trigger a refresh.
- **Daily notification digest** — new Supabase Edge Function `send-notification-digest` with a GitHub Actions cron at 13:00 UTC (morning in the Americas). Sends one email per un-mailed notification, then never again — the bell and queue are the ongoing nag.
- **Shared email template** — new `supabase/functions/_lib/email-template.ts` with Claude-kit aesthetic primitives. Both weekly digest and new daily digest consume it. The weekly digest is re-skinned from the old amber aesthetic as part of the same landing, closing the DESIGN.md drift debt.
- **Admin tooling** — `scripts/seed-contributor.ts` promotes a registered user to a signed contributor (used to onboard Haji); `scripts/seed-local-queue.ts` + `scripts/magic-link.ts` for local browser testing without Google OAuth.

### For contributors
- New integration test tier: `bun run test:integration` runs against local Supabase. 30 tests cover the full state machine, RLS on all three new tables, byline integrity, and the iron-rule regression that contributor-authored paths never create notifications. Required `supabase start` flow is now documented in the README.
- Four pre-existing migrations patched to be replayable from a fresh database (previous schema referenced tables that later migrations dropped). Local `supabase start` now boots the full migration history clean. See PR #36.
- New scripts: `dev:local` (dev server pointed at local Supabase), `test:integration` (new tier).

### Changed (landing page + navbar)
- **Landing page rewritten as front-matter-of-a-journal** in `src/pages/index.astro`. Hero is the wordmark `IrregularPearl` in Inter medium 34px with subtitle "Classical music knowledge platform". In Focus block is conditional — renders only when a recently approved signed work exists (currently always null; wires live when the contributor approval pipeline lands). Below: unnumbered list of pieces ordered by `created_at DESC` (proxy for `updated_at`), each row rendering title · composer · catalog number. Old posture removed: browse-by-era tile grid, top-composer avatars, MostWanted requests section, numbered list rows — all contradicted the PRD rev 2 "narrow scope, one contributor" reality.
- **Navbar rewritten** (`src/components/Navbar.astro`): desktop search input absolute-centered at `w-1/2 max-w-xl` with a `shadow-md` affordance. Mobile (< sm) collapses the search into a magnifier icon that opens a full-row overlay with an X close and Esc-to-dismiss. `About` moved to flush-right, immediately left of the AuthButton. `Browse` link and the inline `beta` label removed. Navbar padding bumped from `py-3` to `py-4`.
- Deleted `src/components/MostWanted.tsx` — orphaned after the LP rewrite, no callers remain.

### Changed (piece page)
- Four-axis difficulty panel now responsive: 4 columns > 1024px, 2×2 768–1024px, 1×4 < 768px. Keeps the "one responsive surface" principle intact when the panel narrows.

### Changed (catalog)
- **Removed Crumb *Vox Balaenae* from the catalog** (`src/data/seed.ts` + `src/data/difficulty-axes.ts` + new migration `20260419210000_remove_vox_balaenae.sql` applied to production). Chamber-trio scope (electric flute + cello + piano, masks, blue lighting, graphic notation) sits outside the cellist-forward daily-use loop the catalog is being built around. FK cascade cleans up related editions and external_links. Catalog now stands at 18 pieces.

### Changed (aesthetic direction)
- **Aesthetic tokens flipped to the Claude design kit direction.** Purple accent `#6B4E7C` replaces amber `#B45309`; white primary `#FFFFFF` + `#F8F7F4` tint replaces parchment `#FAF8F5`; Source Serif 4 replaces Instrument Serif for editorial display; 0.5px default borders replace 1px; eight-size type scale locked (11/12/13/14/15/16/18/22/26/34). `global.css` rewritten with the kit token namespace alongside Tailwind's `@theme`. Inline hex refs swept across `src/` and email templates. Logo SVG ink color updated. `manifest.json` theme color updated.
- **Piece page ported from the Claude design kit** into `src/components/PiecePageLayout.astro` with `src/styles/piece-page.css`. Single responsive page, 9 PRD Tier 1 sections (breadcrumbs, piece header, performer's notes, structural landmarks, interpretive schools, description, editions, recordings, pedagogical arc, external references). Sections without schema show empty-state copy worded as state ("No performer's notes yet"). No kit chrome — nav/footer provided by `Layout.astro`. No meta-caption paragraphs under section headings.
- Deleted `PiecePageLayout.tsx` and `PieceTabs.tsx` — the React piece-page stack is replaced by the ported Astro components.

### Changed (data model / catalog)
- **Catalog reset to curated editorial spine (PRD rev 2, "narrow scope, deep craft").** Wiped the OpenOpus-imported breadth catalog (~7,829 scraped stubs) and replaced it with 19 hand-authored cello-forward pieces aligned with the first real user's daily-use loop: six Bach Cello Suites, three Bach Gamba Sonatas (BWV 1027-1029), Bach Chaconne arranged for cello, Haydn C major, Vivaldi RV 544 "Il Proteo", Saint-Saëns No. 1, Elgar Op. 85, Strauss Op. 6, Mendelssohn Op. 109, Fauré Papillon, Crumb Sonata for Solo Cello (1955), Crumb Vox Balaenae (1971). The Supabase `pieces` table is truncated cascade on deploy; FK-linked rows (editions, recordings, discography, performances, external_links, working_on, maestro_playlist, search_queries, admin- and profile-linked pieces) cascade-delete accordingly.
- Deleted seed-expansion files (`seed-expansion*.ts`, `seed-piano-violin-new.ts`) and scraper scripts (`import-openopus.ts`, `match-spotify.ts`, `repopulate-recordings.ts`) that were producing the scraped breadth catalog.

### Changed
- Sans family switched from DM Sans to Inter across body, UI, and email fallback (Arial where Inter is not reliable).
- Wordmark rendered as `IrregularPearl` (one word) in Inter medium non-italic, replacing the Instrument Serif italic `Irregular Pearl` treatment. Navbar, layout footer, admin header, and email templates all updated. Prose copy (body paragraphs, meta titles, legal, editorial) keeps the two-word form for readability.
- Landing and About pages drop `font-display` and italic on hero and section headings, following the new Inter direction.
- `public/logo.svg` regenerated as a text-based SVG in Inter medium. `public/manifest.json` `short_name` set to `IrregularPearl`.
- DESIGN.md principle 3 and Logo/Wordmark section updated. Decisions log records the Inter swap and the wordmark/prose split.
- Piece page documented as a single responsive surface rather than two products (PRD + DESIGN.md principle 7 reversed). The `<1s` landmarks cold-start is now a Tier 1 perf target on the shared page.

### Fixed
- Migration `20260419000000_drop_legacy_features.sql` rewritten to guard `alter publication ... drop table` with a `pg_publication_tables` lookup, because Postgres does not accept `if exists` on that form. File aligned with what was applied to production.

### Removed
- Legacy scrape-events workflow and the last references to applause, discussions, activity log, events, and community directory. Scope narrowed to the piece-page-centric knowledge base per PRD revision 2.
