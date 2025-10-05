import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Clock, ThumbsUp, CheckCircle, Star, TrendingUp } from "lucide-react";

interface PerformanceMetrics {
  avg_response_time_minutes: number;
  response_rate_percentage: number;
  acceptance_rate_percentage: number;
  completion_rate_percentage: number;
  avg_customer_rating: number;
  total_bids_sent: number;
  jobs_completed: number;
  on_time_delivery_rate: number;
}

interface AgentPerformanceMetricsProps {
  agentId: string;
  compact?: boolean;
}

export function AgentPerformanceMetrics({ agentId, compact = false }: AgentPerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [agentId]);

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_performance_metrics")
        .select("*")
        .eq("agent_id", agentId)
        .order("period_start", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setMetrics(data);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading metrics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{formatResponseTime(metrics.avg_response_time_minutes)}</p>
          <p className="text-xs text-muted-foreground">Avg Response</p>
        </div>
        <div className="text-center">
          <ThumbsUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{Math.round(metrics.acceptance_rate_percentage)}%</p>
          <p className="text-xs text-muted-foreground">Acceptance</p>
        </div>
        <div className="text-center">
          <CheckCircle className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{Math.round(metrics.completion_rate_percentage)}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
        <div className="text-center">
          <Star className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{metrics.avg_customer_rating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Rating</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>Current period performance statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Response Time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Average Response Time</span>
            </div>
            <span className="text-sm font-bold">
              {formatResponseTime(metrics.avg_response_time_minutes)}
            </span>
          </div>
          <Progress
            value={Math.min(100, (60 / metrics.avg_response_time_minutes) * 100)}
            className="h-2"
          />
        </div>

        {/* Acceptance Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Acceptance Rate</span>
            </div>
            <span className="text-sm font-bold">
              {Math.round(metrics.acceptance_rate_percentage)}%
            </span>
          </div>
          <Progress value={metrics.acceptance_rate_percentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.total_bids_sent} bids sent
          </p>
        </div>

        {/* Completion Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Completion Rate</span>
            </div>
            <span className="text-sm font-bold">
              {Math.round(metrics.completion_rate_percentage)}%
            </span>
          </div>
          <Progress value={metrics.completion_rate_percentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.jobs_completed} jobs completed
          </p>
        </div>

        {/* On-Time Delivery */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">On-Time Delivery</span>
            </div>
            <span className="text-sm font-bold">
              {Math.round(metrics.on_time_delivery_rate)}%
            </span>
          </div>
          <Progress value={metrics.on_time_delivery_rate} className="h-2" />
        </div>

        {/* Customer Rating */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Customer Satisfaction</span>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-bold">
                {metrics.avg_customer_rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}