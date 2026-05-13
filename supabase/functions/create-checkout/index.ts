import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "../_shared/rateLimiter.ts";
import { logger, generateTraceId } from "../_shared/structuredLogger.ts";
import { generateIdempotencyKey, withIdempotency } from "../_shared/idempotency.ts";
import { retryStripeOperation } from "../_shared/retryWithBackoff.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

serve(async (req) => {
  const requestId = generateTraceId();
  
  logger.setContext({ 
    functionName: 'create-checkout',
    requestId 
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  // Validate request origin against allowlist
  const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.get("origin") || "";
  const origin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : (ALLOWED_ORIGINS[0] || Deno.env.get("SITE_URL") || "https://goldsainte.ai");

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logger.info("Checkout session creation started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    
    logger.setContext({ userId: user.id });
    logger.info("User authenticated", { email: user.email });

    // Rate limit check: 5 requests per minute per user for payment endpoints
    const identifier = getClientIdentifier(req, user.id);
    const rateLimitResult = await checkRateLimit({
      identifier,
      endpoint: 'create-checkout',
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded", { identifier, retryAfter: rateLimitResult.retryAfter });
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const { priceId, subscriptionType, tier } = await req.json();
    if (!priceId) {
      throw new Error("Price ID is required");
    }
    logger.info("Checkout request received", { priceId, subscriptionType, tier });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    // Try to get cached customer ID from profile
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();
    
    let customerId = profileData?.stripe_customer_id;
    
    // If no cached ID, look up by email and cache it
    if (!customerId) {
      const customers = await retryStripeOperation(
        async () => await stripe.customers.list({ email: user.email, limit: 1 }),
        "customers.list"
      );
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        
        // Cache the customer ID
        await supabaseClient
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
        
        logger.info("Found and cached existing Stripe customer", { customerId });
      } else {
        logger.info("No existing customer, will create at checkout");
      }
    } else {
      logger.info("Using cached Stripe customer ID", { customerId });
    }

    // Build success URL based on subscription type
    const successUrl = subscriptionType === 'ai' 
      ? `${origin}/subscription?success=true&type=ai&tier=${tier || 'unknown'}`
      : `${origin}/subscription?success=true&type=subscription`;
    
    // Generate idempotency key for this checkout session
    const idempotencyKey = generateIdempotencyKey('checkout', user.id);
    logger.info("Generated idempotency key", { idempotencyKey });
    
    // Create checkout session with idempotency protection
    const session = await withIdempotency(
      idempotencyKey,
      async () => {
        return await stripe.checkout.sessions.create({
          customer: customerId,
          customer_email: customerId ? undefined : user.email,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: successUrl,
          cancel_url: `${origin}/subscription?canceled=true`,
          metadata: {
            user_id: user.id,
            subscription_type: subscriptionType || 'main',
            ...(tier && { tier }),
          }
        }, {
          idempotencyKey, // Stripe native idempotency key
        });
      },
      { cache: true, expiresInHours: 1 } // Cache for 1 hour
    );

    logger.info("Checkout session created successfully", { 
      sessionId: session.id, 
      customerId: session.customer 
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logger.error(
      "Failed to create checkout session",
      error instanceof Error ? error : new Error(String(error)),
      { 
        statusCode: error instanceof Error && error.message.includes("not authenticated") ? 401 : 500 
      }
    );
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        requestId 
      }), 
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: error instanceof Error && error.message.includes("not authenticated") ? 401 : 500,
      }
    );
  }
});
