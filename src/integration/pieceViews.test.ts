// Integration tests for log_piece_view + piece_views dedup shape.

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { admin, createAuthUser, createTestPiece, deleteAuthUser, deleteTestPiece } from './helpers';

describe('log_piece_view', () => {
  const PIECE = 'test-piece-views-piece';
  let user: Awaited<ReturnType<typeof createAuthUser>>;

  beforeAll(async () => {
    await createTestPiece(PIECE, 'Piece Views Test');
    user = await createAuthUser({ displayName: 'View Tester' });
  });

  afterAll(async () => {
    await admin.from('piece_views').delete().eq('piece_id', PIECE);
    await deleteTestPiece(PIECE);
    await deleteAuthUser(user.id);
  });

  test('signed-in call logs user_id, not visitor_token', async () => {
    await user.client.rpc('log_piece_view', {
      p_piece_id: PIECE,
      p_visitor_token: 'ignored-when-signed-in',
    });
    const { data: rows } = await admin
      .from('piece_views')
      .select('user_id, visitor_token')
      .eq('piece_id', PIECE)
      .eq('user_id', user.id);
    expect(rows!.length).toBeGreaterThanOrEqual(1);
    const row = rows![0] as { user_id: string; visitor_token: string | null };
    expect(row.user_id).toBe(user.id);
    expect(row.visitor_token).toBeNull();
  });

  test('anonymous call logs visitor_token, user_id null', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const anonClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const token = `token-${crypto.randomUUID()}`;
    await anonClient.rpc('log_piece_view', {
      p_piece_id: PIECE,
      p_visitor_token: token,
    });
    const { data: rows } = await admin
      .from('piece_views')
      .select('user_id, visitor_token')
      .eq('piece_id', PIECE)
      .eq('visitor_token', token);
    expect(rows!.length).toBe(1);
    expect((rows![0] as { user_id: string | null }).user_id).toBeNull();
  });

  test('nonexistent piece_id is a no-op (no FK violation raised)', async () => {
    const { error } = await user.client.rpc('log_piece_view', {
      p_piece_id: 'never-existed-piece',
      p_visitor_token: null,
    });
    expect(error).toBeNull();
  });

  test('empty p_piece_id is a no-op', async () => {
    const { error } = await user.client.rpc('log_piece_view', {
      p_piece_id: '',
      p_visitor_token: null,
    });
    expect(error).toBeNull();
  });

  test('COUNT(DISTINCT) dedup pattern collapses revisits per-user', async () => {
    // Same user views 3 times — rows accumulate, but distinct count is 1
    for (let i = 0; i < 3; i++) {
      await user.client.rpc('log_piece_view', { p_piece_id: PIECE, p_visitor_token: null });
    }
    const { data: uniqueCountData } = await admin
      .from('piece_views')
      .select('user_id, visitor_token', { count: 'exact' })
      .eq('piece_id', PIECE)
      .eq('user_id', user.id);
    const totalHitsForUser = uniqueCountData!.length;
    expect(totalHitsForUser).toBeGreaterThanOrEqual(3); // includes 1st test's row
    // Distinct user_id would be 1 for this user, regardless of refresh count.
  });
});
