import { describe, test, expect, mock } from 'bun:test';

// Mock supabase module
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
  };
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
  test('getEventsBasic returns events and count', async () => {
    const { getEventsBasic } = await import('./events');
    const result = await getEventsBasic();
    expect(result).toHaveProperty('events');
    expect(result).toHaveProperty('count');
    expect(Array.isArray(result.events)).toBe(true);
  });

  test('getEventsBasic is defined', async () => {
    const mod = await import('./events');
    expect(mod.getEventsBasic).toBeDefined();
  });

  test('getEventCities returns array', async () => {
    const { getEventCities } = await import('./events');
    const cities = await getEventCities();
    expect(Array.isArray(cities)).toBe(true);
  });
});
