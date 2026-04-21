// Piece page CSS guardrail. Lightweight protection against two recurring
// regressions observed during the Slice-C push:
//
//   1. CSS that should style React-island DOM (ChangeLog, ExternalRefsList,
//      etc.) drifts into Astro scoped <style> blocks. Astro scopes every
//      selector with [data-astro-cid-xxx]; island DOM doesn't carry that
//      attribute, so the rules silently fail and the page falls back to
//      default UA styles (list bullets, blue underlined links).
//
//   2. Someone accidentally deletes a load-bearing rule (e.g. the
//      .ext-refs a.ext-ref::after ↗ glyph, or the .ed-title inline-block
//      click target).
//
// This test is a plain file-read + regex check — no dev server, no jsdom,
// runs in milliseconds. When a rule genuinely should change, the snapshot
// (this test) is the explicit place to update, which is the whole point.

import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..', '..');
const pieceCss = readFileSync(resolve(root, 'src/styles/piece-page.css'), 'utf8');
const piecePageAstro = readFileSync(resolve(root, 'src/components/PiecePageLayout.astro'), 'utf8');
const changeLogPageAstro = readFileSync(resolve(root, 'src/pages/piece/[id]/change-log.astro'), 'utf8');

// Extract the single <style>…</style> block (scoped) from an Astro file.
function scopedStyleOf(source: string): string {
  const match = source.match(/<style>([\s\S]*?)<\/style>/);
  return match ? match[1] : '';
}

describe('External references — Option D styling', () => {
  test('.ext-refs rules live in GLOBAL piece-page.css, not in scoped <style>', () => {
    expect(pieceCss).toMatch(/\.ext-refs\s*\{/);
    expect(pieceCss).toMatch(/\.ext-refs\s+a\.ext-ref\s*\{/);
    // Scoped style block in PiecePageLayout.astro must NOT carry these —
    // React-island DOM doesn't get Astro's data-astro-cid scope.
    const scoped = scopedStyleOf(piecePageAstro);
    expect(scoped).not.toMatch(/\.ext-refs\s*\{/);
    expect(scoped).not.toMatch(/\.ext-refs\s+a\.ext-ref\s*\{/);
  });

  test('serif accent, no underline, trailing ↗ glyph', () => {
    const rule = pieceCss.match(/\.ext-refs\s+a\.ext-ref\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toMatch(/font-family:\s*var\(--font-serif\)/);
    expect(rule).toMatch(/color:\s*var\(--accent\)/);
    expect(rule).toMatch(/text-decoration:\s*none/);
    expect(pieceCss).toMatch(/\.ext-refs\s+a\.ext-ref::after\s*\{[^}]*↗/);
  });

  test('hover adds 0.5px underline (border-bottom fade)', () => {
    expect(pieceCss).toMatch(
      /\.ext-refs\s+a\.ext-ref:hover[\s\S]*?border-bottom-color:\s*var\(--accent\)/,
    );
  });

  test('list-style: none on the ul (no bullets)', () => {
    const rule = pieceCss.match(/\.ext-refs\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toMatch(/list-style:\s*none/);
  });
});

describe('Change log — global CSS reaches the React island', () => {
  test('.changelog-* rules live in global piece-page.css', () => {
    expect(pieceCss).toMatch(/\.changelog-list\s*\{/);
    expect(pieceCss).toMatch(/\.changelog-row\s*\{/);
  });

  test('change-log page imports piece-page.css from frontmatter, not as scoped @import', () => {
    // Frontmatter side-effect import is unscoped — keeps CSS rules applicable
    // to the React-rendered ChangeLog island.
    expect(changeLogPageAstro).toMatch(
      /---[\s\S]*?import\s+['"]\.\.\/\.\.\/\.\.\/styles\/piece-page\.css['"];[\s\S]*?---/,
    );
    // Must NOT re-import via @import inside scoped <style> (prior bug:
    // the @import scoped the rules to data-astro-cid-xxx and missed the
    // island elements).
    const scoped = scopedStyleOf(changeLogPageAstro);
    expect(scoped).not.toMatch(/@import\s+['"][^'"]*piece-page\.css['"]/);
  });
});

describe('Edition card — Option D clickable treatment', () => {
  test('.ed-external-arrow matches External-references ↗ (muted, sans, 14px)', () => {
    const rule = pieceCss.match(/\.ed-external-arrow\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toMatch(/color:\s*var\(--muted\)/);
    expect(rule).toMatch(/font-family:\s*var\(--font-sans\)/);
    expect(rule).toMatch(/font-size:\s*14px/);
    expect(rule).toMatch(/position:\s*absolute/);
  });

  test('clickable row shows pointer cursor + focus-visible outline', () => {
    expect(pieceCss).toMatch(/\.ed-row\.ed-clickable\s*\{[^}]*cursor:\s*pointer/);
    expect(pieceCss).toMatch(
      /\.ed-row\.ed-clickable:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+var\(--accent\)/,
    );
  });
});

describe('Movement wiki-edit pencil placement', () => {
  test('.movement-edit-pencil is end-of-row, hover-revealed on desktop, 40% on touch', () => {
    expect(pieceCss).toMatch(/\.movement-edit-pencil\s*\{[^}]*opacity:\s*0/);
    expect(pieceCss).toMatch(/@media\s*\(\s*pointer:\s*coarse\s*\)[\s\S]*?\.movement-edit-pencil\s*\{\s*opacity:\s*0\.4/);
    expect(pieceCss).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
  });
});

describe('Change log link at piece-page bottom — Option D', () => {
  test('serif accent with trailing → via ::after', () => {
    // This one lives in PiecePageLayout.astro's scoped <style> because it's
    // on Astro-rendered markup, not an island — so it's fine to be scoped.
    const scoped = scopedStyleOf(piecePageAstro);
    expect(scoped).toMatch(/\.change-log-link\s*\{/);
    expect(scoped).toMatch(/\.change-log-link\s+a\s*\{[^}]*color:\s*var\(--accent\)/);
    expect(scoped).toMatch(/\.change-log-link\s+a::after\s*\{[^}]*content:\s*'\s*→'/);
  });
});
