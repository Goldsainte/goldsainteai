import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Crown, Gem, Star, Check } from "lucide-react";

const tierIcons: Record<string, any> = {
  bronze: Award,
  silver: Star,
  gold: Crown,
  platinum: Gem,
  diamond: Gem,
};

const tierColors: Record<string, string> = {
  bronze: "border-amber-600",
  silver: "border-slate-400",
  gold: "border-yellow-500",
  platinum: "border-cyan-400",
  diamond: "border-purple-500",
};

export function AllTiersOverview() {
  const { data: tiers, isLoading } = useQuery({
    queryKey: ["all-creator-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_tiers")
        .select("*")
        .order("tier_level", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: currentMembership } = useQuery({
    queryKey: ["current-tier-membership"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("creator_tier_memberships")
        .select("current_tier")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading tiers...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Creator Tiers</CardTitle>
        <CardDescription>Explore all available creator tiers and their benefits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {tiers?.map((tier) => {
            const TierIcon = tierIcons[tier.tier_name] || Award;
            const tierColor = tierColors[tier.tier_name];
            const isCurrentTier = currentMembership?.current_tier === tier.tier_name;
            const benefits = Array.isArray(tier.benefits) ? tier.benefits : [];

            return (
              <Card key={tier.id} className={`${tierColor} border-2 ${isCurrentTier ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TierIcon className="h-6 w-6" />
                      <div>
                        <CardTitle className="text-lg">{tier.display_name}</CardTitle>
                        <CardDescription className="text-xs">Level {tier.tier_level}</CardDescription>
                      </div>
                    </div>
                    {isCurrentTier && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{tier.description}</p>

                  {/* Requirements */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Requirements:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-muted-foreground" />
                        <span>{tier.min_followers?.toLocaleString()} followers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-muted-foreground" />
                        <span>{tier.min_posts} posts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-muted-foreground" />
                        <span>{tier.min_engagement_rate}% engagement</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-muted-foreground" />
                        <span>${tier.min_monthly_earnings?.toLocaleString()}/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Benefits:</h4>
                    <ul className="space-y-1 text-xs">
                      {benefits.slice(0, 3).map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-primary mt-0.5">✓</span>
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                      {benefits.length > 3 && (
                        <li className="text-muted-foreground italic">
                          +{benefits.length - 3} more benefits
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Commission Bonus */}
                  {tier.commission_bonus_percentage > 0 && (
                    <div className="bg-primary/5 p-2 rounded text-center">
                      <span className="text-sm font-medium">
                        +{tier.commission_bonus_percentage}% Commission Bonus
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}