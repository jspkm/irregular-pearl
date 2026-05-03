// One-shot test setup for the contributor-profile-link change.
// Creates two users with usernames + bio_short, then publishes signed
// content on a piece so all surfaces are visible.
//
// Run: bun run scripts/seed-profile-link-test.ts

import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';

function readEnv(): { url: string; serviceKey: string } {
  const r = spawnSync('supabase', ['status', '-o', 'env'], { encoding: 'utf-8' });
  if (r.status !== 0) {
    console.error(r.stderr || 'supabase status failed');
    process.exit(1);
  }
  const env: Record<string, string> = {};
  for (const line of r.stdout.split('\n')) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (m) env[m[1]] = m[2];
  }
  return { url: env.API_URL!, serviceKey: env.SERVICE_ROLE_KEY! };
}

const { url, serviceKey } = readEnv();
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const PIECE_ID = 'bach-cello-suite-1';

async function ensureUser(email: string, displayName: string, username: string, bioShort: string): Promise<string> {
  let userId: string;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
  });
  if (error && error.code === 'email_exists') {
    const r = spawnSync('supabase', ['db', 'query', `SELECT id::text FROM auth.users WHERE email = '${email}'`], { encoding: 'utf-8' });
    const m = r.stdout.match(/"id":\s*"([0-9a-f-]+)"/);
    if (!m) throw new Error(`could not find existing user ${email}: ${r.stderr}`);
    userId = m[1];
  } else if (error || !data?.user) {
    throw error ?? new Error('createUser failed');
  } else {
    userId = data.user.id;
  }
  const { error: upErr } = await sb
    .from('users')
    .update({
      display_name: displayName,
      username,
      contributor_bio_short: bioShort,
      contributor_agreement_signed_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (upErr) throw upErr;
  return userId;
}

async function publishDescription(pieceId: string, contributorId: string, body: string) {
  const { data: existing } = await sb
    .from('piece_descriptions')
    .select('id')
    .eq('piece_id', pieceId)
    .eq('contributor_id', contributorId)
    .maybeSingle();
  if (existing) return;

  const { data: desc, error: dErr } = await sb
    .from('piece_descriptions')
    .insert({
      piece_id: pieceId,
      contributor_id: contributorId,
      status: 'draft',
      drafted_by: contributorId,
    })
    .select('id')
    .single();
  if (dErr || !desc) throw dErr;

  const { data: ver, error: vErr } = await sb
    .from('piece_description_versions')
    .insert({
      description_id: desc.id,
      piece_id: pieceId,
      contributor_id: contributorId,
      body,
      authored_by: contributorId,
      approved_at: new Date().toISOString(),
      version_number: 1,
    })
    .select('id')
    .single();
  if (vErr || !ver) throw vErr;

  const { error: upErr } = await sb
    .from('piece_descriptions')
    .update({
      current_version_id: ver.id,
      status: 'published',
      approved_by: contributorId,
      approved_by_contributor_at: new Date().toISOString(),
    })
    .eq('id', desc.id);
  if (upErr) throw upErr;
}

async function publishNote(pieceId: string, contributorId: string, body: string) {
  const { data: existing } = await sb
    .from('performers_notes')
    .select('id')
    .eq('piece_id', pieceId)
    .eq('contributor_id', contributorId)
    .maybeSingle();
  if (existing) return;

  const { data: note, error: nErr } = await sb
    .from('performers_notes')
    .insert({
      piece_id: pieceId,
      contributor_id: contributorId,
      status: 'draft',
      drafted_by: contributorId,
    })
    .select('id')
    .single();
  if (nErr || !note) throw nErr;

  const { data: ver, error: vErr } = await sb
    .from('performers_note_versions')
    .insert({
      note_id: note.id,
      piece_id: pieceId,
      contributor_id: contributorId,
      body,
      authored_by: contributorId,
      approved_at: new Date().toISOString(),
      version_number: 1,
    })
    .select('id')
    .single();
  if (vErr || !ver) throw vErr;

  const { error: upErr } = await sb
    .from('performers_notes')
    .update({
      current_version_id: ver.id,
      status: 'published',
      approved_by: contributorId,
      approved_by_contributor_at: new Date().toISOString(),
    })
    .eq('id', note.id);
  if (upErr) throw upErr;
}

async function publishSchool(
  pieceId: string,
  contributorId: string,
  name: string,
  body: string,
) {
  const { data: existing } = await sb
    .from('interpretive_schools')
    .select('id')
    .eq('piece_id', pieceId)
    .eq('contributor_id', contributorId)
    .eq('name', name)
    .maybeSingle();
  if (existing) return;

  const { data: school, error: sErr } = await sb
    .from('interpretive_schools')
    .insert({
      piece_id: pieceId,
      contributor_id: contributorId,
      name,
      status: 'draft',
      drafted_by: contributorId,
    })
    .select('id')
    .single();
  if (sErr || !school) throw sErr;

  const { data: ver, error: vErr } = await sb
    .from('interpretive_school_versions')
    .insert({
      school_id: school.id,
      piece_id: pieceId,
      contributor_id: contributorId,
      body,
      authored_by: contributorId,
      approved_at: new Date().toISOString(),
      version_number: 1,
    })
    .select('id')
    .single();
  if (vErr || !ver) throw vErr;

  const { error: upErr } = await sb
    .from('interpretive_schools')
    .update({
      current_version_id: ver.id,
      status: 'published',
      approved_by: contributorId,
      approved_by_contributor_at: new Date().toISOString(),
    })
    .eq('id', school.id);
  if (upErr) throw upErr;
}

async function publishDifficulty(pieceId: string, contributorId: string) {
  const { data: existing } = await sb
    .from('piece_difficulty_ratings')
    .select('id')
    .eq('piece_id', pieceId)
    .eq('contributor_id', contributorId)
    .maybeSingle();
  if (existing) return;

  const { error } = await sb.from('piece_difficulty_ratings').insert({
    piece_id: pieceId,
    contributor_id: contributorId,
    status: 'published',
    technical_level: 4,
    technical_note: 'String crossings demand a steady plane.',
    stamina_level: 3,
    stamina_note: null,
    interpretive_level: 5,
    interpretive_note: 'The Prélude alone takes a lifetime.',
    ensemble_level: 1,
    ensemble_note: null,
  });
  if (error) throw error;
}

async function publishLandmark(
  pieceId: string,
  contributorId: string,
  movementId: string,
  label: string,
  description: string,
  measureStart: number,
) {
  const { data: existing } = await sb
    .from('landmarks')
    .select('id')
    .eq('piece_id', pieceId)
    .eq('movement_id', movementId)
    .eq('contributor_id', contributorId)
    .maybeSingle();
  if (existing) return;

  const { data: lm, error: lErr } = await sb
    .from('landmarks')
    .insert({
      piece_id: pieceId,
      movement_id: movementId,
      contributor_id: contributorId,
      status: 'draft',
      drafted_by: contributorId,
    })
    .select('id')
    .single();
  if (lErr || !lm) throw lErr;

  const { data: ver, error: vErr } = await sb
    .from('landmark_versions')
    .insert({
      landmark_id: lm.id,
      piece_id: pieceId,
      movement_id: movementId,
      contributor_id: contributorId,
      label,
      description,
      measure_start: measureStart,
      measure_end: null,
      ordinal: 1,
      flags: [],
      practice_notes: [],
      authored_by: contributorId,
      approved_at: new Date().toISOString(),
      version_number: 1,
    })
    .select('id')
    .single();
  if (vErr || !ver) throw vErr;

  const { error: upErr } = await sb
    .from('landmarks')
    .update({
      current_version_id: ver.id,
      status: 'published',
      approved_by: contributorId,
      approved_by_contributor_at: new Date().toISOString(),
    })
    .eq('id', lm.id);
  if (upErr) throw upErr;
}

async function main() {
  console.log('Creating test users...');
  const aliceId = await ensureUser(
    'alice@test.local',
    'Alice Bartók',
    'alice',
    'Cellist · Berlin Philharmonic',
  );
  const bobId = await ensureUser(
    'bob@test.local',
    'Bob Casals',
    'bob',
    'Pedagogue · Curtis',
  );
  // Carol has NO username — used to verify the /profile/{id} fallback
  const carolId = await ensureUser(
    'carol@test.local',
    'Carol Du Pré',
    null as unknown as string, // intentionally unset; ensureUser will set null below
    'Soloist · no profile slug yet',
  );
  await sb.from('users').update({ username: null }).eq('id', carolId);

  console.log(`  Alice ${aliceId} (@alice)`);
  console.log(`  Bob   ${bobId} (@bob)`);
  console.log(`  Carol ${carolId} (no username)`);

  console.log(`Publishing signed content on ${PIECE_ID}...`);
  await publishDescription(
    PIECE_ID,
    aliceId,
    'The first Suite is a study in openness — every phrase folds back into the dominant before resolving home. Most students mistake its candor for ease.',
  );
  await publishDescription(
    PIECE_ID,
    carolId,
    'A second voice on this piece, from a contributor without a public username yet — the link should still go to their profile by id.',
  );

  await publishNote(
    PIECE_ID,
    bobId,
    'Treat the Prélude as a slow exhale; the bow change at the climax should be invisible. Reset before each new tonal area.',
  );
  await publishNote(
    PIECE_ID,
    aliceId,
    'For the Allemande: think of the dotted figures as breath, not articulation.',
  );

  await publishSchool(
    PIECE_ID,
    aliceId,
    'Historically informed',
    'Gut strings, baroque bow, no end-pin. The dance idiom returns once the instrument resists you.',
  );
  await publishSchool(
    PIECE_ID,
    bobId,
    'Romantic',
    'Sustain the line; let the cello sing through the 19th-century hall it now lives in.',
  );

  await publishDifficulty(PIECE_ID, aliceId);

  // Landmark needs a movement id — pick the first movement on this piece.
  const { data: mvmts } = await sb
    .from('movements')
    .select('id')
    .eq('piece_id', PIECE_ID)
    .order('ordinal')
    .limit(1);
  if (mvmts && mvmts.length > 0) {
    await publishLandmark(
      PIECE_ID,
      bobId,
      mvmts[0].id,
      'Pedal-G climax',
      'The long G pedal builds tension across eight measures; resist crescendoing too early.',
      31,
    );
  } else {
    console.warn('  No movements on piece — skipping landmark.');
  }

  console.log('\nDone. Test the page at:');
  console.log(`  http://localhost:4321/piece/${PIECE_ID}`);
  console.log('\nSign-in credentials (any of):');
  console.log('  alice@test.local / password123');
  console.log('  bob@test.local   / password123');
  console.log('  carol@test.local / password123');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
