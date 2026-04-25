# Awaiting-First-Contribution Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A piece that has zero signed contributions still renders the unsigned identity description, editions, external references, recordings, movements, and pedagogical arc — only the *signed* sections (performer's notes, signed piece descriptions, signed difficulty, interpretive schools, structural landmarks) stay hidden behind the invite. The mode label is renamed `pre-piece` → `awaiting-first-contribution` so the code reads what it does.

**Architecture:** Pure rendering change in `src/components/PiecePageLayout.astro` plus the mode-label rename across four files. No DB migration. No new components. The encyclopedia `description` paragraph renders as a plain identity-layer block (no card, no thumbs) — it is treated like the title, not like content. The signed `SignedPieceDescription` component (which wraps the same paragraph as a "Seed data" card with vote thumbs) only activates once the page exits awaiting mode.

**Tech Stack:** Astro 5 SSR, React 19 islands, Bun test runner, Supabase Postgres, Tailwind v4 + scoped CSS variables.

---

## Background — what changes and why

Today, [`src/components/PiecePageLayout.astro`](../../../src/components/PiecePageLayout.astro) has two branches keyed on `mode`:

- `mode === 'pre-piece'` — renders only the breadcrumb, header, pills, and an "invitation" block with `Start the first contribution` + `Request a contribution` CTAs. Every other section (descriptions, difficulty, performer's notes, movements, schools, editions, recordings, pedagogical arc, external references, change log) is hidden.
- `mode === 'full'` — renders all sections.

The product rule clarified during brainstorming on 2026-04-25:

| Layer | Treatment in awaiting mode |
|---|---|
| Identity (title, catalog, byline, pills, **description paragraph**) | Always visible |
| Status (invite block: "Awaiting first contribution") | Always visible while awaiting |
| Reference (movements skeleton, editions, recordings, pedagogical arc, external references, change log link) | Always visible |
| Signed content (performer's notes, signed piece descriptions, signed difficulty, interpretive schools, structural landmarks within movements) | Hidden until at least one signed contribution lands |

The encyclopedia `description` is identity, not content awaiting signing — like the piece title. It must render in awaiting mode as a plain prose paragraph using the existing `.piece-intro` class, not the `SignedPieceDescription` "Seed data" card with vote thumbs. The card-with-thumbs framing only makes sense when there's a signed counterpoint to vote against, which by definition is the `mode === 'full'` case.

Mode label `pre-piece` is awkward in the code (`isPrePiece` reads as a boolean but the value is a string compare; "pre-piece" doesn't describe what it *is*). Renaming to `awaiting-first-contribution` makes the conditional self-documenting.

The `isStub(piece)` predicate stays unchanged — `!piece.has_signed_content`. The view `v_pieces_with_content_state` stays unchanged. The migration trail is untouched.

## File Structure

**Modified:**

- `src/components/PiecePageLayout.astro` — main change. Restructures the conditional rendering so identity-layer description + reference-layer sections render regardless of mode, while signed-content sections only render in `full` mode. Renames `'pre-piece'` → `'awaiting-first-contribution'` in the prop union and the `isAwaiting` flag.
- `src/pages/piece/[id].astro` — renames the mode literal in the ternary.
- `src/components/StartContributionButton.tsx` — comment update referencing the renamed mode.
- `src/components/PiecePills.tsx` — comment update referencing the renamed mode (line 34).
- `src/lib/pieces.ts` — comment update on `isStub` (lines 238–245).
- `src/lib/pieces.test.ts` — comment update on the `describe('isStub')` block referencing the renamed semantic; one new test verifying the rename keeps the predicate stable.

**Tests touched:**

- `src/lib/pieces.test.ts` — already covers `isStub`. One new assertion added.
- `src/integration/awaitingFirstContribution.test.ts` — *new file*. Renders the layout via SSR fetch against the local dev server and asserts the section visibility contract: identity description visible, reference sections visible, signed-content sections hidden, invite block visible.

**No DB changes. No new components. No new CSS rules.**

The `.piece-intro` class for plain identity-layer prose is already defined in [`src/components/PiecePageLayout.astro`](../../../src/components/PiecePageLayout.astro) at line 274–283 — currently only referenced in commentary because the awaiting branch doesn't render any prose. We start using the class.

---

## Tasks

### Task 1: Update `isStub` doc comment to reflect the renamed mode

**Files:**
- Modify: `src/lib/pieces.ts:236-248`

The predicate logic stays identical. Only the prose comment changes so future readers find the right vocabulary.

- [ ] **Step 1: Read the current comment**

Run: read [`src/lib/pieces.ts`](../../../src/lib/pieces.ts) lines 236–248.

Expected current text references "pre-piece state" and "the pre-piece page is visibly different from an active piece page."

- [ ] **Step 2: Rewrite the doc comment**

```typescript
/**
 * Returns true when the piece is in its "awaiting first contribution" state —
 * no published signed content (no performer's notes, no signed schools,
 * no landmarks, no signed piece descriptions). Editions, external links,
 * movements, recordings, pedagogical arc, and the unsigned identity-layer
 * description paragraph are NOT signals that lift a piece out of the
 * awaiting state — only signed editorial work counts.
 *
 * Design doc: the awaiting-first-contribution page is visibly different
 * from an active piece page. Identity (title, catalog, byline, pills,
 * description paragraph) and reference (editions, links, movements,
 * recordings, pedagogical arc) render normally; signed-content sections
 * are gated behind the invite block until the first contribution lands.
 *
 * This predicate drives that branch.
 */
export function isStub(piece: PieceFull): boolean {
  return !piece.has_signed_content;
}
```

- [ ] **Step 3: Run pieces tests to confirm no regression**

Run: `bunx vitest run src/lib/pieces.test.ts` *(if vitest)* or `bun test src/lib/pieces.test.ts`

Expected: all 9 existing tests pass. (Comment-only change — no behavior shift.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/pieces.ts
git commit -m "docs(pieces): clarify isStub describes awaiting-first-contribution state"
```

---

### Task 2: Add a test that pins the awaiting-state semantic before any rendering changes

**Files:**
- Modify: `src/lib/pieces.test.ts:36-97`

This test documents what's true today (editions/links don't lift the piece out) and what becomes important post-refactor: the rule the new layout depends on is exactly `!has_signed_content`. We're locking it in.

- [ ] **Step 1: Add a new test inside the `isStub` describe block**

In [`src/lib/pieces.test.ts`](../../../src/lib/pieces.test.ts) after the `'signed content + no editions/links still renders as active piece'` test (currently ending at line 96), add:

```typescript
  test('awaiting-first-contribution state survives identity + reference layer being populated', () => {
    // Identity layer (description) and reference layer (editions, links,
    // movements) are all populated, but no signed content exists. The
    // piece is still in the awaiting state — only signed editorial work
    // lifts it out. This is the rule the layout depends on for deciding
    // when to render the invite block.
    const populatedButUnsigned = pieceBase({
      has_signed_content: false,
      description: 'A short virtuoso showpiece for cello and piano...',
      editions: [{ id: 'e1', publisher: 'Henle', editor: 'Ed', year: 2020, description: 'Good' }],
      external_links: [{ type: 'youtube', url: 'https://youtube.com/x', label: 'Video', source: 'user' }],
      movements: [{ name: 'I.', key: 'C', meter: '4/4' }],
    });
    expect(isStub(populatedButUnsigned)).toBe(true);
  });
```

- [ ] **Step 2: Update the existing block comment to match the renamed semantic**

In [`src/lib/pieces.test.ts`](../../../src/lib/pieces.test.ts) lines 36–42, replace the existing comment:

```typescript
describe('isStub', () => {
  // Awaiting-first-contribution semantics: a piece is a "stub" iff it has
  // no published signed content. Editions, external links, movements, and
  // the unsigned identity-layer description paragraph are NOT sufficient
  // to lift a piece out of the awaiting state — only a published
  // performer's note / interpretive school / landmark / piece description
  // counts. Matches the design doc and aligns the language with the
  // typeahead's NOT YET CURATED group.
```

- [ ] **Step 3: Run the test file and confirm new test passes**

Run: `bun test src/lib/pieces.test.ts`

Expected: 6 tests pass (5 existing + 1 new). The new test passes immediately because `isStub` already returns `!has_signed_content`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pieces.test.ts
git commit -m "test(pieces): pin awaiting-state semantic with populated identity/reference layer"
```

---

### Task 3: Rename mode label `pre-piece` → `awaiting-first-contribution` in the page route

This is the entry point that decides which mode to pass into the layout. We rename the literal first; the layout still accepts the old union member, so `bun run build` keeps passing.

**Files:**
- Modify: `src/pages/piece/[id].astro:53-54`
- Modify: `src/components/PiecePageLayout.astro:51-63` (accept *both* values temporarily, single-line union)

- [ ] **Step 1: Widen the layout's mode prop to accept both labels (transitional)**

In [`src/components/PiecePageLayout.astro`](../../../src/components/PiecePageLayout.astro) lines 49–63, replace the Props interface and destructuring with:

```typescript
interface Props {
  piece: PieceFull;
  /**
   * 'awaiting-first-contribution' renders identity (title, catalog,
   * byline, pills, description paragraph) + reference layer (editions,
   * external links, movements, recordings, pedagogical arc) + the
   * invite block. Signed-content sections (performer's notes,
   * signed piece descriptions, signed difficulty, interpretive schools,
   * structural landmarks) are hidden.
   *
   * 'full' renders the complete piece page including all signed-content
   * sections.
   *
   * 'pre-piece' is a deprecated alias for 'awaiting-first-contribution'
   * retained for one PR cycle to keep the build green during rename.
   * Remove in a follow-up commit.
   */
  mode?: 'awaiting-first-contribution' | 'pre-piece' | 'full';
}

const { piece, mode = 'full' } = Astro.props;
const isAwaiting = mode === 'awaiting-first-contribution' || mode === 'pre-piece';
```

Replace every reference to `isPrePiece` with `isAwaiting`. There are two:
- Line 149: `<PiecePills client:load pieceId={piece.id} initialPills={initialPills} readOnly={isPrePiece} />` → `readOnly={isAwaiting}`
- Line 157: `{isPrePiece && (` → `{isAwaiting && (`
- Line 180: `{!isPrePiece && (` → `{!isAwaiting && (`

- [ ] **Step 2: Update the route to emit the new label**

In [`src/pages/piece/[id].astro`](../../../src/pages/piece/%5Bid%5D.astro) lines 53–54, replace:

```typescript
const mode: 'awaiting-first-contribution' | 'full' =
  !expand && !composing && !hasActiveRequests && stub ? 'awaiting-first-contribution' : 'full';
```

- [ ] **Step 3: Build the project**

Run: `bun run build`

Expected: build completes with no TypeScript errors. The layout accepts both `'awaiting-first-contribution'` (from the route) and `'pre-piece'` (legacy / not currently emitted) — neither path is broken.

- [ ] **Step 4: Run all tests**

Run: `bun test`

Expected: full suite passes. No behavior changed; only labels.

- [ ] **Step 5: Commit**

```bash
git add src/components/PiecePageLayout.astro src/pages/piece/[id].astro
git commit -m "refactor(piece-page): rename mode pre-piece -> awaiting-first-contribution

Transitional: layout still accepts 'pre-piece' as a deprecated alias.
The route emits the new label; alias is removed in a follow-up commit."
```

---

### Task 4: Drop the `'pre-piece'` alias from the layout's prop union

Now that the only emitter (`src/pages/piece/[id].astro`) uses the new label, the alias can come out.

**Files:**
- Modify: `src/components/PiecePageLayout.astro:49-63`

- [ ] **Step 1: Narrow the prop union**

In [`src/components/PiecePageLayout.astro`](../../../src/components/PiecePageLayout.astro), replace the Props comment and the union with the final form:

```typescript
interface Props {
  piece: PieceFull;
  /**
   * 'awaiting-first-contribution' renders identity (title, catalog,
   * byline, pills, description paragraph) + reference layer (editions,
   * external links, movements, recordings, pedagogical arc) + the
   * invite block. Signed-content sections (performer's notes,
   * signed piece descriptions, signed difficulty, interpretive schools,
   * structural landmarks) are hidden.
   *
   * 'full' renders the complete piece page including all signed-content
   * sections.
   */
  mode?: 'awaiting-first-contribution' | 'full';
}

const { piece, mode = 'full' } = Astro.props;
const isAwaiting = mode === 'awaiting-first-contribution';
```

- [ ] **Step 2: Build to confirm no remaining callers use the dropped alias**

Run: `bun run build`

Expected: build passes. If it fails with a type error, grep for the failing call site and update it to `'awaiting-first-contribution'`.

- [ ] **Step 3: Run tests**

Run: `bun test`

Expected: full suite passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/PiecePageLayout.astro
git commit -m "refactor(piece-page): drop deprecated 'pre-piece' mode alias"
```

---

### Task 5: Update peripheral comments mentioning the old `pre-piece` label

Comment-only sweep so future readers find the canonical term.

**Files:**
- Modify: `src/components/StartContributionButton.tsx:1-4` (file header comments)
- Modify: `src/components/PiecePills.tsx:34` (jsdoc)

- [ ] **Step 1: Update StartContributionButton comments**

In [`src/components/StartContributionButton.tsx`](../../../src/components/StartContributionButton.tsx) lines 1–4, replace the file header with:

```typescript
// "Start the first contribution" primary CTA on the awaiting-first-contribution
// piece page. Routes to /piece/<id>?expand=1 which forces the layout into
// 'full' mode so every signed-content section is rendered (performer's notes,
// schools, landmarks, etc.). The awaiting page surfaces this CTA once and
// only once, at the bottom of the invite block.
```

- [ ] **Step 2: Update PiecePills jsdoc**

In [`src/components/PiecePills.tsx`](../../../src/components/PiecePills.tsx) around line 34, replace the existing jsdoc reference to "pre-piece (stub) page" with:

```typescript
   * delete affordance. Used on the awaiting-first-contribution page
   * where no signed content exists yet and the pills carry identity,
   * not editorial.
```

- [ ] **Step 3: Build and test**

Run: `bun run build && bun test`

Expected: clean. Comment-only changes.

- [ ] **Step 4: Commit**

```bash
git add src/components/StartContributionButton.tsx src/components/PiecePills.tsx
git commit -m "docs(piece-page): align peripheral comments with awaiting-first-contribution"
```

---

### Task 6: Render the identity-layer description paragraph in awaiting mode

This is the first user-visible change. The encyclopedia `description` paragraph appears as plain prose between the header and the invite block.

**Files:**
- Modify: `src/components/PiecePageLayout.astro:155-178` (insert a new identity-description block before the invite section)

- [ ] **Step 1: Add the identity-layer description block before the invite**

In [`src/components/PiecePageLayout.astro`](../../../src/components/PiecePageLayout.astro), locate the block:

```astro
  {isAwaiting && (
    <section class="block pp-invite" id="invitation">
      <p class="pp-invite-lede">
```

Immediately *above* that `{isAwaiting && (` line, insert:

```astro
  {/* Identity-layer description. The encyclopedia paragraph is part
      of what the piece *is* — like the title and catalog number — not
      content awaiting a signature. Render in both modes; in 'full' mode
      it also appears as the bottom-of-stack "Seed data" card inside
      SignedPieceDescription with vote thumbs (a different role). Here
      it's plain identity prose. */}
  {isAwaiting && piece.description && piece.description.trim().length > 0 && (
    <section class="block" id="identity-description">
      <p class="piece-intro">{piece.description}</p>
    </section>
  )}

```

The `.piece-intro` class is already defined in the Astro `<style>` block at line 274–283. No new CSS.

- [ ] **Step 2: Run the dev server and visually verify**

Run: `bun run dev` (background) and open http://localhost:4321/piece/faure-papillon

Expected: the encyclopedia paragraph about the 1884 composition, Fauré disliking the nickname, "three minutes of controlled dazzle" now renders directly under the pills, in serif at 16px, in muted ink, max-width 640px. The invite block sits below it.

- [ ] **Step 3: Confirm signed pieces are unchanged**

Open http://localhost:4321/piece/haydn-cello-concerto-1 (the only piece in prod with `has_signed_content=true`; locally seed reset will reproduce identity-only stub state, so verify against your dev DB).

Expected: in `full` mode (signed content present), the identity description block does NOT render — the `{isAwaiting && ...}` guard keeps it scoped to awaiting mode. The seed paragraph still appears once via `SignedPieceDescription` as the bottom-of-stack card with vote thumbs. No double rendering.

- [ ] **Step 4: Commit**

```bash
git add src/components/PiecePageLayout.astro
git commit -m "feat(piece-page): render identity description paragraph in awaiting mode

The encyclopedia description is part of piece identity (like title and
catalog), not content awaiting signing. It renders as plain serif prose
between the header and the invite block. The signed-stack treatment in
full mode (Seed data card with vote thumbs) is unchanged."
```

---

### Task 7: Render the reference layer (movements, editions, recordings, pedagogical arc, external references) in awaiting mode

These sections were inside the `{!isAwaiting && (...)}` branch. Move them *out* of that branch so they render unconditionally — but pass `landmarksByMovement={{}}` to MovementsList in awaiting mode so the signed landmarks data stays gated.

**Files:**
- Modify: `src/components/PiecePageLayout.astro:180-261` (restructure the section ordering and the conditional gates)

- [ ] **Step 1: Restructure the section conditionals**

In [`src/components/PiecePageLayout.astro`](../../../src/components/PiecePageLayout.astro), the current structure is:

```astro
  {isAwaiting && (
    <section class="block pp-invite" id="invitation"> ... </section>
  )}

  {!isAwaiting && (
    <>
      <section id="signed-description">...</section>
      <section id="difficulty">...</section>
      <section id="performers-notes">...</section>
      <section>{/* movements + landmarks */}</section>
      <section id="interpretive-schools">...</section>
      <section>{/* editions */}</section>
      <section>{/* recordings */}</section>
      <section>{/* pedagogical arc */}</section>
      <section>{/* external references */}</section>
      <p class="change-log-link">...</p>
    </>
  )}
```

Replace with:

```astro
  {/* ===== Status: awaiting first contribution ===== */}
  {isAwaiting && (
    <section class="block pp-invite" id="invitation">
      <p class="pp-invite-lede">
        This piece has no signed contributions yet.
      </p>
      <p class="pp-invite-prose">
        Write the first performer's note, a practice note on a specific passage,
        or an interpretive school you'd defend in front of colleagues.
      </p>
      <div class="pp-cta-row">
        <StartContributionButton client:load pieceId={piece.id} />
        <RequestContributionDialog
          client:load
          pieceId={piece.id}
          pieceTitle={piece.title}
          composerName={piece.composer_name}
          triggerLabel="Know someone who should? Request a contribution."
          triggerClassName="pp-cta-ghost"
        />
      </div>
    </section>
  )}

  {/* ===== Signed-content sections (gated to full mode) ===== */}
  {!isAwaiting && (
    <>
      {/* Signed descriptions stack (includes the unsigned pieces.description as
          a synthetic "Seed data" card at the bottom of the stack; user-authored
          entries sort above by vote score). */}
      <section class="block" id="signed-description">
        <SignedPieceDescription client:load pieceId={piece.id} initialDescriptions={signedDescriptions} seedDescription={piece.description} seedDescriptionVoteId={seedDescriptionVoteId} />
      </section>

      <section class="block" id="difficulty">
        <div class="kicker">Difficulty</div>
        <SignedPieceDifficulty
          client:load
          pieceId={piece.id}
          initialRatings={difficultyRatings}
          seedAxes={axes ?? null}
          seedDifficultyVoteId={seedDifficultyVoteId}
        />
      </section>

      <section class="block" id="performers-notes">
        <div class="kicker">Performer's notes</div>
        <PerformersNotes client:load pieceId={piece.id} initialNotes={performersNotes} />
      </section>

      <section class="block" id="interpretive-schools">
        <div class="kicker">Interpretive schools</div>
        <InterpretiveSchools client:load pieceId={piece.id} initialSchools={interpretiveSchools} />
      </section>
    </>
  )}

  {/* ===== Reference layer (renders in both modes) =====
      Movements, editions, recordings, pedagogical arc, external references
      are unsigned reference data per PRD §54 ("structured fields can be
      unsigned"). They render regardless of whether signed content exists.
      Landmarks ride inside MovementsList; in awaiting mode we pass an
      empty landmarksByMovement so the signed landmarks stay gated. */}
  <section class="block">
    <div class="kicker">{isAwaiting ? 'Movements' : 'Structural landmarks'}</div>
    <MovementsList
      client:load
      pieceId={piece.id}
      initialMovements={dbMovements}
      seedMovements={seedMovements}
      landmarksByMovement={isAwaiting ? {} : landmarksByMovement}
    />
  </section>

  <section class="block">
    <div class="kicker">Editions</div>
    <EditionsList client:load pieceId={piece.id} initialEditions={dbEditions} />
  </section>

  <section class="block">
    <div class="kicker">Recordings</div>
    <RecordingsList client:load pieceId={piece.id} initialLinks={dbRecordingLinks} />
  </section>

  <section class="block">
    <div class="kicker">Pedagogical arc</div>
    <PedagogicalArcList
      client:load
      pieceId={piece.id}
      initialConnections={dbPedagogical}
      pieceOptions={pedagogicalPickerOptions}
    />
  </section>

  <section class="block">
    <div class="kicker">External references</div>
    <ExternalRefsList client:load pieceId={piece.id} initialLinks={dbReferenceLinks} />
  </section>

  <p class="change-log-link">
    <a href={`/piece/${piece.id}/change-log`}>Change log</a>
  </p>

```

The section order in awaiting mode is now: header → identity description → invite → movements → editions → recordings → pedagogical arc → external references → change log link. Signed sections are hidden but no other ordering shifts in `full` mode (signed sections render between the invite and the reference layer; the change log link comes last in both).

Note the kicker rename for movements: in awaiting mode, the section is *just* the movement skeleton (no signed landmarks), so calling it "Structural landmarks" overstates what's there. We label it "Movements" until landmarks unlock the section.

- [ ] **Step 2: Run dev server and verify awaiting mode renders the reference layer**

Run: `bun run dev` (if not still running)

Open http://localhost:4321/piece/faure-papillon — the awaiting page now should show, in order:

1. Breadcrumb · Title "Papillon" · catalog "Op. 77" · byline · pills
2. Encyclopedia description paragraph (from Task 6)
3. "This piece has no signed contributions yet." invite block + CTAs
4. **Movements** kicker → "Allegro vivo — Andantino — Allegro vivo", A major, 3/4
5. **Editions** kicker → Hamelle 1898 · International Music Co. 1952
6. **Recordings** kicker → empty (Papillon has no recording links seeded)
7. **Pedagogical arc** kicker → empty (no connections seeded)
8. **External references** kicker → IMSLP · Wikipedia
9. Change log link

Confirm the signed sections (performer's notes, schools, signed description, signed difficulty) are NOT rendered.

- [ ] **Step 3: Verify `full` mode unchanged**

Open a piece with signed content. Locally, seed Haji's contribution via `bun run scripts/seed-local-queue.ts` if needed, or modify a piece's `has_signed_content` flag temporarily.

Expected: in `full` mode, the section order is: header → signed description → difficulty → performer's notes → interpretive schools → structural landmarks (with full landmarks data) → editions → recordings → pedagogical arc → external references → change log. The reference layer appears below the signed layer, matching the previous full-mode layout.

- [ ] **Step 4: Commit**

```bash
git add src/components/PiecePageLayout.astro
git commit -m "feat(piece-page): render reference layer in awaiting-first-contribution mode

Movements, editions, recordings, pedagogical arc, external references,
and the change log link now render unconditionally — they are unsigned
reference data per PRD §54. Signed-content sections (performer's notes,
signed description stack, signed difficulty, interpretive schools,
landmarks within movements) remain gated to full mode.

The movements kicker reads 'Movements' in awaiting mode and 'Structural
landmarks' in full mode — the section role shifts when landmarks unlock."
```

---

### Task 7b: Confirm `MovementsList` empty-landmarks path renders correctly

`MovementsList` already accepts `landmarksByMovement` as a prop — passing `{}` should render the movement skeleton with the per-movement headers but no landmark cards underneath. We need to verify this is the actual behavior, not assume.

**Files:**
- Read: `src/components/MovementsList.tsx`

- [ ] **Step 1: Read the MovementsList implementation to confirm empty-map handling**

Run: read [`src/components/MovementsList.tsx`](../../../src/components/MovementsList.tsx)

Look for: how `landmarksByMovement` is destructured and used. The expected pattern is something like `const landmarks = landmarksByMovement[movement.id] ?? []` — if so, an empty map renders zero landmark cards per movement, which is the desired behavior.

- [ ] **Step 2: If `MovementsList` does NOT gracefully handle an empty map, document the gap and stop**

If the component crashes or renders unexpected UI when `landmarksByMovement={}`, stop here. Open a follow-up issue describing the gap and revert Task 7's `landmarksByMovement={isAwaiting ? {} : landmarksByMovement}` to always pass the real map. Re-evaluate.

- [ ] **Step 3: If it handles empty correctly, no code change — commit a verification note**

If verified, no code change. Move on.

- [ ] **Step 4: Visual check via browser**

Open http://localhost:4321/piece/bach-cello-suite-1 in awaiting mode (or any piece with movements seeded but no landmarks). Expected: each movement renders its header (name, key, meter, tempo), no "+ Add landmark" buttons, no landmark cards. If "+ Add landmark" buttons render in awaiting mode, the gating is incomplete — add an `awaitingMode` prop to MovementsList in a follow-up.

---

### Task 8: Add an integration test for awaiting-first-contribution rendering

Locks in the contract so a future refactor can't silently re-hide the reference layer.

**Files:**
- Create: `src/integration/awaitingFirstContribution.test.ts`

This test runs against the local dev server. It assumes `bun run dev` is running and the seed has been applied. The pattern matches existing integration tests (e.g. `src/integration/pieceCssGuardrail.test.ts`).

- [ ] **Step 1: Create the test file**

Create `src/integration/awaitingFirstContribution.test.ts`:

```typescript
import { describe, test, expect, beforeAll } from 'bun:test';

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:4321';

// This test exercises the awaiting-first-contribution layout against a
// known stub piece in the seed. Papillon is the canonical example —
// fully populated identity + reference layer, zero signed content.
//
// Requires: bun run dev (local Astro server) and a seeded local Supabase
// with Papillon present and unsigned. Run via:
//   bun run dev &        # in another terminal
//   bun test src/integration/awaitingFirstContribution.test.ts

const PIECE_ID = 'faure-papillon';

async function fetchPiecePage(): Promise<string> {
  const res = await fetch(`${BASE}/piece/${PIECE_ID}`);
  if (!res.ok) throw new Error(`expected 200 from ${BASE}/piece/${PIECE_ID}, got ${res.status}`);
  return res.text();
}

describe('awaiting-first-contribution piece page', () => {
  let html: string;

  beforeAll(async () => {
    html = await fetchPiecePage();
  });

  test('renders the identity description paragraph', () => {
    // The encyclopedia paragraph contains a recognisable phrase from seed.
    expect(html).toContain('controlled dazzle');
    // And it sits inside .piece-intro, the identity-layer prose class.
    expect(html).toContain('class="piece-intro"');
  });

  test('renders the awaiting-first-contribution invite block', () => {
    expect(html).toContain('This piece has no signed contributions yet.');
    expect(html).toContain('Start the first contribution');
    expect(html).toContain('Know someone who should?');
  });

  test('renders the Movements section kicker (not Structural landmarks)', () => {
    // In awaiting mode the section is just the movement skeleton; the
    // "Structural landmarks" framing belongs to full mode.
    expect(html).toContain('>Movements<');
    expect(html).not.toContain('>Structural landmarks<');
  });

  test('renders the Editions section', () => {
    expect(html).toContain('>Editions<');
    // Papillon's seeded editions
    expect(html).toContain('Hamelle');
    expect(html).toContain('International Music Company');
  });

  test('renders the External references section with IMSLP and Wikipedia', () => {
    expect(html).toContain('>External references<');
    expect(html).toContain('IMSLP');
    expect(html).toContain('Wikipedia');
  });

  test('renders the Pedagogical arc and Recordings section kickers', () => {
    expect(html).toContain('>Pedagogical arc<');
    expect(html).toContain('>Recordings<');
  });

  test('renders the change log link', () => {
    expect(html).toContain('/change-log');
  });

  test('does NOT render signed-content section kickers', () => {
    // Performer's notes, Interpretive schools, Difficulty, and the
    // signed-description stack are gated to full mode.
    expect(html).not.toContain(">Performer's notes<");
    expect(html).not.toContain('>Interpretive schools<');
    expect(html).not.toContain('>Difficulty<');
    // The signed-description stack mounts a SignedPieceDescription island;
    // its container has id="signed-description". In awaiting mode it must
    // not appear.
    expect(html).not.toContain('id="signed-description"');
  });

  test('renders the identity description in id=identity-description, not in signed-description', () => {
    // The identity-layer description has its own block id.
    expect(html).toContain('id="identity-description"');
  });
});
```

- [ ] **Step 2: Start the dev server**

Run in another terminal: `bun run dev`

Wait for: `Local: http://localhost:4321/`

- [ ] **Step 3: Run the new test**

Run: `bun test src/integration/awaitingFirstContribution.test.ts`

Expected: all 8 tests pass.

If any fail, the assertion text will tell you exactly which contract drifted — e.g., if the description doesn't render, "expected to contain 'controlled dazzle'" points at Task 6; if signed sections leak through, "expected NOT to contain '>Difficulty<'" points at Task 7.

- [ ] **Step 4: Stop the dev server**

Stop the `bun run dev` process.

- [ ] **Step 5: Commit**

```bash
git add src/integration/awaitingFirstContribution.test.ts
git commit -m "test(piece-page): integration test for awaiting-first-contribution rendering"
```

---

### Task 9: Manual visual verification via /browse

Per the project's "verify UI changes locally before pushing" rule (see `~/.claude/projects/-Users-jspkm-dev-irregular-pearl/memory/MEMORY.md`), the integration test is necessary but not sufficient — we need eyes on the rendered surface.

**Files:** none modified.

- [ ] **Step 1: Boot the dev server (if not already)**

Run: `bun run dev`

- [ ] **Step 2: Browse to Papillon**

Use the `/browse` skill (per project CLAUDE.md "For all web browsing, use the `/browse` skill from gstack").

Take a screenshot of http://localhost:4321/piece/faure-papillon at desktop width. Save to `docs/screenshots/awaiting-papillon-desktop.png`.

- [ ] **Step 3: Browse to Papillon at mobile width**

Resize to 375×812 (iPhone width). Take a screenshot. Save to `docs/screenshots/awaiting-papillon-mobile.png`.

Verify the layout reflows: pills wrap, description paragraph stays max-width 640px, reference sections stack vertically. No content is hidden.

- [ ] **Step 4: Spot-check three other awaiting pieces**

Pick three pieces from the seed catalog with varied data shapes:
- A solo piece with no recordings: e.g. http://localhost:4321/piece/bach-cello-suite-1
- A chamber piece: e.g. http://localhost:4321/piece/brahms-cello-sonata-1
- A piece with sparse data: e.g. http://localhost:4321/piece/crumb-sonata-solo-cello

For each, confirm: identity description visible, invite visible, reference sections render with whatever data exists (some may have no recordings, no pedagogical connections — those sections render the underlying empty-state copy from the section component, which is correct behavior).

- [ ] **Step 5: Visual check the only `full`-mode piece**

In production this would be Haydn Cello Concerto No. 1, but locally there is no signed content. Either:
- Apply the seed-local-queue script to add a Haji-signed performer's note: `bun run scripts/seed-local-queue.ts`
- Then visit http://localhost:4321/piece/bach-cello-suite-1 (the script seeds against this piece by default)

Confirm in `full` mode:
- The signed-description stack renders (with seed card at bottom, vote thumbs)
- The identity-description block (id="identity-description") does NOT render — its `{isAwaiting && ...}` guard correctly hides it
- The "Structural landmarks" kicker (not "Movements") appears
- The reference sections still appear below the signed sections

- [ ] **Step 6: Stop the dev server. Commit screenshots if you took any.**

```bash
git add docs/screenshots/awaiting-*.png 2>/dev/null || true
git commit -m "docs(screenshots): awaiting-first-contribution layout reference" || true
```

(The `|| true` accommodates the case where the directory doesn't have new screenshots to commit.)

---

### Task 10: Update color-palette.htm with the new awaiting-first-contribution sample

Per project CLAUDE.md and MEMORY: "Always consult color-palette.htm before creating new components or making visual changes... Add a new sample when shipping a pattern the palette doesn't already cover."

The awaiting page is a pattern the palette doesn't currently document. Add a tagged sample so future visual work has a reference.

**Files:**
- Modify: `color-palette.htm`

- [ ] **Step 1: Read color-palette.htm**

Run: read [`color-palette.htm`](../../../color-palette.htm) (top-level structure — it's likely large; skim the existing sample sections to find the convention)

- [ ] **Step 2: Add a new sample block tagged `[AFC]` (Awaiting First Contribution)**

Add a section to both the light-theme and dark-theme columns showing:
- Title + catalog (kit-style header)
- Pills row
- Identity description in `.piece-intro` register
- Invite block (kit-style: lede + prose + two CTAs)
- A reference section header for context

Tag: `[AFC]` to match the existing single-letter conventions documented in CLAUDE.md (T/B/C/D/A/R/P/F/W/I/X/H/E).

- [ ] **Step 3: Reload color-palette.htm in a browser**

Run: open `color-palette.htm` directly in the browser (it's static HTML).

Verify the new sample renders correctly in both themes and matches what the live awaiting page looks like.

- [ ] **Step 4: Commit**

```bash
git add color-palette.htm
git commit -m "docs(palette): add [AFC] awaiting-first-contribution sample"
```

---

### Task 11: Update CHANGELOG and TODOS

**Files:**
- Modify: `CHANGELOG.md` (top of file, new entry)
- Modify: `TODOS.md` (move follow-up items if any, add a Completed entry)

- [ ] **Step 1: Add CHANGELOG entry**

In [`CHANGELOG.md`](../../../CHANGELOG.md), add a new entry above the most recent (currently v0.5.2) following the existing voice:

```markdown
## v0.5.3 — Awaiting-first-contribution page renders identity + reference layer

Pieces with zero signed contributions now render the unsigned identity
description, editions, external references, recordings, movements, and
pedagogical arc. Only signed-content sections (performer's notes, signed
piece descriptions, signed difficulty, interpretive schools, structural
landmarks) stay hidden behind the invite block. The encyclopedia
description is treated as identity — like the title — not as content
awaiting a signature.

Mode label `pre-piece` renamed to `awaiting-first-contribution` across
the layout, route, and tests. Section kicker on the movements block
reads "Movements" in awaiting mode and "Structural landmarks" in full
mode, reflecting the role shift when landmarks unlock.

No DB changes. No new components. The `.piece-intro` class previously
used only in `full` mode now carries identity prose in awaiting mode.
```

- [ ] **Step 2: Add a "Completed" entry in TODOS.md**

In [`TODOS.md`](../../../TODOS.md), move the implicit follow-up (the awaiting-page redesign was discussed in chat but not pre-written into TODOS) into the Completed section near the top. If the canonical-index TODO referenced "stub pages render barren" as a motivation, refresh that wording.

```markdown
### Awaiting-first-contribution page renders identity + reference layer

**What:** Restructured the piece page so awaiting-first-contribution mode
renders the unsigned identity description (encyclopedia paragraph),
editions, external references, recordings, movements, pedagogical arc,
and change log link — only signed-content sections stay hidden. Mode
renamed from `pre-piece` to `awaiting-first-contribution` for clarity.
The movements section kicker reads "Movements" in awaiting mode and
"Structural landmarks" in full mode.

**Why:** Stub pages were barren by accident — seeded reference data
(IMSLP links, edition list, movement structure, encyclopedia paragraph)
existed in the database but was hidden by the pre-piece collapse. The
17 of 18 production pieces still in awaiting state now display real
reference content for visitors and a coherent invite for would-be
contributors. The encyclopedia description is identity, not content
awaiting a signature.

**Completed:** v0.5.3 (2026-04-25)
```

- [ ] **Step 3: Bump VERSION**

In [`VERSION.md`](../../../VERSION.md), update to `0.5.3`.

- [ ] **Step 4: Run all tests + build**

Run: `bun test && bun run build`

Expected: all tests pass; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md TODOS.md VERSION.md
git commit -m "docs: v0.5.3 — awaiting-first-contribution renders identity + reference layer"
```

---

## Self-Review

**Spec coverage:**

- ✓ Identity description renders in awaiting mode → Task 6
- ✓ Reference layer (movements, editions, recordings, pedagogical arc, external refs, change log) renders in awaiting mode → Task 7
- ✓ Signed-content sections stay hidden in awaiting mode → Task 7 (the `{!isAwaiting && (...)}` branch)
- ✓ Encyclopedia description rendered as plain identity prose, not as a Seed card with thumbs → Task 6 uses `.piece-intro`, not `SignedPieceDescription`
- ✓ Mode renamed `pre-piece` → `awaiting-first-contribution` → Tasks 3, 4, 5
- ✓ Movement kicker reads "Movements" in awaiting, "Structural landmarks" in full → Task 7
- ✓ Landmarks (signed) still gated in awaiting mode → Task 7 passes `landmarksByMovement={}` in awaiting
- ✓ Lock the contract with tests → Tasks 2 (unit) and 8 (integration)
- ✓ Visual verification → Task 9
- ✓ Documentation (CHANGELOG, TODOS, color-palette.htm, VERSION) → Tasks 10, 11

**Placeholder scan:** None. Every step has either exact code, an exact command, or an explicit visual check criterion.

**Type consistency:** `mode` union narrows from `'awaiting-first-contribution' | 'pre-piece' | 'full'` (Task 3, transitional) to `'awaiting-first-contribution' | 'full'` (Task 4, final). The route never emits `'pre-piece'` — only the layout temporarily accepts it, and only between Tasks 3 and 4. `isAwaiting` is consistently the boolean flag from Task 3 onward.

**Open question deferred to execution:** Task 7b is a verification-then-decide step. If `MovementsList` requires more than passing an empty `landmarksByMovement` to gate landmark write affordances, that becomes a follow-up commit, not a blocker for this plan.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-25-awaiting-first-contribution-page.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session, batch with checkpoints for review.

Which approach?
