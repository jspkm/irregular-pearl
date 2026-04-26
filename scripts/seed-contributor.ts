#!/usr/bin/env bun
// Mark an existing auth user as a signed contributor.
//
// Looks up the user by email in auth.users, then stamps
// contributor_agreement_signed_at on public.users (and optionally
// contributor_bio_short). Slice C governance opened self-authoring to any
// registered user — the old is_contributor/contributor_active flag columns
// were dropped — but the agreement timestamp + bio remain real fields used
// by the bylined surfaces. Idempotent — re-running refreshes the same
// fields.
//
// Usage:
//   bun run scripts/seed-contributor.ts <email> [bio_short]
//
// Requires in the environment (picks up .env.local by default):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Load your .env.local (e.g. `bun --env-file=.env.local run scripts/seed-contributor.ts ...`).');
  process.exit(1);
}

const [email, bioShort] = process.argv.slice(2);
if (!email) {
  console.error('Usage: bun run scripts/seed-contributor.ts <email> [bio_short]');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error(`Failed to list auth users: ${listErr.message}`);
  process.exit(1);
}

const target = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!target) {
  console.error(`No auth user found for email ${email}.`);
  process.exit(1);
}

const patch: Record<string, unknown> = {
  contributor_agreement_signed_at: new Date().toISOString(),
};
if (bioShort) patch.contributor_bio_short = bioShort;

const { data: updated, error: updateErr } = await admin
  .from('users')
  .update(patch)
  .eq('id', target.id)
  .select('id, display_name, contributor_agreement_signed_at, contributor_bio_short')
  .single();

if (updateErr) {
  console.error(`Failed to update public.users: ${updateErr.message}`);
  process.exit(1);
}

console.log('Contributor promoted.');
console.log(JSON.stringify(updated, null, 2));
