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
    const gclidRaw: unknown = body.gclid;
    const gclid =
      typeof gclidRaw === "string" && gclidRaw.length > 0 && gclidRaw.length <= 256
        ? gclidRaw
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

    // Direct charge on the creator's connected account (seller of record),
    // matching every other creator rail. Goldsainte's flat 7% platform fee is
    // taken as a Stripe application_fee (founder decision, Jul 23 2026).
    // Without a ready payout account the sale must REFUSE — never fall back
    // to collecting into the platform account.
    const { data: creatorProfile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_connect_account_id")
      .eq("id", product.creator_id)
      .maybeSingle();
    const creatorAccountId =
      creatorProfile?.stripe_account_id || creatorProfile?.stripe_connect_account_id || null;
    if (!creatorAccountId) {
      return new Response(
        JSON.stringify({
          error: "NO_SELLER_ACCOUNT",
          message: "This creator's payout account isn't ready yet, so this guide can't be purchased right now.",
        }),
        { status: 409, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const amountCents = Math.round(Number(product.price) * 100);
    const applicationFeeCents = Math.round(amountCents * 0.07);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const session = await stripe.checkout.sessions.create(
      {
        customer_email: user.email,
        mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (product.currency || "USD").toLowerCase(),
            product_data: { name: product.title },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        metadata: {
          type: "itinerary_purchase",
          itinerary_product_id: product.id,
          product_id: product.id,
          buyer_id: user.id,
          creator_id: product.creator_id,
          ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
          ...(gclid ? { gclid } : {}),
        },
      },
      metadata: {
        type: "itinerary_purchase",
        product_id: product.id,
        buyer_id: user.id,
        creator_id: product.creator_id,
        ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
        ...(gclid ? { gclid } : {}),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      },
      { stripeAccount: creatorAccountId }
    );

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
