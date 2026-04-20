#!/usr/bin/env bun
// Generates a magic-link URL for a local-dev user. Opens a browser window
// (or prints the URL) so you can sign in without the Google-OAuth flow.
//
// Usage:
//   bun --env-file=.env.development.local run scripts/magic-link.ts <email> [path]
//   bun --env-file=.env.development.local run scripts/magic-link.ts haji@local.test --open
//   bun --env-file=.env.development.local run scripts/magic-link.ts staff@local.test /admin/performers-notes --open

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'node:child_process';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const email = positional[0];
const path = positional[1] ?? '/notifications';
if (!email) {
  console.error('Usage: bun --env-file=.env.development.local run scripts/magic-link.ts <email> [path] [--open]');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo: `http://localhost:4321${path}` },
});
if (error) {
  console.error(`generateLink: ${error.message}`);
  process.exit(1);
}

// The action_link points at the Supabase auth endpoint; opening it sets the
// session cookie and redirects to redirectTo.
const link = data.properties?.action_link;
if (!link) {
  console.error('No action_link returned.');
  process.exit(1);
}

console.log(`\nMagic link for ${email}:\n`);
console.log(link);
console.log('\nThe link redirects to /notifications after sign-in.\n');

if (process.argv.includes('--open')) {
  spawn('open', [link], { stdio: 'ignore', detached: true }).unref();
}
