#!/usr/bin/env bun
// Seeds the local Supabase stack with fixtures so the /notifications queue
// has something to show when you visit the dev server.
//
// Creates:
//   - a contributor (haji@local.test / password: hajilocal)
//   - a staff user   (staff@local.test / password: stafflocal)
//   - one submitted pending draft on an existing piece
//
// Idempotent — re-running refreshes the draft. Safe to run anytime.
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
const staffId = await ensureUser('staff@local.test', 'stafflocal', {
  display_name: 'Staff Local',
  role: 'admin',
});

// Pick an existing piece. Falls back to creating one if the catalog is empty.
const { data: pieces } = await admin.from('pieces').select('id, title').limit(1);
let pieceId = pieces?.[0]?.id;
if (!pieceId) {
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
  pieceId = fixtureId;
}

// Reset any previous local test draft for this piece + contributor.
await admin
  .from('performers_notes')
  .update({ current_version_id: null, status: 'removed' })
  .eq('piece_id', pieceId)
  .eq('contributor_id', hajiId);

// Sign in as staff to call the RPC with a real JWT.
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const staffClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { error: signInErr } = await staffClient.auth.signInWithPassword({ email: 'staff@local.test', password: 'stafflocal' });
if (signInErr) throw new Error(`sign-in staff: ${signInErr.message}`);

const { data: noteId, error: createErr } = await staffClient.rpc('create_performers_note_draft', {
  p_piece_id: pieceId,
  p_contributor_id: hajiId,
  p_body:
    "Staff-authored draft: the opening arpeggios call for bow speed more than articulation — try broadening the second bar under a single down-bow to hear the architecture Bach wrote, then restore the printed bowing if it serves the room.",
});
if (createErr) throw new Error(`create draft: ${createErr.message}`);

const { error: submitErr } = await staffClient.rpc('submit_performers_note', { p_note_id: noteId });
if (submitErr) throw new Error(`submit draft: ${submitErr.message}`);

console.log('Local queue seeded.');
console.log(`  piece:       ${pieceId}`);
console.log(`  note:        ${noteId}`);
console.log('  contributor: haji@local.test / hajilocal');
console.log('  staff:       staff@local.test / stafflocal');
console.log('\nNext:');
console.log('  1. bun run dev');
console.log('  2. Visit http://localhost:4321');
console.log('  3. Sign in as haji@local.test / hajilocal');
console.log('  4. Visit http://localhost:4321/notifications');
