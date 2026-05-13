import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    // SECURITY: do NOT use the raw Origin header for redirect URLs.
    // Validate against the ALLOWED_ORIGINS allowlist; otherwise an attacker
    // can create a checkout session whose success_url points to a phishing site.
    const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const requestOrigin = req.headers.get("origin") || "";
    const origin = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : (ALLOWED_ORIGINS[0] || Deno.env.get("SITE_URL") || "https://goldsainte.ai");

    const { packageId, promoCode, travelers = 1 } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get package details
    const { data: packageData, error: pkgError } = await supabaseClient
      .from('agent_packages')
      .select(`
        *,
        travel_agents!inner(
          agency_name,
          user_id
        )
      `)
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (pkgError || !packageData) {
      throw new Error('Package not found or not available');
    }

    let discount = 0;
    let promotionId = null;

    // Check promo code if provided
    if (promoCode) {
      const { data: promotion, error: promoError } = await supabaseClient
        .from('influencer_promotions')
        .select('*')
        .eq('promo_code', promoCode)
        .eq('package_id', packageId)
        .eq('status', 'active')
        .single();

      if (promotion && !promoError) {
        // Apply 5% discount for promo codes
        discount = packageData.retail_price * 0.05;
        promotionId = promotion.id;

        // Track promo code click
        await supabaseClient
          .from('promo_code_usage')
          .insert({
            promo_code: promoCode,
            package_id: packageId,
            session_id: crypto.randomUUID()
          });
      }
    }

    const finalPrice = (packageData.retail_price - discount) * travelers;
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Get or create user
    const authHeader = req.headers.get('Authorization');
    let userEmail = null;
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      if (user) {
        userEmail = user.email;
        userId = user.id;
      }
    }

    // Create or find Stripe customer
    let customerId;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { supabase_user_id: userId || '' }
        });
        customerId = customer.id;
      }
    }

    // Get agent's Stripe Connect account
    const { data: agentProfile, error: agentError } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, stripe_payouts_enabled')
      .eq('id', packageData.travel_agents.user_id)
      .single();

    if (agentError || !agentProfile?.stripe_account_id || !agentProfile.stripe_payouts_enabled) {
      throw new Error('Agent has not set up payouts yet');
    }

    // Calculate commission split
    const margin = packageData.retail_price - packageData.wholesale_cost;
    const agentCommission = margin * (packageData.agent_commission_percentage / 100);
    const influencerCommission = promotionId ? margin * (packageData.influencer_commission_percentage / 100) : 0;
    const platformFee = margin * (packageData.platform_fee_percentage / 100);
    
    // Agent gets their commission + the wholesale cost
    const agentPayout = packageData.wholesale_cost + agentCommission;
    const totalMargin = agentCommission + influencerCommission + platformFee;

    // Idempotency key prevents duplicate sessions on rapid double-clicks /
    // network retries. Scoped per (user|anon, package, travelers, promo).
    const idempotencyKey = [
      "cocurated",
      userId || "anon",
      packageId,
      String(travelers),
      promoCode || "none",
    ].join(":");

    // Create checkout session with automatic split to agent
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : undefined,
      payment_intent_data: {
        application_fee_amount: Math.round((platformFee + influencerCommission) * 100 * travelers),
        transfer_data: {
          destination: agentProfile.stripe_account_id,
          amount: Math.round(agentPayout * 100 * travelers)
        }
      },
      line_items: [{
        price_data: {
          currency: packageData.currency.toLowerCase(),
          product_data: {
            name: packageData.package_name,
            description: `${packageData.destination} - ${packageData.duration_days} days`,
            images: packageData.cover_image_url ? [packageData.cover_image_url] : []
          },
          unit_amount: Math.round(finalPrice * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${origin}/cocurated-booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cocurated-package/${packageId}`,
      metadata: {
        package_id: packageId,
        agent_id: packageData.agent_id,
        promo_code: promoCode || '',
        promotion_id: promotionId || '',
        travelers: travelers.toString(),
        agent_commission: agentCommission.toFixed(2),
        influencer_commission: influencerCommission.toFixed(2),
        platform_fee: platformFee.toFixed(2)
      }
    }, { idempotencyKey });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});