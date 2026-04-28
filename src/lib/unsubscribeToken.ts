// Mirror of supabase/functions/_lib/unsubscribe-token.ts for the Astro/Node
// runtime. The edge functions sign tokens; this side verifies them when a
// recipient clicks the unsubscribe link. Keep the two files in sync — both
// must hash the same `<user_id>:<kind>` payload with HMAC-SHA256 against
// the shared UNSUBSCRIBE_SECRET.

export type UnsubscribeKind = 'weekly' | 'notification';

const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

export async function signUnsubscribeToken(
  secret: string,
  userId: string,
  kind: UnsubscribeKind,
): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${userId}:${kind}`));
  return toHex(sig);
}

// Constant-time compare to avoid timing-leak token recovery.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyUnsubscribeToken(
  secret: string,
  userId: string,
  kind: UnsubscribeKind,
  token: string,
): Promise<boolean> {
  if (!secret || !userId || !kind || !token) return false;
  if (!/^[0-9a-f]{64}$/i.test(token)) return false;
  const expected = await signUnsubscribeToken(secret, userId, kind);
  return timingSafeEqual(expected.toLowerCase(), token.toLowerCase());
}

export function isUnsubscribeKind(s: string | null | undefined): s is UnsubscribeKind {
  return s === 'weekly' || s === 'notification';
}
