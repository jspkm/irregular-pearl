#!/usr/bin/env bun
// Seeds the local Supabase stack with fixtures so the /notifications queue
// AND the piece-page signed surfaces have something to show when you visit
// the dev server.
//
// Creates:
//   - a contributor (haji@local.test / password: hajilocal)
//   - a staff user   (staff@local.test / password: stafflocal)
//   - one submitted pending performer's note (Slice A)
//   - one submitted pending interpretive school (Slice B)
//   - one submitted pending piece description (Slice B)
//   - one published interpretive school on a SECOND piece (Slice B, renders
//     in the schools grid on that piece page for visual QA without needing
//     to click approve)
//   - one published piece description on the same second piece (Slice B)
//
// Idempotent — re-running refreshes the drafts + republishes the visuals.
//
// Usage:
//   bun --env-file=.env.development.local run scripts/seed-local-queue.ts

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Run with: bun --env-file=.env.development.local run scripts/seed-local-queue.ts');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function ensureUser(email: string, password: string, patch: Record<string, unknown>): Promise<string> {
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    user = created.user!;
  }
  await admin.from('users').update(patch).eq('id', user.id);
  return user.id;
}

const hajiId = await ensureUser('haji@local.test', 'hajilocal', {
  display_name: 'Haji Kim',
  is_contributor: true,
  contributor_active: true,
  contributor_agreement_signed_at: new Date().toISOString(),
  contributor_bio_short: 'cellist, NYC',
});
await ensureUser('staff@local.test', 'stafflocal', {
  display_name: 'Staff Local',
  role: 'admin',
});

// Pick two existing pieces if available so we can stage pending drafts on
// one and published signed content on the other. Fall back to a single
// Bach fixture if the catalog is empty.
const { data: pieces } = await admin.from('pieces').select('id, title').limit(2);
const pendingPieceId = pieces?.[0]?.id ?? 'bach-cello-suite-1';
const publishedPieceId = pieces?.[1]?.id ?? pendingPieceId;
if (!pieces || pieces.length === 0) {
  const fixtureId = 'bach-cello-suite-1';
  await admin.from('pieces').upsert({
    id: fixtureId,
    title: 'Cello Suite No. 1 in G major',
    composer_name: 'Bach, J.S.',
    catalog_number: 'BWV 1007',
    era: 'Baroque',
    form: 'suite',
    instruments: ['cello'],
    difficulty: 'advanced',
    description: 'The most-played of the Six, and the one every cellist must eventually confront on their own terms.',
  });
}

// Reset any previous local test drafts for both pieces + contributor.
for (const pid of [pendingPieceId, publishedPieceId]) {
  await admin
    .from('performers_notes')
    .update({ current_version_id: null, status: 'removed' })
    .eq('piece_id', pid)
    .eq('contributor_id', hajiId);
  await admin
    .from('interpretive_schools')
    .update({ current_version_id: null, status: 'removed' })
    .eq('piece_id', pid)
    .eq('contributor_id', hajiId);
  await admin
    .from('piece_descriptions')
    .update({ current_version_id: null, status: 'removed' })
    .eq('piece_id', pid)
    .eq('contributor_id', hajiId);
}
await admin.from('notifications').delete().eq('recipient_id', hajiId);

// Sign in as staff + haji respectively so auth.uid() populates correctly.
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const staffClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const hajiClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

{
  const { error } = await staffClient.auth.signInWithPassword({ email: 'staff@local.test', password: 'stafflocal' });
  if (error) throw new Error(`sign-in staff: ${error.message}`);
}
{
  const { error } = await hajiClient.auth.signInWithPassword({ email: 'haji@local.test', password: 'hajilocal' });
  if (error) throw new Error(`sign-in haji: ${error.message}`);
}

// --- Pending drafts on pendingPieceId (bell/queue fixtures) ---

const { data: noteId, error: noteErr } = await staffClient.rpc('create_performers_note_draft', {
  p_piece_id: pendingPieceId,
  p_contributor_id: hajiId,
  p_body:
    "Staff-authored draft: the opening arpeggios call for bow speed more than articulation — try broadening the second bar under a single down-bow to hear the architecture Bach wrote, then restore the printed bowing if it serves the room.",
});
if (noteErr) throw new Error(`create performer's note draft: ${noteErr.message}`);
{
  const { error } = await staffClient.rpc('submit_performers_note', { p_note_id: noteId });
  if (error) throw new Error(`submit performer's note: ${error.message}`);
}

const { data: schoolDraftId, error: schoolErr } = await staffClient.rpc('create_interpretive_school_draft', {
  p_piece_id: pendingPieceId,
  p_contributor_id: hajiId,
  p_name: 'Historically informed',
  p_body:
    "Staff-drafted school: the HIP reading treats the prelude's sixteenths as inégales rather than metrically even — every second note slightly weighted, the phrase shaped around the long arc of the dominant pedal.",
  p_tempo_cues: { opening: 'quarter=72' },
});
if (schoolErr) throw new Error(`create school draft: ${schoolErr.message}`);
{
  const { error } = await staffClient.rpc('submit_interpretive_school', { p_school_id: schoolDraftId });
  if (error) throw new Error(`submit school: ${error.message}`);
}

const { data: descDraftId, error: descErr } = await staffClient.rpc('create_piece_description_draft', {
  p_piece_id: pendingPieceId,
  p_contributor_id: hajiId,
  p_body:
    'Staff-drafted description: the G major Suite is the entry point to the cycle and the thing every cellist eventually confronts on their own terms — not because it is the easiest of the six, but because its rhetoric is the least forgiving. Every shape has to be found, not imposed.',
});
if (descErr) throw new Error(`create description draft: ${descErr.message}`);
{
  const { error } = await staffClient.rpc('submit_piece_description', { p_description_id: descDraftId });
  if (error) throw new Error(`submit description: ${error.message}`);
}

// --- Published signed content on publishedPieceId (piece-page fixtures) ---

let publishedSchoolIds: string[] = [];
let publishedDescriptionId: string | null = null;

if (publishedPieceId !== pendingPieceId) {
  const { data: s1, error: s1Err } = await hajiClient.rpc('publish_contributor_interpretive_school', {
    p_piece_id: publishedPieceId,
    p_name: 'Historically informed',
    p_body:
      'The HIP reading leans into gut-string response — shorter decay, lighter bow weight, clear articulation of the hemiola at the turn. The goal is not austerity but transparency: the counterpoint has to stand on its own.',
    p_tempo_cues: { opening: 'quarter=80' },
  });
  if (s1Err) throw new Error(`publish school 1: ${s1Err.message}`);
  publishedSchoolIds.push(s1 as string);

  const { data: s2, error: s2Err } = await hajiClient.rpc('publish_contributor_interpretive_school', {
    p_piece_id: publishedPieceId,
    p_name: 'Chamber-symphonic',
    p_body:
      'Played on a modern set-up with a symphonic bow, the same measures ask for weight, sustain, and a long horizontal line. The work still reads as Bach, but the architecture is closer to late Beethoven than to a gamba sonata.',
  });
  if (s2Err) throw new Error(`publish school 2: ${s2Err.message}`);
  publishedSchoolIds.push(s2 as string);

  const { data: d1, error: d1Err } = await hajiClient.rpc('publish_contributor_piece_description', {
    p_piece_id: publishedPieceId,
    p_body:
      'This suite is the first page of the working cellist\'s internal library. It rewards attention to key architecture more than to virtuoso display — the D minor Sarabande is where a player finds out whether they can keep a long silence inside a line.',
  });
  if (d1Err) throw new Error(`publish description 1: ${d1Err.message}`);
  publishedDescriptionId = d1 as string;
}

console.log('Local queue + piece-page fixtures seeded.');
console.log(`  pending piece:      ${pendingPieceId}`);
console.log(`    performer's note: ${noteId}   (awaiting approval)`);
console.log(`    school draft:     ${schoolDraftId}   (awaiting approval)`);
console.log(`    desc draft:       ${descDraftId}   (awaiting approval)`);
if (publishedPieceId !== pendingPieceId) {
  console.log(`  published piece:    ${publishedPieceId}`);
  console.log(`    schools:          ${publishedSchoolIds.join(', ')}`);
  console.log(`    description:      ${publishedDescriptionId}`);
} else {
  console.log('  (only one piece in catalog — skipped published fixtures)');
}
console.log('  contributor: haji@local.test / hajilocal');
console.log('  staff:       staff@local.test / stafflocal');
console.log('\nNext:');
console.log('  1. bun run dev:local');
console.log('  2. Sign in as haji@local.test / hajilocal (use scripts/magic-link.ts if needed)');
console.log(`  3. Bell should show 3; queue at /notifications has three distinct kickers`);
if (publishedPieceId !== pendingPieceId) {
  console.log(`  4. Visit /piece/${publishedPieceId} — schools grid (2-col) + signed essay render live`);
}
