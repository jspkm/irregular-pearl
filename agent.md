# Irregular Pearl — Agent Context

A classical music streaming web app built with Next.js and Firebase. Deployed as a static export to Firebase Hosting.

**Live:** https://irregular-pearl.web.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.x (App Router, static export via `output: "export"`) |
| Language | TypeScript, React 19 |
| Styling | Vanilla CSS (`globals.css`, ~1250 lines). **No Tailwind utilities are used** despite being in `package.json`. |
| Backend | Firebase (Auth, Firestore). No server-side code — everything is client-side. |
| Deployment | Firebase Hosting (static `out/` directory) |

---

## Firebase Environments

Configured in `.firebaserc`:

| Alias | Project ID | Usage |
|---|---|---|
| `development` (default) | `irregular-pearl-dev` | Day-to-day dev |
| `production` | `irregular-pearl` | Live site |

**Deploy commands:**
```bash
npm run deploy:dev    # firebase deploy -P development
npm run deploy:prod   # firebase deploy -P production
```

Environment variables are in `.env.development` and `.env.production` (see `.env.example` for keys). All are `NEXT_PUBLIC_*` Firebase config vars.

---

## Project Structure

```
irregular-pearl/
├── app/
│   ├── layout.tsx          # Root layout, wraps children in <AuthProvider>
│   ├── page.tsx            # THE main (and only) page (~1250 lines, single component)
│   ├── globals.css         # All styles (~1250 lines)
│   ├── icon.png            # Favicon
│   └── apple-icon.png      # Apple touch icon
├── contexts/
│   └── AuthContext.tsx      # React context for auth state + methods
├── lib/
│   ├── firebase.ts          # Firebase app initialization (exports db, auth)
│   ├── auth.ts              # Auth helpers: Google, email sign-in/up, sign-out, updateProfile
│   ├── firestore.ts         # Firestore CRUD: tracks, playlists, userProfiles
│   └── types.ts             # TypeScript interfaces: Track, Playlist, UserProfile
├── scripts/
│   ├── seed-tracks.ts       # Track seed data (~120 classical music tracks)
│   └── patch-audio-urls.ts  # Utility to fix audio URLs in Firestore
├── public/
│   ├── piano-keys.png       # Logo icon used in membership header
│   └── irregular-pearl.png  # App icon
├── firestore.rules          # Security rules for tracks, playlists, userProfiles
├── firebase.json            # Hosting (public: "out") + Firestore config
├── next.config.ts           # Static export: { output: "export" }
└── package.json             # Scripts: dev, build, deploy:dev, deploy:prod
```

---

## Architecture

### Single-Page App

The entire UI lives in `app/page.tsx` — one large `"use client"` component. There is no routing (single page). Key UI sections:

1. **Music Player** — Floating, draggable panel (center of screen). Plays audio via `<audio>` element. Has play/pause, skip, seek, volume, track list, and browse tabs.
2. **Membership Header** — Fixed top-right button. Shows "BECOME A MEMBER / LOG IN" when logged out, or the user's first name when logged in.
3. **Auth Panel** — Floating, draggable sign-in/sign-up form. Supports Google and email auth.
4. **Profile Panel** — Floating, draggable panel. Shows avatar (uploadable), name, email, and sign-out button.
5. **Playlist Manager** — Tab within the player for managing playlists (create, rename, delete, add/remove tracks).

### Draggable Panels Pattern

The player, auth panel, and profile panel all use the same drag pattern:
- `useRef` for the panel element and a drag state ref
- `onPointerDown` / `onPointerMove` / `onPointerUp` handlers
- `position: fixed` with `left`/`top` via state (`useState({ x, y })`)
- Initial positions set in a `useEffect` on mount

### State Management

Pure React `useState` + `useEffect`. No external state library. Auth state comes from `AuthContext` via `useAuth()` hook.

---

## Firestore Collections

| Collection | Document ID | Fields | Access Rules |
|---|---|---|---|
| `tracks` | Auto-generated | `title`, `composer`, `performers[]`, `conductor?`, `venue?`, `datePerformed?`, `albumCover?`, `durationSeconds`, `epoch`, `source`, `audioUrl`, `license` | Public read, no client writes |
| `playlists` | Auto-generated | `name`, `ownerId` (null = master), `trackIds[]`, `createdAt`, `updatedAt` | Master (ownerId=null) is public read; user playlists require auth + ownership |
| `userProfiles` | `{uid}` | `displayName`, `photoURL?` (base64 data URI), `updatedAt` | Auth'd user can only read/write their own doc |

---

## Auth Flow

- **Google Sign-in**: Uses `signInWithPopup` with `GoogleAuthProvider`. Display name and photo come from Google.
- **Email Sign-up**: Uses `createUserWithEmailAndPassword` + `updateProfile` to set display name. A "Display Name" input field is shown during signup.
- **Email Sign-in**: Uses `signInWithEmailAndPassword`.
- **Profile Updates**: Avatar photos are resized to 128×128 JPEG, stored as base64 data URIs in Firestore `userProfiles`. Firebase Auth `photoURL` is also updated.

---

## CSS Architecture

All styles in `app/globals.css`. Major sections (in order):

1. **Global resets & body** — Pink/mauve radial gradient background
2. **Membership header** — `.membership-header`, `.membership-header__icon-box`, `.membership-header__text`
3. **Logged-in header variants** — Avatar and name classes
4. **Profile panel** — `.profile-panel`, titlebar, body, avatar wrapper, overlay, sign-out
5. **Floating player** — `.floating-player`, titlebar, controls, volume, seek bar, track list, browse, playlist manager
6. **Auth panel** — `.floating-auth`, titlebar, close, body, inputs, buttons
7. **Animations** — `authFadeIn` keyframes

**Design language**: Y2K aesthetic — pink/mauve palette (`#f2b9dd`, `#e8b8f5`, `#c57aa7`, `#763f71`), Courier New monospace text, bordered boxes with no border-radius, subtle gradients, glassmorphism with `backdrop-filter: blur()`.

---

## Audio Sources

Tracks are sourced from Wikimedia Commons (public domain classical music recordings). Audio URLs follow the pattern:
```
https://upload.wikimedia.org/wikipedia/commons/...
```

The `scripts/seed-tracks.ts` file contains ~120 tracks. The `scripts/patch-audio-urls.ts` script is a one-time utility to audit and fix broken audio URLs in Firestore.

---

## Development Workflow

```bash
# Install
npm install

# Run dev server
npm run dev           # http://localhost:3000

# Build static export
npm run build         # Outputs to out/

# Deploy
npm run deploy:dev    # Development project
npm run deploy:prod   # Production project

# Deploy only Firestore rules
firebase deploy --only firestore:rules -P development
firebase deploy --only firestore:rules -P production

# Seed tracks (one-time, requires firebase-admin)
npx tsx scripts/seed-tracks.ts
```

---

## Key Conventions

- **No server-side rendering** — Static export only. All data fetching is client-side via Firestore SDK.
- **No component library** — Everything is hand-written JSX in `page.tsx`.
- **No state management library** — Pure React hooks.
- **`@/` path alias** — Maps to project root (`lib/`, `contexts/`, etc.).
- **All panels are draggable** — Follow the pointer event pattern described above.
- **Membership header width is fixed** — `.membership-header__text` has `width: 207px` to maintain consistent button size across logged-in/logged-out states.

---

## Git Workflow

This repository may be worked on by multiple coding agents and humans. Keep changes scoped, reviewable, and easy to trace through Git history.

### Branching

- Do not work directly on `main` unless explicitly requested.
- For isolated tasks, create a branch whose prefix matches the agent or tool name in use.
- Preferred branch format:
  - `<agent-name>/<task-slug>`
- Examples:
  - `codex/fix-mobile-player`
  - `claude/add-divider-ornament`
  - `aider/update-build-script`
- Use lowercase kebab-case for task slugs.

### Worktrees

- When a separate workspace is helpful, create a git worktree from `origin/main` unless another base is requested.
- Place the worktree adjacent to the current repository when practical.
- Name the worktree directory after the task slug or branch name.

### Staging

- Stage only files relevant to the current task.
- Do not include unrelated local modifications in a commit.
- If unrelated changes are present, work around them and keep commits task-specific.

### Commit Messages

- Use conventional commit style.
- Preferred format:
  - `<type>: <summary>`
- Common types:
  - `feat` for new functionality
  - `fix` for bug fixes
  - `refactor` for internal code changes without intended behavior change
  - `docs` for documentation-only changes
  - `test` for test changes
  - `chore` for maintenance or tooling changes
  - `style` for visual or presentation-only changes
- Keep the summary concise and specific.
- Good examples:
  - `fix: prevent mobile player from clipping behind browser chrome`
  - `style: add decorative divider to track panel`

### Pushes

- When pushing a new branch, set upstream.
- Preferred command:
  - `git push -u origin <branch>`
- Do not force-push unless explicitly requested.
- Do not amend published commits unless explicitly requested.

### Safety

- Do not discard or overwrite user changes unless explicitly instructed.
- Avoid destructive commands such as `git reset --hard`, `git checkout -- .`, or `git clean -fd` unless explicitly approved.

### Verification and Handoff

- Before committing, run relevant checks when feasible.
- Prefer targeted verification first, then broader validation if needed.
- If verification cannot be run, note that clearly in the final handoff.
- Summarize what changed, what was verified, and any known limitations or follow-up work.
