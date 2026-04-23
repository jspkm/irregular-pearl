// POST /api/draft-contribution-note
// Drafts a short personal note (< 280 chars) for a contribution request.
// Called by the "Help me with note" / "Rewrite" affordance in the
// RequestContributionDialog. Uses Anthropic's API directly (no SDK
// dependency) to keep the Cloudflare Worker runtime lean.
//
// Requires ANTHROPIC_API_KEY as an env var. In local dev set it in
// .env; in production set it via the Cloudflare Worker environment.
//
// Auth: the caller must pass a Supabase session access token as
// `Authorization: Bearer <token>`. We verify the token against the
// project and rate-limit via log_draft_note_request() (20/user/24h
// default, tunable in app_config). Anonymous callers are rejected —
// this endpoint costs real Anthropic tokens per request.

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

interface DraftRequest {
  senderName?: string;
  recipientName?: string;
  recipientFirstName?: string;
  pieceTitle?: string;
  composerName?: string;
}

// User-facing copy for any failure. Implementation details (missing key,
// bad request, upstream error, etc.) go to the server log, never to the
// response body.
const USER_FACING_FAILURE =
  'Note drafting is unavailable right now. Try again shortly, or write the note yourself.';
const USER_FACING_RATE_LIMIT =
  "You've drafted a lot of notes in the last day. Try again tomorrow, or write the note yourself.";

// User-controlled strings get interpolated into the LLM prompt. Strip
// newlines and control chars so an attacker can't smuggle a "IGNORE
// ABOVE" block via a piece title, and cap length to keep the prompt
// bounded.
function sanitize(s: string, maxLen = 200): string {
  return s.replace(/[\r\n\t\x00-\x1f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as { runtime?: { env?: Record<string, string | undefined> } }).runtime?.env ?? {};

  const apiKey =
    env.ANTHROPIC_API_KEY ||
    import.meta.env.ANTHROPIC_API_KEY ||
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined);

  const supabaseUrl =
    env.PUBLIC_SUPABASE_URL ||
    import.meta.env.PUBLIC_SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_URL : undefined);

  const supabaseAnonKey =
    env.PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' ? process.env.PUBLIC_SUPABASE_ANON_KEY : undefined);

  if (!apiKey) {
    console.error('draft-note: ANTHROPIC_API_KEY is not set');
    return json({ error: USER_FACING_FAILURE }, 503);
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('draft-note: Supabase env is not set');
    return json({ error: USER_FACING_FAILURE }, 503);
  }

  // Auth gate: require a Supabase access token and verify it.
  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const accessToken = match?.[1]?.trim();
  if (!accessToken) {
    return json({ error: 'Sign in to draft a note.' }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    return json({ error: 'Sign in to draft a note.' }, 401);
  }

  // Staff gate + rate limit + log. RPC checks auth.uid() and role itself.
  const { error: rpcErr } = await supabase.rpc('log_draft_note_request');
  if (rpcErr) {
    if (/rate_limit/i.test(rpcErr.message)) {
      return json({ error: USER_FACING_RATE_LIMIT }, 429);
    }
    if (/staff only/i.test(rpcErr.message)) {
      return json({ error: 'Note drafting is available to staff only.' }, 403);
    }
    console.error('draft-note: log_draft_note_request failed', rpcErr);
    return json({ error: USER_FACING_FAILURE }, 503);
  }

  let body: DraftRequest;
  try {
    body = (await request.json()) as DraftRequest;
  } catch (err) {
    console.error('draft-note: invalid json body', err);
    return json({ error: USER_FACING_FAILURE }, 400);
  }

  const senderName = sanitize(body.senderName ?? '');
  const recipientName = sanitize(body.recipientName ?? '');
  const recipientFirstName = sanitize(body.recipientFirstName ?? recipientName);
  const pieceTitle = sanitize(body.pieceTitle ?? '');
  const composerName = sanitize(body.composerName ?? '');

  if (!recipientName || !pieceTitle || !composerName) {
    console.error('draft-note: missing fields', {
      hasRecipient: !!recipientName,
      hasPiece: !!pieceTitle,
      hasComposer: !!composerName,
    });
    return json({ error: USER_FACING_FAILURE }, 400);
  }

  // Framing distribution: default (≈90%) is "your insight would be valuable"
  // — recipient-centric, their perspective matters. About 10% of the time
  // the sender is personally working on the piece and asks for the
  // recipient's approach. Both stay warm and musician-to-musician.
  const personalAngle = Math.random() < 0.1;
  const framingInstruction = personalAngle
    ? [
        `FRAMING: The sender is personally working on this piece right now.`,
        `  - Lead with the sender's own work: "I've been working on this piece and..." or "I'm preparing this for a performance and..."`,
        `  - Ask a specific, inviting question about how ${recipientFirstName} approaches it.`,
        `  - The sender's curiosity is the hook.`,
      ].join('\n')
    : [
        `FRAMING: The recipient's voice is what matters. The sender wants ${recipientFirstName}'s insight captured on this piece because other musicians would benefit from hearing it.`,
        `  - DO NOT start with "I've been working on..." or "I'm preparing..." or anything about the sender's own playing or practice. The sender is not the subject; ${recipientFirstName} is.`,
        `  - DO NOT frame this as a favor ("would you mind", "could you help me"). Frame it as: their perspective would be valuable to readers.`,
        `  - Openers that work: "Your reading of..." / "You're one of the voices I'd want on..." / "Few people have lived with this piece the way you have..." / "I'd love for your perspective on ${pieceTitle} to be on the site." Pick a natural one.`,
      ].join('\n');

  const prompt = [
    `You are drafting a short personal note from one classical musician to another.`,
    `The sender${senderName ? ` (${senderName})` : ''} is using Irregular Pearl — a classical music knowledge platform where musicians write signed notes on pieces — to ask ${recipientName} to contribute on:`,
    `  Piece: ${pieceTitle}`,
    `  Composer: ${composerName}`,
    ``,
    framingInstruction,
    ``,
    `Write the note the sender would write. Constraints:`,
    `  - Greet by first name ("Dear ${recipientFirstName}," or "Hi ${recipientFirstName}," or similar warmth).`,
    `  - Two or three short sentences. Concrete, warm, not flowery.`,
    `  - Reference the piece (title fine; composer optional).`,
    `  - Musician-to-musician tone. Not corporate. Not sycophantic.`,
    `  - Under 280 characters total including the greeting.`,
    `  - Do not sign off with the sender's name (the platform shows it automatically).`,
    `  - Return ONLY the note text. No preamble, no meta-commentary, no quote marks.`,
  ].join('\n');

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('draft-note: anthropic error', res.status, errText);
      return json({ error: USER_FACING_FAILURE }, 502);
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (data.content?.[0]?.text ?? '').trim();
    if (!text) {
      console.error('draft-note: anthropic returned empty content');
      return json({ error: USER_FACING_FAILURE }, 502);
    }

    // Hard cap to match contribution_requests.note length constraint.
    const note = text.length > 280 ? text.slice(0, 277) + '…' : text;

    return json({ note }, 200);
  } catch (err) {
    console.error('draft-note: fetch threw', err);
    return json({ error: USER_FACING_FAILURE }, 502);
  }
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
