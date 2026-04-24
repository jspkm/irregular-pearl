// Supabase Edge Function: send-welcome-email
// Triggered by database webhook on public.users INSERT.
// Sends personalized welcome email via Resend, rendered through the shared
// Claude-kit email layout (supabase/functions/_lib/email-template.ts).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  heading,
  paragraph,
  primaryButton,
  renderEmailLayout,
} from "../_lib/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function renderWelcomeEmail(recipientName: string): string {
  const catalogUrl = "https://irregularpearl.org";

  const bodyHtml = `
<div style="padding-bottom:16px;">${paragraph(`Dear ${recipientName},`)}</div>

<div style="padding-bottom:20px;">${heading("Glad you're here.", { level: "h1" })}</div>

<div style="padding-bottom:18px;">${paragraph(
    "The hardest passage in any piece has been played a thousand times before you got to it. Irregular Pearl is where the musicians who played it wrote down what they learned, signed by name, for the ones who came after.",
    { family: "serif" },
  )}</div>

<div style="padding-bottom:18px;">${paragraph(
    "Performer's notes on the piece as a whole. Structural landmarks. Interpretive schools held in disagreement rather than flattened. Edition observations at the measure level.",
    { family: "serif" },
  )}</div>

<div style="padding-bottom:24px;">${paragraph(
    "We are a non-profit. Our only obligation is to the piece, and to the musician who opens it next.",
    { family: "serif" },
  )}</div>

<div align="center" style="padding:24px 0 8px;">
  ${primaryButton({ text: "Add your experience", href: catalogUrl })}
</div>
`;

  return renderEmailLayout({
    title: "Welcome to Irregular Pearl",
    preheader: "The hardest passage in any piece has been played a thousand times before you got to it.",
    subtitle: "Welcome",
    bodyHtml,
    footerNote: "You're receiving this because you just registered on Irregular Pearl.",
  });
}

// --- Edge Function handler ---

Deno.serve(async (req) => {
  const body = await req.json();

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "No API key" }), { status: 500 });
  }

  // Preview mode: skip DB lookup entirely and send one copy to preview_to.
  // Used for reviewing the template against real prod rendering without
  // tripping the per-INSERT webhook path.
  if (body.preview_to) {
    const firstName = (body.preview_name || "").split(" ")[0] || "there";
    const html = renderWelcomeEmail(firstName);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Irregular Pearl <hello@irregularpearl.org>",
        to: [body.preview_to],
        subject: "Welcome to Irregular Pearl (preview)",
        html,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true, preview: true, id: result.id }), { status: 200 });
  }

  const record = body.record;
  if (!record || !record.id) {
    return new Response(JSON.stringify({ error: "No user record" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(record.id);

  if (authError || !authUser?.email) {
    console.error("Could not fetch user email:", authError);
    return new Response(JSON.stringify({ error: "No email found" }), { status: 404 });
  }

  const firstName = (record.display_name || "").split(" ")[0] || "there";
  const html = renderWelcomeEmail(firstName);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Irregular Pearl <hello@irregularpearl.org>",
      to: [authUser.email],
      subject: "Welcome to Irregular Pearl",
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
