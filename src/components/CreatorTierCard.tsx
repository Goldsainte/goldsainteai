import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Crown, Gem, Star, TrendingUp, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const tierIcons: Record<string, any> = {
  bronze: Award,
  silver: Star,
  gold: Crown,
  platinum: Gem,
  diamond: Gem,
};

const tierColors: Record<string, string> = {
  bronze: "bg-amber-600",
  silver: "bg-slate-400",
  gold: "bg-yellow-500",
  platinum: "bg-cyan-400",
  diamond: "bg-purple-500",
};

export function CreatorTierCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const evaluateTierMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('evaluate-creator-tier');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creator-tier-membership"] });
      queryClient.invalidateQueries({ queryKey: ["tier-progress-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["tier-upgrade-history"] });
      
      if (data.tier_result?.tier_changed) {
        toast({
          title: "Tier Updated! 🎉",
          description: `You've been upgraded to ${data.tier_result.new_tier}!`,
        });
      } else {
        toast({
          title: "Tier Evaluated",
          description: "Your progress has been recalculated.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to evaluate tier. Please try again.",
        variant: "destructive",
      });
      console.error('Error evaluating tier:', error);
    },
  });

  const { data: tierMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ["creator-tier-membership"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("creator_tier_memberships")
        .select(`
          *,
          tier:creator_tiers!creator_tier_memberships_current_tier_fkey(*)
        `)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: progressMetrics } = useQuery({
    queryKey: ["tier-progress-metrics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tier_progress_metrics")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: nextTier } = useQuery({
    queryKey: ["next-tier", tierMembership?.current_tier],
    queryFn: async () => {
      if (!tierMembership?.tier) return null;

      const { data, error } = await supabase
        .from("creator_tiers")
        .select("*")
        .gt("tier_level", tierMembership.tier.tier_level)
        .order("tier_level", { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!tierMembership?.tier,
  });

  if (membershipLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading tier information...</p>
        </CardContent>
      </Card>
    );
  }

  if (!tierMembership || !tierMembership.tier) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">No tier assigned yet</p>
          <p className="text-sm text-muted-foreground">
            Start creating content to get your first tier!
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentTier = tierMembership.tier;
  const TierIcon = tierIcons[currentTier.tier_name] || Award;
  const tierColor = tierColors[currentTier.tier_name];

  const calculateProgress = (metric: string) => {
    if (!progressMetrics || !nextTier) return 100;

    const current = progressMetrics[metric as keyof typeof progressMetrics] as number || 0;
    const required = nextTier[`min_${metric}` as keyof typeof nextTier] as number || 0;

    if (required === 0) return 100;
    return Math.min((current / required) * 100, 100);
  };

  const benefits = Array.isArray(currentTier.benefits) ? currentTier.benefits : [];

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${tierColor}`} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${tierColor} bg-opacity-20`}>
              <TierIcon className={`h-6 w-6 ${tierColor.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <CardTitle className="text-2xl">{currentTier.display_name}</CardTitle>
              <CardDescription>{currentTier.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Level {currentTier.tier_level}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => evaluateTierMutation.mutate()}
              disabled={evaluateTierMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${evaluateTierMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benefits */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" />
            Your Benefits
          </h3>
          <ul className="space-y-2">
            {benefits.map((benefit: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Commission Bonus */}
        {currentTier.commission_bonus_percentage > 0 && (
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Commission Bonus</span>
              <Badge variant="default">+{currentTier.commission_bonus_percentage}%</Badge>
            </div>
          </div>
        )}

        {/* Progress to Next Tier */}
        {nextTier && progressMetrics && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress to {nextTier.display_name}
              </h3>
            </div>

            <div className="space-y-3">
              {/* Followers Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Followers</span>
                  <span className="font-medium">
                    {progressMetrics.current_followers?.toLocaleString()} / {nextTier.min_followers?.toLocaleString()}
                  </span>
                </div>
                <Progress value={calculateProgress('followers')} className="h-2" />
              </div>

              {/* Posts Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Posts</span>
                  <span className="font-medium">
                    {progressMetrics.current_posts} / {nextTier.min_posts}
                  </span>
                </div>
                <Progress value={calculateProgress('posts')} className="h-2" />
              </div>

              {/* Engagement Rate Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Engagement Rate</span>
                  <span className="font-medium">
                    {progressMetrics.current_engagement_rate?.toFixed(2)}% / {nextTier.min_engagement_rate}%
                  </span>
                </div>
                <Progress value={calculateProgress('engagement_rate')} className="h-2" />
              </div>

              {/* Monthly Earnings Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Monthly Earnings</span>
                  <span className="font-medium">
                    ${progressMetrics.monthly_earnings?.toLocaleString()} / ${nextTier.min_monthly_earnings?.toLocaleString()}
                  </span>
                </div>
                <Progress value={calculateProgress('monthly_earnings')} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {!nextTier && (
          <div className="text-center py-4 bg-primary/5 rounded-lg">
            <Crown className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">You've reached the highest tier!</p>
            <p className="text-sm text-muted-foreground">Keep up the amazing work!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}