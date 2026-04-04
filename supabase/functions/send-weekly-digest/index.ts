// Supabase Edge Function: send-weekly-digest
// Triggered weekly via GitHub Actions cron (Mondays 03:00 UTC).
// Fetches all users with email_weekly_digest=true, renders a personalized
// digest for each, and sends via Resend.
//
// Invoke: POST /functions/v1/send-weekly-digest
// Auth: requires SUPABASE_SERVICE_ROLE_KEY in Authorization header

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── HTML escape ──────────────────────────────────────────────────────

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Types ────────────────────────────────────────────────────────────

interface DigestPiece {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[];
  era: string;
  description: string;
}

interface DigestMember {
  id: string;
  display_name: string;
  instrument: string | null;
}

interface DigestEvent {
  id: string;
  title: string;
  venue: string | null;
  city: string | null;
  event_date: string;
  event_type: string;
}

// ── Renderers ────────────────────────────────────────────────────────

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

function renderMemberRow(m: DigestMember): string {
  const initials = m.display_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const meta = [m.instrument].filter(Boolean).join(" · ");

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #E7E5E4;">
<tr><td style="padding:14px 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
    <td width="40" valign="middle" style="padding-right:14px;">
      <div style="width:36px;height:36px;border-radius:50%;background:#FEF3C7;text-align:center;line-height:36px;font-family:Arial,sans-serif;font-size:12px;font-weight:500;color:#B45309;">${esc(initials)}</div>
    </td>
    <td valign="middle" style="font-family:Arial,sans-serif;">
      <div style="font-size:14px;font-weight:500;color:#1C1917;">${esc(m.display_name)}</div>
      ${meta ? `<div style="font-size:12px;color:#78716C;">${esc(meta)}</div>` : ""}
    </td>
  </tr></table>
</td></tr></table>`;
}

function renderEventRow(ev: DigestEvent): string {
  const d = new Date(ev.event_date + "T00:00:00");
  const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const url = `https://irregularpearl.org/events/${ev.id}`;

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #E7E5E4;">
<tr><td style="padding:12px 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
    <td width="80" valign="top" style="font-family:'Courier New',monospace;font-size:11px;color:#B45309;padding-right:12px;">${esc(dateStr)}</td>
    <td valign="top">
      <a href="${url}" style="font-family:Georgia,serif;font-size:14px;color:#1C1917;text-decoration:none;" target="_blank">${esc(ev.title)}</a>
      ${ev.venue ? `<div style="font-family:Arial,sans-serif;font-size:12px;color:#78716C;margin-top:2px;">${esc(ev.venue)}${ev.city ? `, ${esc(ev.city)}` : ""}</div>` : ""}
    </td>
    <td width="70" align="right" valign="top" style="font-family:'Courier New',monospace;font-size:10px;color:#78716C;text-transform:capitalize;">${esc(ev.event_type)}</td>
  </tr></table>
</td></tr></table>`;
}

// ── Email template ───────────────────────────────────────────────────

function renderDigest(opts: {
  recipientName: string;
  weekRange: string;
  summary: string;
  piecesHtml: string;
  membersHtml: string;
  eventsHtml: string;
  piecesCount: number;
  membersCount: number;
  totalPieces: number;
  totalMembers: number;
  unsubscribeUrl: string;
}): string {
  const eventsSection = opts.eventsHtml
    ? `<tr><td style="padding:0 24px 24px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:8px;">
<tr><td style="font-family:Georgia,serif;font-size:18px;color:#1C1917;padding-bottom:12px;border-bottom:2px solid #B45309;">This Week's Events</td></tr>
<tr><td>${opts.eventsHtml}</td></tr>
<tr><td style="padding-top:8px;"><a href="https://irregularpearl.org/events" style="font-family:Arial,sans-serif;font-size:12px;color:#B45309;text-decoration:none;" target="_blank">View all events &rarr;</a></td></tr>
</table></td></tr>`
    : "";

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
      <td width="33%" align="center" style="padding:12px 0;border:1px solid #E7E5E4;border-radius:8px 0 0 8px;">
        <div style="font-family:'Courier New',monospace;font-size:24px;color:#B45309;font-weight:500;">${opts.totalPieces}</div>
        <div style="font-family:Arial,sans-serif;font-size:10px;color:#78716C;text-transform:uppercase;letter-spacing:0.08em;">Pieces</div>
      </td>
      <td width="34%" align="center" style="padding:12px 0;border-top:1px solid #E7E5E4;border-bottom:1px solid #E7E5E4;">
        <div style="font-family:'Courier New',monospace;font-size:24px;color:#B45309;font-weight:500;">${opts.totalMembers}</div>
        <div style="font-family:Arial,sans-serif;font-size:10px;color:#78716C;text-transform:uppercase;letter-spacing:0.08em;">Members</div>
      </td>
      <td width="33%" align="center" style="padding:12px 0;border:1px solid #E7E5E4;border-radius:0 8px 8px 0;">
        <div style="font-family:'Courier New',monospace;font-size:24px;color:#B45309;font-weight:500;">${opts.piecesCount}</div>
        <div style="font-family:Arial,sans-serif;font-size:10px;color:#78716C;text-transform:uppercase;letter-spacing:0.08em;">New This Week</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- EVENTS -->
${eventsSection}

<!-- NEW PIECES -->
${opts.piecesHtml ? `<tr><td class="wi" style="padding:0 24px 20px;">
  <div style="font-family:Georgia,serif;font-size:18px;color:#1C1917;padding-bottom:12px;border-bottom:2px solid #B45309;">New Pieces</div>
  <div style="margin-top:12px;">${opts.piecesHtml}</div>
</td></tr>` : ""}

<!-- NEW MEMBERS -->
${opts.membersHtml ? `<tr><td class="wi" style="padding:0 24px 20px;">
  <div style="font-family:Georgia,serif;font-size:18px;color:#1C1917;padding-bottom:12px;border-bottom:2px solid #B45309;">New Members (${opts.membersCount})</div>
  <div style="margin-top:4px;">${opts.membersHtml}</div>
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

// ── Data fetching ────────────────────────────────────────────────────

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

  // Shared data (same for all recipients)
  const { data: newPieces } = await supabase
    .from("pieces")
    .select("id, title, composer_name, catalog_number, instruments, era, description")
    .gte("created_at", isoStart)
    .lte("created_at", isoEnd)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: newMembers } = await supabase
    .from("users")
    .select("id, display_name, instrument")
    .gte("created_at", isoStart)
    .lte("created_at", isoEnd)
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: totalPieces } = await supabase.from("pieces").select("*", { count: "exact", head: true });
  const { count: totalMembers } = await supabase.from("users").select("*", { count: "exact", head: true });

  // Upcoming events (next 7 days, all cities — personalized per user below)
  const todayStr = now.toISOString().split("T")[0];
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
  const { data: allUpcomingEvents } = await supabase
    .from("events")
    .select("id, title, venue, city, event_date, event_type")
    .eq("status", "approved")
    .gte("event_date", todayStr)
    .lte("event_date", nextWeek)
    .order("event_date", { ascending: true })
    .limit(20);

  const upcomingEvents = (allUpcomingEvents || []) as DigestEvent[];

  const piecesHtml = (newPieces || []).map((p: any) => renderPieceCard(p)).join("\n");
  const membersHtml = (newMembers || []).map((m: any) => renderMemberRow(m)).join("\n");

  // Build summary
  const summaryParts: string[] = [];
  if ((newPieces || []).length > 0) {
    summaryParts.push(`${(newPieces || []).length} new pieces added to the catalog this week.`);
  }
  if ((newMembers || []).length > 0) {
    summaryParts.push(`${(newMembers || []).length} new musicians joined.`);
  }
  if (upcomingEvents.length > 0) {
    summaryParts.push(`${upcomingEvents.length} events coming up this week.`);
  }
  summaryParts.push(`The platform now holds ${totalPieces ?? 0} pieces across ${totalMembers ?? 0} members.`);
  const summary = summaryParts.join(" ");

  // Get all users who want the weekly digest, split by role:
  // - admin/firstchair get the full analytics digest (trend charts, moderation stats)
  //   via the separate src/emails/weekly-digest.ts renderer (future: inline here too)
  // - regular users get the community digest (new pieces, events, members)
  const { data: recipients } = await supabase
    .from("users")
    .select("id, display_name, location, email_weekly_digest, role")
    .eq("email_weekly_digest", true);

  if (!recipients || recipients.length === 0) {
    return { sent: 0, skipped: 0, errors: ["No recipients with email_weekly_digest=true"] };
  }

  // Count staff for logging
  const staffCount = recipients.filter((r: any) => ["admin", "firstchair"].includes(r.role)).length;
  const communityCount = recipients.length - staffCount;
  console.log(`Recipients: ${staffCount} staff (admin digest), ${communityCount} community`);

  // Send to each recipient
  for (const recipient of recipients) {
    try {
      const isStaff = ["admin", "firstchair"].includes(recipient.role);

      // Get email from auth.users
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(recipient.id);
      if (!authUser?.email) {
        skipped++;
        continue;
      }

      const firstName = (recipient.display_name || "").split(" ")[0] || "there";

      // Staff get additional moderation stats in their summary
      let staffSummary = summary;
      if (isStaff) {
        const { count: queuedCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "queued");
        const { count: weekDiscussions } = await supabase
          .from("discussions")
          .select("*", { count: "exact", head: true })
          .gte("created_at", isoStart)
          .lte("created_at", isoEnd);
        const { count: weekActivity } = await supabase
          .from("activity_log")
          .select("*", { count: "exact", head: true })
          .gte("created_at", isoStart)
          .lte("created_at", isoEnd);

        const staffParts = [summary];
        if ((queuedCount ?? 0) > 0) staffParts.push(`${queuedCount} events in moderation queue.`);
        staffParts.push(`${weekDiscussions ?? 0} discussions, ${weekActivity ?? 0} activity logs this week.`);
        staffSummary = staffParts.join(" ");
      }

      // Personalize events: prioritize user's city
      const userCity = (recipient.location || "").split(",")[0].trim();
      let personalizedEvents = upcomingEvents;
      if (userCity) {
        const local = upcomingEvents.filter(e => e.city?.toLowerCase() === userCity.toLowerCase());
        const other = upcomingEvents.filter(e => e.city?.toLowerCase() !== userCity.toLowerCase());
        personalizedEvents = [...local, ...other].slice(0, 5);
      } else {
        personalizedEvents = upcomingEvents.slice(0, 5);
      }

      const eventsHtml = personalizedEvents.length > 0
        ? personalizedEvents.map(renderEventRow).join("\n")
        : "";

      const unsubscribeUrl = `https://irregularpearl.org/settings#email`;

      const html = renderDigest({
        recipientName: firstName,
        weekRange,
        summary: isStaff ? staffSummary : summary,
        piecesHtml,
        membersHtml,
        eventsHtml,
        piecesCount: (newPieces || []).length,
        membersCount: (newMembers || []).length,
        totalPieces: totalPieces ?? 0,
        totalMembers: totalMembers ?? 0,
        unsubscribeUrl,
      });

      // Send via Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Irregular Pearl <hello@irregularpearl.org>",
          to: [authUser.email],
          subject: isStaff
            ? `Staff Digest — ${weekRange}`
            : `Your Weekly Digest — ${weekRange}`,
          html,
        }),
      });

      if (res.ok) {
        sent++;
        console.log(`Digest sent to ${authUser.email} (${firstName}${userCity ? `, ${userCity}` : ""})`);
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

// ── Edge Function handler ────────────────────────────────────────────

Deno.serve(async (req) => {
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
