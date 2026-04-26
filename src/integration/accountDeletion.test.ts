// Account deletion integration tests.
//
// Covers the FK behavior shipped in 20260611000000_account_deletion_fk_cascade.sql:
//
//   1. Bylined contributor_id rows (performers_notes + their *_versions
//      trail) cascade-delete with the user.
//   2. Audit *_by columns on rows that survive (because they belong to
//      another contributor) redirect to the "former contributor" sentinel
//      via ON DELETE SET DEFAULT — they do not become NULL.
//   3. Votes the user cast cascade-delete, and the tally trigger reconciles
//      vote_tallies automatically.
//   4. The sentinel user exists at the fixed UUID with the expected
//      display_name.
//
// Uses admin.auth.admin.deleteUser() directly (the same call the
// delete-account edge function makes) so the cascade chain is exercised
// end-to-end.

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const SENTINEL_ID = '00000000-0000-0000-0000-000000000001';
const PIECE = 'account-deletion-test-piece';

beforeAll(async () => {
  await createTestPiece(PIECE, 'Account Deletion Test Piece');
});

afterAll(async () => {
  await admin.from('performers_notes').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('performers_note_versions').delete().eq('piece_id', PIECE);
  await admin.from('performers_notes').delete().eq('piece_id', PIECE);
  await admin.from('vote_tallies').delete().eq('subject_table', 'performers_notes');
  await deleteTestPiece(PIECE);
});

describe('sentinel user', () => {
  test('exists at the fixed UUID with display_name = former contributor', async () => {
    const { data, error } = await admin
      .from('users')
      .select('id, display_name')
      .eq('id', SENTINEL_ID)
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBe(SENTINEL_ID);
    expect(data?.display_name).toBe('former contributor');
  });

  test('survives an unrelated user deletion', async () => {
    const u = await createAuthUser({ displayName: 'Unrelated' });
    await deleteAuthUser(u.id);
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('id', SENTINEL_ID)
      .single();
    expect(data?.id).toBe(SENTINEL_ID);
  });
});

describe('bylined content cascade-deletes with the user', () => {
  test('publish_contributor_note row + version chain disappear', async () => {
    const owner = await createAuthUser({ displayName: 'Byline Owner' });
    const { data: noteId, error: pubErr } = await owner.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'A note that should disappear when the user deletes their account.',
    });
    expect(pubErr).toBeNull();
    expect(noteId).toBeTruthy();

    const { data: noteBefore } = await admin
      .from('performers_notes')
      .select('id')
      .eq('id', noteId as string)
      .single();
    const { data: versionsBefore } = await admin
      .from('performers_note_versions')
      .select('id')
      .eq('note_id', noteId as string);
    expect(noteBefore?.id).toBe(noteId as string);
    expect((versionsBefore?.length ?? 0)).toBeGreaterThan(0);

    await deleteAuthUser(owner.id);

    const { data: noteAfter } = await admin
      .from('performers_notes')
      .select('id')
      .eq('id', noteId as string)
      .maybeSingle();
    const { data: versionsAfter } = await admin
      .from('performers_note_versions')
      .select('id')
      .eq('note_id', noteId as string);
    expect(noteAfter).toBeNull();
    expect(versionsAfter?.length ?? 0).toBe(0);
  });
});

describe('votes the user cast cascade-delete and tally reconciles', () => {
  test('voter delete decrements net_score on the surviving subject', async () => {
    const owner = await createAuthUser({ displayName: 'Note Owner' });
    const voter = await createAuthUser({ displayName: 'Voter' });

    const { data: noteId } = await owner.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'A note that survives while the voter goes away.',
    });
    expect(noteId).toBeTruthy();

    const { error: voteErr } = await voter.client.rpc('cast_vote', {
      p_subject_table: 'performers_notes',
      p_subject_id: noteId as string,
      p_vote_value: 1,
    });
    expect(voteErr).toBeNull();

    const { data: tallyBefore } = await admin
      .from('vote_tallies')
      .select('up_count, net_score')
      .eq('subject_table', 'performers_notes')
      .eq('subject_id', noteId as string)
      .single();
    expect(tallyBefore?.up_count).toBe(1);
    expect(tallyBefore?.net_score).toBe(1);

    await deleteAuthUser(voter.id);

    const { data: tallyAfter } = await admin
      .from('vote_tallies')
      .select('up_count, net_score')
      .eq('subject_table', 'performers_notes')
      .eq('subject_id', noteId as string)
      .single();
    expect(tallyAfter?.up_count).toBe(0);
    expect(tallyAfter?.net_score).toBe(0);

    const { data: noteAfter } = await admin
      .from('performers_notes')
      .select('id')
      .eq('id', noteId as string)
      .single();
    expect(noteAfter?.id).toBe(noteId as string);

    await deleteAuthUser(owner.id);
  });
});

describe('audit *_by columns redirect to former contributor sentinel', () => {
  // Direct-insert a performers_notes row where drafted_by != contributor_id
  // (the staff-drafted-for-contributor pattern). Then delete the staff
  // user and assert drafted_by ended up at the sentinel, while
  // contributor_id (the byline owner) is unaffected and the row stays.
  test('drafted_by on a surviving note redirects to the sentinel when staff deletes', async () => {
    const owner = await createAuthUser({ displayName: 'Byline Owner' });
    const staff = await createAuthUser({ isStaff: true, displayName: 'Staff' });

    const { data: noteId } = await owner.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'Note authored by owner; drafted_by patched to staff for the test.',
    });
    expect(noteId).toBeTruthy();

    // Backfill drafted_by to staff so the FK behavior on staff deletion
    // has something to redirect.
    const { error: patchErr } = await admin
      .from('performers_notes')
      .update({ drafted_by: staff.id })
      .eq('id', noteId as string);
    expect(patchErr).toBeNull();

    const { data: before } = await admin
      .from('performers_notes')
      .select('drafted_by, contributor_id')
      .eq('id', noteId as string)
      .single();
    expect(before?.drafted_by).toBe(staff.id);
    expect(before?.contributor_id).toBe(owner.id);

    await deleteAuthUser(staff.id);

    const { data: after } = await admin
      .from('performers_notes')
      .select('drafted_by, contributor_id, id')
      .eq('id', noteId as string)
      .single();
    expect(after?.id).toBe(noteId as string);          // row survived
    expect(after?.drafted_by).toBe(SENTINEL_ID);       // attribution redirected
    expect(after?.contributor_id).toBe(owner.id);      // byline untouched

    await deleteAuthUser(owner.id);
  });

  test('version row authored_by redirects to the sentinel on actor deletion', async () => {
    // Same approach for the version table: direct-patch authored_by to a
    // non-byline-owner, delete that user, assert SET DEFAULT redirected.
    const owner = await createAuthUser({ displayName: 'Byline Owner v2' });
    const editor = await createAuthUser({ displayName: 'Editor' });

    const { data: noteId } = await owner.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'Note whose version row authored_by we re-attribute to editor.',
    });
    expect(noteId).toBeTruthy();

    const { data: versions } = await admin
      .from('performers_note_versions')
      .select('id, authored_by')
      .eq('note_id', noteId as string);
    expect((versions?.length ?? 0)).toBeGreaterThan(0);
    const versionId = versions![0]!.id;

    const { error: patchErr } = await admin
      .from('performers_note_versions')
      .update({ authored_by: editor.id })
      .eq('id', versionId);
    expect(patchErr).toBeNull();

    await deleteAuthUser(editor.id);

    const { data: rechecked } = await admin
      .from('performers_note_versions')
      .select('authored_by, contributor_id')
      .eq('id', versionId)
      .single();
    expect(rechecked?.authored_by).toBe(SENTINEL_ID);
    expect(rechecked?.contributor_id).toBe(owner.id);

    await deleteAuthUser(owner.id);
  });
});
