# Design System — Irregular Pearl

## Product Context
- **What this is:** A piece-centric knowledge platform for classical music
- **Who it's for:** Classical musicians (conservatory students, performers, teachers), music enthusiasts
- **Space/industry:** Classical music knowledge, reference platforms
- **Project type:** Web app (SSR), iPad-first responsive design

## Aesthetic Direction
- **Direction:** Refined Library, Modernized
- **Decoration level:** Flat, no textures. Content is the decoration.
- **Mood:** Walking into a new conservatory library with warm wood, natural light, and clean typography. Scholarly authority with contemporary craft. Not dusty (IMSLP), not corporate (nkoda), not streaming-dark (tonebase).
- **Reference sites:** IMSLP (competitor, zero design), tonebase (dark streaming feel), Classeek (corporate), old AI Studio prototype (warm research aesthetic)

## Principles

1. **Flat, not skeuomorphic.** No gradients, drop shadows, glow, blur, noise, or faux 3D. Surfaces are solid colors separated by 1px borders and whitespace.
2. **Typography does the hierarchy.** Size, weight, and spacing carry structure. Color is sparingly used and only where it encodes meaning.
3. **Serif for editorial, sans for interface.** Long-form performer's notes, interpretive schools, and piece descriptions use Instrument Serif (the reading voice of the site). Navigation, buttons, labels, metadata, and tables use DM Sans. The switch is deliberate.
4. **Sentence case everywhere.** Headings, button labels, nav items, tags. Never Title Case, never ALL CAPS, except small kicker eyebrows and the wordmark if set in caps.
5. **Two weights only.** 400 regular for body; 500 medium for emphasis, headings, button labels, and names. Never 600 or 700. They read as heavy on the quiet surfaces the site uses.
6. **Ink on parchment or white.** Primary reading is ink on parchment (#FAF8F5). Cards, sidebars, and modals use white (#FFFFFF) for gentle separation. Color is reserved for semantic meaning (warning flags, applause states, interpretive accents) and small editorial chrome.
7. **Mobile and desktop are different products.** The piece page on mobile leads with landmarks and flags above editions and recordings. Desktop can present more discovery-friendly hierarchy. Both are first-class. Neither is a port of the other.

## Logo / Wordmark
- **Font:** Instrument Serif italic
- **Style:** Flowing, elegant, not bold. The wordmark IS the logo. No icon needed.
- **Usage:** Top-left navbar, homepage hero
- **"beta" tag:** DM Sans, regular weight, smaller size, muted color

## Typography
- **Display/Hero:** Instrument Serif (regular + italic) — elegant serif with musical DNA in the name. Used for piece titles, section headings, homepage hero.
- **Body:** DM Sans — clean, readable, modern. Better character width than Inter for body text. Used for descriptions, discussions, UI text.
- **UI/Labels:** DM Sans Medium — tabs, buttons, nav items
- **Data/Tables:** JetBrains Mono — catalog numbers (BWV 1007, Op. 104, K. 331), metadata. Supports tabular-nums.
- **Code:** JetBrains Mono
- **Loading:** Google Fonts CDN
  ```html
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  ```
- **Scale (modular 1.25):**
  - xs: 11px (mono labels)
  - sm: 13px (UI, discussion text, edition details)
  - base: 14px-15px (body text)
  - lg: 18px (section headings)
  - xl: 24px (piece titles on mobile)
  - 2xl: 28px (piece titles on desktop)
  - 3xl: 36px (homepage hero)
  - 4xl: 48px (display, preview page)

## Color
- **Approach:** Restrained (warm neutrals + one accent color)
- **Background:** #FAF8F5 — warm parchment, the signature Irregular Pearl surface
- **Surface:** #FFFFFF — cards, sidebar, modals
- **Ink:** #1C1917 — warm near-black for primary text
- **Muted:** #78716C — secondary text, timestamps, placeholders
- **Border:** #E7E5E4 — subtle warm gray borders
- **Accent:** #B45309 — amber/warm gold. Like the patina on a well-loved instrument, or the glow of a concert hall. Distinct from the blue (IMSLP) and red (nkoda/tonebase) that dominate this space.
- **Accent hover:** #92400E — darker amber on interaction
- **Accent light:** #FEF3C7 — light amber for backgrounds (working-on badge, selected states)
- **Star rating:** #D97706 — golden amber for edition stars
- **Semantic:**
  - Success: #15803D on #F0FDF4 (border: #BBF7D0)
  - Error: #DC2626 on #FEF2F2 (border: #FECACA)
  - Warning: #CA8A04 on #FEFCE8 (border: #FDE68A)
  - Info: #0369A1 on #F0F9FF (border: #BAE6FD)
- **Dark mode:** Deferred to Phase 2. Primary users are on iPads in well-lit practice rooms.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable (not cramped like IMSLP, not wasteful)
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)
- **Content padding:** 16px mobile, 32px tablet, 40px desktop

## Layout
- **Approach:** Grid-disciplined
- **Piece page:** Two-column (content + 280-340px discussion sidebar). Sidebar always visible on tablet+.
- **Homepage:** Three-column card grid, pieces grouped by instrument
- **Max content width:** 1100px
- **Breakpoints:**
  - Mobile: < 768px (single column, sidebar below content)
  - Tablet/iPad: 768px-1024px (two-column, 280px sidebar)
  - Desktop: > 1024px (two-column, 340px sidebar)
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
Small caps label above a section heading. Amber accent, 11-12px DM Sans, letter-spacing 0.4px, weight 500, `text-transform: uppercase`. Used once per section. Editorial chrome, not navigation.

### Metadata pills
Rounded chips for piece-level metadata (instrument, era, form, duration). Neutral only, never colored unless semantic.
`font-size: 12px; padding: 3px 10px; border-radius: 9999px; background: #F5F4F1; color: #78716C`

### Difficulty flags
Inline pill within a structural landmark. Uses the warning palette.
`font-size: 11px; padding: 2px 9px; border-radius: 9999px; background: #FEFCE8; color: #CA8A04; border: 1px solid #FDE68A; weight: 500`

### Cards
White background, 1px border (#E7E5E4), 8px radius (12px for large cards), 16px internal padding. Cards stack with 12px gaps. Cards never nest more than one level.

### Signed notes
Performer's notes and interpretive-school descriptions use a distinctive pattern: 2px amber left border, 18px left padding, Instrument Serif prose inside. Byline underneath in DM Sans sentence case. Contributor display name in weight 500, one-line bio in muted color.

### Buttons
Primary buttons are rare. Only when a single action deserves a solid background. When used: ink (#1C1917) bg, white text, 14px DM Sans weight 500, 8px radius, 8px / 16px padding. Secondary: transparent bg, 1px border, same type. Ghost: no border, underline on hover only.

### Inputs
36px tall desktop, 44px mobile. 1px border, 8px radius, 12px horizontal padding, 15px body text. Focus: 2px amber ring, no background change. No placeholder text where a label would serve.

### Tables
Used for edition comparisons, recording tempo references, structured metadata. Left-align everything except numeric columns (right-aligned). No zebra striping; row separators are 1px border. Column headers: 12px DM Sans, all caps, tracked out, muted color. Body rows: 14px DM Sans.

### Borders and corners
Default border is 1px. Featured cards (e.g., the recommended edition in a comparison) may use 2px amber. This is the only exception. Corner radius: 8px default, 12px large cards, 9999px pills.

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

## Community Section

### Community Page (`/community`)
- **Purpose:** Browsable directory of registered musicians
- **Layout:** Three-column card grid (desktop), two-column (tablet), single (mobile)
- **Sections (top to bottom):**
  1. **Featured Artists** — horizontal scroll strip, top 5-10 most applauded. Each card: avatar, name, instrument, applause count.
  2. **Filter tabs** — All, Piano, Violin, Cello, Voice, Winds. Pill-style, amber fill on active.
  3. **Recently Active** — card grid sorted by recent activity_log entries. Badge shows total count.
  4. **New Members** — chip-style row with mini avatars, recently joined users.
- **Artist card contents:** Generative avatar, display name (Instrument Serif), instrument, level badge, "Working on [piece]" snippet, applause count, Applaud button.

### Applause Feature
- **Terminology:** "Applaud" (action), "Applauding" (active state), "applause" (count noun). NOT "follow/followers."
- **Pluralization:** "1 applause" (singular), "47 applause" (plural). Zero applause shows nothing — no count, no text.
- **No icon.** Applause count is text-only. No emoji, no SVG icon.
- **Button states:**
  - Default: amber outline, text "Applaud"
  - Hover: solid amber fill, white text
  - Active: solid amber fill, white text "Applauding ✓"
  - Logged out: 50% opacity, disabled, links to sign-in on click
- **Button style:** pill shape (border-radius: 9999px), DM Sans medium, 12px on cards / 13px on profiles
- **Profile display:** Applause count + Applaud button in a row below the user details. Below that, a row of mini avatars (28px) showing who applauded, with "+N more" overflow text.
- **Realtime:** Count updates via Supabase realtime subscriptions.
- **DB table:** `applause` — columns: `user_id`, `artist_id`, `created_at`. Unique constraint on `(user_id, artist_id)`.

### Profile Page Layout (updated)
- **Two-column layout** on tablet+ (single column on mobile, sidebar below content)
- **Left column (main content):** Bio (pre-formatted text), social links, training timeline, performances, instruments
- **Right column (sidebar, 300px):** Collapsible sections for Working On, Discussions, Reviews
  - Each section: card with header (title + count badge + chevron), click to toggle open/closed
  - Working On: open by default
  - Discussions, Reviews: collapsed by default
  - Header hover: subtle background fill (var(--bg))
  - Chevron rotates 180deg on open (200ms ease transition)
- **Level badges:** Student/Amateur = default gray, Professional = amber light bg, Teacher = green light bg

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Initial design system | Created by /design-consultation. Refined Library aesthetic with amber accent, Instrument Serif + DM Sans. Based on competitive research (IMSLP, tonebase, nkoda, Classeek) and old AI Studio prototype analysis. |
| 2026-03-28 | Amber accent over blue/red | Every classical music site uses blue or red. Amber signals warmth, tradition, and concert hall glow. |
| 2026-03-28 | No dark mode (Phase 1) | Primary users on iPads in lit practice rooms. Dark mode deferred to Phase 2. |
| 2026-03-28 | Instrument Serif italic for logo | Inspired by the old AI Studio prototype's Playfair Display italic wordmark. Instrument Serif is more contemporary. |
| 2026-04-02 | "Applause" over "Follow/Followers" | Classical music social connection should use performance-world language. "Applaud" is warm, respectful, unmistakably musical. |
| 2026-04-02 | No icon on applause count | Text-only count is cleaner and more typographic. No emoji, no SVG. |
| 2026-04-02 | Zero applause = hidden | Don't show "0 applause". New users shouldn't see an empty vanity metric. |
| 2026-04-02 | Two-column profile with collapsible sidebar | Bio, training, performances on the left (the permanent identity). Working On, Discussions, Reviews on the right as collapsible sections (the active/changing content). |
| 2026-04-02 | Community page added | Browsable directory at /community with featured artists, instrument filters, recently active grid, new members. |
| 2026-04-18 | Merged docs/design-system.md into DESIGN.md | Two contradictory design systems existed. DESIGN.md matched the live site; docs/design-system.md was aspirational with conflicting tokens (white vs parchment, purple vs amber, Source Serif Pro vs Instrument Serif). Merged the structural additions (principles, components, voice, Claude governance) into DESIGN.md and deleted docs/design-system.md. |
| 2026-04-18 | Flat confirmed, textures removed | "Subtle warm textures" bullet removed from Aesthetic Direction. Live site is flat; the textures line was aspirational and never shipped. |
| 2026-04-18 | Two weights only (400, 500) | Adopted from design-system.md. Heavier weights read as loud on parchment surface. |
| 2026-04-18 | Sentence case everywhere | Codified. Never Title Case, never ALL CAPS except kicker eyebrows and wordmark. |
