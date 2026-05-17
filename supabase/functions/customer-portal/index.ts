import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "../_shared/rateLimiter.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  // Reflect allowed request origins; fall back to production.
  const ALLOWED_HOST_RE = /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovableproject\.com)$/i;
  const STATIC_ALLOWED = new Set([
    "https://goldsainte.ai",
    "https://www.goldsainte.ai",
    "https://goldsainteai.lovable.app",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:3000",
  ]);
  const requestOrigin = req.headers.get("origin") || "";
  const isOriginAllowed =
    STATIC_ALLOWED.has(requestOrigin) || ALLOWED_HOST_RE.test(requestOrigin);
  const origin = isOriginAllowed
    ? requestOrigin
    : (Deno.env.get("SITE_URL") || "https://goldsainte.ai");

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Rate limit check: 5 requests per minute per user for portal access
    const identifier = getClientIdentifier(req, user.id);
    const rateLimitResult = await checkRateLimit({
      identifier,
      endpoint: 'customer-portal',
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.allowed) {
      logStep("Rate limit exceeded", { identifier, retryAfter: rateLimitResult.retryAfter });
      return createRateLimitResponse(rateLimitResult, corsHeaders(req));
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20",
    });
    
    // Try to get cached customer ID from profile
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();
    
    let customerId = profileData?.stripe_customer_id;

    // Verify cached customer still exists in current Stripe environment
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        logStep("Using cached customer ID", { customerId });
      } catch (e) {
        logStep("Cached customer not found, will re-resolve", { customerId });
        customerId = null;
      }
    }

    // If no cached ID, look up by email and cache it
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length === 0) {
        // Create customer if doesn't exist
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id }
        });
        customerId = customer.id;
        logStep("Created new Stripe customer", { customerId });
      } else {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
      
      // Cache the customer ID
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      
      logStep("Cached Stripe customer ID", { customerId });
    }

    // Accept caller-provided returnUrl, but only if it's on an allowed origin.
    let returnUrl = `${origin}/traveler?tab=settings`;
    try {
      if (req.headers.get("content-length") && req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        if (body?.returnUrl && typeof body.returnUrl === "string") {
          const u = new URL(body.returnUrl);
          if (STATIC_ALLOWED.has(u.origin) || ALLOWED_HOST_RE.test(u.origin)) {
            returnUrl = body.returnUrl;
          }
        }
      }
    } catch (_) { /* ignore body parse errors */ }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    logStep("Customer portal session created", { sessionId: portalSession.id });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
