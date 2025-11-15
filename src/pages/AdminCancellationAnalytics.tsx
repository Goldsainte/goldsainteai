import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, DollarSign, PieChart, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CancellationStats {
  totalCancellations: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  averageRefundAmount: number;
  averageRefundPercentage: number;
  totalRefundedAmount: number;
}

interface TrendData {
  date: string;
  cancellations: number;
  refunds: number;
}

interface PolicyEffectiveness {
  policyName: string;
  cancellationCount: number;
  averageRefundPercentage: number;
  totalRefunded: number;
}

export default function AdminCancellationAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CancellationStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [policyData, setPolicyData] = useState<PolicyEffectiveness[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
      const startDate = startOfDay(subDays(new Date(), daysMap[timeRange]));

      // Load overall stats
      const { data: cancellations, error: cancellationsError } = await supabase
        .from("booking_cancellations")
        .select("*")
        .gte("requested_at", startDate.toISOString());

      if (cancellationsError) throw cancellationsError;

      // Calculate stats
      const totalCancellations = cancellations?.length || 0;
      const pendingCount = cancellations?.filter((c) => c.status === "pending").length || 0;
      const approvedCount = cancellations?.filter((c) => c.status === "approved").length || 0;
      const rejectedCount = cancellations?.filter((c) => c.status === "rejected").length || 0;
      const completedCount = 0; // Not tracked in booking_cancellations

      const approvedAndCompleted = cancellations?.filter(
        (c) => c.status === "approved"
      );
      
      // Note: Refund data would come from a separate booking_refunds table
      const totalRefundedAmount = 0;
      const averageRefundAmount = 0;
      const averageRefundPercentage = 0;

      setStats({
        totalCancellations,
        pendingCount,
        approvedCount,
        rejectedCount,
        completedCount,
        averageRefundAmount,
        averageRefundPercentage,
        totalRefundedAmount,
      });

      // Prepare trend data
      const trendMap = new Map<string, { cancellations: number; refunds: number }>();
      cancellations?.forEach((c) => {
        const dateKey = format(new Date(c.requested_at), "MMM dd");
        const existing = trendMap.get(dateKey) || { cancellations: 0, refunds: 0 };
        existing.cancellations += 1;
        if (c.status === "approved") {
          existing.refunds += 0; // Refund data not in this table
        }
        trendMap.set(dateKey, existing);
      });

      const trends = Array.from(trendMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTrendData(trends);

      // Mock policy data for now (booking_cancellation_policies not implemented)
      setPolicyData([]);
    } catch (error: any) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: "#f59e0b",
    approved: "#10b981",
    rejected: "#ef4444",
    completed: "#3b82f6",
  };

  const statusData = stats
    ? [
        { name: "Pending", value: stats.pendingCount, color: statusColors.pending },
        { name: "Approved", value: stats.approvedCount, color: statusColors.approved },
        { name: "Rejected", value: stats.rejectedCount, color: statusColors.rejected },
        { name: "Completed", value: stats.completedCount, color: statusColors.completed },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cancellation Analytics</h1>
            <p className="text-muted-foreground">
              Track cancellation trends, refunds, and policy effectiveness
            </p>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cancellations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCancellations || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingCount || 0} pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Refund Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.averageRefundAmount.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.averageRefundPercentage.toFixed(1) || 0}% average rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.totalRefundedAmount.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.approvedCount || 0} approved refunds
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalCancellations
                  ? ((stats.rejectedCount / stats.totalCancellations) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.rejectedCount || 0} rejected requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cancellation Trends</CardTitle>
              <CardDescription>Daily cancellation and refund amounts over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="cancellations"
                    stroke="hsl(var(--primary))"
                    name="Cancellations"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="refunds"
                    stroke="hsl(var(--destructive))"
                    name="Refund Amount ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Breakdown of cancellation statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Policy Effectiveness */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Effectiveness</CardTitle>
            <CardDescription>
              Performance metrics for different cancellation policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={policyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="policyName" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="cancellationCount"
                  fill="hsl(var(--primary))"
                  name="Cancellations"
                />
                <Bar
                  yAxisId="right"
                  dataKey="averageRefundPercentage"
                  fill="hsl(var(--secondary))"
                  name="Avg Refund %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
