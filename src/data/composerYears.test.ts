import { expect, test } from 'bun:test';
import { composerYears, getComposerYears } from './composerYears';
import { historicalComposerNames } from './historicalComposers';
import { seedPieces } from './seed';

test('all historical directory and piece catalog composers have sourced dates', () => {
  for (const name of new Set([...historicalComposerNames, ...seedPieces.map(piece => piece.composer_name)])) {
    expect(getComposerYears(name)?.label).toBeTruthy();
    expect(getComposerYears(name)?.source).toMatch(/^https:\/\//);
  }
});
test('preserves uncertainty and never substitutes a same-name person', () => {
  expect(getComposerYears('Ludwig van Beethoven')?.label).toBe('1770–1827');
  expect(getComposerYears('Caroline Shaw')?.label).toBe('Born 1982');
  expect(getComposerYears('Léonin')?.label).toStartWith('Active');
  expect(getComposerYears('Hildegard von Bingen')?.label).toStartWith('c.');
  expect(getComposerYears('Sid Richardson')).toBeUndefined();
  for (const record of Object.values(composerYears)) expect(record.label).not.toContain('undefined');
});
