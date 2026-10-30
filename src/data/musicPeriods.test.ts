import { describe, expect, test } from 'bun:test';
import { musicPeriods } from './musicPeriods';

describe('music history period catalog', () => {
  test('runs chronologically from antiquity through the 21st century', () => {
    expect(musicPeriods[0].id).toBe('antiquity');
    expect(musicPeriods.at(-1)?.id).toBe('21st-century');
    expect(musicPeriods).toHaveLength(14);
  });

  test('gives every span a title and description', () => {
    for (const period of musicPeriods) {
      expect(period.span.length).toBeGreaterThan(0);
      expect(period.title.length).toBeGreaterThan(0);
      expect(period.description.length).toBeGreaterThan(0);
    }
  });
});
