import { describe, test, expect } from 'bun:test';
import { piecePath } from './SearchTypeahead';

// Regression pin: piece pages live at /piece/[slug], not /p/[slug].
// A stray typo in the navigation path caused a 404 after typeahead selection;
// this test keeps the path shape stable.
describe('piecePath', () => {
  test('returns /piece/[slug] for a standard slug', () => {
    expect(piecePath('bach-cello-suite-1')).toBe('/piece/bach-cello-suite-1');
  });

  test('never returns the short /p/ form', () => {
    expect(piecePath('any-slug')).not.toMatch(/^\/p\//);
    expect(piecePath('any-slug')).toStartWith('/piece/');
  });

  test('does not escape slug contents (slugs are already URL-safe text primary keys)', () => {
    // pieces.id is constrained to slug chars; callers shouldn't pass anything
    // that needs percent-encoding. The helper is intentionally the simplest
    // possible concatenation so any slug-sanity bug lives at the slug-minting
    // layer (_slugify in the materialize RPC), not here.
    expect(piecePath('brahms-trio-op-114')).toBe('/piece/brahms-trio-op-114');
  });
});
