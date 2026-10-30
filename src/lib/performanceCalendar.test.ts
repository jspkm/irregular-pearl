import { describe, expect, test } from 'bun:test';
import { formatPerformanceDate, normalizeConcertUrl } from './performanceCalendar';

describe('performance calendar helpers', () => {
  test('normalizes clickable concert links', () => {
    expect(normalizeConcertUrl('example.org/concert')).toBe('https://example.org/concert');
    expect(normalizeConcertUrl('https://venue.org/events/1')).toBe('https://venue.org/events/1');
    expect(normalizeConcertUrl('')).toBeNull();
    expect(normalizeConcertUrl('not a url')).toBeNull();
  });

  test('formats date-only values without timezone drift', () => {
    const date = formatPerformanceDate('2026-11-08');
    expect(date.month).toBe('Nov');
    expect(date.day).toBe('8');
    expect(date.full).toContain('2026');
  });
});
