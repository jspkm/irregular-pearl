// POST /api/draft-contribution-note
// Drafts a short personal note (< 280 chars) for a contribution request.
// Called by the "Help me with note" / "Rewrite" affordance in the
// RequestContributionDialog. Uses Anthropic's API directly (no SDK
// dependency) to keep the Cloudflare Worker runtime lean.
//
// Requires ANTHROPIC_API_KEY as an env var. In local dev set it in
// .env; in production set it via the Cloudflare Worker environment.

import type { APIRoute } from 'astro';

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

export const POST: APIRoute = async ({ request, locals }) => {
  const apiKey =
    (locals as { runtime?: { env?: { ANTHROPIC_API_KEY?: string } } }).runtime?.env
      ?.ANTHROPIC_API_KEY ||
    import.meta.env.ANTHROPIC_API_KEY ||
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined);

  if (!apiKey) {
    console.error('draft-note: ANTHROPIC_API_KEY is not set');
    return json({ error: USER_FACING_FAILURE }, 503);
  }

  let body: DraftRequest;
  try {
    body = (await request.json()) as DraftRequest;
  } catch (err) {
    console.error('draft-note: invalid json body', err);
    return json({ error: USER_FACING_FAILURE }, 400);
  }

  const senderName = (body.senderName ?? '').trim();
  const recipientName = (body.recipientName ?? '').trim();
  const recipientFirstName = (body.recipientFirstName ?? recipientName).trim();
  const pieceTitle = (body.pieceTitle ?? '').trim();
  const composerName = (body.composerName ?? '').trim();

  if (!recipientName || !pieceTitle || !composerName) {
    console.error('draft-note: missing fields', {
      hasRecipient: !!recipientName,
      hasPiece: !!pieceTitle,
      hasComposer: !!composerName,
    });
    return json({ error: USER_FACING_FAILURE }, 400);
  }

  const prompt = [
    `You are drafting a short personal note from one classical musician to another.`,
    `The sender${senderName ? ` (${senderName})` : ''} is using Irregular Pearl — a classical music knowledge platform where musicians write signed notes on pieces — to ask ${recipientName} to contribute on:`,
    `  Piece: ${pieceTitle}`,
    `  Composer: ${composerName}`,
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
