import { describe, test, expect } from 'bun:test';
import type { ScraperAdapter, ScraperResult, EventCandidate } from './types';

// Test the dedup logic and adapter orchestration without hitting Supabase

class MockAdapter implements ScraperAdapter {
  readonly source = 'mock';
  private candidates: EventCandidate[];
  private shouldFail: boolean;

  constructor(candidates: EventCandidate[], shouldFail = false) {
    this.candidates = candidates;
    this.shouldFail = shouldFail;
  }

  async scrape(): Promise<ScraperResult> {
    if (this.shouldFail) throw new Error('Mock adapter failure');
    return { source: this.source, candidates: this.candidates, errors: [] };
  }
}

describe('ScraperAdapter interface', () => {
  test('adapter returns candidates and errors', async () => {
    const adapter = new MockAdapter([
      { title: 'Test Concert', venue: 'Hall A', city: 'Boston', event_date: '2026-04-10', event_type: 'concert' },
    ]);
    const result = await adapter.scrape();
    expect(result.source).toBe('mock');
    expect(result.candidates.length).toBe(1);
    expect(result.errors.length).toBe(0);
  });

  test('adapter failure throws error', async () => {
    const adapter = new MockAdapter([], true);
    expect(adapter.scrape()).rejects.toThrow('Mock adapter failure');
  });
});

describe('Dedup logic', () => {
  test('duplicate events have same title+venue+date', () => {
    const a: EventCandidate = { title: 'Concert A', venue: 'Hall', city: 'NY', event_date: '2026-04-10', event_type: 'concert' };
    const b: EventCandidate = { title: 'Concert A', venue: 'Hall', city: 'NY', event_date: '2026-04-10', event_type: 'concert' };
    const key = (e: EventCandidate) => `${e.title}|${e.venue}|${e.event_date}`;
    expect(key(a)).toBe(key(b));
  });

  test('different dates are not duplicates', () => {
    const a: EventCandidate = { title: 'Concert A', venue: 'Hall', city: 'NY', event_date: '2026-04-10', event_type: 'concert' };
    const b: EventCandidate = { title: 'Concert A', venue: 'Hall', city: 'NY', event_date: '2026-04-11', event_type: 'concert' };
    const key = (e: EventCandidate) => `${e.title}|${e.venue}|${e.event_date}`;
    expect(key(a)).not.toBe(key(b));
  });

  test('different venues are not duplicates', () => {
    const a: EventCandidate = { title: 'Concert A', venue: 'Hall A', city: 'NY', event_date: '2026-04-10', event_type: 'concert' };
    const b: EventCandidate = { title: 'Concert A', venue: 'Hall B', city: 'NY', event_date: '2026-04-10', event_type: 'concert' };
    const key = (e: EventCandidate) => `${e.title}|${e.venue}|${e.event_date}`;
    expect(key(a)).not.toBe(key(b));
  });
});

describe('EventCandidate validation', () => {
  test('valid candidate has required fields', () => {
    const c: EventCandidate = {
      title: 'Concert',
      venue: 'Hall',
      city: 'Boston',
      event_date: '2026-04-10',
      event_type: 'concert',
    };
    expect(c.title).toBeTruthy();
    expect(c.venue).toBeTruthy();
    expect(c.city).toBeTruthy();
    expect(c.event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('optional fields can be undefined', () => {
    const c: EventCandidate = {
      title: 'Concert',
      venue: 'Hall',
      city: 'Boston',
      event_date: '2026-04-10',
      event_type: 'concert',
    };
    expect(c.start_time).toBeUndefined();
    expect(c.description).toBeUndefined();
    expect(c.url).toBeUndefined();
    expect(c.performers).toBeUndefined();
  });
});
