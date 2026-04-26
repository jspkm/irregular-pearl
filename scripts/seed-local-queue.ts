#!/usr/bin/env bun
// Seeds the local Supabase stack with fixtures so the /notifications tabs
// AND the piece-page signed surfaces have something to show when you visit
// the dev server.
//
// Creates:
//   - a contributor (haji@local.test / password: hajilocal)
//   - a second contributor (ben@local.test / password: benlocal) — for stacking
//   - a staff admin   (staff@local.test / password: stafflocal)
//   - a staff moderator (mod@local.test / password: modlocal)
//   - one published interpretive school on a SECOND piece (Slice B, renders
//     in the schools grid on that piece page for visual QA)
//   - one published piece description on the same second piece (Slice B)
//   - two published landmarks on the Bach Suite No. 1 Prélude at the same
//     measure range, authored by haji and ben respectively, with cross-votes
//     so the stack has a clear top (Slice C)
//   - one movement edit on the Prélude so the change-log + version history
//     have something to show
//   - contribution-request drafts (v0.5.0):
//       · one SENT request from staff → haji on Bach Suite No. 1 with three
//         drafts (performer's note + interpretive school + piece description)
//         — demonstrates recipient triage UX + Open items tab
//       · one SENT request from mod → haji on Bach Suite No. 1 with one
//         performer's note draft — shows multi-sender bell + archive under mod
//       · one OUTBOX (in-progress) request from staff → ben on Bach Suite
//         No. 2 with two drafts — shows Resume → flow in Requests admin tab
//
// Idempotent — re-running refreshes the drafts + republishes the visuals.
// The retired draft-approval pipeline (create_*_draft / submit_*) is gone
// as of PR 5b; this script no longer seeds those.
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
  contributor_agreement_signed_at: new Date().toISOString(),
  contributor_bio_short: 'cellist, NYC',
});
const benId = await ensureUser('ben@local.test', 'benlocal', {
  display_name: 'Ben Cellist',
  contributor_bio_short: 'cellist + chamber player, Boston',
});
const staffId = await ensureUser('staff@local.test', 'stafflocal', {
  display_name: 'Staff Local',
  role: 'admin',
});
const modId = await ensureUser('mod@local.test', 'modlocal', {
  display_name: 'Mod Local',
  role: 'moderator',
  contributor_agreement_signed_at: new Date().toISOString(),
  contributor_bio_short: 'moderator, local test',
});

// Pick two existing pieces if available so we can stage pending drafts on
// one and published signed content on the other. If the catalog is empty,
// run the main seed first so we don't have to fall back to ad-hoc fixtures.
let { data: pieces } = await admin.from('pieces').select('id, title').limit(2);
if (!pieces || pieces.length === 0) {
  console.log('  pieces table empty — running supabase/seed.ts first…');
  const { spawnSync } = await import('node:child_process');
  const seedRun = spawnSync('bun', ['run', 'supabase/seed.ts'], { stdio: 'inherit' });
  if (seedRun.status !== 0) {
    throw new Error('supabase/seed.ts failed; run it manually then retry seed-local-queue.ts');
  }
  ({ data: pieces } = await admin.from('pieces').select('id, title').limit(2));
}
if (!pieces || pieces.length === 0) {
  throw new Error('pieces table still empty after running supabase/seed.ts');
}
const pendingPieceId = pieces[0].id;
const publishedPieceId = pieces[1]?.id ?? pendingPieceId;

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
const modClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const hajiClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const benClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

{
  const { error } = await staffClient.auth.signInWithPassword({ email: 'staff@local.test', password: 'stafflocal' });
  if (error) throw new Error(`sign-in staff: ${error.message}`);
}
{
  const { error } = await modClient.auth.signInWithPassword({ email: 'mod@local.test', password: 'modlocal' });
  if (error) throw new Error(`sign-in mod: ${error.message}`);
}
{
  const { error } = await hajiClient.auth.signInWithPassword({ email: 'haji@local.test', password: 'hajilocal' });
  if (error) throw new Error(`sign-in haji: ${error.message}`);
}
{
  const { error } = await benClient.auth.signInWithPassword({ email: 'ben@local.test', password: 'benlocal' });
  if (error) throw new Error(`sign-in ben: ${error.message}`);
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

// --- Slice C: stacked landmarks on the Bach Suite No. 1 Prélude ---

const LANDMARK_PIECE_ID = 'bach-cello-suite-1';
let preludeId: string | null = null;
let hajiLandmarkId: string | null = null;
let benLandmarkId: string | null = null;
let preludeMovementEdited = false;

const { data: prelude } = await admin
  .from('movements')
  .select('id, ordinal, name, tempo_indication, key_signature, meter')
  .eq('piece_id', LANDMARK_PIECE_ID)
  .eq('ordinal', 1)
  .is('deleted_at', null)
  .maybeSingle();

if (prelude) {
  preludeId = prelude.id as string;

  // Reset prior landmarks for both contributors on this piece so re-running is clean.
  // Hard-delete to avoid orphan vote rows pointing at soft-removed landmarks.
  const { data: existingLandmarks } = await admin
    .from('landmarks')
    .select('id')
    .eq('piece_id', LANDMARK_PIECE_ID)
    .in('contributor_id', [hajiId, benId]);
  if (existingLandmarks && existingLandmarks.length > 0) {
    const ids = existingLandmarks.map((r) => r.id as string);
    await admin.from('votes').delete().eq('subject_table', 'landmarks').in('subject_id', ids);
    await admin.from('landmark_versions').delete().in('landmark_id', ids);
    await admin.from('landmarks').delete().in('id', ids);
  }

  // Haji's landmark — same anchor as Ben's (m. 1-4), rich payload (2 flags + 2 practice notes).
  const { data: hajiLm, error: hajiLmErr } = await hajiClient.rpc('publish_contributor_landmark', {
    p_piece_id: LANDMARK_PIECE_ID,
    p_movement_id: preludeId,
    p_measure_start: 1,
    p_measure_end: 4,
    p_label: 'Opening arpeggios — bow plan',
    p_description:
      'The first four bars set the rhetoric for the whole movement. Plan the bow so the dominant pedal at m. 4 still has somewhere to go.',
    p_flags: [
      { type: 'bow_control', severity: 'notable' },
      { type: 'sustained_bowing', severity: 'informational' },
    ],
    p_practice_notes: [
      {
        body: 'Practice the four bars under a single down-bow at quarter=50 to hear the architecture before the printed slurring breaks it up.',
      },
      {
        body: 'Then restore the printed bowing but keep the long arc in your ear — the slurs should feel like punctuation, not segmentation.',
      },
    ],
  });
  if (hajiLmErr) throw new Error(`publish haji landmark: ${hajiLmErr.message}`);
  hajiLandmarkId = hajiLm as string;

  // Ben's landmark — same opening, narrower (m. 1-2), sparser payload (no flags, 1 practice note).
  // Renders as a sibling in the stack at the same anchor; vote ordering decides who is on top.
  const { data: benLm, error: benLmErr } = await benClient.rpc('publish_contributor_landmark', {
    p_piece_id: LANDMARK_PIECE_ID,
    p_movement_id: preludeId,
    p_measure_start: 1,
    p_measure_end: 4,
    p_label: 'Opening: let the string speak',
    p_description:
      'The opening pair of bars are about resonance, not articulation. Find the weight of the bow on the string and let the G-string ring under everything that follows.',
    p_flags: [],
    p_practice_notes: [
      {
        body: "Drop the bow from a few centimetres above the string on beat one — gravity, not pressure. If the resonance dies before m. 3, the bow plan is wrong.",
      },
    ],
  });
  if (benLmErr) throw new Error(`publish ben landmark: ${benLmErr.message}`);
  benLandmarkId = benLm as string;

  // Cross-votes so the stack has a clear top. Ben upvotes Haji; Haji downvotes Ben.
  // Net: Haji +1, Ben -1 — Haji renders on top of the stack, Ben is the cycle target.
  {
    const { error } = await benClient.rpc('cast_vote', {
      p_subject_table: 'landmarks',
      p_subject_id: hajiLandmarkId,
      p_vote_value: 1,
    });
    if (error) throw new Error(`cast_vote ben→haji: ${error.message}`);
  }
  {
    const { error } = await hajiClient.rpc('cast_vote', {
      p_subject_table: 'landmarks',
      p_subject_id: benLandmarkId,
      p_vote_value: -1,
    });
    if (error) throw new Error(`cast_vote haji→ben: ${error.message}`);
  }

  // Movement edit history — flip the Prélude's tempo_indication so the change-log
  // and version history have something to render. Idempotent: only edit if the
  // current value differs from what we want to set.
  const targetTempo = 'Moderato';
  if ((prelude.tempo_indication ?? null) !== targetTempo) {
    const { error } = await staffClient.rpc('update_movement', {
      p_movement_id: preludeId,
      p_ordinal: prelude.ordinal,
      p_name: prelude.name,
      p_tempo_indication: targetTempo,
      p_key_signature: prelude.key_signature,
      p_meter: prelude.meter,
      p_edit_summary: 'add tempo indication for the Prélude',
    });
    if (error) throw new Error(`update_movement Prélude: ${error.message}`);
    preludeMovementEdited = true;
  }
}

// --- Pedagogical-arc fixture: Bach Suite No. 1 → No. 2 (natural next) ---
// Just one connection so the section renders with live data on first dev boot.
// Idempotent: only insert if no active connection of this exact (piece_id,
// related_piece_id, kind) tuple exists.

let pedagogicalSeeded = false;
const { data: pedagogicalNextPiece } = await admin
  .from('pieces')
  .select('id')
  .eq('id', 'bach-cello-suite-2')
  .maybeSingle();
if (preludeId && pedagogicalNextPiece) {
  const { data: existing } = await admin
    .from('pedagogical_connections')
    .select('id')
    .eq('piece_id', LANDMARK_PIECE_ID)
    .eq('related_piece_id', 'bach-cello-suite-2')
    .eq('kind', 'natural_next')
    .is('deleted_at', null)
    .maybeSingle();
  if (!existing) {
    const { error } = await staffClient.rpc('create_pedagogical_connection', {
      p_piece_id: LANDMARK_PIECE_ID,
      p_related_piece_id: 'bach-cello-suite-2',
      p_kind: 'natural_next',
      p_note: 'The D minor Suite is the natural follow-on — same key architecture, fresh harmonic weight.',
    });
    if (error) throw new Error(`create_pedagogical_connection: ${error.message}`);
    pedagogicalSeeded = true;
  }
}

// --- v0.5.0 contribution-request drafts demo ---
// Three requests total, all idempotent:
//   1. SENT from staff → haji on Bach Suite No. 1 with 3 drafts. Recipient
//      triage: visit /piece/bach-cello-suite-1 as haji → inline cards.
//   2. SENT from mod → haji on Bach Suite No. 1 with 1 performer's note
//      draft. Multi-sender bell; archive visible under mod on /admin Requests.
//   3. OUTBOX from staff → ben on Bach Suite No. 2 with 2 drafts (unsent).
//      Resume → link visible under staff on /admin Requests.
//
// Cleanup wipes everything the previous run of this script or the retired
// draft-approval pipeline might have left around: any contribution request
// marked with the DEMO tag, plus every sent_request_archive row for the
// three demo senders.

const DEMO_TAG = 'V5-DEMO';

// Delete any prior DEMO requests (outbox OR sent) and their archive copies.
{
  const { data: prev } = await admin
    .from('contribution_requests')
    .select('id')
    .like('note', `${DEMO_TAG}%`);
  if (prev && prev.length > 0) {
    await admin.from('contribution_requests').delete().in('id', prev.map((r) => r.id));
  }
  const { data: prevArchive } = await admin
    .from('sent_request_archive')
    .select('id')
    .like('note', `${DEMO_TAG}%`);
  if (prevArchive && prevArchive.length > 0) {
    await admin.from('sent_request_archive').delete().in('id', prevArchive.map((r) => r.id));
  }
}
// Also purge any un-cleared contribution_requested notifications to haji
// from prior runs so the bell doesn't re-render stale ones.
await admin.from('notifications').delete().eq('recipient_id', hajiId);

let demoSentStaffId: string | null = null;
let demoSentModId: string | null = null;
let demoOutboxStaffId: string | null = null;

// 1. SENT from staff → haji with 3 drafts on Bach Suite No. 1
{
  const { data: reqId, error } = await staffClient.rpc('create_outbox_request', {
    p_piece_id: LANDMARK_PIECE_ID,
    p_recipient_id: hajiId,
    p_note: `${DEMO_TAG}: drafted these three on the G major Suite — your voice would round them out.`,
  });
  if (error) throw new Error(`staff outbox → haji: ${error.message}`);
  demoSentStaffId = reqId as string;

  await staffClient.rpc('propose_draft', {
    p_request_id: demoSentStaffId,
    p_kind: 'performers_note',
    p_payload: {
      body: "Sender's draft: the opening prelude rewards a single mental down-bow across the first four bars before the printed bowing kicks in — try practicing it that way once before restoring the marked slurs.",
    },
  });
  await staffClient.rpc('propose_draft', {
    p_request_id: demoSentStaffId,
    p_kind: 'interpretive_school',
    p_payload: {
      name: 'Modernist clarity',
      body: "Sender's school draft: a metronomic, evenly weighted reading that treats every sixteenth as equal architecture — minimal rubato, maximal counterpoint visibility. Suits a hall, suits a recording, doesn't pretend to be HIP.",
    },
  });
  await staffClient.rpc('propose_draft', {
    p_request_id: demoSentStaffId,
    p_kind: 'piece_description',
    p_payload: {
      body: "Sender's description draft: the G major Suite is the cellist's first long-form solo conversation with their instrument. Every register, every gesture, the entire bow plan tested across a single key center.",
    },
  });

  await staffClient.rpc('send_request', { p_request_id: demoSentStaffId });
}

// 2. SENT from mod → haji with 1 performer's note draft on Bach Suite No. 1
{
  const { data: reqId, error } = await modClient.rpc('create_outbox_request', {
    p_piece_id: LANDMARK_PIECE_ID,
    p_recipient_id: hajiId,
    p_note: `${DEMO_TAG}: one thought on your phrasing of the opening — open to your read.`,
  });
  if (error) throw new Error(`mod outbox → haji: ${error.message}`);
  demoSentModId = reqId as string;

  await modClient.rpc('propose_draft', {
    p_request_id: demoSentModId,
    p_kind: 'performers_note',
    p_payload: {
      body: "Moderator's draft: consider treating the last beat of m. 2 as an upbeat into m. 3 rather than closing on it — the phrase wants one long line through the dominant.",
    },
  });

  await modClient.rpc('send_request', { p_request_id: demoSentModId });
}

// 3. OUTBOX from staff → ben on Bach Suite No. 2 (unsent; Resume flow)
{
  const SECOND_PIECE = 'bach-cello-suite-2';
  const { data: p } = await admin.from('pieces').select('id').eq('id', SECOND_PIECE).maybeSingle();
  if (p) {
    const { data: reqId, error } = await staffClient.rpc('create_outbox_request', {
      p_piece_id: SECOND_PIECE,
      p_recipient_id: benId,
      p_note: `${DEMO_TAG}: drafting for the D minor — will add a landmark before I send.`,
    });
    if (error) throw new Error(`staff outbox → ben: ${error.message}`);
    demoOutboxStaffId = reqId as string;

    await staffClient.rpc('propose_draft', {
      p_request_id: demoOutboxStaffId,
      p_kind: 'performers_note',
      p_payload: {
        body: "Sender's draft (in progress): the D minor Prelude's opening figure is about weight and the G string — treat it like a Sarabande before the bow plan kicks in.",
      },
    });
    await staffClient.rpc('propose_draft', {
      p_request_id: demoOutboxStaffId,
      p_kind: 'piece_description',
      p_payload: {
        body: "Sender's description draft (in progress): the D minor is the Suite where Bach's rhetoric turns inward. Less about architecture than about weight — the cellist's first test of how much silence a phrase can hold.",
      },
    });
    // Intentionally NOT calling send_request — this stays in outbox state
    // so you can hit /admin/requests → Resume → land in drafting mode.
  }
}

console.log('Local fixtures seeded.');
if (publishedPieceId !== pendingPieceId) {
  console.log(`  published piece:    ${publishedPieceId}`);
  console.log(`    schools:          ${publishedSchoolIds.join(', ')}`);
  console.log(`    description:      ${publishedDescriptionId}`);
} else {
  console.log('  (only one piece in catalog — skipped published fixtures)');
}
if (preludeId) {
  console.log(`  landmarks on ${LANDMARK_PIECE_ID} Prélude:`);
  console.log(`    haji landmark:    ${hajiLandmarkId}   (m. 1-4, +1, top of stack)`);
  console.log(`    ben landmark:     ${benLandmarkId}   (m. 1-4, -1, cycle target)`);
  if (preludeMovementEdited) {
    console.log(`    movement edit:    Prélude tempo_indication set (history row created)`);
  } else {
    console.log(`    movement edit:    skipped (Prélude tempo already set)`);
  }
} else {
  console.log(`  landmarks: skipped — ${LANDMARK_PIECE_ID} Prélude not found in movements`);
}
if (demoSentStaffId) {
  console.log(`  contribution-request drafts (v0.5.0):`);
  console.log(`    sent from staff → haji on ${LANDMARK_PIECE_ID}:  ${demoSentStaffId}  (3 drafts)`);
  if (demoSentModId) {
    console.log(`    sent from mod → haji on ${LANDMARK_PIECE_ID}:    ${demoSentModId}  (1 draft)`);
  }
  if (demoOutboxStaffId) {
    console.log(`    outbox staff → ben on bach-cello-suite-2:        ${demoOutboxStaffId}  (2 drafts, unsent)`);
  }
}
console.log('  users:');
console.log('    contributors: haji@local.test / hajilocal,  ben@local.test / benlocal');
console.log('    staff admin:  staff@local.test / stafflocal');
console.log('    moderator:    mod@local.test / modlocal');
console.log('\nNext:');
console.log('  1. bun run dev:local');
console.log(`  2. Sign in as haji → /piece/${LANDMARK_PIECE_ID}`);
console.log(`     · four "Proposed by ..." cards inline (3 from Staff + 1 from Mod)`);
console.log(`     · /notifications Messages tab shows two request rows`);
console.log(`     · /notifications Open items tab has a 4-count badge`);
console.log('  3. Sign in as staff → /admin → Requests tab');
console.log('     · Outbox: one "→ Ben Cellist" in-progress entry (Resume → drafting mode)');
console.log(`     · Sent:   one "→ Haji Kim" archive row on ${LANDMARK_PIECE_ID}`);
console.log('  4. Sign in as mod → /admin → Requests tab');
console.log('     · Outbox: empty');
console.log(`     · Sent:   one "→ Haji Kim" archive row on ${LANDMARK_PIECE_ID}`);
console.log('  5. Click Resume on staff outbox → lands on /piece/bach-cello-suite-2?compose=<id>');
console.log('     · drafting banner visible, composer panel with 2 drafts, Add draft of remaining kind works');
console.log('  Private routes redirect anon users silently:');
console.log('    /admin /maestro /notifications → /?signin=1');
