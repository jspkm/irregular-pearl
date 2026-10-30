import { describe, expect, test } from 'bun:test';
import { composerProfiles } from './composerProfiles';
import { seedPieces } from './seed';

describe('composer discovery metadata', () => {
  test('explicitly profiles every composer in the pieces catalog', () => {
    const composers = new Set(seedPieces.map((piece) => piece.composer_name));
    for (const composer of composers) expect(composerProfiles[composer]).toBeDefined();
  });

  test('uses boolean editorial fields', () => {
    for (const profile of Object.values(composerProfiles)) {
      expect(typeof profile.living).toBe('boolean');
      expect(typeof profile.underrepresented).toBe('boolean');
    }
  });
});
