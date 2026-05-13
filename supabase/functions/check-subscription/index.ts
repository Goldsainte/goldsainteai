import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map product IDs to tiers
// IMPORTANT: Keep this synchronized with src/config/stripe.ts SUBSCRIPTION_TIERS
// Edge functions cannot import from src/ so this must be duplicated
const PRODUCT_TIER_MAP: Record<string, string> = {
  'prod_RdSS9f3xhCGOBD': 'premium',
  'prod_RdSSUQWWj8JXJW': 'enterprise',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

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
    
    // If no cached ID, look up by email and cache it
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length === 0) {
        logStep("No customer found, updating to free tier");
        
        await supabaseClient
          .from('user_subscriptions')
          .upsert({ 
            user_id: user.id, 
            tier: 'free'
          });
        
        return new Response(JSON.stringify({ 
          subscribed: false,
          tier: 'free',
          product_id: null,
          subscription_end: null 
        }), {
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      customerId = customers.data[0].id;
      
      // Cache the customer ID
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      
      logStep("Cached Stripe customer ID", { customerId });
    }
    
    if (!customerId) {
      logStep("No Stripe customer found after lookup");
      
      await supabaseClient
        .from('user_subscriptions')
        .upsert({ 
          user_id: user.id, 
          tier: 'free'
        });
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: 'free',
        product_id: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    logStep("Using Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let tier = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // PRODUCTION FIX: Fetch product dynamically to prevent mapping drift
      const price = subscription.items.data[0].price as Stripe.Price;
      const rawProductId = price.product;
      productId = typeof rawProductId === 'string' ? rawProductId : rawProductId.id;
      
      // PRODUCTION FIX: Derive tier from product metadata (if set) instead of hard-coded map
      // Fall back to hard-coded map for backward compatibility
      try {
        if (typeof rawProductId !== 'string') {
          const productMetadata = rawProductId.metadata;
          if (productMetadata?.tier) {
            tier = productMetadata.tier as string;
            logStep("Determined tier from product metadata", { productId, tier, metadata: productMetadata });
          } else {
            tier = PRODUCT_TIER_MAP[productId] || 'free';
            logStep("Determined tier from hard-coded map (no metadata)", { productId, tier });
          }
        } else {
          // Fetch full product to check metadata
          const product = await stripe.products.retrieve(productId);
          if (product.metadata?.tier) {
            tier = product.metadata.tier as string;
            logStep("Determined tier from fetched product metadata", { productId, tier, metadata: product.metadata });
          } else {
            tier = PRODUCT_TIER_MAP[productId] || 'free';
            logStep("Determined tier from hard-coded map (no metadata in fetched product)", { productId, tier });
          }
        }
      } catch (metadataError) {
        console.error("Error fetching product metadata, falling back to map:", metadataError);
        tier = PRODUCT_TIER_MAP[productId] || 'free';
        logStep("Determined tier from hard-coded map (metadata fetch failed)", { productId, tier });
      }

      // Get previous tier to detect changes
      const { data: existingSub } = await supabaseClient
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      const oldTier = existingSub?.tier || 'free';
      
      // Update user_subscriptions table
      await supabaseClient
        .from('user_subscriptions')
        .upsert({ 
          user_id: user.id, 
          tier: tier
        });

      // Send email notification if tier changed
      if (oldTier !== tier && oldTier !== 'free') {
        const tierOrder = ['free', 'premium', 'enterprise'];
        const emailType = tierOrder.indexOf(tier) > tierOrder.indexOf(oldTier) ? 'upgrade' : 'downgrade';
        logStep("Tier change detected, sending email", { oldTier, newTier: tier, emailType });
        
        await supabaseClient.functions.invoke('send-subscription-email', {
          body: {
            email: user.email,
            type: emailType,
            newTier: tier,
            oldTier: oldTier,
          },
        });
      } else if (oldTier === 'free' && tier !== 'free') {
        // New subscription
        logStep("New subscription detected, sending upgrade email");
        await supabaseClient.functions.invoke('send-subscription-email', {
          body: {
            email: user.email,
            type: 'upgrade',
            newTier: tier,
            oldTier: 'free',
          },
        });
      }
    } else {
      logStep("No active subscription found, updating to free tier");
      
      // Get previous tier
      const { data: existingSub } = await supabaseClient
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      const oldTier = existingSub?.tier;
      
      // Update to free tier
      await supabaseClient
        .from('user_subscriptions')
        .upsert({ 
          user_id: user.id, 
          tier: 'free'
        });

      // Send downgrade email if they had a paid subscription
      if (oldTier && oldTier !== 'free') {
        logStep("Subscription ended, sending downgrade email");
        await supabaseClient.functions.invoke('send-subscription-email', {
          body: {
            email: user.email,
            type: 'downgrade',
            newTier: 'free',
            oldTier: oldTier,
          },
        });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier: tier,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
