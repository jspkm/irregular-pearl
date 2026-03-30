import { describe, test, expect } from 'bun:test';
import { seedPieces } from './seed';

describe('seed data integrity', () => {
  test('has pieces', () => {
    expect(seedPieces.length).toBeGreaterThan(100);
  });

  test('all pieces have unique IDs', () => {
    const ids = seedPieces.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all pieces have required fields', () => {
    for (const piece of seedPieces) {
      expect(piece.id).toBeTruthy();
      expect(piece.title).toBeTruthy();
      expect(piece.composer_name).toBeTruthy();
      expect(piece.instruments.length).toBeGreaterThan(0);
      expect(piece.era).toBeTruthy();
      expect(piece.form).toBeTruthy();
      expect(piece.description).toBeTruthy();
      expect(['beginner', 'intermediate', 'advanced', 'professional']).toContain(piece.difficulty);
    }
  });

  test('all pieces have at least one edition', () => {
    for (const piece of seedPieces) {
      expect(piece.editions.length).toBeGreaterThan(0);
    }
  });

  test('all editions have required fields', () => {
    for (const piece of seedPieces) {
      for (const edition of piece.editions) {
        expect(edition.id).toBeTruthy();
        expect(edition.publisher).toBeTruthy();
        expect(edition.editor).toBeTruthy();
      }
    }
  });

  test('all external links have valid types', () => {
    for (const piece of seedPieces) {
      for (const link of piece.external_links) {
        expect(['imslp', 'youtube', 'wikipedia']).toContain(link.type);
        expect(link.url).toMatch(/^https?:\/\//);
        expect(link.label).toBeTruthy();
      }
    }
  });

  test('piece IDs are URL-safe slugs', () => {
    for (const piece of seedPieces) {
      expect(piece.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test('duration is positive when present', () => {
    for (const piece of seedPieces) {
      if (piece.duration_minutes !== null) {
        expect(piece.duration_minutes).toBeGreaterThan(0);
      }
    }
  });
});
