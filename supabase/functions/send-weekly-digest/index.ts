// Supabase Edge Function: send-weekly-digest
// Triggered weekly via GitHub Actions cron (Sundays 13:00 UTC = 09:00 ET).
// Fetches users with email_weekly_digest=true, renders a digest for each,
// and sends via Resend.
//
// Invoke: POST /functions/v1/send-weekly-digest
// Auth: requires SUPABASE_SERVICE_ROLE_KEY in Authorization header

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  TOKENS,
  card,
  esc,
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

const SITE_ORIGIN = "https://irregularpearl.org";
const FROM_ADDRESS = "Irregular Pearl <noreply@irregularpearl.org>";
const UNSUBSCRIBE_MAILTO = "mailto:unsubscribe@irregularpearl.org?subject=unsubscribe-weekly";

interface DigestPiece {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[];
  era: string;
  description: string;
}

function renderPieceCard(p: DigestPiece): string {
  const meta = [p.instruments.slice(0, 2).join(", "), p.era].filter(Boolean).join(" · ");
  const desc = p.description.length > 140
    ? p.description.slice(0, 140).replace(/\s+\S*$/, "") + "..."
    : p.description;
  const url = `https://irregularpearl.org/piece/${p.id}`;

  const inner = `
    <div style="display:flex;justify-content:space-between;font-family:${TOKENS.sans};font-size:11px;color:${TOKENS.accent};letter-spacing:0.08em;font-weight:500;text-transform:uppercase;">
      <span>${esc(meta)}</span>
      ${p.catalog_number ? `<span style="color:${TOKENS.muted};">${esc(p.catalog_number)}</span>` : ""}
    </div>
    <div style="padding-top:6px;">${heading(p.title, { level: "h3", href: url })}</div>
    <div style="padding-top:4px;">${paragraph(p.composer_name, { muted: true })}</div>
    ${desc ? `<div style="padding-top:10px;">${paragraph(desc, { family: "serif" })}</div>` : ""}
  `;

  return card({ html: inner, accent: true });
}

function renderStatBlock(opts: { totalPieces: number; piecesCount: number }): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
<tr>
  <td width="50%" align="center" style="padding:14px 0;border:1px solid ${TOKENS.border};border-radius:8px 0 0 8px;border-right:0;">
    <div style="font-family:${TOKENS.serif};font-size:26px;color:${TOKENS.ink};">${opts.totalPieces}</div>
    <div style="font-family:${TOKENS.sans};font-size:10px;color:${TOKENS.muted};text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">Pieces</div>
  </td>
  <td width="50%" align="center" style="padding:14px 0;border:1px solid ${TOKENS.border};border-radius:0 8px 8px 0;">
    <div style="font-family:${TOKENS.serif};font-size:26px;color:${TOKENS.ink};">${opts.piecesCount}</div>
    <div style="font-family:${TOKENS.sans};font-size:10px;color:${TOKENS.muted};text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">New this week</div>
  </td>
</tr>
</table>`;
}

function renderWeeklyDigest(opts: {
  recipientName: string;
  weekRange: string;
  summary: string;
  piecesHtml: string;
  piecesCount: number;
  totalPieces: number;
  manageUrl: string;
}): string {
  const bodyHtml = `
  <div style="padding-bottom:12px;">${paragraph(`Dear ${opts.recipientName},`)}</div>
  <div style="padding-bottom:20px;">${paragraph(opts.summary, { muted: true })}</div>
  ${renderStatBlock({ totalPieces: opts.totalPieces, piecesCount: opts.piecesCount })}
  ${opts.piecesHtml
    ? `<div style="padding-bottom:12px;">${kicker("New this week")}</div>${opts.piecesHtml}`
    : ""}
  <div align="center" style="padding:24px 0 8px;">
    ${primaryButton({ text: "Open the catalog", href: SITE_ORIGIN })}
  </div>
  `;

  return renderEmailLayout({
    title: `Irregular Pearl — Weekly Digest · ${opts.weekRange}`,
    preheader: opts.summary,
    subtitle: "Weekly Digest",
    bodyHtml,
    footerNote: "You're receiving this because you opted in to the weekly digest.",
    footerLink: { text: "Manage email preferences", href: opts.manageUrl },
  });
}

function renderWeeklyDigestText(opts: {
  recipientName: string;
  weekRange: string;
  summary: string;
  pieces: DigestPiece[];
  totalPieces: number;
  manageUrl: string;
  unsubscribeUrl: string;
}): string {
  const lines: string[] = [];
  lines.push(`IrregularPearl — Weekly Digest`);
  lines.push(opts.weekRange);
  lines.push("");
  lines.push(`Dear ${opts.recipientName},`);
  lines.push("");
  lines.push(opts.summary);
  lines.push("");
  lines.push(`Pieces in catalog: ${opts.totalPieces}`);
  lines.push(`New this week: ${opts.pieces.length}`);
  lines.push("");
  if (opts.pieces.length > 0) {
    lines.push("NEW THIS WEEK");
    lines.push("-------------");
    for (const p of opts.pieces) {
      const meta = [p.instruments.slice(0, 2).join(", "), p.era].filter(Boolean).join(" · ");
      const cat = p.catalog_number ? ` · ${p.catalog_number}` : "";
      const desc = p.description.length > 200
        ? p.description.slice(0, 200).replace(/\s+\S*$/, "") + "..."
        : p.description;
      lines.push("");
      lines.push(p.title);
      lines.push(`by ${p.composer_name}${cat}`);
      if (meta) lines.push(meta);
      if (desc) lines.push(desc);
      lines.push(`${SITE_ORIGIN}/piece/${p.id}`);
    }
    lines.push("");
  }
  lines.push(`Open the catalog: ${SITE_ORIGIN}`);
  lines.push("");
  lines.push("---");
  lines.push("You're receiving this because you opted in to the weekly digest.");
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
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    }),
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: await res.text() };
}

async function fetchAndSendDigests(previewTo?: string, previewName?: string): Promise<{ sent: number; skipped: number; errors: string[] }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  const now = new Date();
  const weekEnd = now;
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const isoStart = weekStart.toISOString();
  const isoEnd = weekEnd.toISOString();

  const weekRange = `${weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  const { data: newPieces } = await supabase
    .from("pieces")
    .select("id, title, composer_name, catalog_number, instruments, era, description")
    .gte("created_at", isoStart)
    .lte("created_at", isoEnd)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: totalPieces } = await supabase.from("pieces").select("*", { count: "exact", head: true });

  const piecesHtml = (newPieces || []).map((p: any) => renderPieceCard(p)).join("\n");

  const summaryParts: string[] = [];
  if ((newPieces || []).length > 0) {
    summaryParts.push(`${(newPieces || []).length} new pieces added to the catalog this week.`);
  }
  summaryParts.push(`The catalog now holds ${totalPieces ?? 0} pieces.`);
  const summary = summaryParts.join(" ");

  // Preview mode: render one digest with real prod data and send only to
  // previewTo. Skips the recipient DB loop and all per-user personalization
  // beyond the greeting, since a single template render is sufficient for
  // visual review. The List-Unsubscribe link uses a placeholder token that
  // won't actually unsubscribe — preview is for visual QA only.
  if (previewTo) {
    const firstName = (previewName || "").split(" ")[0] || "there";
    const manageUrl = `${SITE_ORIGIN}/profile/preview?section=setting#email`;
    const html = renderWeeklyDigest({
      recipientName: firstName,
      weekRange,
      summary,
      piecesHtml,
      piecesCount: (newPieces || []).length,
      totalPieces: totalPieces ?? 0,
      manageUrl,
    });
    const text = renderWeeklyDigestText({
      recipientName: firstName,
      weekRange,
      summary,
      pieces: (newPieces ?? []) as DigestPiece[],
      totalPieces: totalPieces ?? 0,
      manageUrl,
      unsubscribeUrl: `${SITE_ORIGIN}/unsubscribe?u=preview&k=weekly&t=preview`,
    });
    const result = await sendViaResend({
      to: previewTo,
      subject: `[PREVIEW] Irregular Pearl · weekly · ${weekRange}`,
      html,
      text,
      unsubscribeUrl: null,
    });
    if (result.ok) return { sent: 1, skipped: 0, errors: [] };
    return { sent: 0, skipped: 0, errors: [`Preview send failed: ${result.error}`] };
  }

  if (!UNSUBSCRIBE_SECRET) {
    return { sent: 0, skipped: 0, errors: ["UNSUBSCRIBE_SECRET not set — refusing to send digests without one-click unsubscribe support"] };
  }

  const { data: recipients } = await supabase
    .from("users")
    .select("id, display_name, email_weekly_digest")
    .eq("email_weekly_digest", true);

  if (!recipients || recipients.length === 0) {
    return { sent: 0, skipped: 0, errors: ["No recipients with email_weekly_digest=true"] };
  }

  for (const recipient of recipients) {
    try {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(recipient.id);
      if (!authUser?.email) {
        skipped++;
        continue;
      }

      const firstName = (recipient.display_name || "").split(" ")[0] || "there";
      const manageUrl = `${SITE_ORIGIN}/profile/${recipient.id}?section=setting#email`;
      const token = await signUnsubscribeToken(UNSUBSCRIBE_SECRET, recipient.id, "weekly");
      const unsubscribeUrl = buildUnsubscribeUrl({ origin: SITE_ORIGIN, userId: recipient.id, kind: "weekly", token });

      const html = renderWeeklyDigest({
        recipientName: firstName,
        weekRange,
        summary,
        piecesHtml,
        piecesCount: (newPieces || []).length,
        totalPieces: totalPieces ?? 0,
        manageUrl,
      });
      const text = renderWeeklyDigestText({
        recipientName: firstName,
        weekRange,
        summary,
        pieces: (newPieces ?? []) as DigestPiece[],
        totalPieces: totalPieces ?? 0,
        manageUrl,
        unsubscribeUrl,
      });

      const result = await sendViaResend({
        to: authUser.email,
        subject: `Irregular Pearl · weekly · ${weekRange}`,
        html,
        text,
        unsubscribeUrl,
      });

      if (result.ok) {
        sent++;
        console.log(`Digest sent to ${authUser.email} (${firstName})`);
      } else {
        errors.push(`Failed for ${authUser.email}: ${result.error}`);
      }
    } catch (err) {
      errors.push(`Error for ${recipient.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { sent, skipped, errors };
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
    console.log(`Weekly digest complete: ${result.sent} sent, ${result.skipped} skipped, ${result.errors.length} errors`);

    return new Response(JSON.stringify(result), {
      status: result.errors.length > 0 && result.sent === 0 ? 500 : 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
