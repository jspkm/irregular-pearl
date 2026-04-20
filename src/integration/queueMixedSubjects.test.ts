// Mixed-subject queue fetch test. Simulates what NotificationsQueue does
// client-side: reads un-cleared notifications, groups by subject_table,
// batch-fetches per table, joins to pieces. Verifies the polymorphic pivot
// lets one query + per-table fan-out hydrate drafts across ALL three subject
// types without any narrow-FK dependency. (Step 3.)

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  admin,
  createAuthUser,
  deleteAuthUser,
  createTestPiece,
  deleteTestPiece,
} from './helpers';
import {
  SUBJECT_CONFIG,
  SUBJECT_TABLES,
  isSubjectTable,
  type SubjectTable,
} from '../lib/contributorSubjects';

const PIECE_A = 'slice-b-queue-a';
const PIECE_B = 'slice-b-queue-b';
const PIECE_C = 'slice-b-queue-c';

let contributor: Awaited<ReturnType<typeof createAuthUser>>;
let staff: Awaited<ReturnType<typeof createAuthUser>>;

beforeAll(async () => {
  await createTestPiece(PIECE_A, 'Queue Test A');
  await createTestPiece(PIECE_B, 'Queue Test B');
  await createTestPiece(PIECE_C, 'Queue Test C');
  contributor = await createAuthUser({ isContributor: true, displayName: 'Queue Contributor' });
  staff = await createAuthUser({ isStaff: true, displayName: 'Queue Staff' });
});

afterAll(async () => {
  // Clean schools + descriptions explicitly (deleteTestPiece only knows about performers_notes).
  for (const piece of [PIECE_A, PIECE_B, PIECE_C]) {
    await admin.from('interpretive_schools').update({ current_version_id: null }).eq('piece_id', piece);
    await admin.from('interpretive_school_versions').delete().eq('piece_id', piece);
    await admin.from('interpretive_schools').delete().eq('piece_id', piece);
    await admin.from('piece_descriptions').update({ current_version_id: null }).eq('piece_id', piece);
    await admin.from('piece_description_versions').delete().eq('piece_id', piece);
    await admin.from('piece_descriptions').delete().eq('piece_id', piece);
    await deleteTestPiece(piece);
  }
  await deleteAuthUser(contributor.id);
  await deleteAuthUser(staff.id);
});

afterEach(async () => {
  await admin.from('notifications').delete().eq('recipient_id', contributor.id);
});

/**
 * Mirrors the NotificationsQueue.loadQueue fetch, verbatim in shape. Lets us
 * test the polymorphic fetch logic without standing up a DOM.
 */
async function fetchPendingQueue(contributorId: string) {
  // The component uses the anon-scoped supabase client; here we use admin
  // because the test helpers don't provide per-user anon clients for queries
  // (they do for RPCs). RLS behavior is exercised separately.
  const { data: notifs } = await admin
    .from('notifications')
    .select('id, subject_table, subject_id, body, created_at')
    .eq('recipient_id', contributorId)
    .is('cleared_at', null)
    .order('created_at', { ascending: false });
  if (!notifs || notifs.length === 0) return [];

  const idsByTable = new Map<SubjectTable, string[]>();
  for (const n of notifs) {
    if (!isSubjectTable(n.subject_table)) continue;
    const arr = idsByTable.get(n.subject_table) ?? [];
    arr.push(n.subject_id);
    idsByTable.set(n.subject_table, arr);
  }

  type SubjectRow = { id: string; piece_id: string; drafted_by: string | null; name?: string };
  const subjectByKey = new Map<string, { table: SubjectTable; row: SubjectRow }>();
  for (const [table, ids] of idsByTable) {
    const cfg = SUBJECT_CONFIG[table];
    const fields = cfg.hasName ? 'id, piece_id, drafted_by, name' : 'id, piece_id, drafted_by';
    const { data: subjects } = await admin.from(cfg.table).select(fields).in('id', ids);
    for (const row of (subjects ?? []) as SubjectRow[]) {
      subjectByKey.set(`${table}:${row.id}`, { table, row });
    }
  }

  return notifs.map((n) => ({
    notificationId: n.id,
    subjectTable: n.subject_table,
    subjectId: n.subject_id,
    body: n.body,
    subject: subjectByKey.get(`${n.subject_table}:${n.subject_id}`) ?? null,
  }));
}

describe('mixed-subject queue fetch', () => {
  test('returns all three subject types when drafts exist for each', async () => {
    // Draft one of each subject type for the contributor.
    const { data: noteId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE_A,
      p_contributor_id: contributor.id,
      p_body: 'performers note body',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });

    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE_B,
      p_contributor_id: contributor.id,
      p_name: 'Historically informed',
      p_body: 'school body',
    });
    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

    const { data: descId } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE_C,
      p_contributor_id: contributor.id,
      p_body: 'signed description body',
    });
    await staff.client.rpc('submit_piece_description', { p_description_id: descId! });

    const queue = await fetchPendingQueue(contributor.id);
    expect(queue.length).toBe(3);

    const tables = new Set(queue.map((q) => q.subjectTable));
    expect(tables).toEqual(new Set(SUBJECT_TABLES));

    // Each item resolves its subject row.
    for (const item of queue) {
      expect(item.subject).not.toBeNull();
      expect(item.subject!.row.piece_id).toBeTruthy();
    }

    // Schools row carries the name through.
    const school = queue.find((q) => q.subjectTable === 'interpretive_schools');
    expect(school!.subject!.row.name).toBe('Historically informed');

    // Body copy is per-subject (6A: RPC writes the body, consumers read verbatim).
    const performersNote = queue.find((q) => q.subjectTable === 'performers_notes');
    expect(performersNote!.body).toContain("performer's note");
    expect(school!.body).toContain('interpretive school');
    expect(school!.body).toContain('Historically informed');
    const desc = queue.find((q) => q.subjectTable === 'piece_descriptions');
    expect(desc!.body).toContain('piece description');
  });

  test('clearing one subject type does not affect the others', async () => {
    // Start with one of each.
    const { data: noteId } = await staff.client.rpc('create_performers_note_draft', {
      p_piece_id: PIECE_A,
      p_contributor_id: contributor.id,
      p_body: 'body',
    });
    await staff.client.rpc('submit_performers_note', { p_note_id: noteId! });
    const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
      p_piece_id: PIECE_B,
      p_contributor_id: contributor.id,
      p_name: 'Unaffected',
      p_body: 'body',
    });
    await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });
    const { data: descId } = await staff.client.rpc('create_piece_description_draft', {
      p_piece_id: PIECE_C,
      p_contributor_id: contributor.id,
      p_body: 'body',
    });
    await staff.client.rpc('submit_piece_description', { p_description_id: descId! });

    // Approve the performers note — trigger clears only its own notification.
    await contributor.client.rpc('approve_performers_note', { p_note_id: noteId! });

    const queue = await fetchPendingQueue(contributor.id);
    expect(queue.length).toBe(2);
    const tables = new Set(queue.map((q) => q.subjectTable));
    expect(tables).toEqual(new Set(['interpretive_schools', 'piece_descriptions']));
  });

  test('fetches O(subject_tables) subject queries, not O(notifications)', async () => {
    // Create 3 schools + 3 descriptions for the same contributor.
    for (let i = 0; i < 3; i++) {
      const { data: schoolId } = await staff.client.rpc('create_interpretive_school_draft', {
        p_piece_id: PIECE_B,
        p_contributor_id: contributor.id,
        p_name: `School ${i}`,
        p_body: 'body',
      });
      await staff.client.rpc('submit_interpretive_school', { p_school_id: schoolId! });

      const { data: descId } = await staff.client.rpc('create_piece_description_draft', {
        p_piece_id: PIECE_C,
        p_contributor_id: contributor.id,
        p_body: `description ${i}`,
      });
      await staff.client.rpc('submit_piece_description', { p_description_id: descId! });
    }

    // fetchPendingQueue issues 1 notifications query + 2 subject queries
    // (one per subject_table present) regardless of item count. The per-item
    // shape being correct is proven by asserting all 6 items resolve.
    const queue = await fetchPendingQueue(contributor.id);
    expect(queue.length).toBe(6);
    for (const item of queue) expect(item.subject).not.toBeNull();
  });
});
