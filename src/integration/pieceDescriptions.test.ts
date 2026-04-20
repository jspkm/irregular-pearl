// State-machine integration tests for PieceDescription RPCs (Slice B Step 2).
// Body-only entity — no metadata RPC (unlike schools which have name/tempo_cues).

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';

const PIECE = 'slice-b-descriptions-test';

let contributor: Awaited<ReturnType<typeof createAuthUser>>;
let otherContributor: Awaited<ReturnType<typeof createAuthUser>>;
let staff: Awaited<ReturnType<typeof createAuthUser>>;
let normalUser: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE, 'Slice B Descriptions Test Piece');
  contributor = await createAuthUser({ isContributor: true, displayName: 'Descriptions Contributor' });
  otherContributor = await createAuthUser({ isContributor: true, displayName: 'Other Descriptions Contributor' });
  staff = await createAuthUser({ isStaff: true, displayName: 'Descriptions Staff' });
  normalUser = await createAuthUser({ displayName: 'Descriptions Normal' });
});

afterAll(async () => {
  await deleteTestPiece(PIECE);
  await deleteAuthUser(contributor.id);
  await deleteAuthUser(otherContributor.id);
  await deleteAuthUser(staff.id);
  await deleteAuthUser(normalUser.id);
});

afterEach(async () => {
  await admin.from('piece_descriptions').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('piece_description_versions').delete().eq('piece_id', PIECE);
  await admin.from('piece_descriptions').delete().eq('piece_id', PIECE);
  await admin.from('notifications').delete().eq('subject_table', 'piece_descriptions');
});

describe('contributor-authored descriptions', () => {
  test('publish_contributor_piece_description publishes atomically, no notification', async () => {
    const { data: id, error } = await contributor.client.rpc('publish_contributor_piece_description', {
      p_piece_id: PIECE,
      p_body: 'This concerto hinges between late-Romantic lyricism and early-modernist economy.',
    });
    expect(error).toBeNull();
    expect(id).toBeTruthy();

    const { data: d } = await admin
      .from('piece_descriptions')
      .select('status, drafted_by, approved_by, current_version_id')
      .eq('id', id!)
      .single();
    expect(d!.status).toBe('published');
    expect(d!.drafted_by).toBeNull();
    expect(d!.approved_by).toBe(contributor.id);
    expect(d!.current_version_id).toBeTruthy();

    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'piece_descriptions')
      .eq('subject_id', id!);
    expect(count).toBe(0);
  });

  test('publish_contributor_piece_description_edit bumps version, no notification', async () => {
    const { data: id } = await contributor.client.rpc('publish_contributor_piece_description', {
      p_piece_id: PIECE,
      p_body: 'v1',
    });
    await contributor.client.rpc('publish_contributor_piece_description_edit', {
      p_description_id: id!,
      p_body: 'v2 revised',
    });

    const { data: versions } = await admin
      .from('piece_description_versions')
      .select('version_number, body')
      .eq('description_id', id!)
      .order('version_number', { ascending: true });
    expect(versions!.length).toBe(2);
    expect(versions![1].body).toContain('revised');
  });

  test('REGRESSION (iron rule): self-authored paths NEVER create notifications', async () => {
    const { data: id } = await contributor.client.rpc('publish_contributor_piece_description', {
      p_piece_id: PIECE,
      p_body: 'initial',
    });
    await contributor.client.rpc('publish_contributor_piece_description_edit', {
      p_description_id: id!,
      p_body: 'edit 1',
    });
    await contributor.client.rpc('publish_contributor_piece_description_edit', {
      p_description_id: id!,
      p_body: 'edit 2',
    });

    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'piece_descriptions')
      .eq('subject_id', id!);
    expect(count).toBe(0);
  });

  test('remove_piece_description soft-removes', async () => {
    const { data: id } = await contributor.client.rpc('publish_contributor_piece_description', {
      p_piece_id: PIECE,
      p_body: 'body',
    });

    await contributor.client.rpc('remove_piece_description', { p_description_id: id! });

    const { data: d } = await admin
      .from('piece_descriptions')
      .select('status, removed_by, removed_at')
      .eq('id', id!)
      .single();
    expect(d!.status).toBe('removed');
    expect(d!.removed_by).toBe(contributor.id);
  });
});

describe('staff-drafted descriptions — approval flow', () => {
  test('full round trip: create → submit → approve', async () => {
    const { data: id } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'Staff-drafted body.',
    });
    expect(id).toBeTruthy();

    await staff.client.rpc('submit_piece_description', { p_description_id: id! });

    const { data: notif } = await admin
      .from('notifications')
      .select('id, subject_table, subject_id, body, cleared_at')
      .eq('subject_table', 'piece_descriptions')
      .eq('subject_id', id!)
      .single();
    expect(notif!.subject_table).toBe('piece_descriptions');
    expect(notif!.body).toContain('piece description');
    expect(notif!.cleared_at).toBeNull();

    await contributor.client.rpc('approve_piece_description', { p_description_id: id! });

    const { data: d } = await admin
      .from('piece_descriptions')
      .select('status, approved_by, current_version_id')
      .eq('id', id!)
      .single();
    expect(d!.status).toBe('published');
    expect(d!.approved_by).toBe(contributor.id);

    const { data: notifCleared } = await admin
      .from('notifications')
      .select('cleared_at')
      .eq('id', notif!.id)
      .single();
    expect(notifCleared!.cleared_at).not.toBeNull();
  });

  test('CM3: double-submit produces ONE live notification (idempotency)', async () => {
    const { data: id } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'body',
    });

    await staff.client.rpc('submit_piece_description', { p_description_id: id! });
    await admin.from('piece_descriptions').update({ status: 'draft' }).eq('id', id!);
    await staff.client.rpc('submit_piece_description', { p_description_id: id! });

    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'piece_descriptions')
      .eq('subject_id', id!)
      .is('cleared_at', null);
    expect(count).toBe(1);
  });

  test('approve_and_edit inserts new version + publishes atomically', async () => {
    const { data: id } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'staff body',
    });
    await staff.client.rpc('submit_piece_description', { p_description_id: id! });

    await contributor.client.rpc('approve_and_edit_piece_description', {
      p_description_id: id!,
      p_body: 'contributor-revised',
    });

    const { data: d } = await admin
      .from('piece_descriptions')
      .select('status, current_version_id')
      .eq('id', id!)
      .single();
    expect(d!.status).toBe('published');

    const { data: versions } = await admin
      .from('piece_description_versions')
      .select('id, version_number, body, authored_by, approved_at')
      .eq('description_id', id!)
      .order('version_number', { ascending: true });
    expect(versions!.length).toBe(2);
    expect(versions![1].authored_by).toBe(contributor.id);
    expect(versions![1].body).toBe('contributor-revised');
    expect(d!.current_version_id).toBe(versions![1].id);
  });

  test('reject → revise → resubmit → approve', async () => {
    const { data: id } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'first',
    });
    await staff.client.rpc('submit_piece_description', { p_description_id: id! });

    await contributor.client.rpc('reject_piece_description', {
      p_description_id: id!,
      p_reason: 'Wrong register',
    });

    const { data: v1 } = await admin
      .from('piece_description_versions')
      .select('rejection_note')
      .eq('description_id', id!)
      .eq('version_number', 1)
      .single();
    expect(v1!.rejection_note).toBe('Wrong register');

    await staff.client.rpc('update_piece_description_draft', {
      p_description_id: id!,
      p_body: 'revised',
    });
    await staff.client.rpc('submit_piece_description', { p_description_id: id! });
    await contributor.client.rpc('approve_piece_description', { p_description_id: id! });

    const { data: d } = await admin
      .from('piece_descriptions')
      .select('status')
      .eq('id', id!)
      .single();
    expect(d!.status).toBe('published');
  });

  test('staff retract clears notification + returns to draft', async () => {
    const { data: id } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'body',
    });
    await staff.client.rpc('submit_piece_description', { p_description_id: id! });
    await staff.client.rpc('retract_piece_description', { p_description_id: id! });

    const { data: d } = await admin
      .from('piece_descriptions')
      .select('status, retracted_by, retracted_at')
      .eq('id', id!)
      .single();
    expect(d!.status).toBe('draft');
    expect(d!.retracted_by).toBe(staff.id);

    const { count: live } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('subject_table', 'piece_descriptions')
      .eq('subject_id', id!)
      .is('cleared_at', null);
    expect(live).toBe(0);
  });
});

describe('authorization guards', () => {
  test('normal user cannot publish_contributor_piece_description', async () => {
    const { error } = await normalUser.client.rpc('publish_contributor_piece_description', {
      p_piece_id: PIECE,
      p_body: 'body',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not an active contributor/i);
  });

  test('normal user cannot create_piece_description_draft', async () => {
    const { error } = await normalUser.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'body',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not staff/i);
  });

  test('other contributor cannot approve someone else\'s draft', async () => {
    const { data: id } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'body',
    });
    await staff.client.rpc('submit_piece_description', { p_description_id: id! });

    const { error } = await otherContributor.client.rpc('approve_piece_description', {
      p_description_id: id!,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not found, not owned/i);
  });
});

describe('plurality + forbidden transitions', () => {
  test('same contributor can publish multiple descriptions on same piece', async () => {
    const { data: id1 } = await contributor.client.rpc('publish_contributor_piece_description', {
      p_piece_id: PIECE,
      p_body: 'framing A',
    });
    const { data: id2 } = await contributor.client.rpc('publish_contributor_piece_description', {
      p_piece_id: PIECE,
      p_body: 'framing B',
    });
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  test('approve on published fails', async () => {
    const { data: id } = await contributor.client.rpc('publish_contributor_piece_description', {
      p_piece_id: PIECE,
      p_body: 'body',
    });
    const { error } = await contributor.client.rpc('approve_piece_description', {
      p_description_id: id!,
    });
    expect(error).not.toBeNull();
  });

  test('remove on draft fails', async () => {
    const { data: id } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'body',
    });
    const { error } = await contributor.client.rpc('remove_piece_description', {
      p_description_id: id!,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/can only remove a published/i);
  });
});
