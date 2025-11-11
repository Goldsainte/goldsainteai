import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, Info } from "lucide-react";
import { useState } from "react";

interface TierProgressCardProps {
  currentTier: "bronze" | "gold" | "platinum";
  currentMetrics: {
    followers: number;
    bookings: number;
    engagement: number;
  };
  nextTierRequirements?: {
    followers: number;
    bookings: number;
    engagement: number;
  };
  commissionRate: number;
  onViewBenefits: () => void;
}

export function TierProgressCard({
  currentTier,
  currentMetrics,
  nextTierRequirements,
  commissionRate,
  onViewBenefits,
}: TierProgressCardProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-gradient-to-r from-slate-400 to-slate-600";
      case "gold":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case "bronze":
        return "bg-gradient-to-r from-orange-400 to-orange-600";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-600";
    }
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getNextTier = (tier: string) => {
    switch (tier) {
      case "bronze":
        return "gold";
      case "gold":
        return "platinum";
      default:
        return null;
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const nextTier = getNextTier(currentTier);
  const isMaxTier = currentTier === "platinum";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${getTierColor(currentTier)} flex items-center justify-center`}>
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{getTierLabel(currentTier)} Tier</CardTitle>
              <CardDescription>
                {commissionRate}% commission rate
                {currentTier === "platinum" && " (+20% bonus)"}
                {currentTier === "gold" && " (+10% bonus)"}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onViewBenefits}>
            <Info className="w-4 h-4 mr-2" />
            View Benefits
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMaxTier && nextTierRequirements ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {getTierLabel(nextTier!)}</span>
              <Badge variant="secondary">
                <TrendingUp className="w-3 h-3 mr-1" />
                {Math.round(
                  (calculateProgress(currentMetrics.followers, nextTierRequirements.followers) +
                    calculateProgress(currentMetrics.bookings, nextTierRequirements.bookings) +
                    calculateProgress(currentMetrics.engagement, nextTierRequirements.engagement)) /
                    3
                )}%
              </Badge>
            </div>

            {/* Followers Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Followers</span>
                <span className="text-muted-foreground">
                  {currentMetrics.followers.toLocaleString()} / {nextTierRequirements.followers.toLocaleString()}
                </span>
              </div>
              <Progress value={calculateProgress(currentMetrics.followers, nextTierRequirements.followers)} />
            </div>

            {/* Bookings Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Total Bookings</span>
                <span className="text-muted-foreground">
                  {currentMetrics.bookings} / {nextTierRequirements.bookings}
                </span>
              </div>
              <Progress value={calculateProgress(currentMetrics.bookings, nextTierRequirements.bookings)} />
            </div>

            {/* Engagement Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Engagement Score</span>
                <span className="text-muted-foreground">
                  {currentMetrics.engagement} / {nextTierRequirements.engagement}
                </span>
              </div>
              <Progress value={calculateProgress(currentMetrics.engagement, nextTierRequirements.engagement)} />
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Keep creating amazing content and helping travelers! You're on your way to {getTierLabel(nextTier!)}{" "}
                tier with {commissionRate + 10}% commission rates.
              </p>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className={`w-16 h-16 rounded-full ${getTierColor(currentTier)} flex items-center justify-center mx-auto mb-4`}>
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">You've reached the highest tier!</h3>
            <p className="text-sm text-muted-foreground">
              Congratulations on achieving Platinum status. You're earning the maximum {commissionRate}% commission
              rate on all your bookings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
