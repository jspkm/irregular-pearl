// Pure-logic tests for the bell badge. Component behavior is exercised by
// the integration suite (src/integration/...) when the backend matters;
// here we just pin the display rule from the plan.

import { describe, test, expect } from 'bun:test';
import { bellBadgeText } from './NavbarBell';

describe('bellBadgeText', () => {
  test('hidden at zero', () => {
    expect(bellBadgeText(0)).toBeNull();
  });

  test('negative → hidden (defensive)', () => {
    expect(bellBadgeText(-1)).toBeNull();
  });

  test('exact count 1 through 9', () => {
    for (let i = 1; i <= 9; i++) {
      expect(bellBadgeText(i)).toBe(String(i));
    }
  });

  test('"9+" at 10', () => {
    expect(bellBadgeText(10)).toBe('9+');
  });

  test('"9+" at large counts', () => {
    expect(bellBadgeText(42)).toBe('9+');
    expect(bellBadgeText(999)).toBe('9+');
  });
});
