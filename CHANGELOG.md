# Changelog

All notable changes to Irregular Pearl are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions track `package.json`.

## [Unreleased]

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
