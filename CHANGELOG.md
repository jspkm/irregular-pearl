# Changelog

All notable changes to Irregular Pearl are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions track `package.json`.

## [Unreleased]

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
