// Integration tests for external_links wiki-edit RPCs (shared by the
// Recordings + External references surfaces — UI splits by type).

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'xlinks-rpcs-test';
const OTHER_PIECE = 'xlinks-rpcs-other';

let userId: string;
let user: SupabaseClient;

async function clearRateLimit(): Promise<void> {
  await admin.from('rate_limit_log').delete().eq('user_id', userId);
}
async function clearLinks(): Promise<void> {
  await admin.from('external_links').delete().in('piece_id', [PIECE, OTHER_PIECE]);
}

beforeAll(async () => {
  await createTestPiece(PIECE, 'External Links Test');
  await createTestPiece(OTHER_PIECE, 'External Links Other');
  const u = await createAuthUser({ displayName: 'Links Tester' });
  userId = u.id;
  user = u.client;
});

afterAll(async () => {
  await clearLinks();
  await clearRateLimit();
  await deleteAuthUser(userId);
  await deleteTestPiece(PIECE);
  await deleteTestPiece(OTHER_PIECE);
});

afterEach(async () => {
  await clearLinks();
  await clearRateLimit();
});

async function createViaRpc(
  type: string,
  label: string,
  url: string,
  piece: string = PIECE,
): Promise<string> {
  const { data, error } = await user.rpc('create_external_link', {
    p_piece_id: piece, p_type: type, p_url: url, p_label: label,
  });
  if (error) throw new Error(`create_external_link: ${error.message}`);
  return data as string;
}

describe('create_external_link', () => {
  test('creates row + logs with correct subject_type (recording vs reference)', async () => {
    const rec = await createViaRpc('youtube', 'Intro', 'https://www.youtube.com/watch?v=abc');
    const ref = await createViaRpc('imslp', 'Score', 'https://imslp.org/x');

    const { data: rows } = await admin
      .from('external_links')
      .select('id, type, ordinal, source, created_by')
      .eq('piece_id', PIECE).order('ordinal');
    expect(rows).toHaveLength(2);
    expect(rows![0].source).toBe('user');
    expect(rows![0].created_by).toBe(userId);

    const { data: log } = await admin
      .from('content_mutation_log')
      .select('subject_id, subject_type, action')
      .eq('piece_id', PIECE).order('occurred_at');
    expect(log).toHaveLength(2);
    const recLog = log!.find((r: any) => r.subject_id === rec);
    const refLog = log!.find((r: any) => r.subject_id === ref);
    expect(recLog!.subject_type).toBe('recording');
    expect(refLog!.subject_type).toBe('external reference');
    expect(recLog!.action).toBe('added');
  });

  test('rejects bad link_type enum value', async () => {
    const { error } = await user.rpc('create_external_link', {
      p_piece_id: PIECE, p_type: 'not-a-real-type', p_url: 'https://x', p_label: 'X',
    });
    expect(error).not.toBeNull();
  });

  test('rejects empty url or empty label', async () => {
    const { error: noUrl } = await user.rpc('create_external_link', {
      p_piece_id: PIECE, p_type: 'imslp', p_url: '', p_label: 'X',
    });
    expect(noUrl).not.toBeNull();
    const { error: noLabel } = await user.rpc('create_external_link', {
      p_piece_id: PIECE, p_type: 'imslp', p_url: 'https://x', p_label: '',
    });
    expect(noLabel).not.toBeNull();
  });
});

describe('update_external_link', () => {
  test('updates fields', async () => {
    const id = await createViaRpc('imslp', 'Old', 'https://imslp.org/old');
    const { error } = await user.rpc('update_external_link', {
      p_id: id, p_type: 'wikipedia', p_url: 'https://en.wikipedia.org/new', p_label: 'New',
    });
    expect(error).toBeNull();

    const { data: row } = await admin
      .from('external_links')
      .select('type, url, label')
      .eq('id', id).single();
    expect(row).toMatchObject({ type: 'wikipedia', url: 'https://en.wikipedia.org/new', label: 'New' });
  });

  test('rejects update on soft-deleted link', async () => {
    const id = await createViaRpc('imslp', 'X', 'https://imslp.org/x');
    await user.rpc('delete_external_link', { p_id: id });
    const { error } = await user.rpc('update_external_link', {
      p_id: id, p_type: 'imslp', p_url: 'https://imslp.org/x', p_label: 'X',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/deleted/);
  });
});

describe('delete_external_link (soft)', () => {
  test('sets deleted_at and logs delete', async () => {
    const id = await createViaRpc('imslp', 'X', 'https://imslp.org/x');
    await user.rpc('delete_external_link', { p_id: id });

    const { data: row } = await admin
      .from('external_links').select('deleted_at').eq('id', id).single();
    expect(row!.deleted_at).not.toBeNull();

    const { data: log } = await admin
      .from('content_mutation_log').select('action').eq('subject_id', id).order('occurred_at');
    expect(log!.map((r: any) => r.action)).toEqual(['added', 'deleted']);
  });
});

describe('swap_external_link_ordinals', () => {
  test('swaps two links in the same piece', async () => {
    const a = await createViaRpc('imslp', 'A', 'https://imslp.org/a');
    const b = await createViaRpc('wikipedia', 'B', 'https://en.wikipedia.org/b');
    const { error } = await user.rpc('swap_external_link_ordinals', { p_id_a: a, p_id_b: b });
    expect(error).toBeNull();

    const { data: rows } = await admin
      .from('external_links').select('id, ordinal').eq('piece_id', PIECE).order('ordinal');
    expect(rows![0].id).toBe(b);
    expect(rows![1].id).toBe(a);
  });

  test('rejects cross-piece swap', async () => {
    const a = await createViaRpc('imslp', 'A', 'https://imslp.org/a', PIECE);
    const b = await createViaRpc('imslp', 'B', 'https://imslp.org/b', OTHER_PIECE);
    const { error } = await user.rpc('swap_external_link_ordinals', { p_id_a: a, p_id_b: b });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/different pieces/);
  });
});
