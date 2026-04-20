// RLS + iron-rule regression tests for the contributor pipeline.
//
// Verifies:
//   • Anonymous clients see only status='published' notes + no version rows.
//   • Contributors see only their own drafts/pending notes; other contributors'
//     pending work is invisible.
//   • Notifications are scoped to the recipient (no cross-user reads).
//   • IRON RULE: contributor-self-authored paths never create notifications.
//   • Byline CHECK: is_contributor=true requires display_name (it's NOT NULL
//     on the users table, so this is guaranteed by schema — verified here
//     for safety).

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import {
  admin,
  anon,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
  countNotifications,
} from './helpers';

const PIECE = 'rls-test-piece';

let contributor: Awaited<ReturnType<typeof createAuthUser>>;
let otherContributor: Awaited<ReturnType<typeof createAuthUser>>;
let staff: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE, 'RLS Test Piece');
  contributor = await createAuthUser({ isContributor: true, displayName: 'RLS Contributor' });
  otherContributor = await createAuthUser({ isContributor: true, displayName: 'RLS Other Contributor' });
  staff = await createAuthUser({ isStaff: true, displayName: 'RLS Staff' });
});

afterAll(async () => {
  await admin.from('performers_notes').update({ current_version_id: null }).eq('piece_id', PIECE);
  await admin.from('performers_note_versions').delete().eq('piece_id', PIECE);
  await admin.from('performers_notes').delete().eq('piece_id', PIECE);
  await deleteTestPiece(PIECE);
  await deleteAuthUser(contributor.id);
  await deleteAuthUser(otherContributor.id);
  await deleteAuthUser(staff.id);
});

describe('RLS — performers_notes', () => {
  test('anonymous sees only status=published', async () => {
    const { data: publishedId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'public body',
    });
    const { data: draftId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'private draft',
    });

    const anonClient = anon();
    const { data: anonRows } = await anonClient
      .from('performers_notes')
      .select('id, status')
      .eq('piece_id', PIECE);
    const ids = anonRows!.map((r) => r.id);
    expect(ids).toContain(publishedId);
    expect(ids).not.toContain(draftId);
    expect(anonRows!.every((r) => r.status === 'published')).toBe(true);
  });

  test('non-owner contributor cannot read another contributor\'s pending draft', async () => {
    const { data: draftId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'owned by contributor',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: draftId! });

    const { data: othersView } = await otherContributor.client
      .from('performers_notes')
      .select('id, status')
      .eq('id', draftId!);
    expect(othersView).toEqual([]);
  });

  test('owner contributor sees their own pending draft', async () => {
    const { data: draftId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'own draft visibility',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: draftId! });

    const { data: ownersView } = await contributor.client
      .from('performers_notes')
      .select('id, status')
      .eq('id', draftId!);
    expect(ownersView!.length).toBe(1);
    expect(ownersView![0].status).toBe('awaiting_contributor_approval');
  });

  test('staff sees all notes regardless of status', async () => {
    const { data: draftRows } = await staff.client
      .from('performers_notes')
      .select('id, status')
      .eq('piece_id', PIECE);
    const statuses = new Set(draftRows!.map((r) => r.status));
    expect(statuses.size).toBeGreaterThan(1);
  });
});

describe('RLS — performers_note_versions', () => {
  test('anonymous cannot read version rows', async () => {
    const anonClient = anon();
    const { data, error } = await anonClient.from('performers_note_versions').select('id').limit(1);
    // Either empty or filtered — we want no rows returned for anon scope
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test('owner contributor reads their own version rows', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'owned versions',
    });
    const { data } = await contributor.client
      .from('performers_note_versions')
      .select('id, body')
      .eq('note_id', noteId!);
    expect(data!.length).toBe(1);
    expect(data![0].body).toBe('owned versions');
  });

  test('non-owner contributor cannot read another\'s version rows', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'keep out',
    });
    const { data } = await otherContributor.client
      .from('performers_note_versions')
      .select('id')
      .eq('note_id', noteId!);
    expect(data).toEqual([]);
  });
});

describe('RLS — notifications', () => {
  test('recipient sees only their own notifications', async () => {
    const { data: draftId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'nf test',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: draftId! });

    const { data: contribView } = await contributor.client
      .from('notifications')
      .select('id, recipient_id')
      .eq('performers_note_id', draftId!);
    expect(contribView!.length).toBe(1);
    expect(contribView![0].recipient_id).toBe(contributor.id);

    const { data: otherView } = await otherContributor.client
      .from('notifications')
      .select('id')
      .eq('performers_note_id', draftId!);
    expect(otherView).toEqual([]);
  });
});

describe('IRON RULE: contributor-authored paths never create notifications', () => {
  test('publish_contributor_note creates zero notification rows', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'self authored',
    });
    expect(await countNotifications(noteId!)).toBe(0);
  });

  test('publish_contributor_edit creates zero notification rows', async () => {
    const { data: noteId } = await contributor.client.rpc('publish_contributor_note', {
      p_piece_id: PIECE,
      p_body: 'initial',
    });
    await contributor.client.rpc('publish_contributor_edit', { p_note_id: noteId!, p_body: 'edited' });
    expect(await countNotifications(noteId!)).toBe(0);
  });

  test('control: submit_performers_note DOES create one notification', async () => {
    const { data: noteId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'control',
    });
    expect(await countNotifications(noteId!)).toBe(0); // create alone doesn't notify
    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });
    expect(await countNotifications(noteId!, { onlyUncleared: true })).toBe(1);
  });
});

describe('byline integrity', () => {
  test('schema enforces is_contributor requires display_name', async () => {
    // users.display_name is NOT NULL at the schema level, and the CHECK
    // constraint `contributor_has_display_name` guards the is_contributor flip.
    // Attempt to update a user to is_contributor=true with display_name=null
    // via admin bypass should fail.
    const { error } = await admin
      .from('users')
      .update({ is_contributor: true, display_name: null as unknown as string })
      .eq('id', contributor.id);
    expect(error).not.toBeNull();
  });

  test('clearing display_name on an existing contributor is rejected', async () => {
    const { error } = await admin
      .from('users')
      .update({ display_name: null as unknown as string })
      .eq('id', contributor.id);
    expect(error).not.toBeNull();
  });
});

describe('notification clearing RPCs', () => {
  test('clear_notification sets cleared_at for the recipient', async () => {
    const { data: noteId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'clear-me',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });
    const { data: rows } = await contributor.client
      .from('notifications')
      .select('id')
      .eq('performers_note_id', noteId!);
    const notifId = rows![0].id;

    const { error } = await contributor.client.rpc('clear_notification', { p_notification_id: notifId });
    expect(error).toBeNull();

    const { data: after } = await admin
      .from('notifications')
      .select('cleared_at')
      .eq('id', notifId)
      .single();
    expect(after!.cleared_at).not.toBeNull();
  });

  test('clear_all_notifications clears everything for the caller, returns count', async () => {
    // Submit two drafts to stack notifications
    const draft1 = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'd1',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: draft1.data! });
    const draft2 = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'd2',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: draft2.data! });

    const { data: count, error } = await contributor.client.rpc('clear_all_notifications');
    expect(error).toBeNull();
    expect(count).toBeGreaterThanOrEqual(2);

    const { data: remaining } = await admin
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('recipient_id', contributor.id)
      .is('cleared_at', null);
    expect(remaining).toEqual([]);
  });

  test('cannot clear another user\'s notification', async () => {
    const { data: draftId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE,
      p_contributor_id: contributor.id,
      p_body: 'not-yours',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: draftId! });
    const { data: rows } = await admin
      .from('notifications')
      .select('id')
      .eq('performers_note_id', draftId!);
    const notifId = rows![0].id;

    const { error } = await otherContributor.client.rpc('clear_notification', { p_notification_id: notifId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not owned by caller/i);
  });
});
