# Subscription Management - Complete Code for Review

## Frontend Code

### src/pages/Subscription.tsx (455 lines)

```typescript
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Crown, Zap, Star, ArrowRight } from "lucide-react";

type SubscriptionTier = 'free' | 'premium' | 'enterprise';

interface UserSubscription {
  tier: SubscriptionTier;
  created_at: string;
}

const TIER_PRICE_IDS: Record<SubscriptionTier, string> = {
  free: '',
  premium: 'price_1SQe1cF9Y0dnmu4YKaVKPSU6',
  enterprise: 'price_1SQe1uF9Y0dnmu4Yk53KjWru',
};

const tierFeatures = {
  free: {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Star,
    color: "text-muted-foreground",
    features: [
      "30 API requests per 5 minutes",
      "Basic search features",
      "Standard support",
      "Access to public content"
    ],
    limits: "Perfect for trying out the platform"
  },
  premium: {
    name: "Premium",
    price: "$29",
    period: "per month",
    icon: Zap,
    color: "text-primary",
    features: [
      "100 API requests per 5 minutes",
      "Advanced search filters",
      "Priority support",
      "Early access to new features",
      "Save unlimited favorites",
      "Custom collections"
    ],
    limits: "Great for frequent travelers"
  },
  enterprise: {
    name: "Enterprise",
    price: "$99",
    period: "per month",
    icon: Crown,
    color: "text-accent",
    features: [
      "500 API requests per 5 minutes",
      "Unlimited searches",
      "24/7 dedicated support",
      "Custom integrations",
      "API access",
      "Team management",
      "Advanced analytics",
      "White-label options"
    ],
    limits: "Perfect for businesses and agencies"
  }
};

export default function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserSubscription();
    
    // Check for success/canceled query params
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

      // Check subscription status from Stripe
      const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
      
      if (subError) {
        console.error('Error checking subscription:', subError);
        // Fallback to database
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('tier, created_at')
          .eq('user_id', authUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading subscription:', error);
          toast.error("Failed to load subscription details");
          return;
        }

        if (data) {
          setCurrentTier(data.tier as SubscriptionTier);
        }
      } else {
        // Use tier from Stripe check
        setCurrentTier(subData.tier as SubscriptionTier);
      }
    } catch (error) {
      console.error('Load subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!user) {
      toast.error("Please log in to upgrade your subscription");
      navigate("/auth");
      return;
    }

    try {
      const priceId = TIER_PRICE_IDS[tier];
      if (!priceId) {
        toast.error("Invalid subscription tier");
        return;
      }

      toast.loading("Redirecting to checkout...");
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout process");
    }
  };

  const handleManageSubscription = async () => {
    try {
      toast.loading("Opening subscription management...");
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL received");
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error("Failed to open subscription management");
    }
  };

  const getTierIndex = (tier: SubscriptionTier): number => {
    const tiers = ['free', 'premium', 'enterprise'];
    return tiers.indexOf(tier);
  };

  const canUpgrade = (targetTier: SubscriptionTier): boolean => {
    return getTierIndex(targetTier) > getTierIndex(currentTier);
  };

  const isCurrent = (tier: SubscriptionTier): boolean => {
    return tier === currentTier;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock more features and higher rate limits with our flexible subscription plans
          </p>
          {user && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <Badge variant="secondary" className="text-base px-4 py-2">
                Current Plan: <span className="font-bold ml-2 capitalize">{currentTier}</span>
              </Badge>
              <div className="flex gap-3">
                {currentTier !== 'free' && (
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    className="text-sm"
                  >
                    Manage Subscription
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/billing-dashboard')}
                  className="text-sm"
                >
                  View Billing History
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {(Object.keys(tierFeatures) as SubscriptionTier[]).map((tier) => {
            const config = tierFeatures[tier];
            const Icon = config.icon;
            const isCurrentPlan = isCurrent(tier);
            const canUpgradeToThis = canUpgrade(tier);

            return (
              <Card 
                key={tier}
                className={`relative transition-all hover:shadow-xl ${
                  isCurrentPlan 
                    ? 'border-primary border-2 shadow-lg' 
                    : tier === 'premium' 
                    ? 'border-primary/50' 
                    : ''
                }`}
              >
                {tier === 'premium' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="secondary" className="bg-green-500 text-white px-4 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div className={`mx-auto w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${config.color}`} />
                  </div>
                  <CardTitle className="text-2xl mb-2">{config.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{config.price}</span>
                    <span className="text-muted-foreground ml-2">{config.period}</span>
                  </div>
                  <CardDescription>{config.limits}</CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {config.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : tier === 'premium' ? "default" : "secondary"}
                    disabled={isCurrentPlan || !canUpgradeToThis}
                    onClick={() => handleUpgrade(tier)}
                  >
                    {isCurrentPlan ? (
                      "Current Plan"
                    ) : canUpgradeToThis ? (
                      <>
                        Upgrade Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      "Lower Tier"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Rate Limits Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rate Limits Comparison</CardTitle>
            <CardDescription>
              Higher tiers get increased API request limits for faster, more frequent searches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Feature</th>
                    <th className="text-center py-4 px-4">Free</th>
                    <th className="text-center py-4 px-4">Premium</th>
                    <th className="text-center py-4 px-4">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">API Requests (per 5 min)</td>
                    <td className="text-center py-4 px-4">30</td>
                    <td className="text-center py-4 px-4 text-primary font-bold">100</td>
                    <td className="text-center py-4 px-4 text-accent font-bold">500</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">Search History</td>
                    <td className="text-center py-4 px-4">30 days</td>
                    <td className="text-center py-4 px-4">1 year</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">Support Response Time</td>
                    <td className="text-center py-4 px-4">48 hours</td>
                    <td className="text-center py-4 px-4">12 hours</td>
                    <td className="text-center py-4 px-4">1 hour (24/7)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">API Access</td>
                    <td className="text-center py-4 px-4">—</td>
                    <td className="text-center py-4 px-4">—</td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 mx-auto text-green-500" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my rate limit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You'll receive a temporary rate limit error. Wait a few minutes or upgrade your plan for higher limits.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a refund policy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need a custom plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Contact our sales team for custom enterprise solutions with tailored features and pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        {!user && (
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-muted-foreground mb-6">
                  Sign up now to start with our Free plan and upgrade anytime as your needs grow.
                </p>
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Sign Up Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Backend Edge Functions

### supabase/functions/create-checkout/index.ts (87 lines)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId } = await req.json();
    if (!priceId) {
      throw new Error("Price ID is required");
    }
    logStep("Price ID received", { priceId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("Creating new customer");
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
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
      success_url: `${origin}/subscription?success=true`,
      cancel_url: `${origin}/subscription?canceled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

### supabase/functions/customer-portal/index.ts (81 lines)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    
    let customerId: string;
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

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/subscription`,
    });
    logStep("Customer portal session created", { sessionId: portalSession.id });

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

### supabase/functions/check-subscription/index.ts (192 lines)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
        const emailType = tier > oldTier ? 'upgrade' : 'downgrade';
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

### supabase/functions/create-ai-subscription-checkout/index.ts (77 lines)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const { priceId, tier } = await req.json();
    if (!priceId || !tier) {
      throw new Error("Price ID and tier are required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
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
      success_url: `${origin}/ai-subscription?success=true&tier=${tier}`,
      cancel_url: `${origin}/ai-subscription?canceled=true`,
      metadata: {
        user_id: user.id,
        ai_tier: tier
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR in create-ai-subscription-checkout:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

### supabase/functions/check-verification/index.ts (73 lines)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ is_verified: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Check for active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSubscription = subscriptions.data.length > 0;

    // If subscription is active but profile doesn't reflect it, update it
    if (hasActiveSubscription) {
      await supabaseClient
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id);
    }

    return new Response(JSON.stringify({ 
      is_verified: hasActiveSubscription 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

### supabase/functions/create-verification-checkout/index.ts (70 lines)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    if (!user?.email) throw new Error("User not authenticated");

    const { returnUrl } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session for verification subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: 'price_1SIgMGF9Y0dnmu4YWTKXIuIP',
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl}?verification=success`,
      cancel_url: `${returnUrl}?verification=cancelled`,
      metadata: {
        user_id: user.id,
        subscription_type: 'verification',
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

### supabase/functions/stripe-webhook/index.ts (337 lines)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    console.error("Missing stripe-signature header or webhook secret");
    return new Response("Webhook signature or secret missing", { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});

async function handleCheckoutSessionCompleted(session: any) {
  console.log("Processing checkout.session.completed", session.id);
  
  const userId = session.metadata?.user_id;
  const subscriptionType = session.metadata?.subscription_type;
  
  if (!userId || subscriptionType !== 'verification') {
    console.log("Not a verification subscription, skipping");
    return;
  }

  try {
    // Grant verified badge
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw profileError;
    }

    // Store subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    const { error: subError } = await supabaseClient
      .from('verification_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      }, {
        onConflict: 'user_id'
      });

    if (subError) {
      console.error("Error storing subscription:", subError);
      throw subError;
    }

    console.log(`✅ Granted verification badge to user ${userId}`);
    
    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'verification_badge_granted',
        entity_type: 'subscription',
        entity_id: userId,
        details: {
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
        }
      });
  } catch (error) {
    console.error("Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log("Processing customer.subscription.updated", subscription.id);
  
  // Only process verification subscriptions
  if (subscription.metadata?.subscription_type !== 'verification') {
    console.log("Not a verification subscription, skipping");
    return;
  }

  try {
    // Find user by subscription ID
    const { data: subData, error: findError } = await supabaseClient
      .from('verification_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (findError || !subData) {
      console.error("Subscription not found in database:", subscription.id);
      return;
    }

    const userId = subData.user_id;

    // Update subscription status
    const { error: updateError } = await supabaseClient
      .from('verification_subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    // Update verification badge based on status
    const isActive = subscription.status === 'active';
    
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: isActive })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw profileError;
    }

    console.log(`✅ Updated verification status for user ${userId}: ${isActive}`);
    
    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: isActive ? 'verification_badge_renewed' : 'verification_badge_suspended',
        entity_type: 'subscription',
        entity_id: userId,
        details: {
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
        }
      });
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log("Processing customer.subscription.deleted", subscription.id);
  
  if (subscription.metadata?.subscription_type !== 'verification') {
    console.log("Not a verification subscription, skipping");
    return;
  }

  try {
    // Find user by subscription ID
    const { data: subData, error: findError } = await supabaseClient
      .from('verification_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (findError || !subData) {
      console.error("Subscription not found in database:", subscription.id);
      return;
    }

    const userId = subData.user_id;

    // Revoke verification badge
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw profileError;
    }

    // Update subscription status to canceled
    const { error: updateError } = await supabaseClient
      .from('verification_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log(`✅ Revoked verification badge from user ${userId}`);
    
    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'verification_badge_revoked',
        entity_type: 'subscription',
        entity_id: userId,
        details: {
          stripe_subscription_id: subscription.id,
          reason: 'subscription_deleted',
        }
      });
  } catch (error) {
    console.error("Error in handleSubscriptionDeleted:", error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log("Processing invoice.payment_failed", invoice.id);
  
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    
    if (subscription.metadata?.subscription_type !== 'verification') {
      console.log("Not a verification subscription, skipping");
      return;
    }

    // Find user by subscription ID
    const { data: subData, error: findError } = await supabaseClient
      .from('verification_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (findError || !subData) {
      console.error("Subscription not found in database:", subscriptionId);
      return;
    }

    const userId = subData.user_id;

    // Update subscription status to past_due
    const { error: updateError } = await supabaseClient
      .from('verification_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log(`⚠️ Payment failed for user ${userId}, subscription marked as past_due`);
    
    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'verification_payment_failed',
        entity_type: 'subscription',
        entity_id: userId,
        details: {
          stripe_subscription_id: subscriptionId,
          invoice_id: invoice.id,
          amount_due: invoice.amount_due,
        }
      });

    // Note: Badge remains active during grace period (Stripe handles retry logic)
    // Badge will be revoked when subscription.deleted event fires if payment never succeeds
  } catch (error) {
    console.error("Error in handlePaymentFailed:", error);
    throw error;
  }
}
```

## Key Issues Fixed

1. **Missing Authorization Headers** - Both `handleUpgrade` and `handleManageSubscription` now fetch the access token and pass it in headers
2. **Stripe API Version** - Changed from future version "2025-08-27.basil" to stable "2023-10-16" across all edge functions
3. **Popup Blocker Prevention** - Changed from `window.open()` to `window.location.href` for same-tab navigation

## TIER_PRICE_IDS Mapping

```typescript
const TIER_PRICE_IDS: Record<SubscriptionTier, string> = {
  free: '',
  premium: 'price_1SQe1cF9Y0dnmu4YKaVKPSU6',
  enterprise: 'price_1SQe1uF9Y0dnmu4Yk53KjWru',
};
```

## PRODUCT_TIER_MAP in check-subscription

```typescript
const PRODUCT_TIER_MAP: Record<string, string> = {
  'prod_TNOppvdXPriM3E': 'premium',
  'prod_TNOpkzmfNXljRz': 'enterprise',
};
```

**Important**: Verify these IDs match your actual Stripe Dashboard configuration:
- Each `price_` in TIER_PRICE_IDS should point to a Product in Stripe
- Each `prod_` in PRODUCT_TIER_MAP should match the actual Product IDs those prices belong to
