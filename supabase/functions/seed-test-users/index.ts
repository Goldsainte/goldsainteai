// One-time seed of four pre-confirmed test users via the Supabase Admin API.
// This function self-locks: if any target email already exists, it refuses to run.
// After a successful run, this entire directory should be deleted from the repo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PASSWORD = "GoldsainteTest!2026";

// Note: 'brand' is not in the profiles.account_type CHECK constraint
// (allowed: personal | traveler | creator | agent | admin | business | partner).
// We map brand -> business at the DB level, but keep the requested label in output.
const USERS: Array<{ email: string; account_type: string; label: string }> = [
  { email: "traveler-test@goldsainte.com", account_type: "traveler", label: "traveler" },
  { email: "creator-test@goldsainte.com",  account_type: "creator",  label: "creator" },
  { email: "agent-test@goldsainte.com",    account_type: "agent",    label: "agent" },
  { email: "brand-test@goldsainte.com",    account_type: "business", label: "brand (mapped to business)" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Self-lock: abort if any target email already exists.
  const { data: existingList, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    return new Response(JSON.stringify({ error: "listUsers failed", detail: listErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const existingEmails = new Set((existingList?.users ?? []).map((u) => (u.email ?? "").toLowerCase()));
  const clash = USERS.find((u) => existingEmails.has(u.email.toLowerCase()));
  if (clash) {
    return new Response(JSON.stringify({ error: "Seed already ran", clash: clash.email }), {
      status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<Record<string, unknown>> = [];
  for (const u of USERS) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { account_type: u.account_type },
    });
    if (createErr || !created?.user) {
      results.push({ email: u.email, ok: false, error: createErr?.message ?? "no user returned" });
      continue;
    }
    const uid = created.user.id;

    // Force the profiles.account_type in case the trigger defaulted it.
    const { error: updErr } = await admin
      .from("profiles")
      .update({ account_type: u.account_type })
      .eq("id", uid);

    // Read back for verification.
    const { data: prof } = await admin
      .from("profiles")
      .select("id, account_type, email")
      .eq("id", uid)
      .maybeSingle();

    results.push({
      email: u.email,
      password: PASSWORD,
      requested_label: u.label,
      account_type: prof?.account_type ?? null,
      user_id: uid,
      profile_update_error: updErr?.message ?? null,
      ok: true,
    });
  }

  return new Response(JSON.stringify({ ok: true, users: results }, null, 2), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});