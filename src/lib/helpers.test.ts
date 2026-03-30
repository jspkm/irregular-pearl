import { describe, test, expect } from 'bun:test';
import { extractYouTubeId, getInitials, formatTime, formatDate } from './helpers';

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
