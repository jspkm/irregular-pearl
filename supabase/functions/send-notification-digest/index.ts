// Supabase Edge Function: send-notification-digest
// Triggered daily via GitHub Actions cron.
// Gathers un-cleared, un-emailed notifications per recipient and sends
// one digest email grouping them by piece. On success, marks each included
// notification with last_digest_sent_at = now() so it's not re-sent tomorrow.
// The bell + queue page remain the ongoing nag; the email is a one-shot
// heads-up when a draft first lands.
//
// Invoke: POST /functions/v1/send-notification-digest
// Auth:   requires SUPABASE_SERVICE_ROLE_KEY in Authorization header

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  card,
  heading,
  kicker,
  paragraph,
  primaryButton,
  renderEmailLayout,
} from "../_lib/email-template.ts";
import { buildUnsubscribeUrl, signUnsubscribeToken } from "../_lib/unsubscribe-token.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UNSUBSCRIBE_SECRET = Deno.env.get("UNSUBSCRIBE_SECRET");
const EMAIL_REPLY_TO = Deno.env.get("EMAIL_REPLY_TO");

const SITE_ORIGIN = "https://irregularpearl.org";
const FROM_ADDRESS = "Irregular Pearl <noreply@irregularpearl.org>";
const UNSUBSCRIBE_MAILTO = "mailto:unsubscribe@irregularpearl.org?subject=unsubscribe-notification";

interface NotificationRow {
  id: string;
  recipient_id: string;
  subject_table: string;
  subject_id: string;
  body: string;
  link_path: string;
  created_at: string;
}

interface PieceRef {
  id: string;
  title: string;
  catalog_number: string | null;
  composer_name: string;
}

// Subject tables that route through the contributor approval pipeline.
// Keep in sync with src/lib/contributorSubjects.ts — the edge function runs
// in Deno and can't import TypeScript from src/, so this is a local mirror.
const SUBJECT_TABLES = [
  'performers_notes',
  'interpretive_schools',
  'piece_descriptions',
] as const;

async function fetchAndSendDigests(previewTo?: string, previewName?: string): Promise<{ sent: number; skipped: number; errors: string[] }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  // Preview mode: pull the most recent notifications (regardless of cleared /
  // digest-sent state) so the preview always has content, render ONE digest
  // grouping them, send only to previewTo, and skip the last_digest_sent_at
  // stamp so prod state is untouched.
  if (previewTo) {
    const { data: sampleRows } = await supabase
      .from("notifications")
      .select("id, recipient_id, subject_table, subject_id, body, link_path, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    // If prod has no notifications (early-stage catalog), synthesize preview
    // items against real pieces so the review still shows the shipping layout.
    let effectiveRows: NotificationRow[];
    let syntheticPieceById = new Map<string, PieceRef>();
    if (!sampleRows || sampleRows.length === 0) {
      const { data: somePieces } = await supabase
        .from("pieces")
        .select("id, title, catalog_number, composer_name")
        .order("created_at", { ascending: false })
        .limit(2);
      if (!somePieces || somePieces.length === 0) {
        return { sent: 0, skipped: 0, errors: ["No notifications and no pieces in prod — nothing to preview against"] };
      }
      const synthetic: NotificationRow[] = [];
      for (const p of somePieces as PieceRef[]) {
        syntheticPieceById.set(p.id, p);
        synthetic.push({
          id: `preview-${p.id}`,
          recipient_id: "preview",
          subject_table: "__preview__",
          subject_id: p.id,
          body: "Sample draft body: a contributor submitted a performer's note for this piece. Approve, request a revision, or let it sit for another reviewer.",
          link_path: `/piece/${p.id}#performers-notes`,
          created_at: new Date().toISOString(),
        });
      }
      effectiveRows = synthetic;
    } else {
      effectiveRows = sampleRows as NotificationRow[];
    }

    // Enrich subject → piece for pretty rendering.
    const sampleSubjectToPiece = new Map<string, string>();
    const samplePieceIds = new Set<string>();
    const sampleIdsByTable = new Map<string, Set<string>>();
    for (const n of effectiveRows) {
      if (!(SUBJECT_TABLES as readonly string[]).includes(n.subject_table)) continue;
      const set = sampleIdsByTable.get(n.subject_table) ?? new Set<string>();
      set.add(n.subject_id);
      sampleIdsByTable.set(n.subject_table, set);
    }
    for (const [table, ids] of sampleIdsByTable) {
      const { data: subjects } = await supabase.from(table).select("id, piece_id").in("id", [...ids]);
      for (const row of (subjects ?? []) as Array<{ id: string; piece_id: string }>) {
        sampleSubjectToPiece.set(`${table}:${row.id}`, row.piece_id);
        samplePieceIds.add(row.piece_id);
      }
    }
    const { data: samplePieces } = samplePieceIds.size
      ? await supabase.from("pieces").select("id, title, catalog_number, composer_name").in("id", [...samplePieceIds])
      : { data: [] };
    const samplePieceById = new Map<string, PieceRef>();
    for (const p of (samplePieces ?? []) as PieceRef[]) samplePieceById.set(p.id, p);
    for (const [id, p] of syntheticPieceById) samplePieceById.set(id, p);

    const firstName = (previewName || "").split(" ")[0] || "there";
    const items = effectiveRows.map((n) => {
      const pieceId = sampleSubjectToPiece.get(`${n.subject_table}:${n.subject_id}`)
        ?? (syntheticPieceById.has(n.subject_id) ? n.subject_id : undefined);
      return {
        body: n.body,
        linkPath: n.link_path,
        piece: pieceId ? samplePieceById.get(pieceId) ?? null : null,
      };
    });
    const manageUrl = `${SITE_ORIGIN}/profile/preview?section=setting#email`;
    const html = renderNotificationDigest({
      recipientId: "preview",
      recipientName: firstName,
      count: effectiveRows.length,
      items,
    });
    const text = renderNotificationDigestText({
      recipientId: "preview",
      recipientName: firstName,
      count: effectiveRows.length,
      items,
      manageUrl,
      unsubscribeUrl: `${SITE_ORIGIN}/unsubscribe?u=preview&k=notification&t=preview`,
    });

    const subject = effectiveRows.length === 1
      ? "[PREVIEW] Irregular Pearl: 1 draft awaits your review"
      : `[PREVIEW] Irregular Pearl: ${effectiveRows.length} drafts await your review`;

    const result = await sendViaResend({
      to: previewTo,
      subject,
      html,
      text,
      unsubscribeUrl: null,
    });

    if (result.ok) return { sent: 1, skipped: 0, errors: [] };
    return { sent: 0, skipped: 0, errors: [`Preview send failed: ${result.error}`] };
  }

  // Unsent, un-cleared notifications. One email per notification, ever —
  // the bell + /notifications provide the ongoing nag.
  const { data: rows } = await supabase
    .from("notifications")
    .select("id, recipient_id, subject_table, subject_id, body, link_path, created_at")
    .is("cleared_at", null)
    .is("last_digest_sent_at", null)
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) {
    return { sent: 0, skipped: 0, errors: [] };
  }

  if (!UNSUBSCRIBE_SECRET) {
    return { sent: 0, skipped: 0, errors: ["UNSUBSCRIBE_SECRET not set — refusing to send digests without one-click unsubscribe support"] };
  }

  // Group by recipient.
  const byRecipient = new Map<string, NotificationRow[]>();
  for (const n of rows as NotificationRow[]) {
    const arr = byRecipient.get(n.recipient_id) ?? [];
    arr.push(n);
    byRecipient.set(n.recipient_id, arr);
  }

  // Batch-fetch subjects per subject_table (O(tables) round trips). Each
  // supported subject table has a `piece_id` column, so the projection is
  // uniform.
  const idsByTable = new Map<string, Set<string>>();
  for (const n of rows as NotificationRow[]) {
    if (!(SUBJECT_TABLES as readonly string[]).includes(n.subject_table)) continue;
    const set = idsByTable.get(n.subject_table) ?? new Set<string>();
    set.add(n.subject_id);
    idsByTable.set(n.subject_table, set);
  }

  const subjectToPiece = new Map<string, string>(); // "<table>:<id>" → piece_id
  const pieceIdSet = new Set<string>();
  for (const [table, ids] of idsByTable) {
    const { data: subjects } = await supabase
      .from(table)
      .select("id, piece_id")
      .in("id", [...ids]);
    for (const row of (subjects ?? []) as Array<{ id: string; piece_id: string }>) {
      subjectToPiece.set(`${table}:${row.id}`, row.piece_id);
      pieceIdSet.add(row.piece_id);
    }
  }

  const { data: piecesData } = pieceIdSet.size
    ? await supabase.from("pieces").select("id, title, catalog_number, composer_name").in("id", [...pieceIdSet])
    : { data: [] };
  const pieceById = new Map<string, PieceRef>();
  for (const p of (piecesData ?? []) as PieceRef[]) pieceById.set(p.id, p);

  for (const [recipientId, notifications] of byRecipient) {
    try {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(recipientId);
      if (!authUser?.email) {
        skipped++;
        continue;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("display_name, email_notification_digest")
        .eq("id", recipientId)
        .single();

      // Missing profile row — auth.users exists but public.users doesn't
      // (orphaned notifications, deleted account, RLS mismatch). Treat as
      // hard-skip: do not send with a default "there" greeting.
      if (!profile) {
        skipped++;
        continue;
      }

      // Respect the recipient's Notification Email pref. Still stamp
      // last_digest_sent_at so the in-product bell remains the nag; if they
      // later opt in we don't flood them with backlog.
      if ((profile as { email_notification_digest?: boolean }).email_notification_digest === false) {
        const ids = notifications.map((n) => n.id);
        const { error: updateErr } = await supabase
          .from("notifications")
          .update({ last_digest_sent_at: new Date().toISOString() })
          .in("id", ids);
        if (updateErr) {
          errors.push(`Opted-out ${recipientId} but failed to stamp last_digest_sent_at: ${updateErr.message}`);
        }
        skipped++;
        continue;
      }

      const firstName = (profile?.display_name ?? "").split(" ")[0] || "there";
      const items = notifications.map((n) => {
        const pieceId = subjectToPiece.get(`${n.subject_table}:${n.subject_id}`);
        return {
          body: n.body,
          linkPath: n.link_path,
          piece: pieceId ? pieceById.get(pieceId) ?? null : null,
        };
      });
      const manageUrl = `${SITE_ORIGIN}/profile/${recipientId}?section=setting#email`;
      const token = await signUnsubscribeToken(UNSUBSCRIBE_SECRET!, recipientId, "notification");
      const unsubscribeUrl = buildUnsubscribeUrl({ origin: SITE_ORIGIN, userId: recipientId, kind: "notification", token });

      const html = renderNotificationDigest({
        recipientId,
        recipientName: firstName,
        count: notifications.length,
        items,
      });
      const text = renderNotificationDigestText({
        recipientId,
        recipientName: firstName,
        count: notifications.length,
        items,
        manageUrl,
        unsubscribeUrl,
      });

      const subject = notifications.length === 1
        ? "Irregular Pearl: 1 draft awaits your review"
        : `Irregular Pearl: ${notifications.length} drafts await your review`;

      const result = await sendViaResend({
        to: authUser.email,
        subject,
        html,
        text,
        unsubscribeUrl,
      });

      if (!result.ok) {
        errors.push(`Resend failed for ${authUser.email}: ${result.error}`);
        // Do NOT update last_digest_sent_at — next run retries.
        continue;
      }

      // Mark these notifications as mailed so tomorrow's run skips them.
      const ids = notifications.map((n) => n.id);
      const { error: updateErr } = await supabase
        .from("notifications")
        .update({ last_digest_sent_at: new Date().toISOString() })
        .in("id", ids);
      if (updateErr) {
        errors.push(`Mailed ${authUser.email} but failed to update last_digest_sent_at: ${updateErr.message}`);
      }

      sent++;
      console.log(`Digest sent to ${authUser.email} (${firstName}) — ${notifications.length} item(s)`);
    } catch (err) {
      errors.push(`Error for recipient ${recipientId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { sent, skipped, errors };
}

function renderNotificationDigest(opts: {
  recipientId: string;
  recipientName: string;
  count: number;
  items: Array<{ body: string; linkPath: string; piece: PieceRef | null }>;
}): string {
  const greeting = `Dear ${opts.recipientName},`;
  const lede = opts.count === 1
    ? "A draft is waiting for your review."
    : `${opts.count} drafts are waiting for your review.`;

  const itemsHtml = opts.items.map((item) => {
    const pieceLabel = item.piece
      ? `${item.piece.title}${item.piece.catalog_number ? ` · ${item.piece.catalog_number}` : ""}`
      : null;
    const composer = item.piece?.composer_name;
    const deepLink = `${SITE_ORIGIN}${item.linkPath}`;
    const inner = `
      ${pieceLabel ? heading(pieceLabel, { level: "h3", href: deepLink }) : ""}
      ${composer ? `<div style="padding-top:2px;">${paragraph(`by ${composer}`, { muted: true })}</div>` : ""}
      <div style="padding-top:8px;">${paragraph(item.body)}</div>
    `;
    return card({ html: inner, accent: true });
  }).join("\n");

  const queueUrl = `${SITE_ORIGIN}/notifications`;

  const bodyHtml = `
    <div style="padding-bottom:12px;">${paragraph(greeting)}</div>
    <div style="padding-bottom:20px;">${paragraph(lede, { muted: true })}</div>
    <div style="padding-bottom:12px;">${kicker("Awaiting your review")}</div>
    ${itemsHtml}
    <div align="center" style="padding:24px 0 8px;">
      ${primaryButton({ text: "View message", href: queueUrl })}
    </div>
  `;

  return renderEmailLayout({
    title:
      opts.count === 1
        ? "Irregular Pearl — 1 draft awaits your review"
        : `Irregular Pearl — ${opts.count} drafts await your review`,
    preheader: lede,
    subtitle: "Notifications",
    bodyHtml,
    footerNote: "You're receiving this because a draft was routed to your byline.",
    footerLink: { text: "Manage email preferences", href: `${SITE_ORIGIN}/profile/${opts.recipientId}?section=setting#email` },
  });
}

function renderNotificationDigestText(opts: {
  recipientId: string;
  recipientName: string;
  count: number;
  items: Array<{ body: string; linkPath: string; piece: PieceRef | null }>;
  manageUrl: string;
  unsubscribeUrl: string;
}): string {
  const lines: string[] = [];
  lines.push("IrregularPearl — Notifications");
  lines.push("");
  lines.push(`Dear ${opts.recipientName},`);
  lines.push("");
  lines.push(opts.count === 1
    ? "A draft is waiting for your review."
    : `${opts.count} drafts are waiting for your review.`);
  lines.push("");
  lines.push("AWAITING YOUR REVIEW");
  lines.push("--------------------");
  for (const item of opts.items) {
    const pieceLabel = item.piece
      ? `${item.piece.title}${item.piece.catalog_number ? ` · ${item.piece.catalog_number}` : ""}`
      : null;
    lines.push("");
    if (pieceLabel) lines.push(pieceLabel);
    if (item.piece?.composer_name) lines.push(`by ${item.piece.composer_name}`);
    lines.push(item.body);
    lines.push(`${SITE_ORIGIN}${item.linkPath}`);
  }
  lines.push("");
  lines.push(`Open the queue: ${SITE_ORIGIN}/notifications`);
  lines.push("");
  lines.push("---");
  lines.push("You're receiving this because a draft was routed to your byline.");
  lines.push(`Manage email preferences: ${opts.manageUrl}`);
  lines.push(`Unsubscribe: ${opts.unsubscribeUrl}`);
  lines.push("");
  lines.push("Irregular Pearl — a non-profit, community-driven classical music knowledge hub.");
  return lines.join("\n");
}

interface SendInputs {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string | null;
}

async function sendViaResend(inputs: SendInputs): Promise<{ ok: boolean; error?: string }> {
  const headers: Record<string, string> = {};
  if (inputs.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${inputs.unsubscribeUrl}>, <${UNSUBSCRIBE_MAILTO}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [inputs.to],
      subject: inputs.subject,
      html: inputs.html,
      text: inputs.text,
      ...(EMAIL_REPLY_TO ? { reply_to: EMAIL_REPLY_TO } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    }),
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: await res.text() };
}

Deno.serve(async (req) => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500 });
  }

  let previewTo: string | undefined;
  let previewName: string | undefined;
  try {
    const body = await req.json();
    previewTo = body?.preview_to;
    previewName = body?.preview_name;
  } catch {
    // Cron invocation has no body; that's fine.
  }

  try {
    const result = await fetchAndSendDigests(previewTo, previewName);
    console.log(
      `Notification digest complete: ${result.sent} sent, ${result.skipped} skipped, ${result.errors.length} errors`,
    );

    return new Response(JSON.stringify(result), {
      status: result.errors.length > 0 && result.sent === 0 ? 500 : 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
