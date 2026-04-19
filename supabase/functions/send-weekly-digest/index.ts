// Supabase Edge Function: send-weekly-digest
// Triggered weekly via GitHub Actions cron (Mondays 03:00 UTC).
// Fetches all users with email_weekly_digest=true, renders a digest for each,
// and sends via Resend.
//
// Invoke: POST /functions/v1/send-weekly-digest
// Auth: requires SUPABASE_SERVICE_ROLE_KEY in Authorization header

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

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
  const desc = p.description.length > 140 ? p.description.slice(0, 140).replace(/\s+\S*$/, "") + "..." : p.description;
  const url = `https://irregularpearl.org/piece/${p.id}`;

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;background:#FFF;border:1px solid #E7E5E4;border-left:3px solid #B45309;">
<tr><td style="padding:18px 20px;border-radius:8px;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr><td style="font-family:'Courier New',monospace;font-size:10px;color:#B45309;letter-spacing:0.06em;text-transform:uppercase;">${esc(meta)}</td>
    ${p.catalog_number ? `<td align="right" style="font-family:'Courier New',monospace;font-size:10px;color:#78716C;">${esc(p.catalog_number)}</td>` : ""}</tr>
    <tr><td colspan="2" style="padding-top:6px;padding-bottom:4px;font-family:Georgia,serif;font-size:18px;color:#1C1917;line-height:1.25;">
      <a href="${url}" style="text-decoration:none;color:#1C1917;" target="_blank">${esc(p.title)}</a>
    </td></tr>
    <tr><td colspan="2" style="padding-bottom:${desc ? "10px" : "0"};font-family:Arial,sans-serif;font-size:13px;color:#78716C;">${esc(p.composer_name)}</td></tr>
    ${desc ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:13px;color:#1C1917;line-height:1.55;">${esc(desc)}</td></tr>` : ""}
  </table>
</td></tr></table>`;
}

function renderDigest(opts: {
  recipientName: string;
  weekRange: string;
  summary: string;
  piecesHtml: string;
  piecesCount: number;
  totalPieces: number;
  unsubscribeUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Irregular Pearl — Weekly Digest</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%}table,td{border-collapse:collapse}body{margin:0;padding:0;background:#FAF8F5}
@media only screen and (max-width:620px){.w{width:100%!important}.wi{padding:0 16px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;-webkit-font-smoothing:antialiased;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FAF8F5;">
<tr><td align="center" valign="top" style="padding:32px 0 48px;">
<table role="presentation" class="w" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">

<!-- HEADER -->
<tr><td class="wi" align="center" style="padding:0 24px 24px;">
  <div style="font-family:Georgia,serif;font-size:34px;font-style:italic;color:#1C1917;padding:20px 0 8px;">
    <a href="https://irregularpearl.org" style="text-decoration:none;color:#1C1917;">Irregular Pearl</a>
  </div>
  <div style="font-family:Arial,sans-serif;font-size:11px;color:#78716C;letter-spacing:0.12em;text-transform:uppercase;padding-bottom:20px;">Weekly Digest</div>
  <div style="border-top:1px solid #E7E5E4;"></div>
</td></tr>

<!-- GREETING -->
<tr><td class="wi" style="padding:0 24px 8px;font-family:Arial,sans-serif;font-size:15px;color:#1C1917;">
  Dear ${esc(opts.recipientName)},
</td></tr>

<!-- SUMMARY -->
<tr><td class="wi" style="padding:0 24px 20px;font-family:Arial,sans-serif;font-size:14px;color:#57534E;line-height:1.65;">
  ${esc(opts.summary)}
</td></tr>

<!-- AT A GLANCE -->
<tr><td class="wi" style="padding:0 24px 20px;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td width="50%" align="center" style="padding:12px 0;border:1px solid #E7E5E4;border-radius:8px 0 0 8px;">
        <div style="font-family:'Courier New',monospace;font-size:24px;color:#B45309;font-weight:500;">${opts.totalPieces}</div>
        <div style="font-family:Arial,sans-serif;font-size:10px;color:#78716C;text-transform:uppercase;letter-spacing:0.08em;">Pieces</div>
      </td>
      <td width="50%" align="center" style="padding:12px 0;border:1px solid #E7E5E4;border-left:0;border-radius:0 8px 8px 0;">
        <div style="font-family:'Courier New',monospace;font-size:24px;color:#B45309;font-weight:500;">${opts.piecesCount}</div>
        <div style="font-family:Arial,sans-serif;font-size:10px;color:#78716C;text-transform:uppercase;letter-spacing:0.08em;">New This Week</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- NEW PIECES -->
${opts.piecesHtml ? `<tr><td class="wi" style="padding:0 24px 20px;">
  <div style="font-family:Georgia,serif;font-size:18px;color:#1C1917;padding-bottom:12px;border-bottom:2px solid #B45309;">New Pieces</div>
  <div style="margin-top:12px;">${opts.piecesHtml}</div>
</td></tr>` : ""}

<!-- CTA -->
<tr><td align="center" style="padding:12px 24px 48px;">
  <a href="https://irregularpearl.org" style="display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:500;color:#FFF;text-decoration:none;padding:13px 32px;border-radius:8px;background:#B45309;" target="_blank">Explore Irregular Pearl</a>
</td></tr>

<!-- FOOTER -->
<tr><td class="wi" align="center" style="padding:0 24px 8px;">
  <div style="font-family:Georgia,serif;font-size:18px;font-style:italic;color:#78716C;margin-bottom:12px;">Irregular Pearl</div>
  <div style="font-family:Arial,sans-serif;font-size:11px;color:#A8A29E;margin-top:16px;line-height:1.6;">
    You're receiving this because you opted in to weekly digests.<br/>
    <a href="${esc(opts.unsubscribeUrl)}" style="color:#A8A29E;text-decoration:underline;" target="_blank">Unsubscribe</a>
  </div>
</td></tr>

<tr><td class="wi" style="padding:24px 24px 0;"><div style="border-top:2px solid #B45309;"></div></td></tr>

</table>
</td></tr></table>
</body></html>`;
}

async function fetchAndSendDigests(): Promise<{ sent: number; skipped: number; errors: string[] }> {
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
      const unsubscribeUrl = `https://irregularpearl.org/settings#email`;

      const html = renderDigest({
        recipientName: firstName,
        weekRange,
        summary,
        piecesHtml,
        piecesCount: (newPieces || []).length,
        totalPieces: totalPieces ?? 0,
        unsubscribeUrl,
      });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Irregular Pearl <hello@irregularpearl.org>",
          to: [authUser.email],
          subject: `Your Weekly Digest — ${weekRange}`,
          html,
        }),
      });

      if (res.ok) {
        sent++;
        console.log(`Digest sent to ${authUser.email} (${firstName})`);
      } else {
        const err = await res.text();
        errors.push(`Failed for ${authUser.email}: ${err}`);
      }
    } catch (err) {
      errors.push(`Error for ${recipient.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { sent, skipped, errors };
}

Deno.serve(async (_req) => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500 });
  }

  try {
    const result = await fetchAndSendDigests();
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
