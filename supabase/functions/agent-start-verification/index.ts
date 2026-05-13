import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_API_BASE = "https://api.stripe.com/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const agentId = user.id;

    // Admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: application, error: appError } = await supabaseAdmin
      .from("agent_applications")
      .select("id, kyc_session_id")
      .eq("agent_id", agentId)
      .maybeSingle();

    if (appError) {
      console.error("Error loading agent application", appError);
      return new Response(JSON.stringify({ error: "Could not load application" }), {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!application) {
      return new Response(
        JSON.stringify({ error: "Please complete your agent application before starting verification." }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Create Stripe Identity verification session
    const formData = new URLSearchParams();
    formData.append("type", "document");
    formData.append("options[document][require_matching_selfie]", "true");
    formData.append("metadata[agent_id]", agentId);

    const stripeRes = await fetch(`${STRIPE_API_BASE}/identity/verification_sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!stripeRes.ok) {
      const text = await stripeRes.text();
      console.error("Stripe Identity error", text);
      return new Response(JSON.stringify({ error: "Stripe verification setup failed" }), {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const session = await stripeRes.json();

    // Save session id
    const { error: updateError } = await supabaseAdmin
      .from("agent_applications")
      .update({
        kyc_provider: "stripe_identity",
        kyc_session_id: session.id,
      })
      .eq("id", application.id);

    if (updateError) {
      console.error("Error updating agent_applications with KYC session", updateError);
      return new Response(
        JSON.stringify({ error: "Could not save verification session" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Update profile status
    await supabaseAdmin
      .from("profiles")
      .update({
        account_type: "agent",
        agent_verification_status: "pending",
      })
      .eq("id", agentId);

    return new Response(
      JSON.stringify({
        verificationUrl: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error in agent-start-verification", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
