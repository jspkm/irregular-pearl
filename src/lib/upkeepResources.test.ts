import { describe, expect, test } from 'bun:test';
import { curatedResources, validateResource, type ResourceInput } from './upkeepResources';
import { upkeepCategories, upkeepLevels } from '../data/instrumentalUpkeep';
const valid: ResourceInput = { topic: ' Daily care ', title: ' A care guide ', publisher: ' Maker ', scope: ' Flute ', summary: ' A factual overview of cleaning. ', url: ' https://example.org/care ' };
describe('upkeep resource submissions', () => {
  test('normalizes form values and retains the source URL', () => {
    expect(validateResource(valid)).toEqual({ topic: 'Daily care', title: 'A care guide', publisher: 'Maker', scope: 'Flute', summary: 'A factual overview of cleaning.', url: 'https://example.org/care' });
  });
  test('rejects script, data, relative, and credential-bearing links', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,example', '/resource', 'https://name:password@example.org/', 'ftp://example.org/care']) expect(() => validateResource({ ...valid, url })).toThrow();
  });
  test('requires non-empty fields and enforces limits', () => {
    for (const key of Object.keys(valid)) expect(() => validateResource({ ...valid, [key]: '  ' })).toThrow();
    expect(() => validateResource({ ...valid, title: 'x'.repeat(241) })).toThrow();
    expect(() => validateResource({ ...valid, summary: 'x'.repeat(1201) })).toThrow();
  });
  test('curated voting identities are unique and never imply a community author', () => {
    const rows = upkeepCategories.flatMap(group => upkeepLevels.flatMap(level => curatedResources(group.id, level.id)));
    expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
    for (const row of rows) {
      expect(row.user_id).toBeNull(); expect(row.author).toBeNull(); expect(row.reviewed_at).toBeTruthy();
      expect(validateResource(row).url).toBeTruthy();
    }
    expect(rows.length).toBe(32);
  });
});
