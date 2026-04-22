// Integration tests for piece_pills RPCs (add_piece_pill / remove_piece_pill).
//
// Covers:
//   - add validates against controlled vocabularies (instrument, era, form, difficulty)
//   - duration accepts the "~N min" format and rejects others
//   - duplicate pills are rejected
//   - single-value categories (era/form/duration/difficulty) reject a second pill
//   - regular users add → source='user'; staff add → source='mod'
//   - regular users CAN delete any user-source pill (not just their own)
//   - regular users CANNOT delete seed or mod pills
//   - staff CAN delete seed, mod, and user pills
//   - sync trigger keeps the legacy cache columns up to date
//   - new piece insertion triggers seed-pill backfill from scalar columns

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'pills-integration-test';

let userA: Awaited<ReturnType<typeof createAuthUser>>;
let userB: Awaited<ReturnType<typeof createAuthUser>>;
let staff: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE, 'Pills Test Piece');
  userA = await createAuthUser({ displayName: 'Pills User A' });
  userB = await createAuthUser({ displayName: 'Pills User B' });
  staff = await createAuthUser({ displayName: 'Pills Staff', isStaff: true });
});

afterAll(async () => {
  await deleteTestPiece(PIECE);
  await deleteAuthUser(userA.id);
  await deleteAuthUser(userB.id);
  await deleteAuthUser(staff.id);
});

afterEach(async () => {
  // Wipe pills between tests but keep the piece. The createTestPiece above
  // seeds era='Baroque' / form='test' / etc., which the seed-from-piece
  // trigger backfilled into pills — clear those too so each test starts
  // clean.
  await admin.from('piece_pills').delete().eq('piece_id', PIECE);
});

async function addPill(client: typeof userA.client, category: string, value: string) {
  return client.rpc('add_piece_pill', {
    p_piece_id: PIECE,
    p_category: category,
    p_value: value,
  });
}

describe('add_piece_pill', () => {
  test('regular user adds an instrument pill with source=user', async () => {
    const { data, error } = await addPill(userA.client, 'instrument', 'cello');
    expect(error).toBeNull();
    expect(data).toBeTruthy();

    const { data: row } = await admin.from('piece_pills').select('*').eq('id', data!).single();
    expect(row!.category).toBe('instrument');
    expect(row!.value).toBe('cello');
    expect(row!.source).toBe('user');
    expect(row!.added_by).toBe(userA.id);
  });

  test('staff add gets source=mod', async () => {
    const { data, error } = await addPill(staff.client, 'instrument', 'piano');
    expect(error).toBeNull();
    const { data: row } = await admin.from('piece_pills').select('source').eq('id', data!).single();
    expect(row!.source).toBe('mod');
  });

  test('rejects invalid category', async () => {
    const { error } = await addPill(userA.client, 'mood', 'happy');
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/invalid category/i);
  });

  test('lowercases instrument values', async () => {
    const { data, error } = await addPill(userA.client, 'instrument', '  Violin  ');
    expect(error).toBeNull();
    const { data: row } = await admin.from('piece_pills').select('value').eq('id', data!).single();
    expect(row!.value).toBe('violin');
  });

  test('rejects duplicate pill', async () => {
    await addPill(userA.client, 'instrument', 'cello');
    const { error } = await addPill(userB.client, 'instrument', 'cello');
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/already exists/i);
  });

  test('rejects empty value', async () => {
    const { error } = await addPill(userA.client, 'instrument', '   ');
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/empty/i);
  });

  test('duration accepts "~N min" format', async () => {
    const { data, error } = await addPill(userA.client, 'duration', '~18 min');
    expect(error).toBeNull();
    const { data: row } = await admin.from('piece_pills').select('value').eq('id', data!).single();
    expect(row!.value).toBe('~18 min');
  });

  test('duration rejects non-matching format', async () => {
    const { error } = await addPill(userA.client, 'duration', '18 minutes');
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/format/i);
  });

  test('rejects second pill in single-value category', async () => {
    const r1 = await addPill(userA.client, 'era', 'baroque');
    expect(r1.error).toBeNull();
    const r2 = await addPill(userB.client, 'era', 'classical');
    expect(r2.error).not.toBeNull();
    expect(r2.error!.message).toMatch(/already has a pill/i);
  });

  test('allows multiple instruments (multi-value category)', async () => {
    const r1 = await addPill(userA.client, 'instrument', 'cello');
    expect(r1.error).toBeNull();
    const r2 = await addPill(userA.client, 'instrument', 'piano');
    expect(r2.error).toBeNull();
  });

  test('rejects invalid difficulty value', async () => {
    const { error } = await addPill(userA.client, 'difficulty', 'expert');
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/invalid difficulty/i);
  });

  test('unauthenticated request is rejected', async () => {
    const anonClient = (await import('./helpers')).anon();
    const { error } = await anonClient.rpc('add_piece_pill', {
      p_piece_id: PIECE,
      p_category: 'instrument',
      p_value: 'cello',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unauthenticated|denied|jwt/i);
  });
});

describe('remove_piece_pill', () => {
  test('regular user can delete any user-source pill (including others\' adds)', async () => {
    const { data: id } = await addPill(userA.client, 'instrument', 'cello');
    const { error } = await userB.client.rpc('remove_piece_pill', { p_pill_id: id });
    expect(error).toBeNull();

    const { data: gone } = await admin.from('piece_pills').select('id').eq('id', id!).maybeSingle();
    expect(gone).toBeNull();
  });

  test('regular user CANNOT delete a mod-source pill', async () => {
    const { data: id } = await addPill(staff.client, 'instrument', 'piano');
    const { error } = await userA.client.rpc('remove_piece_pill', { p_pill_id: id });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/only moderators/i);
  });

  test('regular user CANNOT delete a seed-source pill', async () => {
    // Seed pill: insert directly bypassing the RPC.
    await admin.from('piece_pills').insert({
      piece_id: PIECE,
      category: 'instrument',
      value: 'flute',
      source: 'seed',
    });
    const { data: seed } = await admin
      .from('piece_pills')
      .select('id')
      .eq('piece_id', PIECE)
      .eq('source', 'seed')
      .single();
    const { error } = await userA.client.rpc('remove_piece_pill', { p_pill_id: seed!.id });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/only moderators/i);
  });

  test('staff can delete seed, mod, and user pills', async () => {
    await admin.from('piece_pills').insert({ piece_id: PIECE, category: 'instrument', value: 'oboe', source: 'seed' });
    const { data: modId } = await addPill(staff.client, 'instrument', 'piano');
    const { data: userId } = await addPill(userA.client, 'instrument', 'cello');

    const { data: seed } = await admin
      .from('piece_pills')
      .select('id')
      .eq('piece_id', PIECE)
      .eq('source', 'seed')
      .single();

    for (const pid of [seed!.id, modId, userId]) {
      const { error } = await staff.client.rpc('remove_piece_pill', { p_pill_id: pid });
      expect(error).toBeNull();
    }
  });
});

describe('sync trigger', () => {
  test('updates pieces.instruments after a pill is added', async () => {
    await addPill(userA.client, 'instrument', 'cello');
    await addPill(userA.client, 'instrument', 'piano');
    const { data } = await admin.from('pieces').select('instruments').eq('id', PIECE).single();
    expect(data!.instruments).toContain('cello');
    expect(data!.instruments).toContain('piano');
  });

  test('updates pieces.era after a single-value pill is added/removed', async () => {
    const { data: id } = await addPill(userA.client, 'era', 'baroque');
    let { data: row } = await admin.from('pieces').select('era').eq('id', PIECE).single();
    expect(row!.era).toBe('baroque');

    await staff.client.rpc('remove_piece_pill', { p_pill_id: id });
    ({ data: row } = await admin.from('pieces').select('era').eq('id', PIECE).single());
    expect(row!.era).toBeNull();
  });

  test('duration cache decodes "~N min" back to integer', async () => {
    await addPill(userA.client, 'duration', '~22 min');
    const { data } = await admin.from('pieces').select('duration_minutes').eq('id', PIECE).single();
    expect(data!.duration_minutes).toBe(22);
  });
});

describe('new-piece backfill trigger', () => {
  const NEW_PIECE = 'pills-newpiece-test';
  afterAll(async () => {
    await admin.from('piece_pills').delete().eq('piece_id', NEW_PIECE);
    await admin.from('pieces').delete().eq('id', NEW_PIECE);
  });

  test('inserts seed pills automatically when a new piece is inserted', async () => {
    await admin.from('pieces').insert({
      id: NEW_PIECE,
      title: 'New Piece',
      composer_name: 'Anonymous',
      era: 'Romantic',
      form: 'sonata',
      instruments: ['Violin', 'Piano'],
      duration_minutes: 25,
      difficulty: 'advanced',
      description: '',
    });

    const { data: pills } = await admin
      .from('piece_pills')
      .select('category, value, source')
      .eq('piece_id', NEW_PIECE)
      .order('category');

    expect(pills).toBeTruthy();
    const all = pills!.map((p: any) => `${p.category}:${p.value}:${p.source}`);
    expect(all).toContain('instrument:violin:seed');
    expect(all).toContain('instrument:piano:seed');
    expect(all).toContain('era:romantic:seed');
    expect(all).toContain('form:sonata:seed');
    expect(all).toContain('duration:~25 min:seed');
    expect(all).toContain('difficulty:advanced:seed');
  });
});
