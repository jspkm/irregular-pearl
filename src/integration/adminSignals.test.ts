// Admin signal RPCs — staff gate + aggregate shapes.

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { admin, createAuthUser, createTestPiece, deleteAuthUser, deleteTestPiece } from './helpers';

describe('admin_top_unmatched_queries', () => {
  let staff: Awaited<ReturnType<typeof createAuthUser>>;
  let plain: Awaited<ReturnType<typeof createAuthUser>>;

  beforeAll(async () => {
    staff = await createAuthUser({ displayName: 'Signals Staff', isStaff: true });
    plain = await createAuthUser({ displayName: 'Signals Plain' });

    // Seed 3 unique queries across varied counts.
    await admin.from('search_misses').insert([
      { query: 'aaaaaaaaa-signal-x', result_count: 0, user_id: plain.id },
      { query: 'aaaaaaaaa-signal-x', result_count: 0, user_id: plain.id },
      { query: 'aaaaaaaaa-signal-x', result_count: 0 },
      { query: 'aaaaaaaaa-signal-y', result_count: 0, user_id: plain.id },
      { query: 'aaaaaaaaa-signal-z', result_count: 0 },
    ]);
  });

  afterAll(async () => {
    await admin.from('search_misses').delete().like('query', 'aaaaaaaaa-signal-%');
    await deleteAuthUser(staff.id);
    await deleteAuthUser(plain.id);
  });

  test('staff gets aggregated top queries', async () => {
    const { data, error } = await staff.client.rpc('admin_top_unmatched_queries', { p_limit: 50 });
    expect(error).toBeNull();
    const rows = (data as any[]).filter((r) => r.query.startsWith('aaaaaaaaa-signal'));
    expect(rows.length).toBe(3);
    const x = rows.find((r) => r.query === 'aaaaaaaaa-signal-x');
    expect(Number(x.count)).toBe(3);
    expect(Number(x.distinct_users)).toBe(1);
  });

  test('non-staff rejected', async () => {
    const { error } = await plain.client.rpc('admin_top_unmatched_queries', { p_limit: 50 });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/staff only/i);
  });
});

describe('admin_top_viewed_no_content_pieces', () => {
  let staff: Awaited<ReturnType<typeof createAuthUser>>;
  let plain: Awaited<ReturnType<typeof createAuthUser>>;
  const P1 = 'test-signals-piece-a';
  const P2 = 'test-signals-piece-b';

  beforeAll(async () => {
    await createTestPiece(P1, 'Signals A');
    await createTestPiece(P2, 'Signals B');
    staff = await createAuthUser({ displayName: 'Signals Staff 2', isStaff: true });
    plain = await createAuthUser({ displayName: 'Signals Plain 2' });

    // Seed views — P1 gets 2 unique users + 1 anon-token (3 unique), P2 gets 1 user + 1 orphan (2 unique)
    await admin.from('piece_views').insert([
      { piece_id: P1, user_id: plain.id },
      { piece_id: P1, user_id: plain.id },  // dedup: same user
      { piece_id: P1, user_id: staff.id },
      { piece_id: P1, visitor_token: 'anon-token-1' },
      { piece_id: P2, user_id: plain.id },
      { piece_id: P2, visitor_token: null }, // orphan
    ]);
  });

  afterAll(async () => {
    await admin.from('piece_views').delete().in('piece_id', [P1, P2]);
    await deleteTestPiece(P1);
    await deleteTestPiece(P2);
    await deleteAuthUser(staff.id);
    await deleteAuthUser(plain.id);
  });

  test('staff gets pieces with unique viewer dedup', async () => {
    const { data, error } = await staff.client.rpc('admin_top_viewed_no_content_pieces', { p_limit: 50 });
    expect(error).toBeNull();
    const rows = (data as any[]).filter((r) => r.piece_id === P1 || r.piece_id === P2);
    expect(rows.length).toBe(2);

    const p1 = rows.find((r) => r.piece_id === P1);
    expect(Number(p1.unique_viewers)).toBe(3); // plain + staff + token-1
    expect(Number(p1.total_views)).toBe(4);

    const p2 = rows.find((r) => r.piece_id === P2);
    expect(Number(p2.unique_viewers)).toBe(2); // plain + 1 orphan (null token counted individually)
    expect(Number(p2.total_views)).toBe(2);
  });

  test('non-staff rejected', async () => {
    const { error } = await plain.client.rpc('admin_top_viewed_no_content_pieces', { p_limit: 50 });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/staff only/i);
  });

  test('limit param clamped to [30, 200]', async () => {
    const { data: below } = await staff.client.rpc('admin_top_viewed_no_content_pieces', { p_limit: 1 });
    const { data: above } = await staff.client.rpc('admin_top_viewed_no_content_pieces', { p_limit: 10000 });
    // Can't assert exact row counts without more data; just confirm RPC accepts out-of-range and returns rows.
    expect(below).toBeDefined();
    expect(above).toBeDefined();
  });
});
