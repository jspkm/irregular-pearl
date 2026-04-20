// State-machine integration tests for the contributor approval pipeline
// RPCs. Exercises every legal transition and a representative set of
// forbidden transitions, on both the contributor-authored and staff-drafted
// paths, against a real local Supabase stack.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
  countNotifications,
} from './helpers';

const PIECE = 'contrib-pipeline-test';

let contributor: Awaited<ReturnType<typeof createAuthUser>>;
let otherContributor: Awaited<ReturnType<typeof createAuthUser>>;
let staff: Awaited<ReturnType<typeof createAuthUser>>;
let normalUser: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE, 'Contributor Pipeline Test Piece');
  contributor = await createAuthUser({ isContributor: true, displayName: 'Test Contributor' });
  otherContributor = await createAuthUser({ isContributor: true, displayName: 'Other Contributor' });
  staff = await createAuthUser({ isStaff: true, displayName: 'Test Staff' });
  normalUser = await createAuthUser({ displayName: 'Test Normal User' });
});

afterAll(async () => {
  await deleteTestPiece(PIECE);
  await deleteAuthUser(contributor.id);
  await deleteAuthUser(otherContributor.id);
  await deleteAuthUser(staff.id);
  await deleteAuthUser(normalUser.id);
});

afterEach(async () => {
  // Each test creates notes against the same piece; clean between tests.
  await admin.from('performers_notes').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('performers_note_versions').delete().eq('piece_id', PIECE);
  await admin.from('performers_notes').delete().eq('piece_id', PIECE);
});

describe('contributor-authored path', () => {
  test('publish_contributor_note creates + publishes atomically, no notification', async () => {
    const { data: noteId, error } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'The prelude asks for bow speed more than articulation.',
    });
    expect(error).toBeNull();
    expect(noteId).toBeTruthy();

    const { data: note } = await admin
      .from('performers_notes')
      .select('status, drafted_by, approved_by, current_version_id')
      .eq('id', noteId!)
      .single();
    expect(note!.status).toBe('published');
    expect(note!.drafted_by).toBeNull();
    expect(note!.approved_by).toBe(contributor.id);
    expect(note!.current_version_id).toBeTruthy();

    const { data: versions } = await admin
      .from('performers_note_versions')
      .select('version_number, approved_at, authored_by')
      .eq('note_id', noteId!);
    expect(versions!.length).toBe(1);
    expect(versions![0].version_number).toBe(1);
    expect(versions![0].approved_at).not.toBeNull();
    expect(versions![0].authored_by).toBe(contributor.id);

    expect(await countNotifications(noteId!)).toBe(0);
  });

  test('publish_contributor_edit advances current_version_id, no notification', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'v1 body',
    });
    const { data: v2Id, error } = await contributor.client.rpc('publish_contributor_edit', {
      p_note_id: noteId!,
      p_body: 'v2 body',
    });
    expect(error).toBeNull();

    const { data: note } = await admin
      .from('performers_notes')
      .select('status, current_version_id')
      .eq('id', noteId!)
      .single();
    expect(note!.status).toBe('published');
    expect(note!.current_version_id).toBe(v2Id);

    const { data: versions } = await admin
      .from('performers_note_versions')
      .select('version_number, body, approved_at')
      .eq('note_id', noteId!)
      .order('version_number');
    expect(versions!.length).toBe(2);
    expect(versions![1].version_number).toBe(2);
    expect(versions![1].body).toBe('v2 body');
    expect(versions![1].approved_at).not.toBeNull();

    expect(await countNotifications(noteId!)).toBe(0);
  });

  test('remove_performers_note soft-removes, sets removed_by', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'to be removed',
    });
    const { error } = await contributor.client.rpc('remove_performers_note', { p_note_id: noteId! });
    expect(error).toBeNull();

    const { data: note } = await admin
      .from('performers_notes')
      .select('status, removed_by, removed_at')
      .eq('id', noteId!)
      .single();
    expect(note!.status).toBe('removed');
    expect(note!.removed_by).toBe(contributor.id);
    expect(note!.removed_at).not.toBeNull();
  });
});

describe('staff-drafted path', () => {
  test('create + submit + approve lifecycle', async () => {
    const { data: noteId, error: createErr } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'Staff draft body',
    });
    expect(createErr).toBeNull();

    const { data: afterCreate } = await admin
      .from('performers_notes')
      .select('status, drafted_by')
      .eq('id', noteId!)
      .single();
    expect(afterCreate!.status).toBe('draft');
    expect(afterCreate!.drafted_by).toBe(staff.id);

    const { error: submitErr } = await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });
    expect(submitErr).toBeNull();

    const { data: afterSubmit } = await admin
      .from('performers_notes')
      .select('status, submitted_by')
      .eq('id', noteId!)
      .single();
    expect(afterSubmit!.status).toBe('awaiting_contributor_approval');
    expect(afterSubmit!.submitted_by).toBe(staff.id);
    expect(await countNotifications(noteId!, { onlyUncleared: true })).toBe(1);

    const { error: approveErr } = await contributor.client.rpc('approve_performers_note', { p_note_id: noteId! });
    expect(approveErr).toBeNull();

    const { data: afterApprove } = await admin
      .from('performers_notes')
      .select('status, approved_by, current_version_id')
      .eq('id', noteId!)
      .single();
    expect(afterApprove!.status).toBe('published');
    expect(afterApprove!.approved_by).toBe(contributor.id);
    expect(afterApprove!.current_version_id).toBeTruthy();
    expect(await countNotifications(noteId!, { onlyUncleared: true })).toBe(0);
  });

  test('reject loop: reject with reason, staff revises, approve', async () => {
    const { data: noteId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'First draft',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });
    await contributor.client.rpc('reject_performers_note', {
      p_note_id: noteId!,
      p_reason: 'Too prescriptive.',
    });

    const { data: v1 } = await admin
      .from('performers_note_versions')
      .select('rejection_note, approved_at')
      .eq('note_id', noteId!)
      .single();
    expect(v1!.rejection_note).toBe('Too prescriptive.');
    expect(v1!.approved_at).toBeNull();
    expect(await countNotifications(noteId!, { onlyUncleared: true })).toBe(0);

    await staff.client.rpc('update_performers_note_draft', { p_note_id: noteId!, p_body: 'Revised draft' });
    const { data: versions } = await admin
      .from('performers_note_versions')
      .select('version_number, body, rejection_note')
      .eq('note_id', noteId!)
      .order('version_number');
    expect(versions!.length).toBe(2);
    expect(versions![0].rejection_note).toBe('Too prescriptive.'); // preserved on v1
    expect(versions![1].body).toBe('Revised draft');

    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });
    await contributor.client.rpc('approve_performers_note', { p_note_id: noteId! });

    const { data: final } = await admin
      .from('performers_notes')
      .select('status, current_version_id')
      .eq('id', noteId!)
      .single();
    expect(final!.status).toBe('published');
    // current should be v2
    const { data: currentVersion } = await admin
      .from('performers_note_versions')
      .select('version_number')
      .eq('id', final!.current_version_id!)
      .single();
    expect(currentVersion!.version_number).toBe(2);
  });

  test('approve_and_edit publishes contributor body as new version', async () => {
    const { data: noteId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'Staff wording',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });

    const { data: v2Id, error } = await contributor.client.rpc('approve_and_edit_performers_note', {
      p_note_id: noteId!,
      p_body: 'Contributor edited wording',
    });
    expect(error).toBeNull();

    const { data: note } = await admin
      .from('performers_notes')
      .select('status, current_version_id')
      .eq('id', noteId!)
      .single();
    expect(note!.status).toBe('published');
    expect(note!.current_version_id).toBe(v2Id);

    const { data: v2 } = await admin
      .from('performers_note_versions')
      .select('body, authored_by, approved_at')
      .eq('id', v2Id!)
      .single();
    expect(v2!.body).toBe('Contributor edited wording');
    expect(v2!.authored_by).toBe(contributor.id);
    expect(v2!.approved_at).not.toBeNull();

    expect(await countNotifications(noteId!, { onlyUncleared: true })).toBe(0);
  });

  test('staff retract clears notification, sets retracted_by', async () => {
    const { data: noteId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'To retract',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });
    expect(await countNotifications(noteId!, { onlyUncleared: true })).toBe(1);

    const { error } = await staff.client.rpc('retract_performers_note', { p_note_id: noteId! });
    expect(error).toBeNull();

    const { data: note } = await admin
      .from('performers_notes')
      .select('status, retracted_by, retracted_at')
      .eq('id', noteId!)
      .single();
    expect(note!.status).toBe('draft');
    expect(note!.retracted_by).toBe(staff.id);
    expect(note!.retracted_at).not.toBeNull();
    expect(await countNotifications(noteId!, { onlyUncleared: true })).toBe(0);
  });
});

describe('forbidden transitions', () => {
  test('non-contributor cannot call publish_contributor_note', async () => {
    const { error } = await normalUser.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'should fail',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toContain('not an active contributor');
  });

  test('non-staff cannot call create_performers_note_draft', async () => {
    const { error } = await contributor.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'should fail',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toContain('not staff');
  });

  test('contributor cannot approve another contributor\'s draft', async () => {
    const { data: noteId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'target draft',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });

    const { error } = await otherContributor.client.rpc('approve_performers_note', { p_note_id: noteId! });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not owned by caller/i);
  });

  test('cannot approve a note not in awaiting state', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'already published',
    });
    const { error } = await contributor.client.rpc('approve_performers_note', { p_note_id: noteId! });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/pending version|awaiting|submitted/i);
  });

  test('cannot retract a published note', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'already published',
    });
    const { error } = await staff.client.rpc('retract_performers_note', { p_note_id: noteId! });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/submitted draft/i);
  });

  test('publish_contributor_edit on non-owned note fails', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'owner body',
    });
    const { error } = await otherContributor.client.rpc('publish_contributor_edit', {
      p_note_id: noteId!,
      p_body: 'hijack',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not owned by caller/i);
  });

  test('publish_contributor_note requires non-empty body', async () => {
    const { error } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: '   ',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toContain('body required');
  });
});
