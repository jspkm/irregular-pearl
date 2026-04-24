# Irregular Pearl

A non-profit, cellist-forward classical music knowledge hub. Every piece gets a living page with signed performer's notes, editions, and recordings — written by working musicians, not auto-generated.

**Live at [irregularpearl.org](https://irregularpearl.org)**

## What it does

- **18 curated pieces** from the daily cellist's repertoire — Bach Suites, Dvořák, Brahms, Shostakovich, and counting
- **Signed performer's notes** — real musicians leave signed prose on each piece, with a full approve-before-publish pipeline (bylines only appear with explicit contributor sign-off)
- **Interpretive schools** — named families of interpretive choices per piece, plural by design (no canonical framing), each with a signed paragraph and optional tempo cues
- **Signed piece descriptions** — long-form signed prose that carries interpretive or pedagogical judgment, distinct from the short unsigned reference copy
- **Signed difficulty ratings** — any registered user can publish their own four-axis rating (technical / stamina / interpretive / ensemble) with optional per-axis commentary, stacked ahead of the seed card by community vote
- **Structural landmarks** — measure-anchored bookmarks per movement with colored flag pills (informational / notable / significant), inline practice notes from each contributor, and silent up/down votes that drive stack ordering when more than one author lands at the same anchor
- **Wiki-edit movements** — any signed-in user can fix a movement name, tempo, key, or ordinal in place, with version history and revert
- **Edition comparisons** with publisher, editor, year, and editorial notes
- **Artist profiles** — public pages at `/@username` with bio and instruments
- **Search** across pieces via Supabase full-text search, with grouped typeahead showing IN THE CATALOG (materialized pieces) and NOT YET CURATED (canonical index entries not yet live as full piece pages)
- **Request a contribution** — any musician with >= 1 published signed contribution can ask a specific user (by username) to curate a piece; recipients see a contextual "asked you to contribute here" ribbon on the piece page and an entry in their unified Messages feed. Staff can draft the personal note with an LLM assist (Claude Haiku 4.5, 20 drafts/staff/24h).
- **Browse by** composer, instrument, or era — each with a dedicated, crawlable page

## Stack

| Layer | Tech |
|-------|------|
| Framework | [Astro](https://astro.build) 5 (SSR) with React islands |
| Styling | Tailwind CSS 4 |
| Database | [Supabase](https://supabase.com) (Postgres, Auth, Edge Functions) |
| Transactional email | [Resend](https://resend.com) (welcome + weekly catalog + daily approval digests) |
| Hosting | Cloudflare Pages |
| Package manager | Bun |
| Tests | Bun test runner (unit + integration + e2e tiers) |

## Run locally

```bash
bun install
bun run dev
```

The app works without Supabase — search falls back to client-side filtering. To enable everything, add a `.env` file:

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database setup

**Against a linked project (production-like):**
1. Create a project at [supabase.com](https://supabase.com)
2. Apply migrations: `supabase db push`
3. Enable Google OAuth in Authentication > Providers

**Against a local stack (dev + tests):**
1. `supabase start` — spins up Postgres + Auth + Functions on `127.0.0.1:54321`
2. `bun run dev:local` — runs Astro dev server against the local stack
3. `bun --env-file=.env.test run scripts/seed-local-queue.ts` — seeds a test contributor so there's a realistic user to draft for
4. `bun --env-file=.env.test run scripts/magic-link.ts <email> [path] --open` — generates a magic-link URL for any local user and opens it in the browser (bypasses the Google-OAuth-only UI for dev)

Migration files are in `supabase/migrations/`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server against the env in `.env` (typically linked project) |
| `bun run dev:local` | Start dev server pointed at a local `supabase start` stack |
| `bun run build` | Production build for Cloudflare |
| `bun run test` | Unit + component tests |
| `bun run test:integration` | Integration tests against a local Supabase stack (requires `supabase start`) |
| `bun run test:e2e` | E2E tests against the live site |
| `bun run test:all` | All three tiers in sequence |
| `bun run check` | Astro type checking |

## Deploy

Connected to Cloudflare Pages. Deploys on push to `main`.

Build command: `bun install && bun run build`
Output directory: `dist`

## Project structure

```
src/
  components/     React components (islands) + Astro components
    admin/
      RequestsAdmin.tsx            Staff Requests tab — outbox (resume drafting) + sent archive
      AdminPage.tsx, users, etc.
    DraftingModeBanner.tsx         Sticky banner on piece/[slug]?compose=<req_id>
    ComposeDraftBlock.tsx          Inline compose block rendered at the top of each signed section in drafting mode
    TempoCuesEditor.tsx            Row editor + note-symbol palette; used by both sender and recipient
    TempoCuesDisplay.tsx           Read-only tempo-cues list; used on every card that shows an interpretive school
    NavbarBell.tsx              Notifications bell + popover (subject-agnostic)
    NotificationsQueue.tsx      Unified Messages page (drafts + contribution requests, reverse-chron)
    SearchTypeahead.tsx         Navbar search with grouped IN THE CATALOG / NOT YET CURATED results
    RequestContributionDialog.tsx  Ask-a-musician dialog with username autocomplete + LLM-drafted note
    RecipientRibbon.tsx         "Asked you to contribute here" aside on piece page
    StartContributionButton.tsx Pre-piece CTA that materializes a canonical index entry into a piece
    PieceViewLogger.tsx         Fire-and-forget view logger (feeds editorial signals)
    PerformersNotes.tsx         Piece-page signed performer's notes
    InterpretiveSchools.tsx     Piece-page schools grid
    SignedPieceDescription.tsx  Piece-page signed description
    StructuralLandmarks.tsx     Piece-page landmarks (movement-grouped, flag pills, practice notes, votes)
    MovementsList.tsx           Piece-page movements with in-place wiki-edit + version history
    VoteThumbs.tsx              Silent up/down votes on signed content (no public counts)
    PiecePageLayout.astro       Piece page template
  data/           Seed data — 18 curated cellist-forward pieces
  layouts/        Base HTML layout with SEO, fonts, footer
  lib/            Helpers, Supabase client, database types, plus per-subject helpers:
                  contributorSubjects.ts, interpretiveSchools.ts, pieceDescriptions.ts
  pages/
    @[slug]                        Artist profile vanity URLs
    piece/[id]                     Piece detail pages
    composer/[name]                Composer index pages
    instrument/[name]              Instrument category pages
    notifications                  Messages list (contribution requests) + Open items tab (recipient drafts cross-piece)
    admin                          Role-gated surface — tabs filtered by role (Dashboard/Users admin; Requests/Signals staff; Playlist maestro)
    maestro                        301 → /admin (legacy URL)
    piece/[id]?compose=<req_id>    Staff drafting mode — sticky banner + inline compose blocks in each signed section
    api/draft-contribution-note    LLM-drafted personal note for request dialog (staff-only, rate-limited)
    about, privacy, terms
    sitemap.xml, llms.txt, llms-full.txt, openapi.json
  e2e/            E2E tests (hit the live site)
  integration/    Integration tests (local Supabase required) — 241 tests across the pipeline
  tests/          Unit tests
supabase/
  config.toml     Local dev stack config (generated by `supabase init`)
  migrations/     SQL migration files
  functions/      Supabase Edge Functions
    _lib/         Shared email template primitives (Claude-kit aesthetic)
    send-weekly-digest          Weekly new-pieces email
    send-notification-digest    Daily approval-queue email (subject-agnostic)
    send-welcome-email          First-signin email
scripts/          Admin one-shots (seed-contributor, seed-local-queue, magic-link, preview-email)
public/
  robots.txt, manifest.json, favicon.svg
  .well-known/ai-plugin.json
```

## SEO and AI visibility

- JSON-LD structured data on every page (MusicComposition, Person, Product, BreadcrumbList, Organization)
- Sitemap with all piece, composer, instrument, and artist pages (Supabase-driven for dynamic entities)
- `robots.txt` allows Googlebot, GPTBot, ClaudeBot, Bingbot, PerplexityBot
- `llms.txt` and `llms-full.txt` for AI model consumption
- ChatGPT plugin manifest at `/.well-known/ai-plugin.json`
- OpenAPI spec at `/openapi.json`
- Registered with Google Search Console and Bing Webmaster Tools

## Docs

- [PRD.md](./PRD.md) — product requirements, principles, data model, Tier 1/2/3 surfaces.
- [DESIGN.md](./DESIGN.md) — design system: tokens, typography, components, voice.
- [TODOS.md](./TODOS.md) — tracked work, sorted by priority.
- [CHANGELOG.md](./CHANGELOG.md) — what shipped, when.
- [VERSION.md](./VERSION.md) — current version, history, and how to cut a release.
- [PLAN-contributor-pipeline-slice-a.md](./PLAN-contributor-pipeline-slice-a.md) — reference implementation plan for the contributor approval pipeline. Slice A shipped; Slices B and C reuse the same shape.
- [PLAN-contributor-pipeline-slice-b.md](./PLAN-contributor-pipeline-slice-b.md) — Slice B plan: InterpretiveSchool + signed PieceDescription through the same pipeline, plus the notifications polymorphic pivot. Shipped in 6 rollout steps (PRs #42–#45).
- [PLAN-contributor-pipeline-slice-c.md](./PLAN-contributor-pipeline-slice-c.md) — Slice C plan: landmark aggregate (landmark + nested flags + nested practice notes, versioned together), universal silent voting + stacking, wiki-edit movements, and the "any registered user === contributor" governance shift. Steps 1–8 shipped (PRs #48–#58); Step 9 (seed fixtures) remaining.

## Name

From the Portuguese *barroco* — an irregularly shaped pearl — the word that gave us *Baroque*.

## License

AGPL-3.0
