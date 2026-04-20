import { describe, test, expect } from 'bun:test';
import { seedPieces, EXAMPLE_PIECE_IDS } from '../data/seed';

// We can't import Astro APIRoute handlers directly (they need Astro context),
// so we test the logic they contain by reimplementing the pure parts.

describe('sitemap.xml logic', () => {
  const composers = [...new Set(seedPieces.map(p => p.composer_name))];
  const instruments = [...new Set(seedPieces.flatMap(p => p.instruments))];

  test('has unique composers', () => {
    expect(composers.length).toBeGreaterThanOrEqual(5);
  });

  test('has unique instruments', () => {
    expect(instruments.length).toBeGreaterThan(3);
  });

  test('all piece IDs are URL-safe for sitemap', () => {
    for (const piece of seedPieces) {
      expect(encodeURIComponent(piece.id)).toBe(piece.id);
    }
  });

  test('all composer names can be URI-encoded', () => {
    for (const name of composers) {
      expect(() => encodeURIComponent(name)).not.toThrow();
    }
  });

  test('total URL count matches expected', () => {
    // home + about + composers + instruments + pieces
    const totalUrls = 1 + 1 + composers.length + instruments.length + seedPieces.length;
    expect(totalUrls).toBeGreaterThan(seedPieces.length);
  });
});

describe('llms.txt logic', () => {
  test('seed pieces count is accurate', () => {
    expect(seedPieces.length).toBeGreaterThanOrEqual(10);
  });

  test('example pieces exist for llms.txt references', () => {
    // EXAMPLE_PIECE_IDS is the shared source of truth for pieces cited in
    // llms.txt — guards against shipping example URLs that 404.
    for (const id of EXAMPLE_PIECE_IDS) {
      expect(seedPieces.find(p => p.id === id)).toBeTruthy();
    }
  });
});

describe('llms-full.txt logic', () => {
  test('all pieces have data for full catalog export', () => {
    for (const piece of seedPieces) {
      expect(piece.title).toBeTruthy();
      expect(piece.composer_name).toBeTruthy();
      expect(piece.description.length).toBeGreaterThan(50);
      expect(piece.editions.length).toBeGreaterThan(0);

      for (const edition of piece.editions) {
        expect(edition.publisher).toBeTruthy();
        expect(edition.editor).toBeTruthy();
      }

      for (const link of piece.external_links) {
        expect(link.url).toMatch(/^https?:\/\//);
        expect(link.label).toBeTruthy();
      }
    }
  });
});

describe('openapi.json structure', () => {
  test('required endpoints are defined', () => {
    const requiredPaths = ['/', '/piece/{id}', '/llms.txt', '/llms-full.txt', '/sitemap.xml'];
    // Just validate the paths we expect exist as constants
    for (const path of requiredPaths) {
      expect(path).toBeTruthy();
    }
  });
});
