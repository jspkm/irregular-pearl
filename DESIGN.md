# Design System — Irregular Pearl

## Product Context
- **What this is:** A piece-centric knowledge platform for classical music
- **Who it's for:** Classical musicians (conservatory students, performers, teachers), music enthusiasts
- **Space/industry:** Classical music knowledge, reference platforms
- **Project type:** Web app (SSR), iPad-first responsive design

## Aesthetic Direction
- **Direction:** Editorial restraint, museum-catalog register. Adopted from the Claude design kit on 2026-04-19.
- **Decoration level:** Flat, no textures. Content is the decoration.
- **Mood:** A well-made scholarly reference or an editorial magazine, not a contemporary SaaS product, not a streaming service, not an AI-tool marketing page. When in doubt, remove rather than add.
- **Reference sites:** New York Times graphics desk, Stripe documentation, Grove Music Online, Henle Verlag edition pages, Met/Rijksmuseum online collection entries, Linear marketing (for restraint), The Pudding (for data-driven editorial), Tonebase blog posts (for the voice performer's notes should read like). See DESIGN-REFERENCES companion document when it lands.
- **Anti-references:** Notion/Airtable/productivity-SaaS chrome, Medium/Substack blog-platform hero pattern, Spotify/Apple Music streaming carousels, Masterclass/Coursera premium-learning photography, generic classical sites (2012 layouts updated piecemeal).

## Principles

1. **Flat, not skeuomorphic.** No gradients, drop shadows, glow, blur, noise, or faux 3D. Surfaces are solid colors separated by 1px borders and whitespace.
2. **Typography does the hierarchy.** Size, weight, and spacing carry structure. Color is sparingly used and only where it encodes meaning.
3. **Serif for editorial, sans for interface.** Long-form performer's notes, interpretive schools, and piece descriptions use Source Serif 4 (the reading voice of the site). Navigation, buttons, labels, metadata, and tables use Inter. The switch is deliberate.
4. **Sentence case everywhere.** Headings, button labels, nav items, tags. Never Title Case, never ALL CAPS, except small kicker eyebrows and the wordmark if set in caps.
5. **Two weights only.** 400 regular for body; 500 medium for emphasis, headings, button labels, and names. Never 600 or 700. They read as heavy on the quiet surfaces the site uses.
6. **Ink on white.** Primary reading is ink (#1A1A1A) on white (#FFFFFF). Secondary surfaces use a near-white warm tint (#F8F7F4) for gentle separation without introducing color. Color is reserved for semantic meaning (warning flags, interpretive accents) and small editorial chrome.
7. **One responsive page, not two products.** The piece page is a single responsive surface — the same markup and information architecture reflowed across viewports via CSS. Narrow viewports may collapse multi-column sections into stacks and compress chrome, but the content, ordering, and hierarchy are shared. No viewport-specific React branches, no duplicate mobile routes, no "mobile app" inside the web app.

## Logo / Wordmark
- **Text:** `IrregularPearl` — one word, no space. Concatenated form is the brand.
- **Font:** Inter, medium weight (500). Non-italic.
- **Style:** Plain, precise, confident. The wordmark IS the logo. No icon needed. Typography carries the identity — no flourish, no italic, no tracking tricks.
- **Usage:** Top-left navbar, homepage hero, email headers. Web = Inter; email = Arial fallback (Inter is not email-safe).
- **Prose vs wordmark:** The wordmark is `IrregularPearl`. In body copy, legal text, meta/SEO titles, and editorial prose, the name is written `Irregular Pearl` (two words) for readability.
- **"beta" tag:** Inter, regular weight, smaller size, muted color

## Typography
- **Display/Editorial:** Source Serif 4 (regular + italic, two weights). Used for piece titles, performer's notes prose, interpretive-school paragraphs, signed editorial text, movement titles. This is the reading voice of the site.
- **Body / UI:** Inter (regular + medium). Used for navigation, buttons, labels, metadata, tables, descriptions, short reference copy, and the IrregularPearl wordmark.
- **Data / Tables / Catalog numbers:** JetBrains Mono — catalog numbers (BWV 1007, Op. 85, K. 331, Hob. VIIb/1), measure ranges, tempi. Supports tabular-nums.
- **Code:** JetBrains Mono.
- **Loading:** Google Fonts CDN
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;1,8..60,400;1,8..60,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  ```
- **Scale — eight sizes, use only these.** If you want a size between, the answer is to change weight or spacing, not add a size.
  - 11px — fine print, legal
  - 12px — small labels, metadata, timestamps
  - 13px — secondary UI text
  - 14px — button labels, table headers
  - 15px — body text on mobile
  - 16px — body text default
  - 18px — subheadings (H3)
  - 22px — section headings (H2)
  - 26px — page titles (H1)
  - 34px — hero titles (landing page only)
- **Weights:** 400 regular, 500 medium. Nothing else.
- **Line-heights:** serif prose 1.68, sans prose 1.55, headings 1.25, captions 1.4.

## Color
The palette is small and mostly neutral. Add a color only if it encodes meaning.

**Neutrals**
- Primary background: `#FFFFFF` — white
- Secondary surface / band backgrounds: `#F8F7F4` — warm near-white tint
- Primary text (ink): `#1A1A1A`
- Secondary text (muted): `#6F6F6F`
- Tertiary text (hints): `#9A9A9A`
- Default border (0.5px): `#E5E3DE`
- Emphasis border: `#CCC9C2`

**Accent — one, used sparingly**
- `#6B4E7C` — quiet purple, derived from the site's logomark palette. Used for kicker eyebrows, selected states, featured-card emphasis borders, focus rings, interactive chrome.
- Accent soft: `#F4F3F5` — band backgrounds, hover fills. Near-neutral grey with a trace of purple so selected states read as quiet rather than lavender.

**Semantic — used only for meaning, never decoration**
| Meaning | Foreground | Soft background |
|---------|-----------|------------------|
| Warning (difficulty flags, caution) | `#8B6914` | `#FAF2DB` |
| Info (information, links) | `#2B5797` | `#E8EEF7` |
| Success | `#2D6A3F` | `#E6F1E9` |
| Danger (error, destructive) | `#A32D2D` | `#F7E4E4` |

Never introduce a new color outside this palette without updating this document first. If a surface needs a color that isn't here, ask whether the surface really needs it — often the answer is typography or spacing would do the same work better.

**Dark mode:** Opt-in via Settings → Appearance (Light / System / Dark). Light remains the default. The dark palette is provisional — derived from inverting the light neutrals and lightening the purple accent — and still needs a proper pass. A few piece-page and profile surfaces use hardcoded hex literals that don't flip; migrate to CSS variables as they're touched.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable (not cramped like IMSLP, not wasteful)
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)
- **Content padding:** 16px mobile, 32px tablet, 40px desktop

## Layout
- **Approach:** Grid-disciplined
- **Piece page:** Single-column content with editions and recordings sections.
- **Homepage:** Three-column card grid, pieces grouped by instrument
- **Max content width:** 1100px
- **Breakpoints:**
  - Mobile: < 768px
  - Tablet/iPad: 768px-1024px
  - Desktop: > 1024px
- **Border radius:**
  - sm: 4px (tags, small elements)
  - md: 8px (cards, inputs, buttons)
  - lg: 12px (large cards, modals)
  - full: 9999px (pills, avatars)

## Motion
- **Approach:** Minimal-functional. Music is the performance, not the UI.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms for hover) short(150ms for tabs/toggles) medium(250ms for panels)
- **Rules:** No bouncy animations. No entrance animations on page load. Smooth tab transitions. Subtle hover color shifts on cards and buttons.

## Components

### Kicker eyebrows
Small caps label above a section heading. Accent purple, 11-12px Inter, letter-spacing 0.08em, weight 500, `text-transform: uppercase`. Used once per section. Editorial chrome, not navigation.

### Metadata pills
Rounded chips for piece-level metadata (instrument, era, form, duration). Neutral only, never colored unless semantic.
`font-size: 12px; padding: 3px 10px; border-radius: 9999px; background: #F5F4F1; color: #78716C`

### Difficulty flags
Inline pill within a structural landmark. Uses the warning palette.
`font-size: 11px; padding: 2px 9px; border-radius: 999px; background: #FAF2DB; color: #8B6914; border: 0.5px solid #8B6914; weight: 500`

### Cards
White background, 0.5px border (`#E5E3DE`), 12px radius, 16px internal padding. Cards stack with 12px gaps. Cards never nest more than one level. Featured cards (e.g., the recommended edition in a comparison) use a 2px accent-purple border — the only exception to the 0.5px border rule, used sparingly.

### Signed notes
Performer's notes and interpretive-school descriptions use a distinctive pattern: 2px accent (purple) left border, 18px left padding, Source Serif 4 prose inside. Byline underneath in Inter sentence case. Contributor display name in weight 500, one-line bio in muted color. A contrasting voice within the same section uses a lighter `border-strong` (`#CCC9C2`) left border instead of accent, signalling "contrasting voice," not ranking.

### Buttons

Three tiers. Pick the lowest-weight tier that still reads as actionable.

**Primary.** One per surface, used for the single action the user is most likely trying to take (e.g., *Approve* in the contributor queue). Dark ink `#1A1A1A` background, white text, Inter 14px weight 500, 12px radius, 8px vertical / 16px horizontal padding.

**Secondary outline.** Transparent background, 0.5px `border-strong` border, muted text. Settled usage across Slice A: *Edit / Remove* on piece-page signed notes, *Refresh* on the contributor queue, *Edit profile* on the owner bar, filter chips in the admin view. Exact spec: Inter 11px, `text-muted`, `border-strong`, padding `4px 10px`, 6px radius, hover darkens both text and border to `ink`. Use for any non-primary button adjacent to or below content — it reads as "you can, but don't have to."

**Active filter chip.** Same shape as the secondary outline, different colors: `bg-accent-light`, `text-accent`, `border-accent-border`. Use only for the "this is the current filter" state, never as a primary action.

**Ghost.** No border, underline-on-hover only. Reserve for inline prose links and footer navigation.

### Popovers
Used for the navbar notifications bell and any future contextual flyouts. 320px wide desktop, full-width on narrow viewports with the same escape-to-close mechanism `Navbar.astro` uses for search. Container: white `bg-surface`, 0.5px `border` (not `border-strong` — popovers already live above the page so they need less weight), 12px radius, subtle shadow (`shadow-md` token). Content sections use `0.5px border` dividers between rows. Dismiss on outside click, Escape key, or route change. First paint has the popover hidden; do not SSR an open state.

### Inputs
36px tall desktop, 44px mobile. 0.5px border, 8px radius, 12px horizontal padding, 15px body text. Focus: 1px accent (purple) ring, no background change. No placeholder text where a label would serve.

### Tables
Used for edition comparisons, recording tempo references, structured metadata. Left-align everything except numeric columns (right-aligned). No zebra striping; row separators are 0.5px border. Column headers: 12px Inter weight 500, all caps, tracked 0.08em, muted color. Body rows: 14px Inter.

### Borders and corners
Default border is 0.5px solid `#E5E3DE`. Never thicker than 1px anywhere. Featured cards (e.g., the recommended edition in a comparison) use 2px solid accent-purple — the only exception to the 0.5px rule, used sparingly.

Corner radius: 8px default (inputs, buttons), 12px large cards, 999px pills. Never use rounded corners with single-sided borders.

## Voice and Copy
- Sentence case everywhere user-visible.
- Never use exclamation marks in interface copy.
- Prefer direct over clever. "Compare editions" beats "Dive into the differences."
- Use em-dashes (—) and en-dashes (–) correctly in editorial prose. Em-dashes join thoughts; en-dashes join ranges; hyphens do neither.
- Use smart quotes in prose, straight quotes in code.
- Numbers under ten are spelled out in prose unless they are measurements, counts of editions, or catalog numbers.
- Write instrument names in lowercase (cello, not Cello), except at the start of a sentence or in tag labels.
- Never use emojis in interface or editorial content.

## Using this system with Claude

When starting a Claude design session, reference this document at the top of the conversation. A concise opening:

> Use the Irregular Pearl design system (attached). Follow every principle; do not introduce new tokens. Produce HTML/CSS (or React with Tailwind utilities mapped to these tokens), not static mockups. If you need a decision the system doesn't cover, ask before inventing it.

For iterative sessions, narrow scope each round: "Work on just the Editions block on the piece page," not "redesign the piece page." Three to four rounds on a narrow surface produce better work than one session on a wide one.

End every session by asking Claude to list what it changed from the system and why. If the list is non-empty, either update the system deliberately or revert.

Claude is an executor of this system, not its author. When the system needs to change, a human makes that change. Claude can propose; humans decide.

## Artist Profile
- **Single-column layout.** Display name, instruments, bio, social links.
- **Level badges:** Student/Amateur = default gray, Professional = accent-soft bg with accent text, Teacher = success-bg with success text.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Initial design system | Created by /design-consultation. Refined Library aesthetic with amber accent, Instrument Serif + DM Sans. Based on competitive research (IMSLP, tonebase, nkoda, Classeek) and old AI Studio prototype analysis. |
| 2026-03-28 | Amber accent over blue/red | Every classical music site uses blue or red. Amber signals warmth, tradition, and concert hall glow. |
| 2026-03-28 | No dark mode (Phase 1) | Primary users on iPads in lit practice rooms. Dark mode deferred to Phase 2. |
| 2026-03-28 | Instrument Serif italic for logo | Inspired by the old AI Studio prototype's Playfair Display italic wordmark. Instrument Serif is more contemporary. |
| 2026-04-18 | Merged docs/design-system.md into DESIGN.md | Two contradictory design systems existed. DESIGN.md matched the live site; docs/design-system.md was aspirational with conflicting tokens (white vs parchment, purple vs amber, Source Serif Pro vs Instrument Serif). Merged the structural additions (principles, components, voice, Claude governance) into DESIGN.md and deleted docs/design-system.md. |
| 2026-04-18 | Flat confirmed, textures removed | "Subtle warm textures" bullet removed from Aesthetic Direction. Live site is flat; the textures line was aspirational and never shipped. |
| 2026-04-18 | Two weights only (400, 500) | Adopted from design-system.md. Heavier weights read as loud on parchment surface. |
| 2026-04-18 | Sentence case everywhere | Codified. Never Title Case, never ALL CAPS except kicker eyebrows and wordmark. |
| 2026-04-19 | Removed applause, discussion, activity log, events, community directory | Scope narrowed to piece-page-centric knowledge base per PRD revision 2. Artist profile reduced to minimal bio + instruments. |
| 2026-04-19 | Piece page is one responsive surface, not two products | Reversed principle 7. Maintaining two piece-page products doubles the work and drifts the information architecture. A single page reflowed with CSS keeps content, ordering, and hierarchy shared across viewports. Supersedes PRD.md "Piece page, mobile" language about a separate product. |
| 2026-04-19 | Sans family: Inter (replaces DM Sans); wordmark: Inter non-italic (replaces Instrument Serif italic) | User preference. Inter is the interface voice across body, UI, and the wordmark. The wordmark is now plain and precise rather than flowing. Instrument Serif stays as the editorial serif for piece titles, section headings, and hero display. |
| 2026-04-19 | Wordmark rendered as `IrregularPearl` (one word) | The logo glyph is the concatenated form. Prose, meta titles, legal text, and editorial copy keep the two-word form `Irregular Pearl` for readability. The wordmark is a brand mark; the prose is writing. |
| 2026-04-19 | **Aesthetic flipped to Claude design kit direction (supersedes amber/parchment/Instrument Serif).** | Purple accent `#6B4E7C`, white `#FFFFFF` primary with `#F8F7F4` tint, Source Serif 4 for editorial (Instrument Serif removed), 0.5px borders, eight-size type scale, two weights (400/500). Reverses the 2026-04-18 purple-vs-amber decision. Rationale: building the piece-page redesign against the kit's IA and tokens is cleaner than reskinning; the kit's museum-catalog/scholarly register is a better fit for the PRD's "reference surface, not product chrome" posture than the earlier refined-library direction. Legacy-amber.css kept in `~/Downloads/Irregular Pearl Design System/` as a historical snapshot. |
| 2026-04-19 | Piece page ported from Claude design kit into `src/components/PiecePageLayout.astro` | Single responsive page, 9 PRD Tier 1 sections (breadcrumbs → header → performer's notes → landmarks → schools → description → editions → recordings → pedagogical arc → external references). Sections without schema (performer's notes, landmarks per-movement, schools, pedagogical arc) show empty-state copy worded as state. No kit chrome (nav/footer provided by `Layout.astro`); no meta-caption paragraphs under section headings. `piece-page.css` uses kit-namespace CSS variables from `global.css :root`. |
| 2026-04-19 | Landing page redesigned as front-matter-of-a-journal (`src/pages/index.astro`) | Navbar wordmark left, centered desktop search (`w-1/2 max-w-xl`), mobile search collapses to icon with an escape-dismissible overlay. About sits immediately left of the AuthButton (Sign in / avatar). "Browse" text link and navbar "beta" label removed. Hero is the wordmark `IrregularPearl` in Inter medium 34px with subtitle "Classical music knowledge platform". In Focus block is conditional — renders only when a recently approved signed work exists (stubbed to `null` until the contributor approval pipeline lands). Below: unnumbered list of pieces (title · composer · catalog number), ordered by `created_at DESC` as a proxy for `updated_at` until the pipeline wires real update events. Removes the old browse-by-era tile grid, top-composer avatars, and MostWanted requests section — all contradicted the PRD rev 2 "narrow scope" posture with 19 pieces and one contributor. |
| 2026-04-19 | Navbar search inputs carry `shadow-md` (exception to principle 1 "no drop shadows") | User preference to give the search input a clearer "tap me" affordance, especially on the first-visit landing page where search is the primary action. The exception is scoped to the search-input control only — no other surface on the site introduces shadows. Principle 1 remains load-bearing everywhere else. |
| 2026-04-19 | Four-axis difficulty panel made responsive: 4 → 2×2 → 1×4 | `.diff-panel` in `piece-page.css` stays at four columns on wide viewports, collapses to 2×2 under 1024px and to a single column under 768px. Keeps the PRD "one responsive page" principle intact as the panel narrows. |
| 2026-04-19 | Removed Crumb *Vox Balaenae* (catalog entry + `difficulty_axes` + Supabase `pieces` row) | Chamber-trio scope (electric flute + cello + piano, masks, blue lighting, graphic notation) sits outside the cellist-forward daily-use loop the catalog is being built around. FK cascade cleans up related editions and external_links. Catalog now stands at 18 pieces. Migration `20260419210000_remove_vox_balaenae.sql`. |
| 2026-04-20 | Signed notes pattern now shipping live on the piece page | First signed content on the site. Slice A of the contributor approval pipeline shipped: performer's notes render in the existing `.signed` pattern (2px accent left border, 18px padding, Source Serif 4 prose, byline in Inter medium with one-line bio). Contributor self-authored vs staff-drafted-and-approved both produce the same public output; the difference is the state machine behind the scenes. Multi-voice treatment (second voice uses `border-strong` instead of accent) already wired in markup even though v1 ships one contributor. |
| 2026-04-20 | Secondary outline button pattern codified | Four surfaces had four different secondary-button looks during the Slice A build. Aligned all to one spec: transparent bg, 0.5px `border-strong`, `text-muted`, Inter 11px, padding `4px 10px`, 6px radius, darkens to `ink` on hover. Applies to Edit/Remove on signed notes, Refresh on the queue, Edit profile on the owner bar, and all filter chips. Enshrined in Buttons spec. |
| 2026-04-20 | Popover spec added | Slice A's navbar bell introduced the site's first popover surface. Spec: 320px desktop / full-width narrow, `bg-surface`, 0.5px `border`, 12px radius, `shadow-md` (popovers float above the page so they get the shadow exception already granted to search inputs), 0.5px row dividers, Esc/outside-click/route-change dismiss. |
| 2026-04-20 | Profile page now a sidebar shell for the signed-in owner | Clicking the navbar avatar opens `/profile/:id`. For the owner, the page renders a two-column shell (`ProfileShell.tsx`) with a left vertical nav — Profile / Setting / Logout — and the existing `ArtistProfile` inside. Anonymous or other-user views render the single-column profile unchanged. Active nav item uses `bg-accent-light` (the new subtler `#F4F3F5`), inactive items hover to `bg-bg-tint`. Logout calls `supabase.auth.signOut()` and redirects home. Profile header now uses the same `GenerativeAvatar` and `email.split('@')[0]` derivation as the navbar so the two stay consistent. |
| 2026-04-20 | Dark mode shipped as opt-in via Settings → Appearance | Supersedes the 2026-03-28 "no dark mode in Phase 1" decision. Light remains the default; System follows `prefers-color-scheme`; Dark forces. Preference stored in `localStorage.theme` and applied by a pre-paint inline script in `Layout.astro` via `html[data-theme="dark"]` to avoid FOUC. Tokens for dark live in `global.css` under that selector; the palette is provisional and inherits all existing variable consumers. Theme picker (`AppearanceSettings.tsx`) shows three SVG preview cards (Light / split-diagonal System / Dark). Known gap: piece-page cards (`diff-panel`, `school`, `ed`) were migrated from `background: #fff` to `background: var(--bg)`; other surfaces still using hardcoded hex will need per-component migration. |
| 2026-04-20 | `accent-soft` softened from `#F2EEF5` → `#F4F3F5` | The Profile sidebar's active state used `bg-accent-light` and read as an obvious lavender pill. Dropped the purple cast from RGB(+7B vs G) to RGB(+2B vs G) — still distinguishable as "accent family" but close enough to neutral grey that it no longer competes with the content. Applied globally; affects every selected/soft-accent surface. |
| 2026-04-21 | Seed cards never render a signer | Codified as a general rule across stacked-card surfaces that mix user-contributed entries with a seed fallback (signed descriptions, signed difficulty, future entities). The seed card shows only vote thumbs flush right — no name field, no italic "Seed" label, no byline block. Bylines mean a human approved the text; attaching any byline-like label to seed content reads as attribution and muddies the signed-vs-unsigned distinction. Applied to [SignedPieceDifficulty.tsx](src/components/SignedPieceDifficulty.tsx); SignedPieceDescription already followed the rule. |
| 2026-04-21 | Stacked-card pattern (chevron rotate) codified | The signed-description stack (one active card + "behind" hints + `← N of M →` controls + seed card pinned last) is now the shared pattern for any plural-voice surface that has a seed fallback. First reuse: `piece_difficulty_ratings`. User cards sort by `vote_tallies.net_score DESC` via `fetch_ordered_subjects` (raw counts never leave the server); seed is appended client-side so user ratings win ties. Styles live under `.desc-stack*` in `piece-page.css` — reused by both components. |
| 2026-04-21 | Signed content spans the full content column | The 640px `max-width` cap on `.description-essay .prose`, the byline row, the seed-thumbs row, and the essay textarea was dropped. Signed prose now fills the piece page's content column (up to the 1180px `.page` max), matching the difficulty card layout. Rationale: the older cap was a holdover from a narrower column; with the new stacked-card chrome + full-width difficulty panel above it, the narrower prose column read as inconsistent. |
| 2026-04-21 | Vote thumbs active color dropped to `--tertiary` | Active thumb color briefly used `var(--success)` (green) and then `#F37021` (Hermès orange) before settling on `var(--tertiary)` — the hint grey that matches the idle state on desktop. The filled-vs-outlined SVG glyph now carries the voted/un-voted signal alone; color contributes almost nothing. Rationale: the voting affordance should stay quiet — it's a community-signal surface, not a primary action, and the filled icon is already a sufficient cue. The upvote celebration pulse (scale bounce + drop-shadow glow) stays but inherits the hint tone. |
| 2026-04-21 | `useAuth` hook is the sole source of truth for signed-content islands | `SignedPieceDescription` and `SignedPieceDifficulty` stopped calling `supabase.auth.getSession()` directly. Both now read `user` from `useAuth`, which subscribes to `onAuthStateChange` and re-renders when the session hydrates. Profile fields (display name, short bio) load in a follow-up effect keyed on `user.id`. Fixes a race where the sign-in panel would open for already-authed users if the session hadn't finished hydrating from localStorage at mount. Applies going forward: any React island that gates behavior on auth state uses `useAuth`, not `getSession()`. |
| 2026-04-24 | `color-palette.htm` adopted as the visual source of truth | Repo-root HTML page renders both light and dark themes side-by-side with tagged component samples (T typography, B buttons, C chips, D drafting banner, A alerts, R request dialog, P pending-draft proposal, F draft form, W wiki-edit dialog, I inline confirm, X toast, H admin header, E signed-content edit form). Each sample renders against the actual CSS tokens, so any contrast bug shows up at a glance in both modes. Required reading before introducing a new visual pattern; add a sample when shipping one the palette doesn't cover. Companion to DESIGN.md (palette = visual source of truth, DESIGN.md = principles + tokens + voice). Lives at repo root, not `/public`, so it doesn't deploy. |
| 2026-04-24 | "color: var(--bg)" rule for any text on a token-driven background | Codified after a sweep that found `color: #fff` paired with `background: var(--ink)` or `background: var(--accent)` going invisible in dark mode (`--ink` flips to white, `--accent` flips to light purple). New rule: text on a theme-token background uses `color: var(--bg)` so it inverts with the surface. Literal `#fff` only when the background is also a literal hex (e.g., the always-dark Toast and admin header). Applies to inline `style={}`, scoped `<style>` blocks, Tailwind classes (prefer `text-bg` over `text-white`), and shared CSS files. |
| 2026-04-24 | Always-dark "interrupt" surfaces use literal hex, not `bg-ink` | Toast and admin header are deliberately always-dark in both themes — the interrupt-surface UX cue. `bg-ink` would invert in dark mode, so they pin literal `#1A1A1A` background with explicit white text. Toast checkmark uses literal `#7FC592` (success-green) and Undo uses `#FCD34D` (warning-yellow), bright variants picked to read on the always-dark surface. Documented in `color-palette.htm` under [X] Toast and [H] Admin header. |
| 2026-04-24 | `--accent-hover` defined in `:root` + dark block (was `@theme`-only) | The Tailwind `@theme` block defined `--color-accent-hover` for utility class generation, but the kit-namespace `:root` (`--accent`, `--ink`, `--bg`, etc.) was missing the matching `--accent-hover`. Any rule that used `var(--accent-hover, …)` always fell to the literal-hex fallback in dark mode. Now defined in both blocks: light `#4C385C`, dark `#D6C2E3`. Same pattern applied to `--accent-border`. |
