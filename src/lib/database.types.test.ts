import { describe, test, expect } from 'bun:test';
import type { Difficulty, UserLevel, LinkType, ActivityType, Database } from './database.types';

// Type-level tests — these verify the types compile correctly.
// If the types are wrong, TypeScript will catch it at compile time.

describe('database types', () => {
  test('Difficulty enum values', () => {
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'professional'];
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

  test('ActivityType enum values', () => {
    const types: ActivityType[] = ['working_on', 'listened', 'practiced', 'sight_read', 'took_lesson', 'performed'];
    expect(types).toHaveLength(6);
  });

  test('Database type has public schema', () => {
    // This is a compile-time check — if Database type is wrong, this won't compile
    const tableNames: (keyof Database['public']['Tables'])[] = [
      'users', 'pieces', 'editions', 'edition_reviews',
      'discussions', 'external_links', 'reports', 'activity_log',
    ];
    expect(tableNames.length).toBeGreaterThan(0);
  });
});
