// HMAC-SHA256 signing for one-click unsubscribe tokens.
//
// Pure Web Crypto so this file works in Deno (edge functions) and is mirrored
// to src/lib/unsubscribeToken.ts for the Astro/Node runtime that verifies the
// link. Keep both files in sync — they sign and verify against the same
// shared UNSUBSCRIBE_SECRET.
//
// Token shape: hex(hmac-sha256(secret, "<user_id>:<kind>")). No expiry — the
// link should keep working indefinitely so a recipient who archives an old
// digest can still unsubscribe months later.

export type UnsubscribeKind = "weekly" | "notification";

const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export async function signUnsubscribeToken(
  secret: string,
  userId: string,
  kind: UnsubscribeKind,
): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${userId}:${kind}`));
  return toHex(sig);
}

export function buildUnsubscribeUrl(opts: {
  origin: string;
  userId: string;
  kind: UnsubscribeKind;
  token: string;
}): string {
  const params = new URLSearchParams({ u: opts.userId, k: opts.kind, t: opts.token });
  return `${opts.origin}/unsubscribe?${params.toString()}`;
}
