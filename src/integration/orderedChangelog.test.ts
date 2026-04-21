// Integration tests for two cross-cutting read surfaces:
//   - fetch_ordered_subjects(subject_table, ids[]) — orders IDs by
//     vote_tallies.net_score DESC without leaking counts.
//   - fetch_piece_changelog(piece_id) — subject-agnostic UNION across
//     versioned tables + content_mutation_log.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'ordered-changelog-test';

let author: Awaited<ReturnType<typeof createAuthUser>>;
let voter: Awaited<ReturnType<typeof createAuthUser>>;

async function clearPiece(): Promise<void> {
  await admin.from('content_mutation_log').delete().eq('piece_id', PIECE);
  await admin.from('vote_tallies').delete().eq('subject_table', 'performers_notes');
  await admin.from('votes').delete().eq('subject_table', 'performers_notes');
  await admin.from('performers_notes').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('performers_note_versions').delete().eq('piece_id', PIECE);
  await admin.from('performers_notes').delete().eq('piece_id', PIECE);
  await admin.from('movements').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('movement_versions').delete().eq('piece_id', PIECE);
  await admin.from('movements').delete().eq('piece_id', PIECE);
  await admin.from('editions').delete().eq('piece_id', PIECE);
  await admin.from('rate_limit_log').delete().eq('user_id', author.id);
  await admin.from('rate_limit_log').delete().eq('user_id', voter.id);
}

beforeAll(async () => {
  await createTestPiece(PIECE, 'Ordered + Changelog Test');
  author = await createAuthUser({ isContributor: true, displayName: 'Ordered Author' });
  voter = await createAuthUser({ displayName: 'Ordered Voter' });
});

afterAll(async () => {
  await clearPiece();
  await deleteAuthUser(author.id);
  await deleteAuthUser(voter.id);
  await deleteTestPiece(PIECE);
});

afterEach(async () => {
  await clearPiece();
});

// ============================================================================
// fetch_ordered_subjects
// ============================================================================

describe('fetch_ordered_subjects', () => {
  test('orders IDs by net_score DESC with stable id tie-break', async () => {
    const { data: n1 } = await author.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE, p_body: 'note one',
    });
    const { data: n2 } = await author.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE, p_body: 'note two',
    });
    const { data: n3 } = await author.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE, p_body: 'note three',
    });

    // Vote n2 up, leave n1 + n3 at 0.
    await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes', p_subject_id: n2, p_vote_value: 1,
    });

    const { data: ordered, error } = await voter.client.rpc('fetch_ordered_subjects', {
      p_subject_table: 'performers_notes',
      p_subject_ids: [n1, n2, n3],
    });
    expect(error).toBeNull();
    expect(ordered).toHaveLength(3);
    // n2 (net_score=1) must come first. n1 / n3 follow in id ASC order.
    expect(ordered![0]).toBe(n2);
    const [first, ...rest] = ordered as string[];
    expect(first).toBe(n2);
    expect([...rest].sort()).toEqual([n1, n3].sort());
  });

  test('returns empty array for empty id list', async () => {
    const { data, error } = await voter.client.rpc('fetch_ordered_subjects', {
      p_subject_table: 'performers_notes', p_subject_ids: [],
    });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test('preserves input IDs even when they have no vote_tallies row', async () => {
    const { data: n1 } = await author.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE, p_body: 'a',
    });
    const { data: n2 } = await author.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE, p_body: 'b',
    });
    const { data: ordered } = await voter.client.rpc('fetch_ordered_subjects', {
      p_subject_table: 'performers_notes', p_subject_ids: [n1, n2],
    });
    expect(ordered).toHaveLength(2);
    expect([...(ordered as string[])].sort()).toEqual([n1, n2].sort());
  });
});

// ============================================================================
// fetch_piece_changelog — UNION across sources
// ============================================================================

describe('fetch_piece_changelog', () => {
  test('returns movement edits, performer note publishes, and edition adds unified', async () => {
    // Movement
    const mvId = await createMovement();
    // Performer's note (versioned subject)
    const { data: noteId } = await author.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE, p_body: 'a note',
    });
    // Edition (non-versioned, via content_mutation_log)
    const { data: edId } = await author.client.rpc('create_edition', {
      p_piece_id: PIECE, p_publisher: 'Henle', p_editor: '', p_year: null,
      p_description: '', p_type: null, p_url: null,
    });

    const { data: rows, error } = await voter.client.rpc('fetch_piece_changelog', {
      p_piece_id: PIECE,
    });
    expect(error).toBeNull();
    expect(rows!.length).toBeGreaterThanOrEqual(3);

    const types = new Set(rows!.map((r: any) => r.subject_type));
    expect(types.has('movement')).toBe(true);
    expect(types.has("performer's note")).toBe(true);
    expect(types.has('edition')).toBe(true);

    const mvRow = rows!.find((r: any) => r.subject_id === mvId);
    expect(mvRow).toBeTruthy();
    expect(mvRow!.edit_summary).toBe('created');

    const noteRow = rows!.find((r: any) => r.subject_id === noteId);
    expect(noteRow).toBeTruthy();
    expect(noteRow!.edit_summary).toBe('published');

    const edRow = rows!.find((r: any) => r.subject_id === edId);
    expect(edRow).toBeTruthy();
    expect(edRow!.edit_summary).toBe('added');
    expect(edRow!.subject_label).toMatch(/Henle/);
  });

  test('soft-removed performer note emits a "removed" entry alongside version entries', async () => {
    const { data: noteId } = await author.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE, p_body: 'to be removed',
    });
    await author.client.rpc('remove_performers_note', { p_note_id: noteId });

    const { data: rows } = await voter.client.rpc('fetch_piece_changelog', {
      p_piece_id: PIECE,
    });
    const forNote = rows!.filter((r: any) => r.subject_id === noteId);
    expect(forNote.map((r: any) => r.edit_summary)).toContain('published');
    expect(forNote.map((r: any) => r.edit_summary)).toContain('removed');
  });

  test('ordered DESC by created_at', async () => {
    await createMovement('First');
    await new Promise((r) => setTimeout(r, 10));
    await createMovement('Second');

    const { data: rows } = await voter.client.rpc('fetch_piece_changelog', {
      p_piece_id: PIECE,
    });
    const labels = rows!
      .filter((r: any) => r.subject_type === 'movement')
      .map((r: any) => r.subject_label);
    expect(labels[0]).toBe('Second'); // most recent first
    expect(labels[labels.length - 1]).toBe('First');
  });
});

async function createMovement(name: string = 'Test mvmt'): Promise<string> {
  const { data, error } = await author.client.rpc('create_movement', {
    p_piece_id: PIECE, p_name: name,
  });
  if (error) throw new Error(`create_movement: ${error.message}`);
  return data as string;
}
