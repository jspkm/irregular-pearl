// Post-Slice-B cleanup integration tests.
//
// Verifies Slice B notification polymorphism works after the vestigial narrow
// FK column is dropped by migration 20260426000000. Covered:
//   - submit_performers_note routes through _insert_notification helper.
//   - _clear_notifications_for_note delegates to polymorphic clear.
//   - Per-subject soft-remove trigger still fires (no cross-subject bleed).
//   - Hard-delete trigger still removes orphan notifications.
//   - Idempotency on double-submit is preserved.
//   - Schema shape: subject_table CHECK + polymorphic columns intact.
//
// Previously this file tested the Slice B dual-write window; after the column
// drop those tests are moot. File now tests that the Slice A→B→C migration
// path still resolves Slice A flows correctly.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'slice-b-cleanup-test';

let contributor: Awaited<ReturnType<typeof createAuthUser>>;
let staff: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE, 'Slice B Cleanup Test Piece');
  contributor = await createAuthUser({ isContributor: true, displayName: 'Cleanup Contributor' });
  staff = await createAuthUser({ isStaff: true, displayName: 'Cleanup Staff' });
});

afterAll(async () => {
  await deleteTestPiece(PIECE);
  await deleteAuthUser(contributor.id);
  await deleteAuthUser(staff.id);
});

afterEach(async () => {
  await admin.from('performers_notes').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('performers_note_versions').delete().eq('piece_id', PIECE);
  await admin.from('performers_notes').delete().eq('piece_id', PIECE);
});

async function draftAndSubmit(body: string): Promise<string> {
  const { data: noteId, error: createErr } = await staff.client.rpc('create_performers_note_draft', {
    p_piece_id: PIECE,
    p_contributor_id: contributor.id,
    p_body: body,
  });
  if (createErr) throw new Error(`create draft: ${createErr.message}`);
  const { error: submitErr } = await staff.client.rpc('submit_performers_note', {
    p_note_id: noteId!,
  });
  if (submitErr) throw new Error(`submit: ${submitErr.message}`);
  return noteId!;
}

describe('post-drop Slice A flow still works', () => {
  test('submit_performers_note creates exactly one polymorphic notification', async () => {
    const noteId = await draftAndSubmit('Post-drop submit body.');

    const { data: notif, error } = await admin
      .from('notifications')
      .select('subject_table, subject_id, body, type, cleared_at')
      .eq('subject_id', noteId)
      .single();
    expect(error).toBeNull();
    expect(notif!.subject_table).toBe('performers_notes');
    expect(notif!.subject_id).toBe(noteId);
    expect(notif!.type).toBe('draft_awaiting_approval');
    expect(notif!.cleared_at).toBeNull();
    expect(notif!.body).toContain("A draft performer's note on");
  });

  test('polymorphic query finds the submitted notification', async () => {
    const noteId = await draftAndSubmit('Polymorphic consumer read.');

    const { count, error } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'performers_notes')
      .eq('subject_id', noteId)
      .is('cleared_at', null);
    expect(error).toBeNull();
    expect(count).toBe(1);
  });

  test('retract clears the notification via delegating helper', async () => {
    const noteId = await draftAndSubmit('Retract delegation test.');

    await staff.client.rpc('retract_performers_note', { p_note_id: noteId });

    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId)
      .is('cleared_at', null);
    expect(count).toBe(0);
  });
});

describe('CM3 — notification insert idempotency preserved', () => {
  test('calling submit_performers_note twice produces exactly one live notification', async () => {
    const noteId = await draftAndSubmit('Idempotency test body.');

    // Flip status back to draft so we can exercise the ON CONFLICT DO NOTHING
    // path directly (state machine rejects real double-submit).
    await admin.from('performers_notes').update({ status: 'draft' }).eq('id', noteId);

    const { error } = await staff.client.rpc('submit_performers_note', { p_note_id: noteId });
    expect(error).toBeNull();

    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId)
      .is('cleared_at', null);
    expect(count).toBe(1);
  });

  test('after clearing, a re-submit produces a new live notification', async () => {
    const noteId = await draftAndSubmit('Re-submit after clear.');

    await admin.from('notifications').update({ cleared_at: new Date().toISOString() }).eq('subject_id', noteId);
    await admin.from('performers_notes').update({ status: 'draft' }).eq('id', noteId);

    const { error } = await staff.client.rpc('submit_performers_note', { p_note_id: noteId });
    expect(error).toBeNull();

    const { count: total } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId);
    expect(total).toBe(2);

    const { count: live } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId)
      .is('cleared_at', null);
    expect(live).toBe(1);
  });
});

describe('2A — parameterized soft-remove trigger', () => {
  test('trigger on performers_notes fires only for performers_notes, not cross-subject', async () => {
    const noteId = await draftAndSubmit('Cross-subject isolation.');

    // Insert a fake notification for interpretive_schools with same uuid
    // in subject_id (collision impossible in practice but tests the filter).
    await admin.from('notifications').insert({
      recipient_id: contributor.id,
      type: 'draft_awaiting_approval',
      subject_table: 'interpretive_schools',
      subject_id: noteId,
      body: 'Fake school notification — should NOT be cleared when the note is removed.',
      link_path: '/notifications',
    });

    await admin.from('performers_notes').update({ current_version_id: null, status: 'removed' }).eq('id', noteId);

    const { data: pnNotif } = await admin
      .from('notifications')
      .select('cleared_at')
      .eq('subject_table', 'performers_notes')
      .eq('subject_id', noteId)
      .single();
    expect(pnNotif!.cleared_at).not.toBeNull();

    const { data: schoolNotif } = await admin
      .from('notifications')
      .select('cleared_at')
      .eq('subject_table', 'interpretive_schools')
      .eq('subject_id', noteId)
      .single();
    expect(schoolNotif!.cleared_at).toBeNull();

    await admin.from('notifications').delete().eq('subject_table', 'interpretive_schools').eq('subject_id', noteId);
  });
});

describe('CM2 — hard-delete cleanup trigger', () => {
  test('BEFORE DELETE on performers_notes removes orphan notifications', async () => {
    const noteId = await draftAndSubmit('Hard-delete orphan cleanup.');

    const { count: before } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId);
    expect(before).toBe(1);

    await admin.from('performers_notes').update({ current_version_id: null, status: 'removed' }).eq('id', noteId);
    await admin.from('performers_note_versions').delete().eq('note_id', noteId);
    await admin.from('performers_notes').delete().eq('id', noteId);

    const { count: after } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId);
    expect(after).toBe(0);
  });
});

describe('schema shape — post-drop', () => {
  test('polymorphic notification insert without the dropped narrow FK succeeds', async () => {
    const { error } = await admin.from('notifications').insert({
      recipient_id: contributor.id,
      type: 'draft_awaiting_approval',
      subject_table: 'interpretive_schools',
      subject_id: '00000000-0000-0000-0000-000000000001',
      body: 'Post-drop polymorphic insert test.',
      link_path: '/notifications',
    });
    expect(error).toBeNull();

    await admin
      .from('notifications')
      .delete()
      .eq('subject_id', '00000000-0000-0000-0000-000000000001');
  });

  test('subject_table CHECK rejects unknown values', async () => {
    const { error } = await admin.from('notifications').insert({
      recipient_id: contributor.id,
      type: 'draft_awaiting_approval',
      subject_table: 'bogus_table',
      subject_id: '00000000-0000-0000-0000-000000000002',
      body: 'Bogus subject_table test.',
      link_path: '/notifications',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/subject_table_allowed|check constraint/i);
  });

  test('interpretive_schools metadata_updated_by/at columns exist', async () => {
    const { data: school, error } = await admin
      .from('interpretive_schools')
      .insert({
        piece_id: PIECE,
        contributor_id: contributor.id,
        name: 'Historically informed',
      })
      .select('id, metadata_updated_by, metadata_updated_at')
      .single();
    expect(error).toBeNull();
    expect(school!.id).toBeTruthy();
    expect(school!.metadata_updated_by).toBeNull();
    expect(school!.metadata_updated_at).toBeNull();

    await admin.from('interpretive_schools').delete().eq('id', school!.id);
  });

  test('interpretive_schools.name nonempty CHECK fires', async () => {
    const { error } = await admin.from('interpretive_schools').insert({
      piece_id: PIECE,
      contributor_id: contributor.id,
      name: '   ',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/school_name_nonempty|check constraint/i);
  });
});
