// Supabase Edge Function: delete-account
//
// Backs the Profile -> Security -> Danger zone "Delete account" flow.
// Hard-deletes the calling user's auth.users row, which cascades through
// public.users to every dependent table per the FK behavior set in
// 20260611000000_account_deletion_fk_cascade.sql:
//
//   - bylined signed content + version chain: CASCADE (rows deleted)
//   - audit *_by columns: SET NULL (other contributors' history preserved)
//   - votes: SET NULL (vote tally preserved, attribution dropped)
//
// No separate public-schema RPC is needed — the cascade chain is the policy.
//
// Auth: the caller's JWT (Authorization: Bearer <token>) is verified by
// hitting auth.getUser() with the user-scoped client; the deletion target
// is always auth.uid() of that JWT. The service-role client is used only
// for the auth.admin.deleteUser call, which requires elevated privileges.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // User-scoped client — auth.getUser() validates the JWT and returns the
  // user the token was issued for. This is the only identity we trust
  // for the deletion target.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: getUserErr } = await userClient.auth.getUser();
  if (getUserErr || !user) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Service-role client for the admin deletion call. The user_id is taken
  // from the validated JWT above — never from the request body — so this
  // function can only ever delete the caller's own account.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    console.error(`delete-account: admin.deleteUser(${user.id}) failed:`, deleteErr);
    return new Response(JSON.stringify({ error: "deletion_failed", detail: deleteErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`delete-account: hard-deleted ${user.id}`);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
