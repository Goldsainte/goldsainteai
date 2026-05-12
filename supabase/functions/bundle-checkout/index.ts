import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    const token = authHeader.replace("Bearer ", "");

    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: userData, error: userError } = await supabaseUserClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const bundleId: string | undefined = body.bundleId;
    const successUrl: string | undefined = body.successUrl;
    const cancelUrl: string | undefined = body.cancelUrl;
    const affiliateCodeRaw: unknown = body.affiliateCode;
    const affiliateCode =
      typeof affiliateCodeRaw === "string" && /^[a-zA-Z0-9_-]{3,64}$/.test(affiliateCodeRaw)
        ? affiliateCodeRaw
        : undefined;
    if (!bundleId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "bundleId, successUrl and cancelUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: bundle, error: bundleErr } = await supabaseAdmin
      .from("product_bundles")
      .select("id, title, price, currency, creator_id, status, trip_id, guide_ids")
      .eq("id", bundleId)
      .maybeSingle();
    if (bundleErr) throw bundleErr;
    if (!bundle) throw new Error("Bundle not found");
    if (bundle.status !== "published") throw new Error("Bundle not available");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const meta: Record<string, string> = {
      type: "bundle_purchase",
      bundle_id: bundle.id,
      buyer_id: user.id,
      creator_id: bundle.creator_id,
    };
    if (affiliateCode) meta.affiliate_code = affiliateCode;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (bundle.currency || "USD").toLowerCase(),
            product_data: { name: `Bundle — ${bundle.title}` },
            unit_amount: Math.round(Number(bundle.price) * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: { metadata: meta },
      metadata: meta,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});