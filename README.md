# Irregular Pearl

A non-profit, community-driven classical music knowledge hub. Every piece gets a living page with editions, recordings, activity tracking, and discussion.

**Live at [irregularpearl.org](https://irregularpearl.org)**

## What it does

- **193 pieces** across piano, violin, cello, voice, and winds — from Bach to Bartok
- **Edition comparisons** with publisher, editor, year, and editorial notes
- **Activity logging** — track practice, lessons, performances, listening, and sight-reading
- **Threaded discussion** on every piece page with realtime updates
- **Artist profiles** with performances, discography, and edition reviews
- **Full-text search** via Supabase tsvector with relevance ranking
- **Browse by** composer, instrument, or era — each with a dedicated, crawlable page

## Stack

| Layer | Tech |
|-------|------|
| Framework | [Astro](https://astro.build) 5 (SSR) with React islands |
| Styling | Tailwind CSS 4 |
| Database | [Supabase](https://supabase.com) (Postgres, Auth, Realtime) |
| Hosting | Cloudflare Pages |
| Package manager | Bun |
| Tests | Bun test runner |

## Run locally

```bash
bun install
bun run dev
```

The app works without Supabase — search falls back to client-side filtering, discussions and activity tracking are disabled. To enable everything, add a `.env` file:

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database setup

1. Create a project at [supabase.com](https://supabase.com)
2. Apply migrations: `supabase db push`
3. Enable Google OAuth in Authentication > Providers

Migration files are in `supabase/migrations/`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build for Cloudflare |
| `bun run test` | Unit + component tests (100% line coverage) |
| `bun run test:e2e` | E2E tests against live site |
| `bun run test:all` | All tests |
| `bun run check` | Astro type checking |

## Deploy

Connected to Cloudflare Pages. Deploys on push to `main`.

Build command: `bun install && bun run build`
Output directory: `dist`

## Project structure

```
src/
  components/     React components (islands) and Astro components
  data/           Seed data — 193 curated classical music pieces
  layouts/        Base HTML layout with SEO, fonts, footer
  lib/            Helpers, Supabase client, database types
  pages/
    piece/[id]        Piece detail pages
    composer/[name]   Composer index pages
    instrument/[name] Instrument index pages
    about, privacy, terms
    sitemap.xml, llms.txt, llms-full.txt, openapi.json
  e2e/            E2E tests
supabase/
  migrations/     SQL migration files
public/
  robots.txt, manifest.json, favicon.svg
  .well-known/ai-plugin.json
```

## SEO and AI visibility

- JSON-LD structured data on every page (MusicComposition, BreadcrumbList, Organization)
- Sitemap with all piece, composer, and instrument pages
- `robots.txt` allows Googlebot, GPTBot, ClaudeBot, Bingbot, PerplexityBot
- `llms.txt` and `llms-full.txt` for AI model consumption
- ChatGPT plugin manifest at `/.well-known/ai-plugin.json`
- OpenAPI spec at `/openapi.json`
- Registered with Google Search Console and Bing Webmaster Tools

## Name

From the Portuguese *barroco* — an irregularly shaped pearl — the word that gave us *Baroque*.

## License

AGPL-3.0
