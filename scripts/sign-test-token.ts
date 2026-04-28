// Dev utility: sign a one-click unsubscribe token against the local
// UNSUBSCRIBE_SECRET so you can curl /unsubscribe end-to-end without
// running an edge function. Mirrors what send-weekly-digest /
// send-notification-digest do per recipient.
//
// Usage:
//   bun --env-file=.env run scripts/sign-test-token.ts <user-uuid> [weekly|notification]
//
// Pipe into curl:
//   TOK=$(bun --env-file=.env run scripts/sign-test-token.ts $UID weekly)
//   curl "http://localhost:4321/unsubscribe?u=$UID&k=weekly&t=$TOK"

import { signUnsubscribeToken } from '../src/lib/unsubscribeToken.ts';

const secret = process.env.UNSUBSCRIBE_SECRET;
if (!secret) {
  console.error('UNSUBSCRIBE_SECRET not set. Run via `bun --env-file=.env run ...`.');
  process.exit(1);
}

const userId = process.argv[2];
const kind = (process.argv[3] ?? 'weekly') as 'weekly' | 'notification';
if (!userId) {
  console.error('Usage: sign-test-token.ts <user-uuid> [weekly|notification]');
  process.exit(1);
}

const token = await signUnsubscribeToken(secret, userId, kind);
console.log(token);
