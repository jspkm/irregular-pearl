import { describe, expect, test } from 'bun:test';
import { careerResources, getCareerResourceTypes } from './careerResources';

describe('classical-music career resources', () => {
  test('includes Audition Forum, its Instagram, and Musical Chairs', () => {
    const auditionForum = careerResources.find((resource) => resource.name === 'Audition Forum');
    expect(auditionForum?.url).toBe('https://www.auditionforum.com/');
    expect(auditionForum?.instagramUrl).toMatch(/^https:\/\/www\.instagram\.com\//);
    expect(careerResources.some((resource) => resource.name === 'Musical Chairs')).toBe(true);
  });

  test('contains complete, reviewed external references', () => {
    expect(careerResources.length).toBeGreaterThanOrEqual(6);
    for (const resource of careerResources) {
      expect(resource.description.length).toBeGreaterThan(40);
      expect(resource.url).toMatch(/^https:\/\//);
      expect(resource.sourceReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

test('cross-listed books remain a single entry with matching categories', () => {
  const books = careerResources.filter(resource => resource.name === 'The Inner Game of Tennis');
  expect(books).toHaveLength(1);
  expect(getCareerResourceTypes(books[0])).toEqual(['Study Resources — Performance and practice', 'Performance Resources — Psychology']);
  expect(careerResources.find(resource => resource.name === 'PracticeMind for Everyone')?.authors).toBe('Hans Jørgen Jensen and Oleksander Mycyk');
});

test('study filters classify history, practice, and libraries without losing resources', () => {
 const find = (name: string) => careerResources.find(resource => resource.name === name)!;
 expect(getCareerResourceTypes(find('Classic FM — Composers'))).toContain('Study Resources — Music history');
 expect(getCareerResourceTypes(find('PracticeMind for Everyone'))).toContain('Study Resources — Performance and practice');
 expect(getCareerResourceTypes(find('IMSLP — Petrucci Music Library'))).toContain('Study Resources — Music libraries (in person/virtual)');
 expect(getCareerResourceTypes(find('The New York Public Library for the Performing Arts'))).toContain('Study Resources — Music libraries (in person/virtual)');
 expect(careerResources.flatMap(getCareerResourceTypes)).not.toContain('Study Resources');
});

test('performance resources distinguish psychology from lessons and general tools', () => {
 const find = (name: string) => careerResources.find(resource => resource.name === name)!;
 expect(getCareerResourceTypes(find('The Inner Game of Tennis'))).toContain('Performance Resources — Psychology');
 expect(getCareerResourceTypes(find('CelloBello'))).toContain('Performance Resources — Lessons, masterclasses, and interviews');
 expect(getCareerResourceTypes(find('forScore'))).toEqual(['Performance Resources']);
 expect(getCareerResourceTypes(find('CelloBello'))).not.toContain('Performance Resources — Physical health');
});
