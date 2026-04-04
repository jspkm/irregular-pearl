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
  test('returns true for piece with no editions and no user links', () => {
    const stub: PieceFull = {
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
    };
    expect(isStub(stub)).toBe(true);
  });

  test('returns false for piece with editions', () => {
    const full: PieceFull = {
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
      source: 'seed',
      editions: [{ id: 'e1', publisher: 'Henle', editor: 'Ed', year: 2020, description: 'Good' }],
      external_links: [],
      movements: [],
    };
    expect(isStub(full)).toBe(false);
  });

  test('returns false for piece with user-sourced links but no editions', () => {
    const withUserLinks: PieceFull = {
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
      external_links: [{ type: 'youtube', url: 'https://youtube.com/x', label: 'Video', source: 'user' }],
      movements: [],
    };
    expect(isStub(withUserLinks)).toBe(false);
  });

  test('returns true for piece with only seed-sourced links and no editions', () => {
    const seedOnly: PieceFull = {
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
      source: 'seed',
      editions: [],
      external_links: [{ type: 'youtube', url: 'https://youtube.com/x', label: 'Video', source: 'seed' }],
      movements: [],
    };
    expect(isStub(seedOnly)).toBe(true);
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
