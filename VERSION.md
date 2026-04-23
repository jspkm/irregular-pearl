# Version

Current: **0.4.0** (2026-04-22)

The version number lives in three places that must stay in sync:

| Source | Path | Authoritative for |
|--------|------|-------------------|
| `package.json` | `version` field | tooling, build artifacts |
| Git tag | `vX.Y.Z` on the release commit | install / clone reproducibility |
| GitHub release | `vX.Y.Z` release | end-user-visible release notes |

The full per-version narrative lives in [CHANGELOG.md](./CHANGELOG.md). This file
is the manifest — the authoritative pointer to "what version are we on, and where
do I find the rest."

## Versioning policy

Pre-1.0, this project follows a relaxed semver:

- **MINOR (0.X.0)** — meaningful new product surface or governance shift. Cut on a clean main, retroactively tagged on the docs-sync commit that closes the work. The CHANGELOG `[Unreleased]` block becomes the version body.
- **PATCH (0.X.Y)** — bug fix or small enhancement that doesn't change the product surface. Cut whenever the fix lands.
- **No MAJOR before product/market validation.** 1.0 is reserved for the moment Irregular Pearl is the daily-use surface for working musicians beyond the founding contributor.

## How to cut a release

1. Backfill any drift in `CHANGELOG.md [Unreleased]` so it accurately covers everything since the last tag.
2. Replace `## [Unreleased]` with `## [X.Y.Z] — YYYY-MM-DD`. Add a fresh empty `## [Unreleased]` block above.
3. Bump `package.json` `version` to `X.Y.Z`.
4. Update this file's "Current" line.
5. Commit (`chore(release): cut vX.Y.Z`), push.
6. Tag the release commit: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`.
7. Create the GitHub release: `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <(awk '/^## \[X.Y.Z\]/,/^## \[/' CHANGELOG.md | sed '$d')`.

## History

| Version | Date | Tag | GitHub release | Anchor commit | One-line summary |
|---------|------|-----|----------------|---------------|------------------|
| 0.4.0 | 2026-04-22 | `v0.4.0` | [v0.4.0](https://github.com/jspkm/irregular-pearl/releases/tag/v0.4.0) | release commit | Request a contribution end-to-end: canonical piece index, pre-piece surface with NOT YET CURATED search, materialize-on-CTA, recipient ribbon, unified Messages page, LLM-drafted notes (staff-only), editorial signals dashboard (unmatched queries + most-viewed-no-contribution), Recent Curation admin tile |
| 0.3.0 | 2026-04-21 | `v0.3.0` | [v0.3.0](https://github.com/jspkm/irregular-pearl/releases/tag/v0.3.0) | release commit | Wiki-edit for recordings + pedagogical arc (with piece picker), seed-description voting, piece-page UI polish across every wiki-edit surface, thumbs-up celebration animation, seed.ts ordinal fix |
| 0.2.0 | 2026-04-21 | `v0.2.0` | [v0.2.0](https://github.com/jspkm/irregular-pearl/releases/tag/v0.2.0) | release commit | Slice C: structural landmarks + silent voting + stacking + wiki-edit movements + page change log + email/password auth + profile sidebar + dark mode |
| 0.1.0 | 2026-04-20 | `v0.1.0` | [v0.1.0](https://github.com/jspkm/irregular-pearl/releases/tag/v0.1.0) | [`36cb166`](https://github.com/jspkm/irregular-pearl/commit/36cb166) | Slices A + B: contributor approval pipeline (performer's notes, interpretive schools, signed piece descriptions), navbar bell, daily digest, Claude-kit aesthetic port, curated 18-piece catalog |
