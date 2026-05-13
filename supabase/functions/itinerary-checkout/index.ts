import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseUserClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      throw new Error("Not authenticated");
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const itineraryProductId: string | undefined = body.itineraryProductId;
    const successUrl: string | undefined = body.successUrl;
    const cancelUrl: string | undefined = body.cancelUrl;
    const affiliateCodeRaw: unknown = body.affiliateCode;
    const affiliateCode =
      typeof affiliateCodeRaw === "string" && /^[a-zA-Z0-9_-]{3,64}$/.test(affiliateCodeRaw)
        ? affiliateCodeRaw
        : undefined;
    if (!itineraryProductId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "itineraryProductId, successUrl and cancelUrl are required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Use service role for guaranteed read of the product row
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: product, error: productError } = await supabaseAdmin
      .from("itinerary_products")
      .select("id, title, price, currency, creator_id, status")
      .eq("id", itineraryProductId)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) throw new Error("Itinerary guide not found");
    if (product.status !== "published") throw new Error("This guide is not available for purchase");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (product.currency || "USD").toLowerCase(),
            product_data: { name: product.title },
            unit_amount: Math.round(Number(product.price) * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          type: "itinerary_purchase",
          itinerary_product_id: product.id,
          product_id: product.id,
          buyer_id: user.id,
          creator_id: product.creator_id,
          ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
        },
      },
      metadata: {
        type: "itinerary_purchase",
        product_id: product.id,
        buyer_id: user.id,
        creator_id: product.creator_id,
        ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});