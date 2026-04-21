// Slice C Step 4 integration tests: votes + vote_tallies RPCs + triggers.
//
// Covers:
//   • cast_vote — upsert semantics, flip path, idempotent same-vote,
//                 vote_value + subject_table validation, unauth rejection,
//                 30/min rate-limit (shared cast_vote bucket).
//   • clear_vote — deletes vote, decrements tally, safe no-op on nothing.
//   • Trigger correctness (trg_votes_delta) — up_count / down_count /
//                 net_score stay in sync across insert / flip / delete /
//                 multiple users.
//   • RLS on votes — authenticated user sees only their own rows.
//   • Orphan cleanup (_clear_votes_on_subject_delete) — deleting a
//                 performers_notes row cleans up vote rows and tally.
//
// Uses `publish_contributor_note` to create a real subject row for each
// test so the integration path mirrors how votes are cast in production.

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'votes-test-piece';

let voter: Awaited<ReturnType<typeof createAuthUser>>;
let otherVoter: Awaited<ReturnType<typeof createAuthUser>>;
let author: Awaited<ReturnType<typeof createAuthUser>>;

async function publishNote(authorClient: SupabaseClient, body: string): Promise<string> {
  const { data, error } = await authorClient.rpc('publish_contributor_note', {
    p_piece_id: PIECE,
    p_body: body,
  });
  if (error) throw new Error(`publish_contributor_note: ${error.message}`);
  return data as string;
}

async function getTally(noteId: string): Promise<{ up: number; down: number; net: number } | null> {
  const { data } = await admin
    .from('vote_tallies')
    .select('up_count, down_count, net_score')
    .eq('subject_table', 'performers_notes')
    .eq('subject_id', noteId)
    .maybeSingle();
  return data
    ? { up: data.up_count, down: data.down_count, net: data.net_score }
    : null;
}

async function clearRateLimit(userId: string): Promise<void> {
  await admin.from('rate_limit_log').delete().eq('user_id', userId);
}

async function clearNotes(): Promise<void> {
  await admin.from('performers_notes').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('performers_note_versions').delete().eq('piece_id', PIECE);
  await admin.from('performers_notes').delete().eq('piece_id', PIECE);
  // vote_tallies rows for deleted notes hang around under their own key —
  // clear them so DB state is pristine between tests.
  await admin.from('vote_tallies').delete().eq('subject_table', 'performers_notes');
}

beforeAll(async () => {
  await createTestPiece(PIECE, 'Votes Test Piece');
  voter = await createAuthUser({ displayName: 'Voter' });
  otherVoter = await createAuthUser({ displayName: 'Other Voter' });
  author = await createAuthUser({ isContributor: true, displayName: 'Author' });
});

afterAll(async () => {
  await clearNotes();
  await clearRateLimit(voter.id);
  await clearRateLimit(otherVoter.id);
  await clearRateLimit(author.id);
  await deleteAuthUser(voter.id);
  await deleteAuthUser(otherVoter.id);
  await deleteAuthUser(author.id);
  await deleteTestPiece(PIECE);
});

afterEach(async () => {
  await clearNotes();
  await clearRateLimit(voter.id);
  await clearRateLimit(otherVoter.id);
  await clearRateLimit(author.id);
});

// ============================================================================
// cast_vote — happy path + tally sync
// ============================================================================

describe('cast_vote', () => {
  test('insert upvote writes row + tally (+1/1/0)', async () => {
    const noteId = await publishNote(author.client, 'subject');
    const { error } = await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    expect(error).toBeNull();

    const { data: voteRow } = await admin
      .from('votes')
      .select('vote_value, user_id')
      .eq('subject_id', noteId)
      .single();
    expect(voteRow).toMatchObject({ vote_value: 1, user_id: voter.id });

    const tally = await getTally(noteId);
    expect(tally).toEqual({ up: 1, down: 0, net: 1 });
  });

  test('flip upvote → downvote via second cast_vote updates tally in place', async () => {
    const noteId = await publishNote(author.client, 'flip target');
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: -1,
    });

    const { data: rows } = await admin
      .from('votes')
      .select('vote_value')
      .eq('subject_id', noteId);
    expect(rows).toHaveLength(1);
    expect(rows![0].vote_value).toBe(-1);

    const tally = await getTally(noteId);
    expect(tally).toEqual({ up: 0, down: 1, net: -1 });
  });

  test('idempotent same-value call leaves tally unchanged', async () => {
    const noteId = await publishNote(author.client, 'idempotent');
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });

    const { count } = await admin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId);
    expect(count).toBe(1);

    const tally = await getTally(noteId);
    expect(tally).toEqual({ up: 1, down: 0, net: 1 });
  });

  test('two users voting reconciles to up=1, down=1, net=0', async () => {
    const noteId = await publishNote(author.client, 'multiuser');
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    await otherVoter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: -1,
    });

    const tally = await getTally(noteId);
    expect(tally).toEqual({ up: 1, down: 1, net: 0 });
  });

  test('rejects vote_value outside {-1, 1}', async () => {
    const noteId = await publishNote(author.client, 'range check');
    const { error: zero } = await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 0,
    });
    expect(zero).not.toBeNull();
    const { error: two } = await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 2,
    });
    expect(two).not.toBeNull();
  });

  test('rejects unknown subject_table', async () => {
    const { error } = await voter.client.rpc('cast_vote', {
      p_subject_table: 'movements',
      p_subject_id: '00000000-0000-0000-0000-000000000000',
      p_vote_value: 1,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/invalid subject_table/);
  });

  test('rejects unauthenticated caller', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
    const { error } = await anonClient.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: '00000000-0000-0000-0000-000000000000',
      p_vote_value: 1,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unauthenticated/);
  });

  test('rate-limited at 30/minute (shared cast_vote bucket)', async () => {
    const noteId = await publishNote(author.client, 'rate target');
    const rows = Array.from({ length: 30 }, () => ({
      user_id: voter.id,
      action: 'cast_vote',
    }));
    await admin.from('rate_limit_log').insert(rows);

    const { error } = await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/rate limit/);
  });
});

// ============================================================================
// clear_vote
// ============================================================================

describe('clear_vote', () => {
  test('deletes existing vote and decrements tally', async () => {
    const noteId = await publishNote(author.client, 'clearable');
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    const { error } = await voter.client.rpc('clear_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
    });
    expect(error).toBeNull();

    const { count } = await admin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId);
    expect(count).toBe(0);

    const tally = await getTally(noteId);
    expect(tally).toEqual({ up: 0, down: 0, net: 0 });
  });

  test('no-op when no vote exists', async () => {
    const noteId = await publishNote(author.client, 'never voted');
    const { error } = await voter.client.rpc('clear_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
    });
    expect(error).toBeNull();
  });
});

// ============================================================================
// RLS on votes — authenticated user sees only own rows
// ============================================================================

describe('RLS on votes', () => {
  test('voter only sees their own vote rows, not other voters', async () => {
    const noteId = await publishNote(author.client, 'rls subject');
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    await otherVoter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: -1,
    });

    const { data: asVoter } = await voter.client.from('votes').select('vote_value, user_id');
    expect(asVoter).toHaveLength(1);
    expect(asVoter![0]).toMatchObject({ vote_value: 1, user_id: voter.id });

    const { data: asOther } = await otherVoter.client.from('votes').select('vote_value, user_id');
    expect(asOther).toHaveLength(1);
    expect(asOther![0]).toMatchObject({ vote_value: -1, user_id: otherVoter.id });
  });

  test('anon gets no vote rows at all', async () => {
    const noteId = await publishNote(author.client, 'anon subject');
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    const { createClient } = await import('@supabase/supabase-js');
    const anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
    const { data } = await anonClient.from('votes').select('vote_value');
    expect(data ?? []).toHaveLength(0);
  });
});

// ============================================================================
// Orphan cleanup — deleting a subject clears votes + tally
// ============================================================================

describe('_clear_votes_on_subject_delete', () => {
  test('deleting a performers_note row clears its votes', async () => {
    const noteId = await publishNote(author.client, 'doomed');
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: 1,
    });
    await otherVoter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId,
      p_vote_value: -1,
    });

    // Hard-delete the note via admin (the RPC path soft-statuses to 'removed',
    // which doesn't fire AFTER DELETE). Direct delete mimics piece cascade.
    await admin.from('performers_notes').update({ current_version_id: null }).eq('id', noteId);
    await admin.from('performers_note_versions').delete().eq('note_id', noteId);
    const { error } = await admin.from('performers_notes').delete().eq('id', noteId);
    expect(error).toBeNull();

    const { count } = await admin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId);
    expect(count).toBe(0);

    const tally = await getTally(noteId);
    // _apply_vote_delta fires on each vote DELETE and decrements. After both
    // votes are cleared the tally is back to zero — but the ROW stays at
    // zero (tallies don't self-delete). Either net=0 + zeros, or null if
    // the row was otherwise cleaned — both acceptable states here.
    if (tally !== null) {
      expect(tally).toEqual({ up: 0, down: 0, net: 0 });
    }
  });
});
