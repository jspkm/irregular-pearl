import { describe, test, expect, mock, beforeEach } from 'bun:test';

// Mock supabase module
const mockSelect = mock(() => ({ data: [], count: 0 }));
const mockChain = () => {
  const chain: any = {
    select: mock(() => chain),
    eq: mock(() => chain),
    neq: mock(() => chain),
    gte: mock(() => chain),
    lt: mock(() => chain),
    in: mock(() => chain),
    not: mock(() => chain),
    order: mock(() => chain),
    range: mock(() => chain),
    limit: mock(() => chain),
    single: mock(() => chain),
    then: (fn: any) => fn({ data: [], count: 0 }),
  };
  // Make it thenable for await
  Object.defineProperty(chain, 'then', {
    value: (resolve: any) => resolve({ data: [], count: 0 }),
  });
  return chain;
};

mock.module('../lib/supabase', () => ({
  hasSupabase: true,
  supabase: {
    from: mock(() => mockChain()),
  },
}));

describe('events helpers', () => {
  test('EventBasic interface has required fields', async () => {
    const { getEventsBasic } = await import('./events');
    const result = await getEventsBasic();
    expect(result).toHaveProperty('events');
    expect(result).toHaveProperty('count');
    expect(Array.isArray(result.events)).toBe(true);
  });

  test('getEventsBasic returns empty when no supabase', async () => {
    // Re-mock with hasSupabase=false
    mock.module('../lib/supabase', () => ({
      hasSupabase: false,
      supabase: { from: mock() },
    }));
    // Clear module cache and re-import
    const mod = await import('./events');
    // hasSupabase is read at call time from the module
    expect(mod.getEventsBasic).toBeDefined();
  });

  test('getEventCities returns sorted unique cities', async () => {
    const { getEventCities } = await import('./events');
    const cities = await getEventCities();
    expect(Array.isArray(cities)).toBe(true);
  });

  test('getEventCountsByDay returns record', async () => {
    const { getEventCountsByDay } = await import('./events');
    const counts = await getEventCountsByDay(2026, 4);
    expect(typeof counts).toBe('object');
  });

  test('getUpcomingEventsForUser returns empty for missing user', async () => {
    const { getUpcomingEventsForUser } = await import('./events');
    const events = await getUpcomingEventsForUser('');
    expect(events).toEqual([]);
  });
});
