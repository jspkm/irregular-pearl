import { describe, expect, test } from 'bun:test';
import { musicSchools } from './musicSchools';

describe('pre-professional music school catalog', () => {
  test('contains an expanded university and conservatory directory', () => {
    expect(musicSchools.filter((school) => school.kind === 'University music program').length).toBeGreaterThanOrEqual(9);
    expect(musicSchools.filter((school) => school.kind === 'Conservatory').length).toBeGreaterThanOrEqual(15);
  });

  test('includes the requested comparison fields', () => {
    for (const school of musicSchools) {
      expect(school.state.length).toBeGreaterThan(0);
      expect(school.repertoire.length).toBeGreaterThan(0);
      expect(school.admissionsUrl).toMatch(/^https:\/\//);
    }
  });
});
