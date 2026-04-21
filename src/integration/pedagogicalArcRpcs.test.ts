// Integration tests for pedagogical_arc CRUD RPCs + log trigger.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'pedagogical-rpcs-test';
const RELATED = 'pedagogical-related-test';
const OTHER_RELATED = 'pedagogical-other-related';

let userId: string;
let user: SupabaseClient;

async function clearRateLimit(): Promise<void> {
  await admin.from('rate_limit_log').delete().eq('user_id', userId);
}
async function clearConnections(): Promise<void> {
  await admin.from('pedagogical_connections').delete().eq('piece_id', PIECE);
}

beforeAll(async () => {
  await createTestPiece(PIECE, 'Pedagogical Subject');
  await createTestPiece(RELATED, 'Related Piece');
  await createTestPiece(OTHER_RELATED, 'Other Related Piece');
  const u = await createAuthUser({ displayName: 'Arc Tester' });
  userId = u.id;
  user = u.client;
});

afterAll(async () => {
  await clearConnections();
  await clearRateLimit();
  await deleteAuthUser(userId);
  await deleteTestPiece(PIECE);
  await deleteTestPiece(RELATED);
  await deleteTestPiece(OTHER_RELATED);
});

afterEach(async () => {
  await clearConnections();
  await clearRateLimit();
});

async function createViaRpc(
  related: string,
  kind: 'prepare_with' | 'natural_next',
): Promise<string> {
  const { data, error } = await user.rpc('create_pedagogical_connection', {
    p_piece_id: PIECE,
    p_related_piece_id: related,
    p_kind: kind,
    p_note: null,
  });
  if (error) throw new Error(`create_pedagogical_connection: ${error.message}`);
  return data as string;
}

describe('create_pedagogical_connection', () => {
  test('creates with ordinal=1 per (piece, kind) and logs with pedagogical arc subject_type', async () => {
    const a = await createViaRpc(RELATED, 'prepare_with');
    const b = await createViaRpc(OTHER_RELATED, 'prepare_with');
    const c = await createViaRpc(RELATED, 'natural_next');

    const { data: rows } = await admin
      .from('pedagogical_connections')
      .select('id, related_piece_id, kind, ordinal, created_by')
      .eq('piece_id', PIECE)
      .order('kind').order('ordinal');
    expect(rows).toHaveLength(3);

    const prepareWith = rows!.filter((r: any) => r.kind === 'prepare_with');
    expect(prepareWith.map((r: any) => r.ordinal)).toEqual([1, 2]);
    const natural = rows!.filter((r: any) => r.kind === 'natural_next');
    expect(natural.map((r: any) => r.ordinal)).toEqual([1]);
    expect(rows!.every((r: any) => r.created_by === userId)).toBe(true);

    const { data: log } = await admin
      .from('content_mutation_log')
      .select('subject_id, subject_type, subject_label, action')
      .eq('piece_id', PIECE).order('occurred_at');
    expect(log).toHaveLength(3);
    expect(log!.every((r: any) => r.subject_type === 'pedagogical arc' && r.action === 'added')).toBe(true);
    // Labels include the prefix based on kind.
    expect(log!.find((r: any) => r.subject_id === a)!.subject_label).toMatch(/^prepare with/);
    expect(log!.find((r: any) => r.subject_id === c)!.subject_label).toMatch(/^natural next/);
  });

  test('rejects self-reference', async () => {
    const { error } = await user.rpc('create_pedagogical_connection', {
      p_piece_id: PIECE, p_related_piece_id: PIECE, p_kind: 'prepare_with', p_note: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/cannot connect a piece to itself/);
  });

  test('rejects invalid kind', async () => {
    const { error } = await user.rpc('create_pedagogical_connection', {
      p_piece_id: PIECE, p_related_piece_id: RELATED, p_kind: 'random', p_note: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/kind must be/);
  });
});

describe('update_pedagogical_connection', () => {
  test('updates related piece + kind + note', async () => {
    const id = await createViaRpc(RELATED, 'prepare_with');
    const { error } = await user.rpc('update_pedagogical_connection', {
      p_id: id, p_related_piece_id: OTHER_RELATED, p_kind: 'natural_next', p_note: 'revised',
    });
    expect(error).toBeNull();

    const { data: row } = await admin
      .from('pedagogical_connections')
      .select('related_piece_id, kind, note')
      .eq('id', id).single();
    expect(row).toMatchObject({
      related_piece_id: OTHER_RELATED,
      kind: 'natural_next',
      note: 'revised',
    });
  });

  test('rejects update on soft-deleted row', async () => {
    const id = await createViaRpc(RELATED, 'prepare_with');
    await user.rpc('delete_pedagogical_connection', { p_id: id });
    const { error } = await user.rpc('update_pedagogical_connection', {
      p_id: id, p_related_piece_id: RELATED, p_kind: 'prepare_with', p_note: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/deleted/);
  });
});

describe('delete_pedagogical_connection (soft)', () => {
  test('sets deleted_at and emits a deleted log entry', async () => {
    const id = await createViaRpc(RELATED, 'prepare_with');
    await user.rpc('delete_pedagogical_connection', { p_id: id });

    const { data: row } = await admin
      .from('pedagogical_connections').select('deleted_at').eq('id', id).single();
    expect(row!.deleted_at).not.toBeNull();

    const { data: log } = await admin
      .from('content_mutation_log').select('action').eq('subject_id', id).order('occurred_at');
    expect(log!.map((r: any) => r.action)).toEqual(['added', 'deleted']);
  });
});

describe('swap_pedagogical_ordinals', () => {
  test('swaps within the same (piece, kind) section', async () => {
    const a = await createViaRpc(RELATED, 'prepare_with');
    const b = await createViaRpc(OTHER_RELATED, 'prepare_with');
    const { error } = await user.rpc('swap_pedagogical_ordinals', { p_id_a: a, p_id_b: b });
    expect(error).toBeNull();

    const { data: rows } = await admin
      .from('pedagogical_connections')
      .select('id, ordinal')
      .eq('piece_id', PIECE).eq('kind', 'prepare_with').order('ordinal');
    expect(rows![0].id).toBe(b);
    expect(rows![1].id).toBe(a);
  });

  test('rejects swap across kinds (prepare_with vs natural_next)', async () => {
    const a = await createViaRpc(RELATED, 'prepare_with');
    const b = await createViaRpc(RELATED, 'natural_next');
    const { error } = await user.rpc('swap_pedagogical_ordinals', { p_id_a: a, p_id_b: b });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/different sections/);
  });
});
