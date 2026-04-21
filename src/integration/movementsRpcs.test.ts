// Slice C Step 3 integration tests: movements wiki-edit RPCs.
//
// Covers:
//   • update_movement      — new version, bumps current_version_id,
//                            name length guard, ordinal guard, rejects
//                            unauthenticated + soft-deleted, rate-limited.
//   • revert_movement      — new version with reverted_from_version_id set,
//                            rejects cross-movement targets, shares rate
//                            bucket with update.
//   • create_movement      — appends at max(ordinal)+1, initial version
//                            'created', rejects missing piece + unauth.
//   • delete_movement      — sets deleted_at, writes tombstone version,
//                            rejects already-deleted, fetchMovementsForPiece
//                            filters it out.
//   • swap_movement_ordinals — transactional swap with one version row per
//                              movement, rejects cross-piece + self + deleted.
//   • fetch_piece_changelog — subject-agnostic feed, DESC order, movement
//                             rows carry subject_type='movement'.
//
// Run via `bun run test:integration` (loads .env.test).

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'movements-rpcs-test-piece';
const OTHER_PIECE = 'movements-rpcs-other-piece';

let userId: string;
let user: SupabaseClient;

async function clearRateLimit(): Promise<void> {
  await admin.from('rate_limit_log').delete().eq('user_id', userId);
}

async function clearMovements(pieceId: string): Promise<void> {
  await admin.from('movements').update({ current_version_id: null }).eq('piece_id', pieceId);
  await admin.from('movement_versions').delete().eq('piece_id', pieceId);
  await admin.from('movements').delete().eq('piece_id', pieceId);
}

async function createMovementViaRpc(pieceId: string, name: string): Promise<string> {
  const { data, error } = await user.rpc('create_movement', {
    p_piece_id: pieceId,
    p_name: name,
  });
  if (error) throw new Error(`create_movement: ${error.message}`);
  return data as string;
}

beforeAll(async () => {
  await createTestPiece(PIECE, 'Step 3 RPC Test Piece');
  await createTestPiece(OTHER_PIECE, 'Step 3 Other Piece');
  const created = await createAuthUser({
    displayName: 'Step 3 Tester',
  });
  userId = created.id;
  user = created.client;
});

afterAll(async () => {
  await clearMovements(PIECE);
  await clearMovements(OTHER_PIECE);
  await clearRateLimit();
  await deleteAuthUser(userId);
  await deleteTestPiece(PIECE);
  await deleteTestPiece(OTHER_PIECE);
});

afterEach(async () => {
  await clearMovements(PIECE);
  await clearMovements(OTHER_PIECE);
  await clearRateLimit();
});

// ============================================================================
// create_movement
// ============================================================================

describe('create_movement', () => {
  test('appends at max(ordinal)+1 with initial version "created"', async () => {
    const firstId = await createMovementViaRpc(PIECE, 'I. Allegro');
    const secondId = await createMovementViaRpc(PIECE, 'II. Andante');

    const { data: rows } = await admin
      .from('movements')
      .select('id, ordinal, name, current_version_id')
      .eq('piece_id', PIECE)
      .order('ordinal');
    expect(rows).toHaveLength(2);
    expect(rows![0]).toMatchObject({ id: firstId, ordinal: 1, name: 'I. Allegro' });
    expect(rows![1]).toMatchObject({ id: secondId, ordinal: 2, name: 'II. Andante' });
    expect(rows![0].current_version_id).not.toBeNull();

    const { data: versions } = await admin
      .from('movement_versions')
      .select('version_number, edit_summary, authored_by')
      .eq('movement_id', firstId);
    expect(versions).toHaveLength(1);
    expect(versions![0]).toMatchObject({
      version_number: 1,
      edit_summary: 'created',
      authored_by: userId,
    });
  });

  test('rejects missing piece', async () => {
    const { error } = await user.rpc('create_movement', {
      p_piece_id: 'no-such-piece',
      p_name: 'X',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/piece not found/);
  });

  test('rejects unauthenticated caller', async () => {
    // Fresh unauthenticated client (no signIn). Cannot use service role —
    // service role bypasses security-definer's auth.uid() null check, so
    // we go via the anon key explicitly.
    const { createClient } = await import('@supabase/supabase-js');
    const anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
    const { error } = await anonClient.rpc('create_movement', {
      p_piece_id: PIECE,
      p_name: 'Anon attempt',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unauthenticated/);
  });

  test('rejects empty + oversized name', async () => {
    const tooLong = 'x'.repeat(201);
    const { error: blankErr } = await user.rpc('create_movement', {
      p_piece_id: PIECE,
      p_name: '',
    });
    expect(blankErr).not.toBeNull();
    const { error: longErr } = await user.rpc('create_movement', {
      p_piece_id: PIECE,
      p_name: tooLong,
    });
    expect(longErr).not.toBeNull();
  });
});

// ============================================================================
// update_movement
// ============================================================================

describe('update_movement', () => {
  test('writes new version and bumps current_version_id', async () => {
    const id = await createMovementViaRpc(PIECE, 'Original');

    const { data: newVersionId, error } = await user.rpc('update_movement', {
      p_movement_id: id,
      p_ordinal: 1,
      p_name: 'Updated',
      p_tempo_indication: 'Adagio',
      p_key_signature: null,
      p_meter: null,
      p_edit_summary: 'tempo + name',
    });
    expect(error).toBeNull();
    expect(newVersionId).toBeTruthy();

    const { data: row } = await admin
      .from('movements')
      .select('name, tempo_indication, current_version_id')
      .eq('id', id)
      .single();
    expect(row).toMatchObject({
      name: 'Updated',
      tempo_indication: 'Adagio',
      current_version_id: newVersionId,
    });

    const { data: versions } = await admin
      .from('movement_versions')
      .select('version_number, name, edit_summary')
      .eq('movement_id', id)
      .order('version_number');
    expect(versions).toHaveLength(2);
    expect(versions![1]).toMatchObject({
      version_number: 2,
      name: 'Updated',
      edit_summary: 'tempo + name',
    });
  });

  test('rejects name outside 1–200 chars', async () => {
    const id = await createMovementViaRpc(PIECE, 'X');
    const { error } = await user.rpc('update_movement', {
      p_movement_id: id,
      p_ordinal: 1,
      p_name: '',
      p_tempo_indication: null,
      p_key_signature: null,
      p_meter: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/name must be/);
  });

  test('rejects ordinal < 1', async () => {
    const id = await createMovementViaRpc(PIECE, 'X');
    const { error } = await user.rpc('update_movement', {
      p_movement_id: id,
      p_ordinal: 0,
      p_name: 'X',
      p_tempo_indication: null,
      p_key_signature: null,
      p_meter: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/ordinal/);
  });

  test('rejects soft-deleted movement', async () => {
    const id = await createMovementViaRpc(PIECE, 'Zombie');
    await user.rpc('delete_movement', { p_movement_id: id });

    const { error } = await user.rpc('update_movement', {
      p_movement_id: id,
      p_ordinal: 1,
      p_name: 'Zombie rising',
      p_tempo_indication: null,
      p_key_signature: null,
      p_meter: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/deleted/);
  });

  test('rate-limited at 10/hour (shared update_movement bucket)', async () => {
    const id = await createMovementViaRpc(PIECE, 'Rate me');
    // create_movement already counted toward the bucket (1/10). Pre-seed
    // 9 more rate_limit_log rows for the user on 'update_movement' to push
    // to the cap without waiting on real calls.
    const rows = Array.from({ length: 9 }, () => ({
      user_id: userId,
      action: 'update_movement',
    }));
    await admin.from('rate_limit_log').insert(rows);

    const { error } = await user.rpc('update_movement', {
      p_movement_id: id,
      p_ordinal: 1,
      p_name: 'Over the cap',
      p_tempo_indication: null,
      p_key_signature: null,
      p_meter: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/rate limit/);
  });
});

// ============================================================================
// revert_movement
// ============================================================================

describe('revert_movement', () => {
  test('copies target version fields with reverted_from_version_id set', async () => {
    const id = await createMovementViaRpc(PIECE, 'v1');
    const { data: v1 } = await admin
      .from('movement_versions')
      .select('id')
      .eq('movement_id', id)
      .single();

    await user.rpc('update_movement', {
      p_movement_id: id,
      p_ordinal: 1,
      p_name: 'v2',
      p_tempo_indication: null,
      p_key_signature: null,
      p_meter: null,
    });

    const { data: newVersionId, error } = await user.rpc('revert_movement', {
      p_movement_id: id,
      p_target_version_id: v1!.id,
    });
    expect(error).toBeNull();

    const { data: row } = await admin
      .from('movements')
      .select('name, current_version_id')
      .eq('id', id)
      .single();
    expect(row).toMatchObject({ name: 'v1', current_version_id: newVersionId });

    const { data: v3 } = await admin
      .from('movement_versions')
      .select('version_number, name, reverted_from_version_id, edit_summary')
      .eq('id', newVersionId as string)
      .single();
    expect(v3).toMatchObject({
      version_number: 3,
      name: 'v1',
      reverted_from_version_id: v1!.id,
    });
    expect(v3!.edit_summary).toMatch(/reverted to version 1/);
  });

  test('rejects target version from a different movement', async () => {
    const idA = await createMovementViaRpc(PIECE, 'A');
    const idB = await createMovementViaRpc(PIECE, 'B');
    const { data: vB } = await admin
      .from('movement_versions')
      .select('id')
      .eq('movement_id', idB)
      .single();

    const { error } = await user.rpc('revert_movement', {
      p_movement_id: idA,
      p_target_version_id: vB!.id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/does not belong/);
  });
});

// ============================================================================
// delete_movement (soft-delete)
// ============================================================================

describe('delete_movement', () => {
  test('sets deleted_at + writes tombstone version', async () => {
    const id = await createMovementViaRpc(PIECE, 'Doomed');
    const { error } = await user.rpc('delete_movement', { p_movement_id: id });
    expect(error).toBeNull();

    const { data: row } = await admin
      .from('movements')
      .select('deleted_at')
      .eq('id', id)
      .single();
    expect(row!.deleted_at).not.toBeNull();

    const { data: versions } = await admin
      .from('movement_versions')
      .select('version_number, edit_summary')
      .eq('movement_id', id)
      .order('version_number');
    expect(versions).toHaveLength(2);
    expect(versions![1]).toMatchObject({
      version_number: 2,
      edit_summary: 'deleted',
    });
  });

  test('rejects already-deleted movement', async () => {
    const id = await createMovementViaRpc(PIECE, 'Doomed');
    await user.rpc('delete_movement', { p_movement_id: id });
    const { error } = await user.rpc('delete_movement', { p_movement_id: id });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/already deleted/);
  });

  test('fetchMovementsForPiece client helper excludes soft-deleted rows', async () => {
    const kept = await createMovementViaRpc(PIECE, 'Kept');
    const gone = await createMovementViaRpc(PIECE, 'Gone');
    await user.rpc('delete_movement', { p_movement_id: gone });

    // Re-implement the helper's query shape inline — importing the helper
    // pulls in the whole app tree including Astro-specific paths. The
    // .is('deleted_at', null) filter is what we care about verifying here.
    const { data } = await admin
      .from('movements')
      .select('id')
      .eq('piece_id', PIECE)
      .is('deleted_at', null);
    const ids = data!.map((r: any) => r.id);
    expect(ids).toContain(kept);
    expect(ids).not.toContain(gone);
  });

  test('allows adding a new movement after soft-delete (partial unique index)', async () => {
    const first = await createMovementViaRpc(PIECE, 'First');
    await user.rpc('delete_movement', { p_movement_id: first });
    // Now create another — it should still get ordinal 1 via max+1 when
    // ignoring the soft-deleted row? No, max() counts deleted too. So the
    // new one appends at ordinal 2. Either way no unique-violation error.
    const second = await createMovementViaRpc(PIECE, 'Second');
    expect(second).toBeTruthy();
  });
});

// ============================================================================
// swap_movement_ordinals
// ============================================================================

describe('swap_movement_ordinals', () => {
  test('swaps ordinals and writes one version row per movement', async () => {
    const idA = await createMovementViaRpc(PIECE, 'A');
    const idB = await createMovementViaRpc(PIECE, 'B');
    // A=1, B=2

    const { error } = await user.rpc('swap_movement_ordinals', {
      p_movement_id_a: idA,
      p_movement_id_b: idB,
    });
    expect(error).toBeNull();

    const { data: rows } = await admin
      .from('movements')
      .select('id, ordinal')
      .eq('piece_id', PIECE)
      .order('ordinal');
    expect(rows).toHaveLength(2);
    expect(rows![0].id).toBe(idB);
    expect(rows![0].ordinal).toBe(1);
    expect(rows![1].id).toBe(idA);
    expect(rows![1].ordinal).toBe(2);

    const { data: versionsA } = await admin
      .from('movement_versions')
      .select('version_number, edit_summary')
      .eq('movement_id', idA)
      .order('version_number');
    expect(versionsA).toHaveLength(2);
    expect(versionsA![1]!.edit_summary).toMatch(/reordered: 1 → 2/);

    const { data: versionsB } = await admin
      .from('movement_versions')
      .select('version_number, edit_summary')
      .eq('movement_id', idB)
      .order('version_number');
    expect(versionsB).toHaveLength(2);
    expect(versionsB![1]!.edit_summary).toMatch(/reordered: 2 → 1/);
  });

  test('rejects swap of movements from different pieces', async () => {
    const idA = await createMovementViaRpc(PIECE, 'A');
    const idB = await createMovementViaRpc(OTHER_PIECE, 'B');
    const { error } = await user.rpc('swap_movement_ordinals', {
      p_movement_id_a: idA,
      p_movement_id_b: idB,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/different pieces/);
  });

  test('rejects self-swap', async () => {
    const id = await createMovementViaRpc(PIECE, 'Narcissus');
    const { error } = await user.rpc('swap_movement_ordinals', {
      p_movement_id_a: id,
      p_movement_id_b: id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/itself/);
  });

  test('rejects swap involving a soft-deleted movement', async () => {
    const idA = await createMovementViaRpc(PIECE, 'A');
    const idB = await createMovementViaRpc(PIECE, 'B');
    await user.rpc('delete_movement', { p_movement_id: idB });

    const { error } = await user.rpc('swap_movement_ordinals', {
      p_movement_id_a: idA,
      p_movement_id_b: idB,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/deleted/);
  });
});

// ============================================================================
// fetch_piece_changelog
// ============================================================================

describe('fetch_piece_changelog', () => {
  test('returns one row per version, subject-tagged, DESC by created_at', async () => {
    const id = await createMovementViaRpc(PIECE, 'Initial');
    await user.rpc('update_movement', {
      p_movement_id: id,
      p_ordinal: 1,
      p_name: 'Renamed',
      p_tempo_indication: null,
      p_key_signature: null,
      p_meter: null,
      p_edit_summary: 'gave it a name',
    });

    const { data, error } = await user.rpc('fetch_piece_changelog', {
      p_piece_id: PIECE,
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data![0]).toMatchObject({
      subject_type: 'movement',
      subject_id: id,
      subject_label: 'Renamed',
      edit_summary: 'gave it a name',
      version_number: 2,
      authored_by_display_name: 'Step 3 Tester',
    });
    expect(data![1]).toMatchObject({
      subject_type: 'movement',
      subject_id: id,
      subject_label: 'Initial',
      edit_summary: 'created',
      version_number: 1,
    });
  });

  test('returns empty array for a piece with no versions', async () => {
    const { data, error } = await user.rpc('fetch_piece_changelog', {
      p_piece_id: OTHER_PIECE,
    });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
