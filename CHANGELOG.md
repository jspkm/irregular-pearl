# Changelog

All notable changes to Irregular Pearl are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions track `package.json`.

## [Unreleased]

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
