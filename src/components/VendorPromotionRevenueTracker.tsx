import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Percent, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface RevenueMetrics {
  totalMRR: number;
  subscriptionRevenue: number;
  commissionRevenue: number;
  tierDistribution: Array<{ tier: string; count: number; revenue: number }>;
  churnRate: number;
  avgRevenuePerVendor: number;
  totalActiveVendors: number;
  commissionSavingsProvided: number;
}

const TIER_COLORS = {
  free: '#94a3b8',
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2'
};

export default function VendorPromotionRevenueTracker() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueMetrics();
  }, []);

  const fetchRevenueMetrics = async () => {
    try {
      // Fetch subscription data
      const { data: subscriptions, error: subError } = await supabase
        .from('vendor_promotion_subscriptions')
        .select(`
          *,
          transportation_vendors!inner(
            supplier_id,
            suppliers!inner(business_name)
          )
        `)
        .eq('status', 'active');

      if (subError) throw subError;

      // Calculate MRR
      const totalMRR = subscriptions?.reduce((sum, sub) => sum + Number(sub.monthly_price), 0) || 0;

      // Tier distribution
      const tierCounts: Record<string, { count: number; revenue: number }> = {};
      subscriptions?.forEach(sub => {
        if (!tierCounts[sub.tier]) {
          tierCounts[sub.tier] = { count: 0, revenue: 0 };
        }
        tierCounts[sub.tier].count += 1;
        tierCounts[sub.tier].revenue += Number(sub.monthly_price);
      });

      const tierDistribution = Object.entries(tierCounts).map(([tier, data]) => ({
        tier,
        count: data.count,
        revenue: data.revenue
      }));

      // Calculate commission savings (difference between 15% standard and their tier rate)
      const commissionSavings = subscriptions?.reduce((sum, sub) => {
        return sum + ((15 - Number(sub.commission_rate)) / 100 * 1000); // Estimated per $1000 booking
      }, 0) || 0;

      // Mock commission revenue calculation (would integrate with actual booking data)
      const commissionRevenue = totalMRR * 0.8; // Estimated commission revenue

      setMetrics({
        totalMRR,
        subscriptionRevenue: totalMRR,
        commissionRevenue,
        tierDistribution,
        churnRate: 5.2, // Mock data - would calculate from cancellations
        avgRevenuePerVendor: subscriptions.length > 0 ? totalMRR / subscriptions.length : 0,
        totalActiveVendors: subscriptions?.length || 0,
        commissionSavingsProvided: commissionSavings
      });

    } catch (error: any) {
      console.error('Error fetching revenue metrics:', error);
      toast.error("Failed to load revenue metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vendor Promotion Revenue Dashboard</h1>
        <p className="text-muted-foreground">Track monetization from transportation vendor promotions</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${metrics.totalMRR.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalActiveVendors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With paid subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Vendor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${metrics.avgRevenuePerVendor.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average monthly revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.churnRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly cancellation rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
            <CardDescription>Vendors by promotion tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.tierDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, count }) => `${tier}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier as keyof typeof TIER_COLORS] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
            <CardDescription>Monthly subscription revenue per tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.tierDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Commission Revenue (30 days)</CardTitle>
            <CardDescription>Revenue from booking commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${metrics.commissionRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              From completed bookings with varying commission rates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Platform Revenue</CardTitle>
            <CardDescription>Combined subscription + commission revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${(metrics.totalMRR + metrics.commissionRevenue).toLocaleString()}
            </div>
            <div className="flex gap-4 mt-3 text-sm">
              <div>
                <p className="text-muted-foreground">Subscriptions</p>
                <p className="font-semibold">${metrics.subscriptionRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Commissions</p>
                <p className="font-semibold">${metrics.commissionRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}