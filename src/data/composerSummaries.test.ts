import { expect, test } from 'bun:test';
import { getComposerSummary } from './composerSummaries';
import { historicalComposerNames } from './historicalComposers';
import { livingComposers } from './livingComposers';
import { seedPieces } from './seed';

test('every represented composer has an individual introduction', () => {
  const names = new Set([...historicalComposerNames, ...livingComposers.map(composer => composer.name), ...seedPieces.map(piece => piece.composer_name)]);
  for (const name of names) expect(getComposerSummary(name)?.length).toBeGreaterThan(50);
});
test('introductions describe the person rather than substituting generic era copy', () => {
  expect(getComposerSummary('Ludwig van Beethoven')).toContain('symphonies');
  expect(getComposerSummary('Frédéric Chopin')).toContain('piano');
  expect(getComposerSummary('Terpander')).toContain('fragmentary');
  expect(getComposerSummary('Unknown composer')).toBeUndefined();
});
