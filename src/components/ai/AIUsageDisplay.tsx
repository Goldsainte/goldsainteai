import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AIUsageStats {
  tier: string;
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
  needsUpgrade: boolean;
  tierInfo: {
    name: string;
    price: number;
    priceId: string | null;
  };
  availableTiers: Array<{
    key: string;
    name: string;
    limit: number;
    price: number;
    priceId: string | null;
  }>;
}

export function AIUsageDisplay() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token}`,
    };
  };

  const fetchUsage = async () => {
    try {
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('check-ai-usage', { headers });
      
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching AI usage:', error);
      toast({
        title: "Error",
        description: "Failed to fetch AI usage stats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleUpgrade = async (priceId: string, tier: string) => {
    try {
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers,
        body: { priceId, subscriptionType: 'ai', tier }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const usagePercentage = (stats.used / stats.limit) * 100;
  const isNearLimit = usagePercentage >= 80;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI Search Usage</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.tierInfo.name}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {stats.used} of {stats.limit} searches used
              </span>
              <span className={isNearLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                {stats.remaining} remaining
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>

          <p className="text-xs text-muted-foreground">
            Resets on {format(new Date(stats.resetDate), 'MMM dd, yyyy')}
          </p>

          {isNearLimit && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                You're running low on AI searches. Upgrade your plan to continue using AI-powered features.
              </p>
            </div>
          )}
        </div>
      </Card>

      {stats.tier === 'free' || stats.needsUpgrade ? (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-1" />
              <div className="space-y-1">
                <h4 className="font-semibold">Upgrade for More AI Searches</h4>
                <p className="text-sm text-muted-foreground">
                  Get more AI-powered searches with our premium plans
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {stats.availableTiers
                .filter(t => t.key !== 'free' && t.key !== stats.tier)
                .map(tier => (
                  <div
                    key={tier.key}
                    className="flex items-center justify-between p-4 bg-background border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{tier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tier.limit} searches/month
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">${tier.price}</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                      <Button
                        onClick={() => handleUpgrade(tier.priceId!, tier.key)}
                        size="sm"
                      >
                        Upgrade
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
