// Slice B Step 1 integration tests.
//
// Verifies the additive polymorphic pivot, the Slice A dual-write, idempotency
// on notification inserts, and the per-subject trigger behavior (soft-remove
// AFTER UPDATE + hard-delete BEFORE DELETE).
//
// These are the iron-rule regression tests for Step 1: Slice A must keep
// working unchanged after the pivot.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'slice-b-step1-test';

let contributor: Awaited<ReturnType<typeof createAuthUser>>;
let staff: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE, 'Slice B Step 1 Test Piece');
  contributor = await createAuthUser({ isContributor: true, displayName: 'Slice B Contributor' });
  staff = await createAuthUser({ isStaff: true, displayName: 'Slice B Staff' });
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

describe('CM1 — Slice A dual-write during vestigial window', () => {
  test('submit_performers_note populates BOTH performers_note_id AND (subject_table, subject_id)', async () => {
    const noteId = await draftAndSubmit('Dual-write body.');

    const { data: notif, error } = await admin
      .from('notifications')
      .select('performers_note_id, subject_table, subject_id, body')
      .eq('subject_id', noteId)
      .single();
    expect(error).toBeNull();
    expect(notif!.performers_note_id).toBe(noteId);
    expect(notif!.subject_table).toBe('performers_notes');
    expect(notif!.subject_id).toBe(noteId);
    expect(notif!.body).toContain("A draft performer's note on");
  });

  test('Slice A queue query (by performers_note_id) still finds the notification', async () => {
    const noteId = await draftAndSubmit('Slice A consumer regression.');

    // Simulates the pre-refactor Slice A consumer that reads performers_note_id.
    const { count, error } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('performers_note_id', noteId)
      .is('cleared_at', null);
    expect(error).toBeNull();
    expect(count).toBe(1);
  });

  test('New-style queue query (by subject_table + subject_id) finds the same notification', async () => {
    const noteId = await draftAndSubmit('New-style consumer.');

    const { count, error } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'performers_notes')
      .eq('subject_id', noteId)
      .is('cleared_at', null);
    expect(error).toBeNull();
    expect(count).toBe(1);
  });
});

describe('CM3 — notification insert idempotency', () => {
  test('calling submit_performers_note twice produces exactly one live notification', async () => {
    const noteId = await draftAndSubmit('Idempotency test body.');

    // Manually flip status back to draft so we can call submit again (the
    // state machine rejects double-submit on its own, so we're testing the
    // ON CONFLICT DO NOTHING path directly by forcing the state).
    await admin.from('performers_notes').update({ status: 'draft' }).eq('id', noteId);

    // Call submit a second time; should not create a duplicate notification.
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

    // Clear the notification.
    await admin.from('notifications').update({ cleared_at: new Date().toISOString() }).eq('subject_id', noteId);

    // Flip status back to draft and re-submit.
    await admin.from('performers_notes').update({ status: 'draft' }).eq('id', noteId);
    const { error } = await staff.client.rpc('submit_performers_note', { p_note_id: noteId });
    expect(error).toBeNull();

    // Now two notifications exist: the cleared one + the new live one.
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
      subject_id: noteId, // intentionally same id to prove the filter discriminates
      body: 'Fake school notification — should NOT be cleared when the note is removed.',
      link_path: '/notifications',
    });

    // Remove the note (status='removed' triggers the soft-remove).
    await admin.from('performers_notes').update({ current_version_id: null, status: 'removed' }).eq('id', noteId);

    // The performers_notes notification should be cleared.
    const { data: pnNotif } = await admin
      .from('notifications')
      .select('cleared_at')
      .eq('subject_table', 'performers_notes')
      .eq('subject_id', noteId)
      .single();
    expect(pnNotif!.cleared_at).not.toBeNull();

    // The interpretive_schools notification MUST still be live.
    const { data: schoolNotif } = await admin
      .from('notifications')
      .select('cleared_at')
      .eq('subject_table', 'interpretive_schools')
      .eq('subject_id', noteId)
      .single();
    expect(schoolNotif!.cleared_at).toBeNull();

    // Cleanup.
    await admin.from('notifications').delete().eq('subject_table', 'interpretive_schools').eq('subject_id', noteId);
  });
});

describe('CM2 — hard-delete cleanup trigger', () => {
  test('BEFORE DELETE on performers_notes removes orphan notifications', async () => {
    const noteId = await draftAndSubmit('Hard-delete orphan cleanup.');

    // Verify the live notification exists before delete.
    const { count: before } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId);
    expect(before).toBe(1);

    // Hard-delete the note (simulates cascade from a piece hard-delete or
    // test cleanup code). Null the current_version_id first so the composite
    // FK allows delete, then drop the version rows.
    await admin.from('performers_notes').update({ current_version_id: null, status: 'removed' }).eq('id', noteId);
    await admin.from('performers_note_versions').delete().eq('note_id', noteId);
    await admin.from('performers_notes').delete().eq('id', noteId);

    // The notification should have been removed by the BEFORE DELETE trigger.
    const { count: after } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', noteId);
    expect(after).toBe(0);
  });
});

describe('schema shape', () => {
  test('notifications.performers_note_id is now nullable', async () => {
    // Try to insert a notification with NULL performers_note_id and populated
    // polymorphic columns (what the new subject-type RPCs will do in Step 2).
    const { error } = await admin.from('notifications').insert({
      recipient_id: contributor.id,
      type: 'draft_awaiting_approval',
      performers_note_id: null,
      subject_table: 'interpretive_schools',
      subject_id: '00000000-0000-0000-0000-000000000001',
      body: 'Nullable-perf-note-id test.',
      link_path: '/notifications',
    });
    expect(error).toBeNull();

    // Cleanup.
    await admin
      .from('notifications')
      .delete()
      .eq('subject_id', '00000000-0000-0000-0000-000000000001');
  });

  test('subject_table CHECK rejects unknown values', async () => {
    const { error } = await admin.from('notifications').insert({
      recipient_id: contributor.id,
      type: 'draft_awaiting_approval',
      performers_note_id: null,
      subject_table: 'bogus_table',
      subject_id: '00000000-0000-0000-0000-000000000002',
      body: 'Bogus subject_table test.',
      link_path: '/notifications',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/subject_table_allowed|check constraint/i);
  });

  test('interpretive_schools metadata_updated_by/at columns exist', async () => {
    // Smoke test: schema introspection via direct insert with metadata fields.
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

    // Cleanup.
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
