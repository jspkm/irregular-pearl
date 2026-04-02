// Supabase Edge Function: send-welcome-email
// Triggered by database webhook on public.users INSERT.
// Sends personalized welcome email via Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Inline welcome email template (self-contained, no file system access in Edge Functions)
function renderWelcomeEmail(recipientName: string, userId: string): string {
  const name = escapeHtml(recipientName);
  const profileUrl = `https://irregularpearl.org/profile/${encodeURIComponent(userId)}`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>Welcome to Irregular Pearl</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style type="text/css">table{border-collapse:collapse;}td{font-family:Arial,Helvetica,sans-serif;}a{color:#B45309;}.cta-btn{background-color:#B45309!important;padding:13px 32px!important;}</style>
  <![endif]-->
  <style type="text/css">
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}
    body{margin:0;padding:0;width:100%!important;height:100%!important;}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
    u+#body a{color:inherit;text-decoration:none;}
    #MessageViewBody a{color:inherit;text-decoration:none;}
    @media only screen and (max-width:620px){.wrapper{width:100%!important;}.wrapper-inner{padding:0 16px!important;}}
  </style>
</head>
<body id="body" style="margin:0;padding:0;background-color:#FAF8F5;-webkit-font-smoothing:antialiased;">

  <div style="display:none;font-size:1px;color:#FAF8F5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    Welcome to the classical music community.&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;
  </div>

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
                  <td align="center" style="padding-bottom:20px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:400;color:#78716C;letter-spacing:0.12em;text-transform:uppercase;">
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
            <td class="wrapper-inner" style="padding:0 24px 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:#1C1917;line-height:1.5;">
              Dear ${name},
            </td>
          </tr>

          <!-- WELCOME TEXT -->
          <tr>
            <td class="wrapper-inner" style="padding:0 24px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;color:#57534E;line-height:1.65;">
              Welcome to Irregular Pearl. You've joined a community of musicians, students, and music lovers building a living knowledge base for classical music.
            </td>
          </tr>
          <tr>
            <td class="wrapper-inner" style="padding:0 24px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;color:#57534E;line-height:1.65;">
              This is a non-profit, community-driven project. Every piece page is a shared resource that gets richer as people contribute editions, recordings, discussions, and performance notes. We're glad you're here.
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td class="wrapper-inner" style="padding:0 24px 36px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="border-top:1px solid #E7E5E4;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- FEATURES SECTION -->
          <tr>
            <td class="wrapper-inner" style="padding:0 24px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #E7E5E4;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:500;color:#B45309;letter-spacing:0.12em;text-transform:uppercase;">Getting Started</div>
                    <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;font-weight:400;color:#1C1917;margin-top:2px;line-height:1.2;">Here's what you can do</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 1 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #E7E5E4;">
                <tr>
                  <td width="50" valign="top" style="padding:16px 14px 16px 0;">
                    <div style="width:36px;height:36px;background-color:#FEF3C7;text-align:center;line-height:36px;font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:500;color:#B45309;">1</div>
                  </td>
                  <td valign="top" style="padding:16px 0;font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;font-weight:400;color:#1C1917;line-height:1.3;">Browse and discover</div>
                    <div style="font-size:13px;color:#78716C;margin-top:4px;line-height:1.5;">Explore pieces across instruments, composers, and eras. Every piece has editions, recordings, and community notes.</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 2 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #E7E5E4;">
                <tr>
                  <td width="50" valign="top" style="padding:16px 14px 16px 0;">
                    <div style="width:36px;height:36px;background-color:#FEF3C7;text-align:center;line-height:36px;font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:500;color:#B45309;">2</div>
                  </td>
                  <td valign="top" style="padding:16px 0;font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;font-weight:400;color:#1C1917;line-height:1.3;">Log your musical life</div>
                    <div style="font-size:13px;color:#78716C;margin-top:4px;line-height:1.5;">Track practice sessions, lessons, performances, and listening. Your activity feed becomes your musical diary.</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 3 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #E7E5E4;">
                <tr>
                  <td width="50" valign="top" style="padding:16px 14px 16px 0;">
                    <div style="width:36px;height:36px;background-color:#FEF3C7;text-align:center;line-height:36px;font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:500;color:#B45309;">3</div>
                  </td>
                  <td valign="top" style="padding:16px 0;font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;font-weight:400;color:#1C1917;line-height:1.3;">Join the discussion</div>
                    <div style="font-size:13px;color:#78716C;margin-top:4px;line-height:1.5;">Every piece page has a threaded discussion. Share edition recommendations, bowing choices, interpretation notes.</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 4 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="50" valign="top" style="padding:16px 14px 16px 0;">
                    <div style="width:36px;height:36px;background-color:#FEF3C7;text-align:center;line-height:36px;font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:500;color:#B45309;">4</div>
                  </td>
                  <td valign="top" style="padding:16px 0;font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;font-weight:400;color:#1C1917;line-height:1.3;">Applaud fellow musicians</div>
                    <div style="font-size:13px;color:#78716C;margin-top:4px;line-height:1.5;">Show appreciation for artists in the community. Visit the Community page to discover who's here.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td align="center" style="padding:0 24px 48px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#B45309;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${profileUrl}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="18%" fillcolor="#B45309" stroke="f">
                      <w:anchorlock/><center style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;">Complete Your Profile</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${profileUrl}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;padding:13px 32px;border-radius:8px;background-color:#B45309;mso-hide:all;" target="_blank">Complete Your Profile</a>
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
                  <td style="padding:0 8px;border-left:1px solid #E7E5E4;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
                    <a href="https://irregularpearl.org/about" style="color:#78716C;text-decoration:none;" target="_blank">About</a>
                  </td>
                </tr>
              </table>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#A8A29E;margin-top:16px;line-height:1.6;text-align:center;">
                You are receiving this email because you just registered on Irregular Pearl.<br/>
                <a href="https://irregularpearl.org/settings#email" style="color:#A8A29E;text-decoration:underline;" target="_blank">Manage email preferences</a>
              </div>
            </td>
          </tr>

          <!-- BOTTOM AMBER RULE -->
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

// --- Edge Function handler ---

Deno.serve(async (req) => {
  // Verify the request is from Supabase webhook
  const body = await req.json();

  // Database webhook payload: { type: "INSERT", table: "users", record: {...}, ... }
  const record = body.record;
  if (!record || !record.id) {
    return new Response(JSON.stringify({ error: "No user record" }), { status: 400 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "No API key" }), { status: 500 });
  }

  // Get email from auth.users
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(record.id);

  if (authError || !authUser?.email) {
    console.error("Could not fetch user email:", authError);
    return new Response(JSON.stringify({ error: "No email found" }), { status: 404 });
  }

  const firstName = (record.display_name || "").split(" ")[0] || "there";
  const html = renderWelcomeEmail(firstName, record.id);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Irregular Pearl <hello@irregularpearl.org>",
      to: [authUser.email],
      subject: "Welcome to Irregular Pearl \uD83C\uDFB6",
      html,
    }),
  });

  const result = await res.json();

  if (res.ok) {
    console.log(`Welcome email sent to ${authUser.email} (${record.display_name})`);
    return new Response(JSON.stringify({ success: true, id: result.id }), { status: 200 });
  } else {
    console.error(`Failed to send to ${authUser.email}:`, result);
    return new Response(JSON.stringify({ error: result }), { status: 500 });
  }
});
