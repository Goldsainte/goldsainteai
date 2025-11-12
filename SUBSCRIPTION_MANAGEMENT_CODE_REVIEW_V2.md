# Subscription Management Code Review - Version 2 (Updated)

## Changes Made
1. ✅ Added Authorization header to `loadUserSubscription` when calling `check-subscription`
2. ✅ Replaced string comparison with indexed array lookup for tier upgrade/downgrade detection

---

## Frontend: src/pages/Subscription.tsx

```typescript
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type SubscriptionTier = 'free' | 'premium' | 'enterprise';

interface UserSubscription {
  tier: SubscriptionTier;
  subscription_end?: string;
}

// Map tiers to their Stripe price IDs
const TIER_PRICE_IDS = {
  premium: 'price_1QpqPPAwnXdGkVDYKBDUdxHe',
  enterprise: 'price_1QpqPqAwnXdGkVDYDaI3vXC3',
};

const tierFeatures = {
  free: {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Basic travel planning tools',
      'AI-powered trip suggestions',
      'Access to public travel guides',
      'Community forum access',
      'Standard customer support',
    ],
    limits: {
      requests: '100/day',
      storage: '100MB',
    },
    cta: 'Current Plan',
    highlighted: false,
  },
  premium: {
    name: 'Premium',
    price: '$29',
    period: 'per month',
    features: [
      'Everything in Free',
      'Unlimited AI travel planning',
      'Priority booking assistance',
      'Exclusive travel deals',
      'Premium customer support',
      'Advanced itinerary builder',
      'Offline access to guides',
    ],
    limits: {
      requests: 'Unlimited',
      storage: '10GB',
    },
    cta: 'Upgrade to Premium',
    highlighted: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: '$99',
    period: 'per month',
    features: [
      'Everything in Premium',
      'Dedicated travel concierge',
      'Custom travel packages',
      'Corporate travel management',
      'API access for integrations',
      '24/7 priority support',
      'White-label solutions',
      'Advanced analytics dashboard',
    ],
    limits: {
      requests: 'Unlimited',
      storage: 'Unlimited',
    },
    cta: 'Upgrade to Enterprise',
    highlighted: false,
  },
};

export default function Subscription() {
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserSubscription();
    
    // Check for success/cancel query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      toast.success("Subscription activated! Refreshing status...");
      // Refresh subscription status after successful payment
      setTimeout(() => loadUserSubscription(), 2000);
      // Clean up URL
      window.history.replaceState({}, '', '/subscription');
    } else if (params.get('canceled')) {
      toast.info("Checkout canceled");
      // Clean up URL
      window.history.replaceState({}, '', '/subscription');
    }
  }, []);

  const loadUserSubscription = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setLoading(false);
        return;
      }

      setUser(authUser);

      // Get access token for auth
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      // Check subscription status from Stripe
      const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (subError) {
        console.error('Error checking subscription:', subError);
        // Fallback to database
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', authUser.id)
          .single();

        if (!error && data) {
          setCurrentTier(data.tier as SubscriptionTier);
        }
      } else if (subData) {
        setCurrentTier(subData.tier as SubscriptionTier);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error("Failed to load subscription status");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: 'premium' | 'enterprise') => {
    try {
      if (!user) {
        toast.error("Please sign in to upgrade");
        navigate('/auth');
        return;
      }

      // Get access token for auth
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: TIER_PRICE_IDS[tier],
          tier: tier 
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw error;

      if (data?.url) {
        // Use window.location.href to avoid popup blockers
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error("Failed to start checkout process");
    }
  };

  const handleManageSubscription = async () => {
    try {
      if (!user) {
        toast.error("Please sign in to manage subscription");
        navigate('/auth');
        return;
      }

      // Get access token for auth
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw error;

      if (data?.url) {
        // Use window.location.href to avoid popup blockers
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error("Failed to open subscription management");
    }
  };

  const getTierIndex = (tier: SubscriptionTier): number => {
    const tiers: SubscriptionTier[] = ['free', 'premium', 'enterprise'];
    return tiers.indexOf(tier);
  };

  const canUpgrade = (tier: SubscriptionTier): boolean => {
    return getTierIndex(tier) > getTierIndex(currentTier);
  };

  const isCurrent = (tier: SubscriptionTier): boolean => {
    return tier === currentTier;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading subscription details...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock powerful features to enhance your travel experience
        </p>
        {user && (
          <div className="mt-6">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Current Plan: {tierFeatures[currentTier].name}
            </Badge>
            {currentTier !== 'free' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                className="ml-4"
              >
                Manage Subscription
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {(Object.keys(tierFeatures) as SubscriptionTier[]).map((tier) => {
          const plan = tierFeatures[tier];
          const isCurrentPlan = isCurrent(tier);
          const canUpgradeToPlan = canUpgrade(tier);

          return (
            <Card
              key={tier}
              className={`relative ${
                plan.highlighted
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border'
              } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="px-4 py-1">
                    Your Plan
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {user ? (
                  isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : canUpgradeToPlan ? (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(tier as 'premium' | 'enterprise')}
                    >
                      {plan.cta}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Not Available
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full"
                    variant={tier === 'free' ? 'outline' : 'default'}
                    onClick={() => navigate('/auth')}
                  >
                    {tier === 'free' ? 'Get Started' : plan.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Feature</th>
                <th className="text-center p-4">Free</th>
                <th className="text-center p-4">Premium</th>
                <th className="text-center p-4">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">API Rate Limit</td>
                <td className="text-center p-4">{tierFeatures.free.limits.requests}</td>
                <td className="text-center p-4">{tierFeatures.premium.limits.requests}</td>
                <td className="text-center p-4">{tierFeatures.enterprise.limits.requests}</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Storage</td>
                <td className="text-center p-4">{tierFeatures.free.limits.storage}</td>
                <td className="text-center p-4">{tierFeatures.premium.limits.storage}</td>
                <td className="text-center p-4">{tierFeatures.enterprise.limits.storage}</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">AI Travel Planning</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Priority Booking</td>
                <td className="text-center p-4">-</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Dedicated Concierge</td>
                <td className="text-center p-4">-</td>
                <td className="text-center p-4">-</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">API Access</td>
                <td className="text-center p-4">-</td>
                <td className="text-center p-4">-</td>
                <td className="text-center p-4">
                  <Check className="w-5 h-5 text-primary mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Can I change my plan later?</AccordionTrigger>
            <AccordionContent>
              Yes! You can upgrade or downgrade your plan at any time through your
              subscription management page. Changes will be prorated accordingly.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
            <AccordionContent>
              We accept all major credit cards (Visa, Mastercard, American Express)
              and process payments securely through Stripe.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
            <AccordionContent>
              Absolutely! You can cancel your subscription at any time. You'll
              continue to have access to premium features until the end of your
              billing period.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Is there a free trial?</AccordionTrigger>
            <AccordionContent>
              Our Free plan gives you access to basic features with no time limit.
              You can upgrade to Premium or Enterprise at any time to unlock
              additional features.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>What happens to my data if I downgrade?</AccordionTrigger>
            <AccordionContent>
              Your data remains safe. However, if you exceed the storage limits of
              your new plan, you'll need to reduce your storage usage or upgrade
              again to access all your content.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="mt-16 text-center bg-primary/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Join thousands of travelers using AI-powered planning
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Sign Up Now
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## Backend: supabase/functions/create-checkout/index.ts

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { priceId } = await req.json();
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16"
    });
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription?success=true`,
      cancel_url: `${req.headers.get("origin")}/subscription?canceled=true`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

---

## Backend: supabase/functions/customer-portal/index.ts

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/subscription`,
    });
    logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

---

## Backend: supabase/functions/check-subscription/index.ts

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map product IDs to tiers
const PRODUCT_TIER_MAP: Record<string, string> = {
  'prod_TNOppvdXPriM3E': 'premium',
  'prod_TNOpkzmfNXljRz': 'enterprise',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating to free tier");
      
      // Update user_subscriptions to free tier
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

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
      
      productId = subscription.items.data[0].price.product as string;
      tier = PRODUCT_TIER_MAP[productId] || 'free';
      logStep("Determined subscription tier", { productId, tier });

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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

---

## Other Stripe Functions (Summary)

The following functions have also been updated with:
- Stripe API version changed to `"2023-10-16"`
- Complete CORS headers including `Access-Control-Allow-Methods`

### create-ai-subscription-checkout/index.ts
- Creates checkout sessions for AI subscription tiers
- Same auth pattern as create-checkout

### check-verification/index.ts
- Checks verification subscription status
- Same pattern as check-subscription

### create-verification-checkout/index.ts
- Creates checkout for verification subscriptions
- Same pattern as create-checkout

### stripe-webhook/index.ts
- Handles Stripe webhook events
- Processes subscription updates, cancellations, and payments
- Uses Stripe API version `"2023-10-16"`

---

## Summary of Fixes

### ✅ Completed
1. **Added Authorization header** to `loadUserSubscription` in frontend
2. **Fixed tier comparison** in backend using array indexing instead of string comparison
3. **Updated Stripe API version** to stable `"2023-10-16"` across all functions
4. **Added complete CORS headers** including `Access-Control-Allow-Methods`
5. **Used `window.location.href`** instead of `window.open` to avoid popup blockers

### 🔍 Still Need Verification
1. **TIER_PRICE_IDS** - Verify these match your Stripe Dashboard Price IDs
2. **PRODUCT_TIER_MAP** - Verify Product IDs map correctly to tiers
3. **Route consistency** - Consider standardizing on `/auth` vs `/login`
4. **Test complete flow** - Verify paid users see "Manage Subscription" button
