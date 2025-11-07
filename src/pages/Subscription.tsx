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
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
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
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
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
