import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Public endpoint: returns ONLY a boolean indicating whether the given email
// address has been confirmed in auth.users. Used by the signup verify-email
// screen to detect cross-device confirmation when the local browser has no
// session yet (Supabase does not create a session until the email is
// confirmed). We intentionally return { verified: false } for unknown emails
// to avoid email enumeration beyond what signup already exposes.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || !email.includes("@") || email.length > 320) {
      return new Response(JSON.stringify({ verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // listUsers supports filtering by email via the admin API.
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // @ts-expect-error filter is supported by the GoTrue admin API
      filter: `email.eq.${email.toLowerCase()}`,
    });

    if (error) {
      console.error("check-email-verified listUsers error", error);
      return new Response(JSON.stringify({ verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const match = (data?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    const verified = Boolean(match?.email_confirmed_at);

    return new Response(JSON.stringify({ verified }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-email-verified error", err);
    return new Response(JSON.stringify({ verified: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});