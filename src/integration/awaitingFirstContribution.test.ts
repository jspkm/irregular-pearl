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
