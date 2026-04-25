import { describe, test, expect } from 'bun:test';
import { getPieceBasic, getPieceFull, isStub, getComposerPieces } from './pieces';
import type { PieceFull } from './pieces';

describe('getPieceBasic', () => {
  test('returns seed piece when it exists', async () => {
    const piece = await getPieceBasic('bach-cello-suite-1');
    expect(piece).not.toBeNull();
    expect(piece!.title).toBe('Cello Suite No. 1 in G major');
    expect(piece!.composer_name).toBe('Johann Sebastian Bach');
    expect(piece!.source).toBe('seed');
  });

  test('returns null for nonexistent piece', async () => {
    const piece = await getPieceBasic('nonexistent-piece-id');
    expect(piece).toBeNull();
  });
});

describe('getPieceFull', () => {
  test('returns seed piece with editions and links', async () => {
    const piece = await getPieceFull('bach-cello-suite-1');
    expect(piece).not.toBeNull();
    expect(piece!.title).toBe('Cello Suite No. 1 in G major');
    expect(piece!.editions.length).toBeGreaterThan(0);
    expect(piece!.external_links.length).toBeGreaterThan(0);
    expect(piece!.movements.length).toBeGreaterThan(0);
  });

  test('returns null for nonexistent piece', async () => {
    const piece = await getPieceFull('nonexistent-piece-id');
    expect(piece).toBeNull();
  });
});

describe('isStub', () => {
  // Awaiting-first-contribution semantics: a piece is a "stub" iff it has
  // no published signed content. Editions, external links, movements, and
  // the unsigned identity-layer description paragraph are NOT sufficient
  // to lift a piece out of the awaiting state — only a published
  // performer's note / interpretive school / landmark / piece description
  // counts. Matches the design doc and aligns the language with the
  // typeahead's NOT YET CURATED group.

  function pieceBase(overrides: Partial<PieceFull> = {}): PieceFull {
    return {
      id: 'test',
      title: 'Test',
      composer_name: 'Test',
      catalog_number: null,
      instruments: [],
      era: 'Modern',
      form: 'Sonata',
      difficulty: null,
      duration_minutes: null,
      description: '',
      source: 'import',
      editions: [],
      external_links: [],
      movements: [],
      has_signed_content: false,
      ...overrides,
    };
  }

  test('returns true for piece with no signed content', () => {
    expect(isStub(pieceBase({ has_signed_content: false }))).toBe(true);
  });

  test('returns false for piece with signed content', () => {
    expect(isStub(pieceBase({ has_signed_content: true }))).toBe(false);
  });

  test('editions alone do not lift a piece out of pre-piece state', () => {
    const withEditions = pieceBase({
      has_signed_content: false,
      editions: [{ id: 'e1', publisher: 'Henle', editor: 'Ed', year: 2020, description: 'Good' }],
    });
    expect(isStub(withEditions)).toBe(true);
  });

  test('external links alone do not lift a piece out of pre-piece state', () => {
    const withLinks = pieceBase({
      has_signed_content: false,
      external_links: [{ type: 'youtube', url: 'https://youtube.com/x', label: 'Video', source: 'user' }],
    });
    expect(isStub(withLinks)).toBe(true);
  });

  test('signed content + no editions/links still renders as active piece', () => {
    const activeNoResources = pieceBase({
      has_signed_content: true,
      editions: [],
      external_links: [],
    });
    expect(isStub(activeNoResources)).toBe(false);
  });

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
});

describe('getComposerPieces', () => {
  test('returns pieces for a known composer', async () => {
    const pieces = await getComposerPieces('Johann Sebastian Bach');
    expect(pieces.length).toBeGreaterThan(0);
    expect(pieces.every((p) => p.composer_name === 'Johann Sebastian Bach')).toBe(true);
  });

  test('is case-insensitive for seed data', async () => {
    const pieces = await getComposerPieces('johann sebastian bach');
    expect(pieces.length).toBeGreaterThan(0);
  });

  test('returns empty array for unknown composer', async () => {
    const pieces = await getComposerPieces('Nonexistent Composer Name');
    expect(pieces).toEqual([]);
  });
});
