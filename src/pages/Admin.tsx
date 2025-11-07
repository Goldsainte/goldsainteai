import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Users, Activity, TrendingUp } from "lucide-react";

type SubscriptionTier = 'free' | 'premium' | 'enterprise';

interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
  profiles?: {
    email?: string;
  };
}

interface RateLimitStats {
  endpoint: string;
  total_requests: number;
  unique_users: number;
  blocked_requests: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [rateLimitStats, setRateLimitStats] = useState<RateLimitStats[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to access admin dashboard");
        navigate("/");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !roles) {
        toast.error("Access denied: Admin privileges required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error) {
      console.error('Admin check error:', error);
      toast.error("Failed to verify admin status");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load user subscriptions
      const { data: subs, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;
      
      // Add empty profiles object for display
      const subscriptionsWithPlaceholder = (subs || []).map(sub => ({
        ...sub,
        profiles: { email: undefined }
      }));
      
      setSubscriptions(subscriptionsWithPlaceholder);

      // Load rate limit stats
      const { data: stats, error: statsError } = await supabase
        .from('rate_limits')
        .select('endpoint, request_count, identifier')
        .gte('window_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (statsError) throw statsError;

      // Aggregate stats by endpoint
      const aggregated = (stats || []).reduce((acc: Record<string, RateLimitStats>, curr) => {
        if (!acc[curr.endpoint]) {
          acc[curr.endpoint] = {
            endpoint: curr.endpoint,
            total_requests: 0,
            unique_users: 0,
            blocked_requests: 0
          };
        }
        acc[curr.endpoint].total_requests += curr.request_count;
        return acc;
      }, {});

      setRateLimitStats(Object.values(aggregated));
    } catch (error) {
      console.error('Load data error:', error);
      toast.error("Failed to load dashboard data");
    }
  };

  const updateUserTier = async (userId: string, newTier: SubscriptionTier) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ tier: newTier, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`Successfully updated subscription tier to ${newTier}`);
      await loadData();
    } catch (error) {
      console.error('Update tier error:', error);
      toast.error("Failed to update subscription tier");
    } finally {
      setUpdating(null);
    }
  };

  const getTierBadgeVariant = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'enterprise': return 'default';
      case 'premium': return 'secondary';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const totalUsers = subscriptions.length;
  const totalRequests = rateLimitStats.reduce((sum, stat) => sum + stat.total_requests, 0);
  const premiumUsers = subscriptions.filter(s => s.tier === 'premium').length;
  const enterpriseUsers = subscriptions.filter(s => s.tier === 'enterprise').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage user subscriptions and monitor rate limits</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to App
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{premiumUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enterprise Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enterpriseUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Requests (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Subscriptions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Subscriptions</CardTitle>
            <CardDescription>Manage subscription tiers for all users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Current Tier</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.user_id.substring(0, 8) + '...'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTierBadgeVariant(sub.tier)}>
                        {sub.tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(sub.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={sub.tier}
                        onValueChange={(value) => updateUserTier(sub.user_id, value as SubscriptionTier)}
                        disabled={updating === sub.user_id}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Rate Limit Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limit Statistics (Last 24 Hours)</CardTitle>
            <CardDescription>Monitor API usage across all endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Total Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateLimitStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No rate limit data available
                    </TableCell>
                  </TableRow>
                ) : (
                  rateLimitStats.map((stat) => (
                    <TableRow key={stat.endpoint}>
                      <TableCell className="font-medium">{stat.endpoint}</TableCell>
                      <TableCell>{stat.total_requests.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
