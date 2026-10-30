import { expect, test } from 'bun:test';
import { searchLocalPieces, searchComposerPages } from './localPieceSearch';
test('finds existing pages by composer and title in either word order', () => {
  expect(searchLocalPieces('Beethoven symphony 5').some(row => row.id === 'beethoven-symphony-5')).toBe(true);
  expect(searchLocalPieces('5 symphony Beethoven').some(row => row.id === 'beethoven-symphony-5')).toBe(true);
});
test('normalizes accents and catalog punctuation', () => {
  expect(searchLocalPieces('Dvorak').some(row => row.composer_name.includes('Dvořák'))).toBe(true);
  expect(searchLocalPieces('K 165').some(row => row.id === 'mozart-exsultate-jubilate')).toBe(true);
});
test('keeps composer-scoped searches scoped and never creates an index entry', () => {
  expect(searchLocalPieces('concerto', 'Ludwig van Beethoven').every(row => row.composer_name === 'Ludwig van Beethoven')).toBe(true);
  expect(searchLocalPieces('Bach').every(row => row.is_materialized)).toBe(true);
  expect(searchLocalPieces('zzzz-nonexistent')).toEqual([]);
  expect(searchLocalPieces(' ')).toEqual([]);
});

test('composer search finds unique pages, including composers without seeded pieces', () => {
  expect(searchComposerPages('Beethoven').map(row => row.composer_name)).toEqual(['Ludwig van Beethoven']);
  expect(searchComposerPages('Terpander').map(row => row.composer_name)).toEqual(['Terpander']);
  expect(searchComposerPages('Dvorak').some(row => row.composer_name.includes('Dvořák'))).toBe(true);
  expect(searchComposerPages('Beethoven symphony')).toEqual([]);
  expect(searchComposerPages('Bach', ['Johann Sebastian Bach']).filter(row => row.composer_name === 'Johann Sebastian Bach')).toHaveLength(1);
});
