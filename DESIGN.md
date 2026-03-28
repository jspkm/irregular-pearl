# Design System — Irregular Pearl

## Product Context
- **What this is:** A piece-centric knowledge platform for classical music
- **Who it's for:** Classical musicians (conservatory students, performers, teachers), music enthusiasts
- **Space/industry:** Classical music knowledge, reference platforms
- **Project type:** Web app (SSR), iPad-first responsive design

## Aesthetic Direction
- **Direction:** Refined Library, Modernized
- **Decoration level:** Intentional (subtle warm textures, content IS the decoration)
- **Mood:** Walking into a new conservatory library with warm wood, natural light, and clean typography. Scholarly authority with contemporary craft. Not dusty (IMSLP), not corporate (nkoda), not streaming-dark (tonebase).
- **Reference sites:** IMSLP (competitor, zero design), tonebase (dark streaming feel), Classeek (corporate), old AI Studio prototype (warm research aesthetic)

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

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Initial design system | Created by /design-consultation. Refined Library aesthetic with amber accent, Instrument Serif + DM Sans. Based on competitive research (IMSLP, tonebase, nkoda, Classeek) and old AI Studio prototype analysis. |
| 2026-03-28 | Amber accent over blue/red | Every classical music site uses blue or red. Amber signals warmth, tradition, and concert hall glow. |
| 2026-03-28 | No dark mode (Phase 1) | Primary users on iPads in lit practice rooms. Dark mode deferred to Phase 2. |
| 2026-03-28 | Instrument Serif italic for logo | Inspired by the old AI Studio prototype's Playfair Display italic wordmark. Instrument Serif is more contemporary. |
