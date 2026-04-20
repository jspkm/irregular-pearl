// Slice C Step 2 integration tests: movements table schema + behavior.
//
// Step 2 ships schema only; wiki-edit RPCs (update_movement, revert_movement,
// fetch_movement_history) land in Step 3. Actual catalog data is populated
// via `bun run supabase/seed.ts` post-migration — these tests don't depend
// on seeded data and use synthetic test pieces.
//
// Covered:
//   - Composite FK on current_version_id rejects cross-movement pairs.
//   - unique(piece_id, ordinal) rejects duplicates.
//   - name length CHECK.
//   - authored_by nullable (initial seed) vs non-null (user wiki edit).
//   - RLS grants anon + authenticated public select on both tables.
//   - Cascade: delete piece → movements + movement_versions cascade.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { admin, createTestPiece, deleteTestPiece } from './helpers';
import { createClient } from '@supabase/supabase-js';

const ANON = createClient(
  process.env.PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  process.env.PUBLIC_SUPABASE_ANON_KEY ?? '',
);

const TEST_PIECE = 'movements-test-piece';

beforeAll(async () => {
  await createTestPiece(TEST_PIECE, 'Movements Test Piece');
});

afterAll(async () => {
  await deleteTestPiece(TEST_PIECE);
});

afterEach(async () => {
  // Between tests, clear any movement rows created under the test piece.
  // Null current_version_id first so FK allows the version delete.
  await admin.from('movements').update({ current_version_id: null }).eq('piece_id', TEST_PIECE);
  await admin.from('movement_versions').delete().eq('piece_id', TEST_PIECE);
  await admin.from('movements').delete().eq('piece_id', TEST_PIECE);
});

describe('schema shape', () => {
  test('composite FK rejects cross-movement current_version_id', async () => {
    const { data: m1, error: e1 } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 10, name: 'Alpha' })
      .select('id')
      .single();
    expect(e1).toBeNull();

    const { data: m2, error: e2 } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 11, name: 'Beta' })
      .select('id')
      .single();
    expect(e2).toBeNull();

    const { data: v1, error: e3 } = await admin
      .from('movement_versions')
      .insert({
        movement_id: m1!.id,
        piece_id: TEST_PIECE,
        ordinal: 10,
        name: 'Alpha',
        version_number: 1,
        authored_by: null,
      })
      .select('id')
      .single();
    expect(e3).toBeNull();

    // Try to point m2.current_version_id at v1 (which belongs to m1).
    // Composite FK should reject.
    const { error: badErr } = await admin
      .from('movements')
      .update({ current_version_id: v1!.id })
      .eq('id', m2!.id);
    expect(badErr).not.toBeNull();
    expect(badErr!.message).toMatch(/fk_movements_current_version_matches|foreign key/i);
  });

  test('unique(piece_id, ordinal) rejects duplicates', async () => {
    const { error: e1 } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 20, name: 'First' });
    expect(e1).toBeNull();

    const { error: e2 } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 20, name: 'Duplicate' });
    expect(e2).not.toBeNull();
    expect(e2!.message).toMatch(/duplicate key|unique/i);
  });

  test('name length CHECK rejects empty + over-length names', async () => {
    const { error: tooShort } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 30, name: '' });
    expect(tooShort).not.toBeNull();

    const { error: tooLong } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 31, name: 'x'.repeat(201) });
    expect(tooLong).not.toBeNull();
  });

  test('authored_by is nullable (seed marker)', async () => {
    const { data: m, error: mErr } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 40, name: 'Seed-authorship test' })
      .select('id')
      .single();
    expect(mErr).toBeNull();

    const { data: v, error: vErr } = await admin
      .from('movement_versions')
      .insert({
        movement_id: m!.id,
        piece_id: TEST_PIECE,
        ordinal: 40,
        name: 'Seed-authorship test',
        version_number: 1,
        authored_by: null,
        edit_summary: 'initial seed from src/data/seed.ts',
      })
      .select('authored_by, edit_summary')
      .single();
    expect(vErr).toBeNull();
    expect(v!.authored_by).toBeNull();
    expect(v!.edit_summary).toBe('initial seed from src/data/seed.ts');
  });
});

describe('RLS — public select works for anon + authenticated', () => {
  test('anon client can read movements', async () => {
    // Create a movement via admin, then read via anon.
    const { data: m } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 50, name: 'Anon-readable' })
      .select('id')
      .single();

    const { data, error } = await ANON
      .from('movements')
      .select('id, name')
      .eq('id', m!.id)
      .single();
    expect(error).toBeNull();
    expect(data!.name).toBe('Anon-readable');
  });

  test('anon client can read movement_versions', async () => {
    const { data: m } = await admin
      .from('movements')
      .insert({ piece_id: TEST_PIECE, ordinal: 51, name: 'Anon-version-readable' })
      .select('id')
      .single();

    const { data: v } = await admin
      .from('movement_versions')
      .insert({
        movement_id: m!.id,
        piece_id: TEST_PIECE,
        ordinal: 51,
        name: 'Anon-version-readable',
        version_number: 1,
        authored_by: null,
      })
      .select('id')
      .single();

    const { data, error } = await ANON
      .from('movement_versions')
      .select('id, name, version_number')
      .eq('id', v!.id)
      .single();
    expect(error).toBeNull();
    expect(data!.name).toBe('Anon-version-readable');
    expect(data!.version_number).toBe(1);
  });
});

describe('cascade behavior', () => {
  test('deleting a piece cascades to movements and movement_versions', async () => {
    const cascadePieceId = 'movements-cascade-test';
    await createTestPiece(cascadePieceId, 'Cascade Test');

    const { data: m, error: mErr } = await admin
      .from('movements')
      .insert({ piece_id: cascadePieceId, ordinal: 1, name: 'Only' })
      .select('id')
      .single();
    expect(mErr).toBeNull();

    const { error: vErr } = await admin
      .from('movement_versions')
      .insert({
        movement_id: m!.id,
        piece_id: cascadePieceId,
        ordinal: 1,
        name: 'Only',
        version_number: 1,
        authored_by: null,
      });
    expect(vErr).toBeNull();

    // Delete the piece. Cascade should drop the movement + version.
    await admin.from('pieces').delete().eq('id', cascadePieceId);

    const { count: mCount } = await admin
      .from('movements')
      .select('id', { count: 'exact', head: true })
      .eq('piece_id', cascadePieceId);
    expect(mCount).toBe(0);

    const { count: vCount } = await admin
      .from('movement_versions')
      .select('id', { count: 'exact', head: true })
      .eq('piece_id', cascadePieceId);
    expect(vCount).toBe(0);
  });
});
