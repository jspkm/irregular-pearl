import { describe, test, expect } from 'bun:test';
import type { Difficulty, UserLevel, LinkType, Database } from './database.types';

describe('database types', () => {
  test('Difficulty enum values', () => {
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'virtuoso'];
    expect(difficulties).toHaveLength(4);
  });

  test('UserLevel enum values', () => {
    const levels: UserLevel[] = ['student', 'amateur', 'professional', 'teacher'];
    expect(levels).toHaveLength(4);
  });

  test('LinkType enum values', () => {
    const types: LinkType[] = ['imslp', 'youtube', 'wikipedia'];
    expect(types).toHaveLength(3);
  });

  test('Database type has public schema', () => {
    const tableNames: (keyof Database['public']['Tables'])[] = [
      'users', 'pieces', 'editions', 'edition_reviews', 'external_links',
    ];
    expect(tableNames.length).toBeGreaterThan(0);
  });
});
