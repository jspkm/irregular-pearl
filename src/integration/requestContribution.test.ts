// Integration tests for the request-a-contribution + canonical-index
// RPCs: materialize_piece_from_index, request_contribution,
// search_pieces_typeahead. Runs against a local Supabase stack.

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { admin, createAuthUser, deleteAuthUser, createTestPiece, deleteTestPiece } from './helpers';

// -----------------------------
// Helpers scoped to this file
// -----------------------------

async function insertIndexRow(opts: {
  title: string;
  composer: string;
  catalog?: string | null;
  form?: string | null;
  era?: string | null;
  instruments?: string[];
  mbId?: string | null;
}): Promise<string> {
  const { data, error } = await admin
    .from('canonical_piece_index')
    .insert({
      canonical_title: opts.title,
      composer_name: opts.composer,
      catalog_number: opts.catalog ?? null,
      form: opts.form ?? 'sonata',
      era: opts.era ?? 'Classical',
      instruments: opts.instruments ?? ['piano'],
      musicbrainz_work_id: opts.mbId ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`insert index: ${error?.message}`);
  return data.id;
}

async function publishSignedContribution(pieceId: string, contributorId: string): Promise<void> {
  // Insert a performers_note + version in 'published' state so the sender
  // gate is satisfied. Bypasses the approval pipeline.
  const { data: note, error: noteErr } = await admin
    .from('performers_notes')
    .insert({
      piece_id: pieceId,
      contributor_id: contributorId,
      status: 'draft',
    })
    .select('id')
    .single();
  if (noteErr || !note) throw new Error(`insert note: ${noteErr?.message}`);

  const { data: ver, error: verErr } = await admin
    .from('performers_note_versions')
    .insert({
      note_id: note.id,
      piece_id: pieceId,
      contributor_id: contributorId,
      body: 'Test body for sender-gate.',
      version_number: 1,
      authored_by: contributorId,
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (verErr || !ver) throw new Error(`insert version: ${verErr?.message}`);

  const { error: pubErr } = await admin
    .from('performers_notes')
    .update({ status: 'published', current_version_id: ver.id })
    .eq('id', note.id);
  if (pubErr) throw new Error(`publish note: ${pubErr.message}`);
}

// -----------------------------
// materialize_piece_from_index
// -----------------------------

describe('materialize_piece_from_index', () => {
  let user: Awaited<ReturnType<typeof createAuthUser>>;
  const createdIndexIds: string[] = [];
  const createdPieceIds: string[] = [];

  beforeAll(async () => {
    user = await createAuthUser({ displayName: 'Mat Tester' });
  });

  afterAll(async () => {
    for (const pid of createdPieceIds) {
      await admin.from('pieces').delete().eq('id', pid);
    }
    for (const iid of createdIndexIds) {
      await admin.from('canonical_piece_index').delete().eq('id', iid);
    }
    await deleteAuthUser(user.id);
  });

  test('happy path creates piece with generated slug', async () => {
    const iid = await insertIndexRow({
      title: 'Test Sonata in C',
      composer: 'Wolfgang Mozart',
      form: 'sonata',
      catalog: 'K. 999',
    });
    createdIndexIds.push(iid);

    const { data: pieceId, error } = await user.client.rpc('materialize_piece_from_index', {
      p_index_id: iid,
    });
    expect(error).toBeNull();
    expect(pieceId).toBe('mozart-sonata-k-999');
    createdPieceIds.push(pieceId as string);

    // Piece row has canonical_index_id linking back to the index
    const { data: piece } = await admin
      .from('pieces')
      .select('canonical_index_id, title, composer_name')
      .eq('id', pieceId)
      .single();
    expect(piece!.canonical_index_id).toBe(iid);
    expect(piece!.title).toBe('Test Sonata in C');
  });

  test('idempotent: second call on same index returns same piece', async () => {
    const iid = await insertIndexRow({
      title: 'Test Quintet',
      composer: 'Franz Schubert',
      form: 'quintet',
      catalog: 'D. 999',
    });
    createdIndexIds.push(iid);

    const { data: firstId } = await user.client.rpc('materialize_piece_from_index', { p_index_id: iid });
    const { data: secondId } = await user.client.rpc('materialize_piece_from_index', { p_index_id: iid });
    expect(firstId).toBe(secondId);
    createdPieceIds.push(firstId as string);
  });

  test('slug collision: second distinct index row with same base slug gets -2 suffix', async () => {
    const iid1 = await insertIndexRow({
      title: 'First Variation',
      composer: 'J Test',
      form: 'variation',
      catalog: 'V. 1',
    });
    const iid2 = await insertIndexRow({
      title: 'Second Variation (different piece, same slug)',
      composer: 'J Test',
      form: 'variation',
      catalog: 'V. 1',
    });
    createdIndexIds.push(iid1, iid2);

    const { data: p1 } = await user.client.rpc('materialize_piece_from_index', { p_index_id: iid1 });
    const { data: p2 } = await user.client.rpc('materialize_piece_from_index', { p_index_id: iid2 });
    expect(p1).toBe('test-variation-v-1');
    expect(p2).toBe('test-variation-v-1-2');
    createdPieceIds.push(p1 as string, p2 as string);
  });

  test('unauthenticated rejected', async () => {
    const iid = await insertIndexRow({ title: 'Anon Sonata', composer: 'Unsigned', catalog: 'Op. 1' });
    createdIndexIds.push(iid);

    const { createClient } = await import('@supabase/supabase-js');
    const anonClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { error } = await anonClient.rpc('materialize_piece_from_index', { p_index_id: iid });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unauthenticated/i);
  });

  test('non-existent index rejected', async () => {
    const { error } = await user.client.rpc('materialize_piece_from_index', {
      p_index_id: '00000000-0000-0000-0000-000000000000',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/not found/i);
  });
});

// -----------------------------
// request_contribution
// -----------------------------

describe('request_contribution', () => {
  let sender: Awaited<ReturnType<typeof createAuthUser>>;
  let staffSender: Awaited<ReturnType<typeof createAuthUser>>;
  let recipient: Awaited<ReturnType<typeof createAuthUser>>;
  const PIECE = 'test-request-contribution-piece';

  beforeAll(async () => {
    await createTestPiece(PIECE, 'Request Contribution Test');

    sender = await createAuthUser({ displayName: 'Gate Sender' });
    staffSender = await createAuthUser({ displayName: 'Staff Sender', isStaff: true });
    recipient = await createAuthUser({ displayName: 'Recipient User' });

    // Give recipient a username so user-ID invites can resolve.
    await admin.from('users').update({ username: 'recipient_test' }).eq('id', recipient.id);
  });

  afterAll(async () => {
    await admin.from('notifications').delete().eq('subject_table', 'contribution_requests');
    await admin.from('contribution_requests').delete().eq('piece_id', PIECE);
    await deleteTestPiece(PIECE);
    await deleteAuthUser(sender.id);
    await deleteAuthUser(staffSender.id);
    await deleteAuthUser(recipient.id);
  });

  test('sender gate blocks sender with no published contributions', async () => {
    const { error } = await sender.client.rpc('request_contribution', {
      p_piece_id: PIECE,
      p_recipient_username: 'recipient_test',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/sender gate/i);
  });

  test('staff bypasses sender gate', async () => {
    const { data: requestId, error } = await staffSender.client.rpc('request_contribution', {
      p_piece_id: PIECE,
      p_recipient_username: 'recipient_test',
      p_note: 'Please contribute when you can.',
    });
    expect(error).toBeNull();
    expect(requestId).toBeDefined();

    // Notification row exists with correct link_path
    const { data: notif } = await admin
      .from('notifications')
      .select('id, type, subject_table, subject_id, recipient_id, body, link_path')
      .eq('subject_id', requestId)
      .single();
    expect(notif!.type).toBe('contribution_requested');
    expect(notif!.subject_table).toBe('contribution_requests');
    expect(notif!.recipient_id).toBe(recipient.id);
    expect(notif!.body).toMatch(/Staff Sender/);
    // Regression pin: piece page lives at /piece/[slug], not /p/[slug].
    expect(notif!.link_path).toBe(`/piece/${PIECE}`);
  });

  test('sender gate passes after publishing a signed contribution', async () => {
    await publishSignedContribution(PIECE, sender.id);

    const { data: requestId, error } = await sender.client.rpc('request_contribution', {
      p_piece_id: PIECE,
      p_recipient_username: 'recipient_test',
    });
    expect(error).toBeNull();
    expect(requestId).toBeDefined();
  });

  test('non-staff rejected when sending email invite', async () => {
    const { error } = await sender.client.rpc('request_contribution', {
      p_piece_id: PIECE,
      p_recipient_email: 'some@example.com',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/email invites are staff-only/i);
  });

  test('staff can send email invite', async () => {
    const { data, error } = await staffSender.client.rpc('request_contribution', {
      p_piece_id: PIECE,
      p_recipient_email: 'some@example.com',
    });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('recipient=sender rejected', async () => {
    const senderSelf = await createAuthUser({ displayName: 'Self Inviter' });
    const uniqueUsername = `self_${senderSelf.id.slice(0, 8).replace(/-/g, '')}`;
    try {
      const { error: updErr } = await admin
        .from('users')
        .update({ username: uniqueUsername })
        .eq('id', senderSelf.id);
      expect(updErr).toBeNull();
      await publishSignedContribution(PIECE, senderSelf.id);

      const { error } = await senderSelf.client.rpc('request_contribution', {
        p_piece_id: PIECE,
        p_recipient_username: uniqueUsername,
      });
      expect(error).not.toBeNull();
      expect(error!.message).toMatch(/yourself/i);
    } finally {
      await deleteAuthUser(senderSelf.id);
    }
  });

  test('nonexistent username rejected', async () => {
    const { error } = await staffSender.client.rpc('request_contribution', {
      p_piece_id: PIECE,
      p_recipient_username: 'does_not_exist',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/no musician found/i);
  });

  test('nonexistent piece rejected', async () => {
    const { error } = await staffSender.client.rpc('request_contribution', {
      p_piece_id: 'never-existed',
      p_recipient_username: 'recipient_test',
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/piece not found/i);
  });

  test('note longer than 280 chars rejected', async () => {
    const { error } = await staffSender.client.rpc('request_contribution', {
      p_piece_id: PIECE,
      p_recipient_username: 'recipient_test',
      p_note: 'x'.repeat(281),
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/cr_note_length|check constraint/i);
  });
});

// -----------------------------
// search_pieces_typeahead
// -----------------------------

describe('search_pieces_typeahead', () => {
  let indexRowId: string;

  beforeAll(async () => {
    indexRowId = await insertIndexRow({
      title: 'Typeahead Seed Example',
      composer: 'Anton Typeahead',
      catalog: 'Tp. 1',
      form: 'étude',
    });
  });

  afterAll(async () => {
    await admin.from('canonical_piece_index').delete().eq('id', indexRowId);
    await admin.from('search_misses').delete().like('query', '%xqxqxq%');
  });

  test('returns materialized results for known query', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data, error } = await client.rpc('search_pieces_typeahead', { p_query: 'bach' });
    expect(error).toBeNull();
    const materialized = (data as any[]).filter((r) => r.result_type === 'materialized');
    expect(materialized.length).toBeGreaterThan(0);
    expect(materialized[0].composer_name).toMatch(/Bach/i);
  });

  test('returns seed results for unmaterialized index entry', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data, error } = await client.rpc('search_pieces_typeahead', { p_query: 'typeahead' });
    expect(error).toBeNull();
    const seeds = (data as any[]).filter((r) => r.result_type === 'seed');
    expect(seeds.some((r) => r.id === indexRowId)).toBe(true);
  });

  test('query shorter than 2 chars returns nothing', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data } = await client.rpc('search_pieces_typeahead', { p_query: 'b' });
    expect(data).toEqual([]);
  });

  test('query >=6 chars with no matches logs to search_misses', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const query = 'xqxqxqxq-not-a-real-piece';
    await client.rpc('search_pieces_typeahead', { p_query: query });

    const { data: misses } = await admin
      .from('search_misses')
      .select('query')
      .like('query', '%xqxqxq%');
    expect(misses!.length).toBeGreaterThanOrEqual(1);
  });
});
