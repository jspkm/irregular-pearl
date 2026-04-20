// Integration-test helpers for the contributor pipeline RPCs.
//
// These tests run against a real local Supabase stack (`supabase start`) via
// the bun test runner. They create real auth users, real pieces, exercise the
// security-definer RPCs, and clean up after themselves.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (loaded
// from .env.test via --env-file at the bun invocation).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL!;
const ANON = process.env.SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!URL || !ANON || !SERVICE) {
  throw new Error(
    'Integration tests require SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Run via `bun run test:integration` which loads .env.test.',
  );
}

export const admin: SupabaseClient = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function anon(): SupabaseClient {
  return createClient(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Creates a fresh auth user and returns a client signed in as that user.
// Optionally promotes to contributor (via direct admin UPDATE — bypasses the
// seed-contributor script's public.users path for test brevity).
export async function createAuthUser(opts: {
  email?: string;
  password?: string;
  isContributor?: boolean;
  isStaff?: boolean; // sets users.role = 'admin'
  contributorBioShort?: string;
  displayName?: string;
}): Promise<{ id: string; email: string; client: SupabaseClient }> {
  const email = opts.email ?? `test-${crypto.randomUUID()}@example.com`;
  const password = opts.password ?? 'test-password-1234';

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: opts.displayName ? { display_name: opts.displayName } : undefined,
  });
  if (createErr) throw new Error(`createUser: ${createErr.message}`);

  const userId = created.user!.id;

  // The auto_create_user_profile trigger already inserted into public.users.
  // Patch the fields we care about for this test.
  const patch: Record<string, unknown> = {};
  if (opts.displayName) patch.display_name = opts.displayName;
  if (opts.isContributor) {
    patch.is_contributor = true;
    patch.contributor_active = true;
    patch.contributor_agreement_signed_at = new Date().toISOString();
  }
  if (opts.contributorBioShort) patch.contributor_bio_short = opts.contributorBioShort;
  if (opts.isStaff) patch.role = 'admin';

  if (Object.keys(patch).length > 0) {
    const { error: updateErr } = await admin.from('users').update(patch).eq('id', userId);
    if (updateErr) throw new Error(`update users: ${updateErr.message}`);
  }

  // Sign in to get a JWT'd client. The returned client's calls will see
  // `auth.uid() = userId` inside RPCs.
  const client = createClient(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) throw new Error(`signIn: ${signInErr.message}`);

  return { id: userId, email, client };
}

export async function deleteAuthUser(id: string): Promise<void> {
  // auth.users cascade to public.users and everything below.
  await admin.auth.admin.deleteUser(id);
}

export async function createTestPiece(id: string, title = 'Test Piece'): Promise<void> {
  const { error } = await admin.from('pieces').upsert({
    id,
    title,
    composer_name: 'Anonymous',
    era: 'Baroque',
    form: 'test',
    instruments: [],
    difficulty: 'intermediate',
    description: '',
  });
  if (error) throw new Error(`insert piece: ${error.message}`);
}

export async function deleteTestPiece(id: string): Promise<void> {
  // Null current_version_id first so we can delete version rows, then the
  // composite FK cascade handles the rest.
  await admin.from('performers_notes').update({ current_version_id: null, status: 'removed' }).eq('piece_id', id);
  await admin.from('performers_note_versions').delete().eq('piece_id', id);
  await admin.from('performers_notes').delete().eq('piece_id', id);
  await admin.from('pieces').delete().eq('id', id);
}

// Convenience: count notifications scoped to a performer's note (polymorphic).
export async function countNotifications(
  noteId: string,
  opts: { onlyUncleared?: boolean } = {},
): Promise<number> {
  let q = admin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('subject_table', 'performers_notes')
    .eq('subject_id', noteId);
  if (opts.onlyUncleared) q = q.is('cleared_at', null);
  const { count, error } = await q;
  if (error) throw new Error(`count notifications: ${error.message}`);
  return count ?? 0;
}
