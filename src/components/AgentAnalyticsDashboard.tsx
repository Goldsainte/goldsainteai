import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, Star, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AgentAnalyticsDashboardProps {
  agentId: string;
}

export const AgentAnalyticsDashboard = ({ agentId }: AgentAnalyticsDashboardProps) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [agentId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all jobs where agent has bid
      const { data: bids, error: bidsError } = await supabase
        .from('agent_bids')
        .select(`
          *,
          marketplace_jobs!inner(
            status,
            completed_at,
            created_at,
            agent_payout_amount,
            currency
          )
        `)
        .eq('agent_id', agentId);

      if (bidsError) throw bidsError;

      // Calculate metrics
      const totalBids = bids?.length || 0;
      const acceptedBids = bids?.filter(b => b.status === 'accepted').length || 0;
      const completedJobs = bids?.filter(b => b.marketplace_jobs?.status === 'completed').length || 0;
      const inProgressJobs = bids?.filter(b => b.marketplace_jobs?.status === 'in_progress').length || 0;
      const disputedJobs = bids?.filter(b => b.marketplace_jobs?.status === 'disputed').length || 0;
      
      // Calculate earnings
      const completedJobsWithPayout = bids?.filter(
        b => b.marketplace_jobs?.status === 'completed' && b.marketplace_jobs?.agent_payout_amount
      ) || [];
      
      const totalEarnings = completedJobsWithPayout.reduce(
        (sum, bid) => sum + (bid.marketplace_jobs?.agent_payout_amount || 0),
        0
      );

      const pendingEarnings = bids
        ?.filter(b => b.status === 'accepted' && b.marketplace_jobs?.status === 'in_progress')
        .reduce((sum, bid) => sum + (bid.agent_payout_amount || 0), 0) || 0;

      // Calculate average response time (time from job post to bid)
      const bidsWithTiming = bids?.filter(b => b.created_at && b.marketplace_jobs?.created_at) || [];
      const avgResponseTime = bidsWithTiming.length > 0
        ? bidsWithTiming.reduce((sum, bid) => {
            const jobCreated = new Date(bid.marketplace_jobs.created_at).getTime();
            const bidCreated = new Date(bid.created_at).getTime();
            return sum + (bidCreated - jobCreated) / (1000 * 60 * 60); // hours
          }, 0) / bidsWithTiming.length
        : 0;

      // Calculate average completion time
      const completedWithTime = completedJobsWithPayout.filter(
        b => b.marketplace_jobs?.completed_at && b.marketplace_jobs?.created_at
      );
      
      const avgCompletionTime = completedWithTime.length > 0
        ? completedWithTime.reduce((sum, bid) => {
            const created = new Date(bid.marketplace_jobs.created_at).getTime();
            const completed = new Date(bid.marketplace_jobs.completed_at).getTime();
            return sum + (completed - created) / (1000 * 60 * 60 * 24); // days
          }, 0) / completedWithTime.length
        : 0;

      // Win rate
      const winRate = totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0;

      // Success rate (completed / accepted)
      const successRate = acceptedBids > 0 ? (completedJobs / acceptedBids) * 100 : 0;

      setAnalytics({
        totalBids,
        acceptedBids,
        completedJobs,
        inProgressJobs,
        disputedJobs,
        totalEarnings,
        pendingEarnings,
        avgResponseTime,
        avgCompletionTime,
        winRate,
        successRate,
        currency: completedJobsWithPayout[0]?.marketplace_jobs?.currency || 'USD'
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: analytics.currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {analytics.completedJobs} completed jobs
            </p>
          </CardContent>
        </Card>

        {/* Pending Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(analytics.pendingEarnings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {analytics.inProgressJobs} active jobs
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.acceptedBids} of {analytics.totalBids} bids won
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.completedJobs} completed successfully
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {analytics.avgResponseTime.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Time to place bid after job posted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg. Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {analytics.avgCompletionTime.toFixed(1)} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average time to complete jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Job Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Completed
              </span>
              <Badge variant="secondary">{analytics.completedJobs}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                In Progress
              </span>
              <Badge variant="secondary">{analytics.inProgressJobs}</Badge>
            </div>
            {analytics.disputedJobs > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Disputed
                </span>
                <Badge variant="destructive">{analytics.disputedJobs}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};