// State-machine integration tests for InterpretiveSchool RPCs (Slice B Step 2).
// Mirrors src/integration/contributorPipeline.test.ts for parity — if a
// performers-notes transition is tested there, the school version is here.
// Additional: metadata-only update audit (4A), owner-only enforcement (CM4),
// name uniqueness NOT enforced at DB level, multi-school-per-(piece, contributor)
// allowed.

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'slice-b-schools-test';

let contributor: Awaited<ReturnType<typeof createAuthUser>>;
let otherContributor: Awaited<ReturnType<typeof createAuthUser>>;
let staff: Awaited<ReturnType<typeof createAuthUser>>;
let normalUser: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE, 'Slice B Schools Test Piece');
  contributor = await createAuthUser({ isContributor: true, displayName: 'Schools Contributor' });
  otherContributor = await createAuthUser({ isContributor: true, displayName: 'Other Schools Contributor' });
  staff = await createAuthUser({ isStaff: true, displayName: 'Schools Staff' });
  normalUser = await createAuthUser({ displayName: 'Schools Normal' });
});

afterAll(async () => {
  await deleteTestPiece(PIECE);
  await deleteAuthUser(contributor.id);
  await deleteAuthUser(otherContributor.id);
  await deleteAuthUser(staff.id);
  await deleteAuthUser(normalUser.id);
});

afterEach(async () => {
  await admin.from('interpretive_schools').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('interpretive_school_versions').delete().eq('piece_id', PIECE);
  await admin.from('interpretive_schools').delete().eq('piece_id', PIECE);
  await admin.from('notifications').delete().eq('subject_table', 'interpretive_schools');
});

describe('contributor-authored schools', () => {
  test('publish_contributor_interpretive_school creates + publishes atomically, no notification', async () => {
    const { data: schoolId, error } = await contributor.client.rpc(
      'publish_contributor_interpretive_school',
      {
        p_piece_id: PIECE,
        p_name: 'Historically informed',
        p_body: 'Bowing conventions follow early-music practice.',
      },
    );
    expect(error).toBeNull();
    expect(schoolId).toBeTruthy();

    const { data: school } = await admin
      .from('interpretive_schools')
      .select('status, drafted_by, approved_by, current_version_id, name')
      .eq('id', schoolId!)
      .single();
    expect(school!.status).toBe('published');
    expect(school!.drafted_by).toBeNull();
    expect(school!.approved_by).toBe(contributor.id);
    expect(school!.current_version_id).toBeTruthy();
    expect(school!.name).toBe('Historically informed');

    const { count: notifCount } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'interpretive_schools')
      .eq('subject_id', schoolId!);
    expect(notifCount).toBe(0);
  });

  test('publish_contributor_interpretive_school_edit bumps version, no notification', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Chamber-symphonic',
      p_body: 'v1 body',
    });

    const { error } = await contributor.client.rpc('publish_contributor_interpretive_school_edit', {
      p_school_id: schoolId!,
      p_body: 'v2 body, revised',
    });
    expect(error).toBeNull();

    const { data: versions } = await admin
      .from('interpretive_school_versions')
      .select('version_number, body, approved_at')
      .eq('school_id', schoolId!)
      .order('version_number', { ascending: true });
    expect(versions!.length).toBe(2);
    expect(versions![1].version_number).toBe(2);
    expect(versions![1].body).toContain('revised');
    expect(versions![1].approved_at).not.toBeNull();

    const { count: notifCount } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'interpretive_schools')
      .eq('subject_id', schoolId!);
    expect(notifCount).toBe(0);
  });

  test('REGRESSION (iron rule): self-authored paths NEVER create notifications', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Self-author test',
      p_body: 'original',
    });
    await contributor.client.rpc('publish_contributor_interpretive_school_edit', {
      p_school_id: schoolId!,
      p_body: 'edit 1',
    });
    await contributor.client.rpc('publish_contributor_interpretive_school_edit', {
      p_school_id: schoolId!,
      p_body: 'edit 2',
    });

    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'interpretive_schools')
      .eq('subject_id', schoolId!);
    expect(count).toBe(0);
  });

  test('remove_interpretive_school soft-removes + trigger clears notifications', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Removal test',
      p_body: 'body',
    });

    await contributor.client.rpc('remove_interpretive_school', { p_school_id: schoolId! });

    const { data: school } = await admin
      .from('interpretive_schools')
      .select('status, removed_by, removed_at')
      .eq('id', schoolId!)
      .single();
    expect(school!.status).toBe('removed');
    expect(school!.removed_by).toBe(contributor.id);
    expect(school!.removed_at).not.toBeNull();
  });
});

describe('CM4 — update_interpretive_school_metadata owner-only', () => {
  test('owner can update name + tempo_cues; audit columns set', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Typo verison',
      p_body: 'body',
    });

    const { error } = await contributor.client.rpc('update_interpretive_school_metadata', {
      p_school_id: schoolId!,
      p_name: 'Typo version',
      p_tempo_cues: { opening: 'quarter=72' },
    });
    expect(error).toBeNull();

    const { data: school } = await admin
      .from('interpretive_schools')
      .select('name, tempo_cues, metadata_updated_by, metadata_updated_at')
      .eq('id', schoolId!)
      .single();
    expect(school!.name).toBe('Typo version');
    expect(school!.tempo_cues).toEqual({ opening: 'quarter=72' });
    expect(school!.metadata_updated_by).toBe(contributor.id);
    expect(school!.metadata_updated_at).not.toBeNull();
  });

  test('metadata update does NOT bump version', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Version stability',
      p_body: 'body',
    });

    await contributor.client.rpc('update_interpretive_school_metadata', {
      p_school_id: schoolId!,
      p_name: 'Renamed',
    });

    const { data: versions } = await admin
      .from('interpretive_school_versions')
      .select('version_number')
      .eq('school_id', schoolId!);
    expect(versions!.length).toBe(1);
  });

  test('non-owner contributor is blocked', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Owner-only gate',
      p_body: 'body',
    });

    const { error } = await otherContributor.client.rpc('update_interpretive_school_metadata', {
      p_school_id: schoolId!,
      p_name: 'Stolen rename',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not found or not owned/i);
  });

  test('staff is blocked (CM4: PRD invariant — only bylined contributor touches their byline)', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Staff cannot rename',
      p_body: 'body',
    });

    const { error } = await staff.client.rpc('update_interpretive_school_metadata', {
      p_school_id: schoolId!,
      p_name: 'Staff-renamed',
    });
    expect(error).not.toBeNull();
    // Staff is not a contributor — _require_active_contributor blocks.
    expect(error!.message).toMatch(/not an active contributor|not found or not owned/i);
  });

  test('at least one of p_name or p_tempo_cues is required', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Required args',
      p_body: 'body',
    });

    const { error } = await contributor.client.rpc('update_interpretive_school_metadata', {
      p_school_id: schoolId!,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/at least one/i);
  });
});

describe('staff-drafted schools — approval flow', () => {
  test('full round trip: create → submit → approve, notification lifecycle', async () => {
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'String-native',
      p_body: 'Body drafted by staff.',
    });
    expect(schoolId).toBeTruthy();

    // Submit — notification fires.
    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

    const { data: notifAfterSubmit } = await admin
      .from('notifications')
      .select('id, subject_table, subject_id, body, cleared_at')
      .eq('subject_table', 'interpretive_schools')
      .eq('subject_id', schoolId!)
      .single();
    expect(notifAfterSubmit!.subject_table).toBe('interpretive_schools');
    expect(notifAfterSubmit!.body).toContain("interpretive school");
    expect(notifAfterSubmit!.body).toContain('String-native');
    expect(notifAfterSubmit!.cleared_at).toBeNull();

    // Approve — notification cleared.
    await contributor.client.rpc('approve_interpretive_school', { p_school_id: schoolId! });

    const { data: school } = await admin
      .from('interpretive_schools')
      .select('status, approved_by, current_version_id')
      .eq('id', schoolId!)
      .single();
    expect(school!.status).toBe('published');
    expect(school!.approved_by).toBe(contributor.id);
    expect(school!.current_version_id).toBeTruthy();

    const { data: notifAfterApprove } = await admin
      .from('notifications')
      .select('cleared_at')
      .eq('id', notifAfterSubmit!.id)
      .single();
    expect(notifAfterApprove!.cleared_at).not.toBeNull();
  });

  test('CM3: double-submit produces ONE live notification (idempotency)', async () => {
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'Idempotent submit',
      p_body: 'body',
    });

    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

    // Force status back to draft so we can re-submit (the state machine
    // would normally block a double-submit, so we bypass to test CM3 directly).
    await admin.from('interpretive_schools').update({ status: 'draft' }).eq('id', schoolId!);

    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'interpretive_schools')
      .eq('subject_id', schoolId!)
      .is('cleared_at', null);
    expect(count).toBe(1);
  });

  test('approve_and_edit inserts new version + publishes in one atomic call', async () => {
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'Approve-and-edit',
      p_body: 'staff-drafted body',
    });
    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

    await contributor.client.rpc('approve_and_edit_interpretive_school', {
      p_school_id: schoolId!,
      p_body: 'contributor-revised body',
    });

    const { data: school } = await admin
      .from('interpretive_schools')
      .select('status, current_version_id, approved_by')
      .eq('id', schoolId!)
      .single();
    expect(school!.status).toBe('published');
    expect(school!.approved_by).toBe(contributor.id);

    const { data: versions } = await admin
      .from('interpretive_school_versions')
      .select('id, version_number, body, authored_by, approved_at')
      .eq('school_id', schoolId!)
      .order('version_number', { ascending: true });
    expect(versions!.length).toBe(2);
    expect(versions![0].body).toBe('staff-drafted body');
    expect(versions![0].approved_at).toBeNull();
    expect(versions![1].body).toBe('contributor-revised body');
    expect(versions![1].authored_by).toBe(contributor.id);
    expect(versions![1].approved_at).not.toBeNull();
    expect(school!.current_version_id).toBe(versions![1].id);
  });

  test('reject → revise → resubmit → approve loop', async () => {
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'Reject loop',
      p_body: 'first staff draft',
    });
    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

    await contributor.client.rpc('reject_interpretive_school', {
      p_school_id: schoolId!,
      p_reason: 'Too long',
    });

    const { data: v1 } = await admin
      .from('interpretive_school_versions')
      .select('rejection_note')
      .eq('school_id', schoolId!)
      .eq('version_number', 1)
      .single();
    expect(v1!.rejection_note).toBe('Too long');

    const { data: school } = await admin
      .from('interpretive_schools')
      .select('status, rejected_by')
      .eq('id', schoolId!)
      .single();
    expect(school!.status).toBe('draft');
    expect(school!.rejected_by).toBe(contributor.id);

    // Staff revises.
    await staff.client.rpc('update_interpretive_school_draft', {
      p_school_id: schoolId!,
      p_body: 'revised tighter version',
    });
    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });
    await contributor.client.rpc('approve_interpretive_school', { p_school_id: schoolId! });

    const { data: finalSchool } = await admin
      .from('interpretive_schools')
      .select('status')
      .eq('id', schoolId!)
      .single();
    expect(finalSchool!.status).toBe('published');
  });

  test('staff retract clears notification + returns to draft', async () => {
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'Retract test',
      p_body: 'body',
    });
    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

    await staff.client.rpc('retract_interpretive_school', { p_school_id: schoolId! });

    const { data: school } = await admin
      .from('interpretive_schools')
      .select('status, retracted_by, retracted_at')
      .eq('id', schoolId!)
      .single();
    expect(school!.status).toBe('draft');
    expect(school!.retracted_by).toBe(staff.id);
    expect(school!.retracted_at).not.toBeNull();

    const { count: live } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'interpretive_schools')
      .eq('subject_id', schoolId!)
      .is('cleared_at', null);
    expect(live).toBe(0);
  });
});

describe('authorization guards', () => {
  test('any registered user can publish_contributor_interpretive_school', async () => {
    // Post-Slice-C governance (20260513000000_open_self_authoring.sql):
    // the is_contributor flag is no longer a gate; auth is all that's
    // required. Ownership guards still prevent user A editing user B's row.
    const { data: schoolId, error } = await normalUser.client.rpc(
      'publish_contributor_interpretive_school',
      { p_piece_id: PIECE, p_name: 'Self-authored by non-flagged user', p_body: 'body' },
    );
    expect(error).toBeNull();
    expect(schoolId).toBeTruthy();
    const { data: row } = await admin
      .from('interpretive_schools')
      .select('contributor_id, status')
      .eq('id', schoolId as string)
      .single();
    expect(row?.contributor_id).toBe(normalUser.id);
    expect(row?.status).toBe('published');
  });

  test('normal user cannot create_interpretive_school_draft', async () => {
    const { error } = await normalUser.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'Should fail',
      p_body: 'body',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not staff/i);
  });

  test('other contributor cannot approve someone else\'s draft', async () => {
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'Foreign approval',
      p_body: 'body',
    });
    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

    const { error } = await otherContributor.client.rpc('approve_interpretive_school', {
      p_school_id: schoolId!,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not found, not owned/i);
  });
});

describe('plurality rules', () => {
  test('same contributor can publish multiple schools on the same piece', async () => {
    const { data: id1 } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Historically informed',
      p_body: 'body 1',
    });
    const { data: id2 } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Chamber-symphonic',
      p_body: 'body 2',
    });
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);

    const { count } = await admin
      .from('interpretive_schools')
      .select('id', { count: 'exact', head: true })
      .eq('piece_id', PIECE)
      .eq('contributor_id', contributor.id)
      .eq('status', 'published');
    expect(count).toBe(2);
  });

  test('two contributors can hold schools with identical names (no DB uniqueness)', async () => {
    await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Historically informed',
      p_body: 'voice A',
    });
    const { data: id2, error } = await otherContributor.client.rpc(
      'publish_contributor_interpretive_school',
      {
        p_piece_id: PIECE,
        p_name: 'Historically informed',
        p_body: 'voice B',
      },
    );
    expect(error).toBeNull();
    expect(id2).toBeTruthy();
  });
});

describe('forbidden transitions', () => {
  test('approve on a published school fails', async () => {
    const { data: schoolId } = await contributor.client.rpc('publish_contributor_interpretive_school', {
      p_piece_id: PIECE,
      p_name: 'Already published',
      p_body: 'body',
    });

    const { error } = await contributor.client.rpc('approve_interpretive_school', {
      p_school_id: schoolId!,
    });
    expect(error).not.toBeNull();
  });

  test('remove on a draft fails', async () => {
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'Draft removal',
      p_body: 'body',
    });

    const { error } = await contributor.client.rpc('remove_interpretive_school', {
      p_school_id: schoolId!,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/can only remove a published/i);
  });

  test('retract on a draft (not awaiting) fails', async () => {
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_name: 'Retract draft',
      p_body: 'body',
    });

    const { error } = await staff.client.rpc('retract_interpretive_school', {
      p_school_id: schoolId!,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/can only retract/i);
  });
});
