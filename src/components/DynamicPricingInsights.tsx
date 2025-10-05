import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

interface PricingSuggestion {
  suggested_price: number;
  market_average: number;
  confidence_score: number;
  factors: Record<string, any>;
}

interface DynamicPricingInsightsProps {
  jobId?: string;
  bookingType: string;
  destination?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export const DynamicPricingInsights = ({
  jobId,
  bookingType,
  destination,
  budgetMin,
  budgetMax,
}: DynamicPricingInsightsProps) => {
  const [insights, setInsights] = useState<PricingSuggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingInsights();
  }, [jobId, bookingType, destination]);

  const fetchPricingInsights = async () => {
    try {
      // Fetch pricing suggestions if available
      if (jobId) {
        const { data, error } = await (supabase as any)
          .from("pricing_suggestions")
          .select("*")
          .eq("job_id", jobId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setInsights(data);
        }
      }

      // Fetch market average from price history
      const { data: priceHistory } = await (supabase as any)
        .from("price_history")
        .select("average_price, sample_size")
        .eq("booking_type", bookingType)
        .eq("destination", destination || "")
        .gte("date_recorded", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order("date_recorded", { ascending: false });

      if (priceHistory && priceHistory.length > 0) {
        const totalSamples = priceHistory.reduce((sum, item) => sum + (item.sample_size || 0), 0);
        const weightedAverage = priceHistory.reduce(
          (sum, item) => sum + item.average_price * (item.sample_size || 1),
          0
        ) / totalSamples;

        if (!insights) {
          setInsights({
            suggested_price: weightedAverage,
            market_average: weightedAverage,
            confidence_score: Math.min(totalSamples / 100, 1),
            factors: { samples: totalSamples },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching pricing insights:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !insights) {
    return null;
  }

  const budgetMidpoint = budgetMin && budgetMax ? (budgetMin + budgetMax) / 2 : null;
  const priceDiff = budgetMidpoint ? insights.suggested_price - budgetMidpoint : 0;
  const isAboveBudget = priceDiff > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Pricing Insights
        </CardTitle>
        <CardDescription>AI-powered market analysis and recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Suggested Price
            </div>
            <p className="text-2xl font-bold">
              ${insights.suggested_price.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Market Average
            </div>
            <p className="text-2xl font-bold">
              ${insights.market_average.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <Badge variant={insights.confidence_score > 0.7 ? "default" : "secondary"}>
              {(insights.confidence_score * 100).toFixed(0)}%
            </Badge>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${insights.confidence_score * 100}%` }}
            />
          </div>
        </div>

        {budgetMidpoint && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2">
              {isAboveBudget ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-sm">
                {isAboveBudget ? "Above" : "Below"} customer budget by{" "}
                <span className="font-semibold">${Math.abs(priceDiff).toFixed(2)}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Customer budget range: ${budgetMin?.toFixed(2)} - ${budgetMax?.toFixed(2)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
