import { expect, test } from 'bun:test';
import { composerDirectoryName, historicalComposers } from './historicalComposers';
import { seedPieces } from './seed';
import { musicPeriodProfiles } from './musicPeriodProfiles';
test('historical directory is sorted by surname and excludes known contemporary entries', () => {
  const names = historicalComposers.map(row => row.name);
  expect(new Set(names).size).toBe(names.length);
  for (const name of ['Emmanuel Séjourné', 'Thomas Adès', 'Unsuk Chin', 'Caroline Shaw']) expect(names).not.toContain(name);
  expect(names).toContain('Kaija Saariaho');
  for (let i = 1; i < historicalComposers.length; i++) expect(historicalComposers[i - 1].sort.localeCompare(historicalComposers[i].sort, 'en', { sensitivity: 'base' })).toBeLessThanOrEqual(0);
});
test('compound surnames and historic appellations remain intact', () => {
  expect(composerDirectoryName('Guillaume Du Fay').surname).toBe('Du Fay');
  expect(composerDirectoryName('Josquin des Prez').surname).toBe('des Prez');
  expect(composerDirectoryName('Camille Saint-Saëns').surname).toBe('Saint-Saëns');
  expect(composerDirectoryName('Léonin').given).toBe('');
});
test('every directory link has an existing composer-page identity', () => {
  const routed = new Set([...seedPieces.map(piece => piece.composer_name), ...musicPeriodProfiles.flatMap(period => period.composers)]);
  for (const composer of historicalComposers) expect(routed.has(composer.name)).toBe(true);
});

import { historicalComposerEras } from './historicalComposers';
test('chronological eras preserve every composer once and sort each group by surname', () => {
  expect(historicalComposerEras[0].id).toBe('antiquity');
  expect(historicalComposerEras.at(-1)?.id).toBe('20th-century');
  const names = historicalComposerEras.flatMap(era => era.composers.map(composer => composer.name));
  expect(new Set(names).size).toBe(historicalComposers.length);
  expect(names.length).toBe(historicalComposers.length);
  for (const era of historicalComposerEras) {
    for (let i = 1; i < era.composers.length; i++) expect(era.composers[i - 1].sort.localeCompare(era.composers[i].sort, 'en', { sensitivity: 'base' })).toBeLessThanOrEqual(0);
  }
});
