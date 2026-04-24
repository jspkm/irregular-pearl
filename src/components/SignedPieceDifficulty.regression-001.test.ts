// Regression: ISSUE-001 — difficulty Publish was enabled with all axes at n/a
// Found by /qa on 2026-04-24
// Report: .gstack/qa-reports/qa-report-localhost-2026-04-24-signed.md

import { describe, test, expect } from 'bun:test';
import { hasRatedAxis, type Draft } from './SignedPieceDifficulty';

const allNa: Draft = {
  technical: { level: 0, note: '' },
  stamina: { level: 0, note: '' },
  interpretive: { level: 0, note: '' },
  ensemble: { level: 0, note: '' },
};

describe('SignedPieceDifficulty / hasRatedAxis', () => {
  test('returns false when every axis is 0 (all n/a)', () => {
    expect(hasRatedAxis(allNa)).toBe(false);
  });

  test('returns false when every axis is 0 even if notes are filled', () => {
    const notesOnly: Draft = {
      technical: { level: 0, note: 'demanding bow control' },
      stamina: { level: 0, note: 'long' },
      interpretive: { level: 0, note: 'free' },
      ensemble: { level: 0, note: '' },
    };
    expect(hasRatedAxis(notesOnly)).toBe(false);
  });

  test('returns true when technical is set', () => {
    expect(hasRatedAxis({ ...allNa, technical: { level: 3, note: '' } })).toBe(true);
  });

  test('returns true when stamina is set', () => {
    expect(hasRatedAxis({ ...allNa, stamina: { level: 1, note: '' } })).toBe(true);
  });

  test('returns true when interpretive is set', () => {
    expect(hasRatedAxis({ ...allNa, interpretive: { level: 5, note: '' } })).toBe(true);
  });

  test('returns true when ensemble is set', () => {
    expect(hasRatedAxis({ ...allNa, ensemble: { level: 2, note: '' } })).toBe(true);
  });

  test('returns true at boundary level 1', () => {
    expect(hasRatedAxis({ ...allNa, technical: { level: 1, note: '' } })).toBe(true);
  });

  test('returns true at boundary level 5', () => {
    expect(hasRatedAxis({ ...allNa, ensemble: { level: 5, note: '' } })).toBe(true);
  });
});
