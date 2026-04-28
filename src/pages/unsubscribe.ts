// /unsubscribe — one-click unsubscribe endpoint targeted by the
// `List-Unsubscribe` header in digest emails (RFC 8058).
//
// Both verbs are supported:
//   POST — Gmail/Yahoo one-click handlers send `List-Unsubscribe=One-Click`
//          form data. We verify the HMAC-signed token and flip the matching
//          email_*_digest column to false. Returns 200 OK with no body.
//   GET  — A human clicked the link in the email. We do the same DB write
//          and render a small confirmation page. The page links to the
//          settings panel for granular control, since the URL only flips
//          one digest at a time.
//
// Auth model: the HMAC token IS the credential. No session required —
// recipients click from email without being signed in. Verification happens
// against UNSUBSCRIBE_SECRET shared between this route and the edge
// functions that sign the link. The DB write uses the service role key
// because anon RLS would require a session.

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import {
  isUnsubscribeKind,
  verifyUnsubscribeToken,
  type UnsubscribeKind,
} from '../lib/unsubscribeToken';

export const prerender = false;

const COLUMN_BY_KIND: Record<UnsubscribeKind, 'email_weekly_digest' | 'email_notification_digest'> = {
  weekly: 'email_weekly_digest',
  notification: 'email_notification_digest',
};

const HUMAN_LABEL_BY_KIND: Record<UnsubscribeKind, string> = {
  weekly: 'the weekly digest',
  notification: 'notification emails',
};

interface Env {
  unsubscribeSecret?: string;
  supabaseUrl?: string;
  serviceRoleKey?: string;
}

function readEnv(locals: unknown): Env {
  const env =
    (locals as { runtime?: { env?: Record<string, string | undefined> } } | undefined)?.runtime
      ?.env ?? {};

  const pick = (key: string): string | undefined =>
    env[key] ||
    (import.meta.env as Record<string, string | undefined>)[key] ||
    (typeof process !== 'undefined' ? process.env[key] : undefined);

  return {
    unsubscribeSecret: pick('UNSUBSCRIBE_SECRET'),
    supabaseUrl: pick('SUPABASE_URL') || pick('PUBLIC_SUPABASE_URL'),
    serviceRoleKey: pick('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

async function applyUnsubscribe(
  env: Env,
  userId: string,
  kind: UnsubscribeKind,
  token: string,
): Promise<{ ok: true } | { ok: false; status: number; reason: string }> {
  if (!env.unsubscribeSecret || !env.supabaseUrl || !env.serviceRoleKey) {
    console.error('unsubscribe: missing env', {
      hasSecret: !!env.unsubscribeSecret,
      hasUrl: !!env.supabaseUrl,
      hasServiceRole: !!env.serviceRoleKey,
    });
    return { ok: false, status: 503, reason: 'misconfigured' };
  }

  const valid = await verifyUnsubscribeToken(env.unsubscribeSecret, userId, kind, token);
  if (!valid) {
    return { ok: false, status: 400, reason: 'invalid token' };
  }

  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const column = COLUMN_BY_KIND[kind];
  const { error } = await admin.from('users').update({ [column]: false }).eq('id', userId);
  if (error) {
    console.error('unsubscribe: db update failed', error);
    return { ok: false, status: 500, reason: 'db error' };
  }

  return { ok: true };
}

function parseQuery(url: URL): { userId: string; kind: UnsubscribeKind; token: string } | null {
  const userId = url.searchParams.get('u') ?? '';
  const kindRaw = url.searchParams.get('k');
  const token = url.searchParams.get('t') ?? '';
  if (!userId || !token || !isUnsubscribeKind(kindRaw)) return null;
  return { userId, kind: kindRaw, token };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function renderConfirmation(opts: { kind: UnsubscribeKind; siteUrl: string }): string {
  const label = HUMAN_LABEL_BY_KIND[opts.kind];
  const settingsUrl = `${opts.siteUrl.replace(/\/$/, '')}/settings`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Unsubscribed — Irregular Pearl</title>
<meta name="robots" content="noindex"/>
<style>
  body { margin:0; padding:0; background:#FFFFFF; color:#1A1A1A; font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:520px; margin:0 auto; padding:64px 24px; }
  .word { font-family:Inter, Arial, sans-serif; font-size:22px; font-weight:500; color:#1A1A1A; padding-bottom:32px; }
  .word a { color:#1A1A1A; text-decoration:none; }
  h1 { font-family:'Source Serif 4', Georgia, serif; font-size:26px; font-weight:500; line-height:1.25; margin:0 0 12px; }
  p { font-family:'Source Serif 4', Georgia, serif; font-size:15px; line-height:1.68; margin:0 0 16px; color:#1A1A1A; }
  p.muted { font-family:Inter, Arial, sans-serif; font-size:13px; line-height:1.55; color:#6F6F6F; }
  a.cta { display:inline-block; background:#1A1A1A; color:#FFFFFF; text-decoration:none; font-size:14px; font-weight:500; padding:10px 20px; border-radius:12px; margin-top:8px; }
  .rule { border-top:1px solid #E5E3DE; margin:32px 0 20px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="word"><a href="${escapeHtml(opts.siteUrl)}">IrregularPearl</a></div>
    <h1>You&rsquo;re unsubscribed.</h1>
    <p>You will no longer receive ${escapeHtml(label)} from Irregular Pearl.</p>
    <p class="muted">You can re-enable this email or fine-tune the rest from the email preferences in your settings.</p>
    <a class="cta" href="${escapeHtml(settingsUrl)}">Manage email preferences</a>
    <div class="rule"></div>
    <p class="muted">Essential account emails (password resets, security alerts) are not affected.</p>
  </div>
</body>
</html>`;
}

function renderError(message: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Unsubscribe link invalid — Irregular Pearl</title>
<meta name="robots" content="noindex"/>
<style>
  body { margin:0; padding:0; background:#FFFFFF; color:#1A1A1A; font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:520px; margin:0 auto; padding:64px 24px; }
  .word { font-family:Inter, Arial, sans-serif; font-size:22px; font-weight:500; color:#1A1A1A; padding-bottom:32px; }
  h1 { font-family:'Source Serif 4', Georgia, serif; font-size:26px; font-weight:500; line-height:1.25; margin:0 0 12px; }
  p { font-family:'Source Serif 4', Georgia, serif; font-size:15px; line-height:1.68; margin:0 0 16px; color:#1A1A1A; }
  p.muted { font-family:Inter, Arial, sans-serif; font-size:13px; line-height:1.55; color:#6F6F6F; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="word">IrregularPearl</div>
    <h1>This unsubscribe link isn&rsquo;t valid.</h1>
    <p>${escapeHtml(message)}</p>
    <p class="muted">Sign in and visit your email preferences to make changes directly.</p>
  </div>
</body>
</html>`;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = readEnv(locals);
  const url = new URL(request.url);
  const parsed = parseQuery(url);
  if (!parsed) {
    return new Response(null, { status: 400 });
  }
  const result = await applyUnsubscribe(env, parsed.userId, parsed.kind, parsed.token);
  if (!result.ok) {
    return new Response(null, { status: result.status });
  }
  return new Response(null, { status: 200 });
};

export const GET: APIRoute = async ({ request, locals, url }) => {
  const env = readEnv(locals);
  const parsed = parseQuery(url);
  if (!parsed) {
    return new Response(renderError('The link is missing required parameters.'), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  const result = await applyUnsubscribe(env, parsed.userId, parsed.kind, parsed.token);
  if (!result.ok) {
    const message =
      result.reason === 'invalid token'
        ? 'The link may have been tampered with, or the secret has changed since the email was sent.'
        : 'Something went wrong on our end. Please try again in a few minutes.';
    return new Response(renderError(message), {
      status: result.status === 400 ? 400 : 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  const siteUrl = url.origin;
  return new Response(renderConfirmation({ kind: parsed.kind, siteUrl }), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
};
