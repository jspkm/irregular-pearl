import { describe, expect, test } from 'bun:test';
import { getCareerStages, groupOpportunitiesByType, opportunities, opportunitiesById, opportunityTypes } from './opportunities';

describe('opportunities catalog data', () => {
  test('has unique URL-safe ids', () => {
    const ids = opportunities.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  test('every record has required discovery and source fields', () => {
    for (const entry of opportunities) {
      expect(entry.summary.length).toBeGreaterThan(60);
      expect(entry.disciplines.length).toBeGreaterThan(0);
      expect(entry.eligibility.length).toBeGreaterThan(0);
      expect(entry.support.length).toBeGreaterThan(0);
      expect(entry.officialUrl.startsWith('https://')).toBe(true);
      expect(entry.sourceReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(opportunitiesById.get(entry.id)).toBe(entry);
    }
  });

  test('covers every catalog type', () => {
    const groups = groupOpportunitiesByType();
    for (const type of opportunityTypes) expect(groups[type].length).toBeGreaterThan(0);
  });

  test('nomination-only programs are clearly identified', () => {
    const nominationOnly = opportunities.filter((entry) => entry.applicationRoute === 'Nomination only');
    expect(nominationOnly.map((entry) => entry.id)).toContain('avery-fisher-career-grants');
  });

  test('uses supplied age limits to assign every intersecting career stage', () => {
    const musicAcademy = opportunitiesById.get('music-academy-fellowship-institute')!;
    expect(getCareerStages(musicAcademy)).toEqual(['College Student', 'Emerging Professional']);

    const queenElisabeth = opportunitiesById.get('queen-elisabeth-competition')!;
    expect(getCareerStages(queenElisabeth)).toEqual(['College Student', 'Emerging Professional']);

    for (const entry of opportunities) {
      if (entry.minimumAge !== undefined && entry.maximumAge !== undefined) {
        expect(entry.minimumAge).toBeLessThanOrEqual(entry.maximumAge);
      }
    }
  });
});
