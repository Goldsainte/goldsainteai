// check-stripe-connect-status v2 (Jul 12) — v1 validated the user's token but
// then queried travel_agents with a plain anon client, so RLS returned zero
// rows and .single() threw a 500 for every caller. House pattern now: anon
// client verifies the token, service-role client does the data work, and a
// missing agent row is an honest "not connected", not an error.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(req, { error: "Not authenticated" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return json(req, { error: "Not authenticated" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // v3 (Jul 13): the Connect account id's ONE home is profiles — the
    // live travel_agents table never had a stripe_account_id column (the
    // schema export lied; verified against the live DB the hard way).
    const { data: profileRow, error: profileError } = await admin
      .from("profiles")
      .select("stripe_account_id, stripe_connect_account_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      return json(req, { error: `Could not read profile: ${profileError.message}` }, 500);
    }
    const accountId =
      profileRow?.stripe_account_id || profileRow?.stripe_connect_account_id;

    const { data: agentData } = await admin
      .from("travel_agents")
      .select("payout_schedule")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!accountId) {
      return json(req, {
        connected: false,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
        payout_schedule: "daily",
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });
    const account = await stripe.accounts.retrieve(accountId);

    await admin
      .from("travel_agents")
      .update({
        stripe_account_status: account.details_submitted ? "active" : "pending",
        stripe_onboarding_completed: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
      })
      .eq("user_id", user.id);

    return json(req, {
      connected: true,
      onboarding_complete: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      payout_schedule: agentData.payout_schedule || "daily",
      requirements: account.requirements,
    });
  } catch (error: any) {
    console.error("Error checking Stripe Connect status:", error);
    return json(req, { error: error.message }, 500);
  }
});
