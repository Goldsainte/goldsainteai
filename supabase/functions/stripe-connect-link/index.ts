import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function cors(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const DEFAULT_SITE_URL = Deno.env.get("SITE_URL") || "https://goldsainteai.lovable.app";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // Determine return origin from request body or fallback
    let body: any = {};
    try { body = await req.json(); } catch { /* no body is fine */ }
    const origin = body?.origin || req.headers.get("origin") || DEFAULT_SITE_URL;
    const RETURN_URL = `${origin}/creator-dashboard?stripe=success`;
    const REFRESH_URL = `${origin}/creator-dashboard?stripe=refresh`;

    console.log("[STRIPE-CONNECT-LINK] Request started, origin:", origin);
    // Auth: require a logged-in user
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[STRIPE-CONNECT-LINK] No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - no auth header" }), 
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: uErr } = await supabase.auth.getUser(token);
    
    if (uErr || !user) {
      console.error("[STRIPE-CONNECT-LINK] Auth error:", uErr);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }), 
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.log("[STRIPE-CONNECT-LINK] User authenticated:", user.id);

    if (!STRIPE_SECRET_KEY) {
      console.error("[STRIPE-CONNECT-LINK] STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe env not configured" }), 
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { 
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: "2024-06-20"
    });

    console.log("[STRIPE-CONNECT-LINK] Fetching profile for user:", user.id);

    // 1) Get or create connected account for this user
    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (pErr) {
      console.error("[STRIPE-CONNECT-LINK] Error fetching profile:", pErr);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile" }), 
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    let accountId = prof?.stripe_account_id as string | null;
    console.log("[STRIPE-CONNECT-LINK] Existing account ID:", accountId || "none");

    if (!accountId) {
      console.log("[STRIPE-CONNECT-LINK] Creating new Stripe Connect account...");
      
      try {
        const acct = await stripe.accounts.create({
          type: "express",
          email: user.email ?? undefined,
          business_type: "individual",
          capabilities: { 
            transfers: { requested: true }, 
            card_payments: { requested: true } 
          },
          settings: {
            payouts: {
              schedule: {
                interval: 'daily',
                delay_days: 'minimum',
              },
            },
          },
        });
        
        accountId = acct.id;
        console.log("[STRIPE-CONNECT-LINK] Created account:", accountId);

        const { error: upErr } = await supabase
          .from("profiles")
          .update({ 
            stripe_account_id: accountId,
            stripe_account_status: 'pending',
            payout_schedule: 'daily'
          })
          .eq("id", user.id);
          
        if (upErr) {
          console.error("[STRIPE-CONNECT-LINK] Failed to persist stripe_account_id:", upErr);
          return new Response(
            JSON.stringify({ error: "Failed to persist stripe_account_id" }), 
            { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        
        console.log("[STRIPE-CONNECT-LINK] Persisted account ID to profile");
      } catch (stripeErr: any) {
        console.error("[STRIPE-CONNECT-LINK] Stripe account creation error:", stripeErr.message);
        
        // Handle specific Stripe errors
        if (stripeErr.message?.includes('signed up for Connect')) {
          return new Response(
            JSON.stringify({
              error: 'Stripe Connect is not enabled on this account. Please enable Stripe Connect in your Stripe Dashboard.',
              details: 'To enable creator payouts, you need to activate Stripe Connect.'
            }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        
        if (stripeErr.message?.includes('managing losses') || stripeErr.message?.includes('platform-profile')) {
          return new Response(
            JSON.stringify({
              error: 'Action required: confirm loss responsibility in Stripe Connect platform profile',
              details: 'Open your Stripe Dashboard and complete the Platform Profile > Losses section.',
              link: 'https://dashboard.stripe.com/settings/connect/platform-profile'
            }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: stripeErr.message || 'Failed to create Stripe account' }), 
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    // 2) Create an onboarding link
    console.log("[STRIPE-CONNECT-LINK] Creating account link for:", accountId);
    console.log("[STRIPE-CONNECT-LINK] Return URL:", RETURN_URL);
    console.log("[STRIPE-CONNECT-LINK] Refresh URL:", REFRESH_URL);
    
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: REFRESH_URL,
      return_url: RETURN_URL,
      type: "account_onboarding",
    });

    console.log("[STRIPE-CONNECT-LINK] Account link created successfully");

    return new Response(
      JSON.stringify({ url: link.url }), 
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[STRIPE-CONNECT-LINK] Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), 
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
