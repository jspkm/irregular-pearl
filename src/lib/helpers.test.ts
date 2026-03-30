import { describe, test, expect } from 'bun:test';
import { extractYouTubeId, getInitials, formatTime, formatDate, ACTIVITIES, ACTIVITY_STAT_LABELS, groupBy, validateSlug } from './helpers';

describe('extractYouTubeId', () => {
  test('extracts ID from standard watch URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=1prweT95Mo0')).toBe('1prweT95Mo0');
  });

  test('extracts ID from short URL', () => {
    expect(extractYouTubeId('https://youtu.be/1prweT95Mo0')).toBe('1prweT95Mo0');
  });

  test('extracts ID from embed URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/1prweT95Mo0')).toBe('1prweT95Mo0');
  });

  test('extracts ID with extra query params', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=1prweT95Mo0&t=120')).toBe('1prweT95Mo0');
  });

  test('returns null for non-YouTube URL', () => {
    expect(extractYouTubeId('https://vimeo.com/123456')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(extractYouTubeId('')).toBeNull();
  });
});

describe('getInitials', () => {
  test('returns two-letter initials from full name', () => {
    expect(getInitials('Johann Sebastian Bach')).toBe('JS');
  });

  test('returns single letter for single name', () => {
    expect(getInitials('Mozart')).toBe('M');
  });

  test('returns uppercase', () => {
    expect(getInitials('claude bot')).toBe('CB');
  });

  test('truncates to 2 characters', () => {
    expect(getInitials('A B C D')).toBe('AB');
  });
});

describe('formatTime', () => {
  test('returns "just now" for current time', () => {
    expect(formatTime(new Date().toISOString())).toBe('just now');
  });

  test('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatTime(fiveMinAgo)).toBe('5m ago');
  });

  test('returns hours ago', () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(formatTime(threeHrsAgo)).toBe('3h ago');
  });

  test('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(formatTime(twoDaysAgo)).toBe('2d ago');
  });
});

describe('formatDate', () => {
  test('formats ISO date to month and year', () => {
    expect(formatDate('2026-03-15T00:00:00Z')).toBe('March 2026');
  });

  test('formats another date', () => {
    expect(formatDate('2025-12-01T00:00:00Z')).toBe('December 2025');
  });
});

describe('ACTIVITIES', () => {
  test('has 6 activity types', () => {
    expect(ACTIVITIES).toHaveLength(6);
  });

  test('each has type, emoji, and label', () => {
    for (const a of ACTIVITIES) {
      expect(a.type).toBeTruthy();
      expect(a.emoji).toBeTruthy();
      expect(a.label).toBeTruthy();
    }
  });
});

describe('ACTIVITY_STAT_LABELS', () => {
  test('has labels for all 6 types', () => {
    expect(Object.keys(ACTIVITY_STAT_LABELS)).toHaveLength(6);
  });
});

describe('groupBy', () => {
  test('groups items by key function', () => {
    const items = [{ n: 'a', g: 'x' }, { n: 'b', g: 'x' }, { n: 'c', g: 'y' }];
    const result = groupBy(items, i => i.g);
    expect(Object.keys(result)).toEqual(['x', 'y']);
    expect(result['x']).toHaveLength(2);
    expect(result['y']).toHaveLength(1);
  });

  test('returns empty object for empty array', () => {
    expect(groupBy([], () => 'key')).toEqual({});
  });
});

describe('validateSlug', () => {
  test('accepts valid slugs', () => {
    expect(validateSlug('cellist-anna').valid).toBe(true);
    expect(validateSlug('bach42').valid).toBe(true);
    expect(validateSlug('yo-yo-ma').valid).toBe(true);
  });

  test('rejects too short', () => {
    expect(validateSlug('ab').valid).toBe(false);
    expect(validateSlug('ab').error).toContain('3-30');
  });

  test('rejects too long', () => {
    expect(validateSlug('a'.repeat(31)).valid).toBe(false);
  });

  test('rejects invalid characters', () => {
    expect(validateSlug('hello world').valid).toBe(false);
    expect(validateSlug('UPPER').valid).toBe(false);
    expect(validateSlug('hello@world').valid).toBe(false);
  });

  test('rejects consecutive hyphens', () => {
    expect(validateSlug('hello--world').valid).toBe(false);
  });

  test('rejects slugs starting or ending with hyphen', () => {
    expect(validateSlug('-hello').valid).toBe(false);
    expect(validateSlug('hello-').valid).toBe(false);
  });

  test('rejects reserved words', () => {
    expect(validateSlug('about').valid).toBe(false);
    expect(validateSlug('admin').valid).toBe(false);
    expect(validateSlug('settings').valid).toBe(false);
    expect(validateSlug('about').error).toContain('reserved');
  });

  test('rejects profanity', () => {
    const result = validateSlug('fuckyou');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });
});
