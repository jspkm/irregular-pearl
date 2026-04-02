// Supabase Edge Function: send-activity-email
// Triggered by database webhook on activity_log INSERT.
// Uses Claude API to compose a unique, activity-appropriate email each time.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Activity config ───────────────────────────────────────────────────

interface ActivityConfig {
  subject: string;
  prompt: string;
  cta: { text: string; url: (pieceId: string) => string };
}

const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
  performed: {
    subject: "How was your performance? 🎶",
    prompt: `The user just performed a classical music piece live. Write a warm, enthusiastic 2-3 sentence email body congratulating them on the performance. Ask them how it went — the venue, the audience reaction, any unexpected moments. End by encouraging them to share their experience with the community on the piece page. Include a specific, interesting observation about performing this particular piece or composer (something a fellow musician would appreciate). Vary your tone — sometimes more excited, sometimes reflective, sometimes with dry humor. Never use the same opening twice.`,
    cta: { text: "Tell the community about it", url: (id) => `https://irregularpearl.org/piece/${id}` },
  },
  practiced: {
    subject: "Great practice session 🎶",
    prompt: `The user just logged a practice session on a classical music piece. Write a warm 2-3 sentence email body acknowledging their practice. Include ONE specific, actionable practice tip relevant to this piece or its composer's style — something a conservatory teacher might suggest (slow practice, section isolation, rhythmic variation, singing the line, practicing difficult passages backward, etc.). Make each tip different and genuinely useful. Vary your tone — sometimes encouraging, sometimes conspiratorial ("here's a trick that works"), sometimes reflective on the craft. Never repeat the same tip structure.`,
    cta: { text: "View your practice log", url: (id) => `https://irregularpearl.org/piece/${id}` },
  },
  working_on: {
    subject: "New piece in progress 🎶",
    prompt: `The user just marked a classical music piece as "working on" — they're starting to learn or prepare it. Write a warm 2-3 sentence email body acknowledging this exciting new undertaking. Share ONE interesting historical or musical insight about this specific piece or composer that would motivate and inspire a musician beginning work on it — a backstory, a famous interpretation, what makes this piece special. End by encouraging them to check out the editions and recordings on the piece page. Vary your approach — sometimes share history, sometimes quote a famous performer on the piece, sometimes highlight a musical detail to listen for.`,
    cta: { text: "Explore editions and recordings", url: (id) => `https://irregularpearl.org/piece/${id}` },
  },
  listened: {
    subject: "Good ear 🎶",
    prompt: `The user just logged that they listened to or studied a classical music piece. Write a warm 2-3 sentence email body acknowledging their listening. Include ONE specific listening suggestion for this piece — a particular recording worth comparing, a detail to listen for in a specific passage, or a way this piece connects to another work. Make it feel like a recommendation from a knowledgeable friend, not a textbook. Vary your approach widely — sometimes suggest a surprising recording, sometimes point out a hidden detail in the score, sometimes connect it to a bigger musical story.`,
    cta: { text: "See all recordings", url: (id) => `https://irregularpearl.org/piece/${id}` },
  },
  sight_read: {
    subject: "First read-through 🎶",
    prompt: `The user just sight-read a classical music piece for the first time. Write a warm 2-3 sentence email body about the thrill of a first read-through. Include ONE specific sight-reading tip or observation about this piece — what makes it tricky to sight-read, what to focus on the second time through, or how the structure reveals itself once you've seen it. Be encouraging about the messy, exciting nature of sight-reading. Vary your tone — sometimes excited, sometimes philosophical about first encounters with music, sometimes practical.`,
    cta: { text: "Check edition recommendations", url: (id) => `https://irregularpearl.org/piece/${id}` },
  },
  took_lesson: {
    subject: "Lesson logged 🎶",
    prompt: `The user just had a lesson on a classical music piece. Write a warm 2-3 sentence email body acknowledging the lesson. Include ONE thoughtful observation about studying this particular piece with a teacher — what aspects of this piece or composer's work benefit most from guided instruction, a famous teacher-student story related to this repertoire, or encouragement about the teacher-student dynamic in classical music. End by encouraging them to note what they learned in the piece discussion. Vary your approach — sometimes reflective on pedagogy, sometimes share a famous teaching anecdote, sometimes focus on what makes this piece a great lesson piece.`,
    cta: { text: "Share what you learned", url: (id) => `https://irregularpearl.org/piece/${id}` },
  },
};

// ── Email rendering ───────────────────────────────────────────────────

function renderActivityEmail(
  recipientName: string,
  body: string,
  ctaText: string,
  ctaUrl: string,
): string {
  const name = escapeHtml(recipientName);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>Irregular Pearl</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style type="text/css">table{border-collapse:collapse;}td{font-family:Arial,Helvetica,sans-serif;}a{color:#B45309;}</style>
  <![endif]-->
  <style type="text/css">
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}
    body{margin:0;padding:0;width:100%!important;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit;text-decoration:none;}
    @media only screen and (max-width:620px){.wrapper{width:100%!important;}.wrapper-inner{padding:0 16px!important;}}
  </style>
</head>
<body id="body" style="margin:0;padding:0;background-color:#FAF8F5;-webkit-font-smoothing:antialiased;">

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#FAF8F5;">
    <tr>
      <td align="center" valign="top" style="padding:32px 0 48px;">
        <!--[if (gte mso 9)|(IE)]><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center"><tr><td><![endif]-->
        <table role="presentation" class="wrapper" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">

          <!-- HEADER -->
          <tr>
            <td class="wrapper-inner" align="center" style="padding:0 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:20px 0 8px;font-family:Georgia,'Times New Roman',Times,serif;font-size:34px;font-style:italic;font-weight:400;color:#1C1917;letter-spacing:-0.02em;line-height:1;">
                    <a href="https://irregularpearl.org" style="text-decoration:none;color:#1C1917;" target="_blank">Irregular Pearl</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:20px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#78716C;letter-spacing:0.12em;text-transform:uppercase;">
                    Classical Music Knowledge Platform
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="border-top:1px solid #E7E5E4;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td class="wrapper-inner" style="padding:0 24px 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1C1917;line-height:1.5;">
              Dear ${name},
            </td>
          </tr>

          <!-- BODY (LLM-generated) -->
          <tr>
            <td class="wrapper-inner" style="padding:0 24px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#57534E;line-height:1.65;">
              ${body}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 24px 48px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#B45309;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="18%" fillcolor="#B45309" stroke="f">
                      <w:anchorlock/><center style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;">${escapeHtml(ctaText)}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${ctaUrl}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;padding:13px 32px;border-radius:8px;background-color:#B45309;mso-hide:all;" target="_blank">${escapeHtml(ctaText)}</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td class="wrapper-inner" style="padding:0 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="border-top:1px solid #E7E5E4;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="wrapper-inner" align="center" style="padding:0 24px 8px;">
              <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:18px;font-style:italic;color:#78716C;margin-bottom:12px;">Irregular Pearl</div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
                    <a href="https://irregularpearl.org" style="color:#78716C;text-decoration:none;" target="_blank">irregularpearl.org</a>
                  </td>
                  <td style="padding:0 8px;border-left:1px solid #E7E5E4;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
                    <a href="https://irregularpearl.org/community" style="color:#78716C;text-decoration:none;" target="_blank">Community</a>
                  </td>
                </tr>
              </table>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#A8A29E;margin-top:16px;line-height:1.6;text-align:center;">
                <a href="https://irregularpearl.org/settings#email" style="color:#A8A29E;text-decoration:underline;" target="_blank">Manage email preferences</a>
              </div>
            </td>
          </tr>

          <!-- BOTTOM RULE -->
          <tr>
            <td class="wrapper-inner" style="padding:24px 24px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="border-top:2px solid #B45309;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── LLM composition ──────────────────────────────────────────────────

async function composeEmailBody(
  activity: string,
  pieceName: string,
  composerName: string,
): Promise<string> {
  const config = ACTIVITY_CONFIGS[activity];
  if (!config) return `You just logged activity on ${pieceName} by ${composerName}. Nice work!`;

  if (!ANTHROPIC_API_KEY) {
    // Fallback: static messages per activity type
    return getFallbackBody(activity, pieceName, composerName);
  }

  const userPrompt = `Piece: "${pieceName}" by ${composerName}. Activity: ${activity}.\n\nWrite the email body (2-3 sentences only, no greeting, no sign-off, no subject line). Plain text, no markdown.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: config.prompt + "\n\nDo not use emojis. Do not include a greeting or sign-off. Just the body text. 2-3 sentences max.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      console.error("Claude API error:", res.status, await res.text());
      return getFallbackBody(activity, pieceName, composerName);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim();
    return text || getFallbackBody(activity, pieceName, composerName);
  } catch (err) {
    console.error("Claude API call failed:", err);
    return getFallbackBody(activity, pieceName, composerName);
  }
}

function getFallbackBody(activity: string, piece: string, composer: string): string {
  const fallbacks: Record<string, string> = {
    performed: `Congratulations on performing ${piece} by ${composer}! We'd love to hear how it went. Head over to the piece page and share your experience with the community.`,
    practiced: `Great work putting time into ${piece} by ${composer}. Consistent practice is where the magic happens. Try isolating the most challenging passage and practicing it at half tempo before building back up.`,
    working_on: `Exciting to see you starting work on ${piece} by ${composer}. This is a wonderful piece to have in your repertoire. Check out the editions and recordings on the piece page to find the right interpretation for you.`,
    listened: `Good listening session with ${piece} by ${composer}. Active listening is one of the best ways to deepen your understanding. Try comparing two different recordings and noting where the interpretations diverge.`,
    sight_read: `You just sight-read ${piece} by ${composer} for the first time. That first read-through is always an adventure. Now that you've seen the whole landscape, go back to the spots that surprised you.`,
    took_lesson: `Lesson on ${piece} by ${composer} logged. Working with a teacher on this repertoire is invaluable. Consider jotting down the key takeaways in the piece discussion so you can reference them later.`,
  };
  return fallbacks[activity] || `You logged activity on ${piece} by ${composer}. Keep it up!`;
}

// ── Edge Function handler ────────────────────────────────────────────

Deno.serve(async (req) => {
  const body = await req.json();
  const record = body.record;

  if (!record?.user_id || !record?.piece_id || !record?.activity) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "No email API key" }), { status: 500 });
  }

  const config = ACTIVITY_CONFIGS[record.activity];
  if (!config) {
    return new Response(JSON.stringify({ error: "Unknown activity type" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get user email and name
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(record.user_id);
  if (!authUser?.email) {
    return new Response(JSON.stringify({ error: "No email" }), { status: 404 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", record.user_id)
    .single();

  // Get piece info
  const { data: piece } = await supabase
    .from("pieces")
    .select("title, composer_name")
    .eq("id", record.piece_id)
    .single();

  const firstName = (profile?.display_name || "").split(" ")[0] || "there";
  const pieceName = piece?.title || record.piece_id;
  const composerName = piece?.composer_name || "Unknown";

  // Compose email body via LLM
  const emailBody = await composeEmailBody(record.activity, pieceName, composerName);
  const ctaUrl = config.cta.url(record.piece_id);
  const html = renderActivityEmail(firstName, emailBody, config.cta.text, ctaUrl);

  // Send
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Irregular Pearl <hello@irregularpearl.org>",
      to: [authUser.email],
      subject: config.subject,
      html,
    }),
  });

  const result = await res.json();
  if (res.ok) {
    console.log(`Activity email sent: ${record.activity} on "${pieceName}" to ${authUser.email}`);
    return new Response(JSON.stringify({ success: true, id: result.id }), { status: 200 });
  } else {
    console.error("Send failed:", result);
    return new Response(JSON.stringify({ error: result }), { status: 500 });
  }
});
