import { describe, expect, test } from 'bun:test';
import { slugify, generatePieceId } from './slugify';

describe('slugify', () => {
  test('basic text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  test('collapses multiple spaces and hyphens', () => {
    expect(slugify('foo   bar--baz')).toBe('foo-bar-baz');
  });

  test('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  test('strips punctuation', () => {
    expect(slugify("Sonata No. 1 in C major, K. 279")).toBe('sonata-no-1-in-c-major-k-279');
  });

  test('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  // Unicode / diacritics
  test('transliterates Dvorak', () => {
    expect(slugify('Dvořák')).toBe('dvorak');
  });

  test('transliterates Bartok', () => {
    expect(slugify('Bartók')).toBe('bartok');
  });

  test('transliterates Janacek', () => {
    expect(slugify('Janáček')).toBe('janacek');
  });

  test('transliterates Schonberg (umlaut)', () => {
    expect(slugify('Schönberg')).toBe('schonberg');
  });

  test('transliterates Faure', () => {
    expect(slugify('Fauré')).toBe('faure');
  });

  test('transliterates Smetana (already ASCII)', () => {
    expect(slugify('Smetana')).toBe('smetana');
  });

  test('handles German eszett', () => {
    expect(slugify('Straße')).toBe('strasse');
  });

  test('handles ae ligature', () => {
    expect(slugify('Præludium')).toBe('praeludium');
  });
});

describe('generatePieceId', () => {
  test('basic piece without catalog number', () => {
    expect(generatePieceId('Johann Sebastian Bach', 'Cello Suite No. 1 in G major'))
      .toBe('bach-cello-suite-no-1-in-g-major');
  });

  test('piece with catalog number', () => {
    expect(generatePieceId('Ludwig van Beethoven', 'Sonata No. 1', 'Op. 2, No. 1'))
      .toBe('beethoven-sonata-no-1-op-2-no-1');
  });

  test('Unicode composer name', () => {
    expect(generatePieceId('Antonín Dvořák', 'Cello Concerto in B minor', 'Op. 104'))
      .toBe('dvorak-cello-concerto-in-b-minor-op-104');
  });

  test('Bartok with diacritics', () => {
    expect(generatePieceId('Béla Bartók', 'String Quartet No. 4', 'Sz. 91'))
      .toBe('bartok-string-quartet-no-4-sz-91');
  });

  test('null catalog number is ignored', () => {
    expect(generatePieceId('Claude Debussy', 'Clair de lune', null))
      .toBe('debussy-clair-de-lune');
  });

  test('empty catalog number is ignored', () => {
    expect(generatePieceId('Claude Debussy', 'Clair de lune', ''))
      .toBe('debussy-clair-de-lune');
  });

  test('uses last name only', () => {
    expect(generatePieceId('Johann Sebastian Bach', 'Test'))
      .toBe('bach-test');
  });

  test('collision avoidance: same title different catalog', () => {
    const id1 = generatePieceId('Wolfgang Amadeus Mozart', 'Sonata', 'K. 279');
    const id2 = generatePieceId('Wolfgang Amadeus Mozart', 'Sonata', 'K. 280');
    expect(id1).not.toBe(id2);
    expect(id1).toBe('mozart-sonata-k-279');
    expect(id2).toBe('mozart-sonata-k-280');
  });
});
