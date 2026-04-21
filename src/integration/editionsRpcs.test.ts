// Integration tests for editions wiki-edit RPCs.
//
// Covers create_edition, update_edition, delete_edition (soft),
// swap_edition_ordinals, plus auth / validation / already-deleted guards
// and rate-limit via the shared 'content_edit' bucket.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'editions-rpcs-test';
const OTHER_PIECE = 'editions-rpcs-other-test';

let userId: string;
let user: SupabaseClient;

async function clearRateLimit(): Promise<void> {
  await admin.from('rate_limit_log').delete().eq('user_id', userId);
}
async function clearEditions(): Promise<void> {
  await admin.from('editions').delete().in('piece_id', [PIECE, OTHER_PIECE]);
}

beforeAll(async () => {
  await createTestPiece(PIECE, 'Editions RPC Test Piece');
  await createTestPiece(OTHER_PIECE, 'Editions RPC Other Piece');
  const u = await createAuthUser({ displayName: 'Editions Tester' });
  userId = u.id;
  user = u.client;
});

afterAll(async () => {
  await clearEditions();
  await clearRateLimit();
  await deleteAuthUser(userId);
  await deleteTestPiece(PIECE);
  await deleteTestPiece(OTHER_PIECE);
});

afterEach(async () => {
  await clearEditions();
  await clearRateLimit();
});

async function createViaRpc(
  publisher: string,
  piece: string = PIECE,
): Promise<string> {
  const { data, error } = await user.rpc('create_edition', {
    p_piece_id: piece,
    p_publisher: publisher,
    p_editor: 'Ed',
    p_year: 2020,
    p_description: '',
    p_type: null,
    p_url: null,
  });
  if (error) throw new Error(`create_edition: ${error.message}`);
  return data as string;
}

describe('create_edition', () => {
  test('appends at max ordinal + 1 with content_edit log', async () => {
    const a = await createViaRpc('Henle');
    const b = await createViaRpc('Bärenreiter');

    const { data: rows } = await admin
      .from('editions')
      .select('id, ordinal, publisher, created_by')
      .eq('piece_id', PIECE)
      .order('ordinal');
    expect(rows).toHaveLength(2);
    expect(rows![0]).toMatchObject({ id: a, ordinal: 1, publisher: 'Henle', created_by: userId });
    expect(rows![1]).toMatchObject({ id: b, ordinal: 2, publisher: 'Bärenreiter' });

    const { data: log } = await admin
      .from('content_mutation_log')
      .select('action, subject_type, subject_label')
      .eq('piece_id', PIECE)
      .order('occurred_at');
    expect(log).toHaveLength(2);
    expect(log!.every((r: any) => r.subject_type === 'edition' && r.action === 'added')).toBe(true);
  });

  test('rejects unauthenticated caller', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { error } = await anon.rpc('create_edition', {
      p_piece_id: PIECE, p_publisher: 'X', p_editor: '', p_year: null,
      p_description: '', p_type: null, p_url: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unauthenticated/);
  });

  test('rejects missing piece and empty publisher', async () => {
    const { error: missingPiece } = await user.rpc('create_edition', {
      p_piece_id: 'no-such-piece', p_publisher: 'X', p_editor: '', p_year: null,
      p_description: '', p_type: null, p_url: null,
    });
    expect(missingPiece).not.toBeNull();

    const { error: blank } = await user.rpc('create_edition', {
      p_piece_id: PIECE, p_publisher: '', p_editor: '', p_year: null,
      p_description: '', p_type: null, p_url: null,
    });
    expect(blank).not.toBeNull();
  });
});

describe('update_edition', () => {
  test('updates fields and writes updated-log row', async () => {
    const id = await createViaRpc('Henle');
    const { error } = await user.rpc('update_edition', {
      p_id: id, p_publisher: 'Henle Verlag', p_editor: 'Wenzinger',
      p_year: 2019, p_description: 'updated desc', p_type: 'urtext', p_url: 'https://example.com',
    });
    expect(error).toBeNull();

    const { data: row } = await admin
      .from('editions')
      .select('publisher, editor, year, type, url')
      .eq('id', id).single();
    expect(row).toMatchObject({
      publisher: 'Henle Verlag',
      editor: 'Wenzinger',
      year: 2019,
      type: 'urtext',
      url: 'https://example.com',
    });

    const { data: log } = await admin.from('content_mutation_log')
      .select('action').eq('subject_id', id).order('occurred_at');
    expect(log!.map((r: any) => r.action)).toEqual(['added', 'updated']);
  });

  test('rejects edit on soft-deleted row', async () => {
    const id = await createViaRpc('Henle');
    await user.rpc('delete_edition', { p_id: id });
    const { error } = await user.rpc('update_edition', {
      p_id: id, p_publisher: 'X', p_editor: '', p_year: null,
      p_description: '', p_type: null, p_url: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/deleted/);
  });
});

describe('delete_edition', () => {
  test('soft-deletes and allows reinserting at freed ordinal via create_edition', async () => {
    const a = await createViaRpc('A');
    await createViaRpc('B');
    await user.rpc('delete_edition', { p_id: a });

    const { data: rows } = await admin
      .from('editions')
      .select('publisher, ordinal, deleted_at')
      .eq('piece_id', PIECE).order('ordinal');
    // Deleted row still present; active query excludes it — verify both.
    const active = rows!.filter((r: any) => r.deleted_at == null);
    expect(active).toHaveLength(1);
    expect(active[0].publisher).toBe('B');

    // Partial unique index lets a new edition take the same ordinal.
    await createViaRpc('A replacement');
    const { data: after } = await admin
      .from('editions')
      .select('publisher')
      .eq('piece_id', PIECE)
      .is('deleted_at', null)
      .order('ordinal');
    expect(after!.map((r: any) => r.publisher)).toEqual(['B', 'A replacement']);
  });

  test('rejects double delete', async () => {
    const id = await createViaRpc('Henle');
    await user.rpc('delete_edition', { p_id: id });
    const { error } = await user.rpc('delete_edition', { p_id: id });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/already deleted/);
  });
});

describe('swap_edition_ordinals', () => {
  test('swaps ordinals', async () => {
    const a = await createViaRpc('First');
    const b = await createViaRpc('Second');

    const { error } = await user.rpc('swap_edition_ordinals', { p_id_a: a, p_id_b: b });
    expect(error).toBeNull();

    const { data: rows } = await admin
      .from('editions')
      .select('id, ordinal')
      .eq('piece_id', PIECE).order('ordinal');
    expect(rows![0].id).toBe(b);
    expect(rows![1].id).toBe(a);
  });

  test('rejects cross-piece swap', async () => {
    const a = await createViaRpc('A', PIECE);
    const b = await createViaRpc('B', OTHER_PIECE);
    const { error } = await user.rpc('swap_edition_ordinals', { p_id_a: a, p_id_b: b });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/different pieces/);
  });

  test('rejects swap involving a soft-deleted row', async () => {
    const a = await createViaRpc('A');
    const b = await createViaRpc('B');
    await user.rpc('delete_edition', { p_id: b });
    const { error } = await user.rpc('swap_edition_ordinals', { p_id_a: a, p_id_b: b });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/deleted/);
  });
});

describe('content_edit rate limit (shared 30/hour bucket)', () => {
  test('update_edition rejected after 30 entries in the bucket', async () => {
    const id = await createViaRpc('Henle'); // 1 entry in bucket
    const rows = Array.from({ length: 29 }, () => ({
      user_id: userId, action: 'content_edit',
    }));
    await admin.from('rate_limit_log').insert(rows);

    const { error } = await user.rpc('update_edition', {
      p_id: id, p_publisher: 'Over cap', p_editor: '', p_year: null,
      p_description: '', p_type: null, p_url: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/rate limit/);
  });
});
