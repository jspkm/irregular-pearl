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
  TOKENS,
  card,
  heading,
  kicker,
  paragraph,
  primaryButton,
  renderEmailLayout,
} from "../_lib/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface NotificationRow {
  id: string;
  recipient_id: string;
  performers_note_id: string;
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

interface NoteWithPiece {
  note_id: string;
  piece: PieceRef;
}

async function fetchAndSendDigests(): Promise<{ sent: number; skipped: number; errors: string[] }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  // Unsent, un-cleared notifications. One email per notification, ever —
  // the bell + /notifications provide the ongoing nag.
  const { data: rows } = await supabase
    .from("notifications")
    .select("id, recipient_id, performers_note_id, body, link_path, created_at")
    .is("cleared_at", null)
    .is("last_digest_sent_at", null)
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) {
    return { sent: 0, skipped: 0, errors: [] };
  }

  // Group by recipient.
  const byRecipient = new Map<string, NotificationRow[]>();
  for (const n of rows as NotificationRow[]) {
    const arr = byRecipient.get(n.recipient_id) ?? [];
    arr.push(n);
    byRecipient.set(n.recipient_id, arr);
  }

  // Batch-fetch the performers_notes + pieces referenced across all recipients.
  const noteIds = [...new Set((rows as NotificationRow[]).map((n) => n.performers_note_id))];
  const { data: notesData } = await supabase
    .from("performers_notes")
    .select("id, piece_id")
    .in("id", noteIds);
  const pieceIds = [...new Set((notesData ?? []).map((n: any) => n.piece_id))];
  const { data: piecesData } = pieceIds.length
    ? await supabase.from("pieces").select("id, title, catalog_number, composer_name").in("id", pieceIds)
    : { data: [] };
  const pieceById = new Map<string, PieceRef>();
  for (const p of (piecesData ?? []) as PieceRef[]) pieceById.set(p.id, p);
  const noteToPiece = new Map<string, NoteWithPiece>();
  for (const n of (notesData ?? []) as Array<{ id: string; piece_id: string }>) {
    const piece = pieceById.get(n.piece_id);
    if (piece) noteToPiece.set(n.id, { note_id: n.id, piece });
  }

  for (const [recipientId, notifications] of byRecipient) {
    try {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(recipientId);
      if (!authUser?.email) {
        skipped++;
        continue;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", recipientId)
        .single();
      const firstName = (profile?.display_name ?? "").split(" ")[0] || "there";

      const html = renderNotificationDigest({
        recipientName: firstName,
        count: notifications.length,
        items: notifications.map((n) => ({
          body: n.body,
          linkPath: n.link_path,
          piece: noteToPiece.get(n.performers_note_id)?.piece ?? null,
        })),
      });

      const subject = notifications.length === 1
        ? "1 draft awaits your review"
        : `${notifications.length} drafts await your review`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Irregular Pearl <hello@irregularpearl.org>",
          to: [authUser.email],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        errors.push(`Resend failed for ${authUser.email}: ${errText}`);
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
    const deepLink = `https://irregularpearl.org${item.linkPath}`;
    const inner = `
      ${pieceLabel ? heading(pieceLabel, { level: "h3", href: deepLink }) : ""}
      ${composer ? `<div style="padding-top:2px;">${paragraph(`by ${composer}`, { muted: true })}</div>` : ""}
      <div style="padding-top:8px;">${paragraph(item.body)}</div>
    `;
    return card({ html: inner, accent: true });
  }).join("\n");

  const queueUrl = "https://irregularpearl.org/notifications";

  const bodyHtml = `
    <div style="padding-bottom:12px;">${paragraph(greeting)}</div>
    <div style="padding-bottom:20px;">${paragraph(lede, { muted: true })}</div>
    <div style="padding-bottom:12px;">${kicker("Awaiting your review")}</div>
    ${itemsHtml}
    <div align="center" style="padding:24px 0 8px;">
      ${primaryButton({ text: "Open your queue", href: queueUrl })}
    </div>
    <div style="padding-top:16px;text-align:center;">
      <span style="font-family:${TOKENS.sans};font-size:11px;color:${TOKENS.hint};">
        Approve, edit, or send back from the queue. This email won't repeat for the same draft.
      </span>
    </div>
  `;

  return renderEmailLayout({
    title:
      opts.count === 1
        ? "Irregular Pearl — 1 draft awaits your review"
        : `Irregular Pearl — ${opts.count} drafts await your review`,
    preheader: lede,
    subtitle: "Awaiting review",
    bodyHtml,
    footerNote: "You're receiving this because a draft was routed to your byline.",
    footerLink: { text: "Open your queue", href: queueUrl },
  });
}

Deno.serve(async (_req) => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500 });
  }

  try {
    const result = await fetchAndSendDigests();
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
