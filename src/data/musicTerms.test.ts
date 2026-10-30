import { describe, expect, test } from 'bun:test';
import { getRelatedMusicTerms, groupMusicTermsByLetter, musicTerms, musicTermsById } from './musicTerms';
import { musicPeriods } from './musicPeriods';
import { musicPeriodProfiles } from './musicPeriodProfiles';

describe('music glossary data', () => {
  test('has unique URL-safe ids', () => {
    const ids = musicTerms.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  test('every entry has complete reference sections', () => {
    for (const entry of musicTerms) {
      expect(entry.definition.length).toBeGreaterThan(30);
      expect(entry.context.length).toBeGreaterThanOrEqual(2);
      expect(entry.listeningCues.length).toBeGreaterThanOrEqual(3);
      expect(entry.examples.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('related term references resolve', () => {
    for (const entry of musicTerms) {
      for (const id of entry.relatedTerms) expect(musicTermsById.has(id)).toBe(true);
      expect(getRelatedMusicTerms(entry)).toHaveLength(entry.relatedTerms.length);
    }
  });

  test('alphabetical grouping sorts entries', () => {
    const groups = groupMusicTermsByLetter();
    for (const entries of Object.values(groups)) {
      expect(entries.map((entry) => entry.term)).toEqual(
        [...entries].sort((a, b) => a.term.localeCompare(b.term)).map((entry) => entry.term),
      );
    }
  });

  test('every term belongs to a historical period', () => {
    const periodIds = new Set(musicPeriods.map((period) => period.id));
    for (const term of musicTerms) expect(periodIds.has(term.historicalPeriodId)).toBe(true);
  });

  test('every era example term has a glossary entry', () => {
    const glossaryNames = new Set(musicTerms.map((term) => term.term.toLowerCase()));
    for (const profile of musicPeriodProfiles) {
      for (const exampleTerm of profile.exampleTerms) {
        expect(glossaryNames.has(exampleTerm.toLowerCase())).toBe(true);
      }
    }
  });
});
