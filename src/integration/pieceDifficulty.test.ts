// Integration tests for piece_difficulty_ratings RPCs and seed-vote plumbing.
// Self-authored only in v1 — no staff-drafted path, no approval queue.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'slice-difficulty-test';

let contributor: Awaited<ReturnType<typeof createAuthUser>>;
let otherContributor: Awaited<ReturnType<typeof createAuthUser>>;
let normalUser: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE, 'Difficulty Test Piece');
  contributor = await createAuthUser({ displayName: 'Rating Contributor' });
  otherContributor = await createAuthUser({ displayName: 'Other Rating Contributor' });
  normalUser = await createAuthUser({ displayName: 'Rating Normal' });
});

afterAll(async () => {
  await deleteTestPiece(PIECE);
  await deleteAuthUser(contributor.id);
  await deleteAuthUser(otherContributor.id);
  await deleteAuthUser(normalUser.id);
});

afterEach(async () => {
  await admin.from('piece_difficulty_ratings').delete().eq('piece_id', PIECE);
});

function baseRating() {
  return {
    p_piece_id: PIECE,
    p_technical_level: 4,
    p_technical_note: 'Ricochet bowing exposes the line',
    p_stamina_level: 3,
    p_stamina_note: null as string | null,
    p_interpretive_level: 5,
    p_interpretive_note: 'Autumnal rubato',
    p_ensemble_level: 0,
    p_ensemble_note: null as string | null,
  };
}

describe('publish_contributor_piece_difficulty', () => {
  test('publishes atomically with all axes', async () => {
    const { data: id, error } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty',
      baseRating(),
    );
    expect(error).toBeNull();
    expect(id).toBeTruthy();

    const { data: r } = await admin
      .from('piece_difficulty_ratings')
      .select('*')
      .eq('id', id!)
      .single();
    expect(r!.status).toBe('published');
    expect(r!.contributor_id).toBe(contributor.id);
    expect(r!.technical_level).toBe(4);
    expect(r!.technical_note).toContain('Ricochet');
    expect(r!.stamina_note).toBeNull();
    expect(r!.ensemble_level).toBe(0);
  });

  test('rejects out-of-range level', async () => {
    const args = { ...baseRating(), p_technical_level: 7 };
    const { error } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty',
      args,
    );
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/between 0 and 5/i);
  });

  test('trims whitespace notes to null', async () => {
    const args = { ...baseRating(), p_technical_note: '   ' };
    const { data: id } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty',
      args,
    );
    const { data: r } = await admin
      .from('piece_difficulty_ratings')
      .select('technical_note')
      .eq('id', id!)
      .single();
    expect(r!.technical_note).toBeNull();
  });

  test('any registered user can publish (post Slice C governance)', async () => {
    const { data: id, error } = await normalUser.client.rpc(
      'publish_contributor_piece_difficulty',
      baseRating(),
    );
    expect(error).toBeNull();
    expect(id).toBeTruthy();
  });

  test('unauth cannot publish', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await anon.rpc('publish_contributor_piece_difficulty', baseRating());
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unauthenticated/i);
  });
});

describe('publish_contributor_piece_difficulty_edit', () => {
  test('owner can edit, other user cannot', async () => {
    const { data: id } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty',
      baseRating(),
    );

    const editArgs = {
      p_rating_id: id!,
      p_technical_level: 5,
      p_technical_note: 'revised',
      p_stamina_level: 4,
      p_stamina_note: null,
      p_interpretive_level: 5,
      p_interpretive_note: null,
      p_ensemble_level: 0,
      p_ensemble_note: null,
    };

    const { error: ownErr } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty_edit',
      editArgs,
    );
    expect(ownErr).toBeNull();

    const { data: after } = await admin
      .from('piece_difficulty_ratings')
      .select('technical_level, technical_note, stamina_level')
      .eq('id', id!)
      .single();
    expect(after!.technical_level).toBe(5);
    expect(after!.technical_note).toBe('revised');
    expect(after!.stamina_level).toBe(4);

    const { error: otherErr } = await otherContributor.client.rpc(
      'publish_contributor_piece_difficulty_edit',
      editArgs,
    );
    expect(otherErr).not.toBeNull();
    expect(otherErr!.message).toMatch(/not owned/i);
  });
});

describe('remove_piece_difficulty', () => {
  test('soft-removes', async () => {
    const { data: id } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty',
      baseRating(),
    );
    const { error } = await contributor.client.rpc('remove_piece_difficulty', {
      p_rating_id: id!,
    });
    expect(error).toBeNull();

    const { data: r } = await admin
      .from('piece_difficulty_ratings')
      .select('status, removed_by, removed_at')
      .eq('id', id!)
      .single();
    expect(r!.status).toBe('removed');
    expect(r!.removed_by).toBe(contributor.id);
    expect(r!.removed_at).not.toBeNull();
  });

  test('cannot remove twice', async () => {
    const { data: id } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty',
      baseRating(),
    );
    await contributor.client.rpc('remove_piece_difficulty', { p_rating_id: id! });
    const { error } = await contributor.client.rpc('remove_piece_difficulty', {
      p_rating_id: id!,
    });
    expect(error).not.toBeNull();
  });
});

describe('voting on difficulty subjects', () => {
  test('cast_vote accepts piece_difficulty_ratings', async () => {
    const { data: id } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty',
      baseRating(),
    );
    const { error } = await otherContributor.client.rpc('cast_vote', {
      p_subject_table: 'piece_difficulty_ratings',
      p_subject_id: id!,
      p_vote_value: 1,
    });
    expect(error).toBeNull();

    const { data: tally } = await admin
      .from('vote_tallies')
      .select('net_score')
      .eq('subject_table', 'piece_difficulty_ratings')
      .eq('subject_id', id!)
      .single();
    expect(tally!.net_score).toBe(1);
  });

  test('cast_vote accepts pieces_seed_difficulty', async () => {
    const { data: piece } = await admin
      .from('pieces')
      .select('seed_difficulty_vote_id')
      .eq('id', PIECE)
      .single();
    expect(piece!.seed_difficulty_vote_id).toBeTruthy();

    const { error } = await contributor.client.rpc('cast_vote', {
      p_subject_table: 'pieces_seed_difficulty',
      p_subject_id: piece!.seed_difficulty_vote_id,
      p_vote_value: -1,
    });
    expect(error).toBeNull();

    const { data: tally } = await admin
      .from('vote_tallies')
      .select('net_score')
      .eq('subject_table', 'pieces_seed_difficulty')
      .eq('subject_id', piece!.seed_difficulty_vote_id)
      .single();
    expect(tally!.net_score).toBe(-1);
  });

  test('deleting the rating clears its votes + tallies', async () => {
    const { data: id } = await contributor.client.rpc(
      'publish_contributor_piece_difficulty',
      baseRating(),
    );
    await otherContributor.client.rpc('cast_vote', {
      p_subject_table: 'piece_difficulty_ratings',
      p_subject_id: id!,
      p_vote_value: 1,
    });

    await admin.from('piece_difficulty_ratings').delete().eq('id', id!);

    const { count: voteCount } = await admin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'piece_difficulty_ratings')
      .eq('subject_id', id!);
    expect(voteCount).toBe(0);

    // vote_tallies rows remain but the trigger-applied delta reconciles
    // net_score back to zero (mirrors the performers_notes / piece_descriptions
    // behaviour — the orphan trigger clears votes, not tallies).
    const { data: tally } = await admin
      .from('vote_tallies')
      .select('net_score, up_count, down_count')
      .eq('subject_table', 'piece_difficulty_ratings')
      .eq('subject_id', id!)
      .maybeSingle();
    if (tally) {
      expect(tally.net_score).toBe(0);
      expect(tally.up_count).toBe(0);
      expect(tally.down_count).toBe(0);
    }
  });
});

describe('seed difficulty vote id', () => {
  test('every piece has a stable seed_difficulty_vote_id', async () => {
    const { data } = await admin
      .from('pieces')
      .select('id, seed_difficulty_vote_id')
      .limit(5);
    expect(data!.length).toBeGreaterThan(0);
    for (const row of data!) {
      expect(row.seed_difficulty_vote_id).toBeTruthy();
    }
  });
});
