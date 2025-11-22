import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, DollarSign, TrendingUp, Package, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PartnershipApprovals } from "@/components/PartnershipApprovals";

export default function CoCuratedDashboard() {
  const { user } = useAuth();
  const { isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePromotions: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
  });
  const [packages, setPackages] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAgentAccess = isAdmin || isAgent;

  useEffect(() => {
    fetchStats();
  }, [user, hasAgentAccess]);

  const fetchStats = async () => {
    if (!user || roleLoading) return;

    try {
      if (hasAgentAccess) {
        // Fetch agent stats
        const { data: agentData } = await supabase
          .from('travel_agents')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (agentData) {
          const { data: packagesData } = await supabase
            .from('agent_packages')
            .select('*')
            .eq('agent_id', agentData.id);

          const { data: promotionsData } = await supabase
            .from('influencer_promotions')
            .select('*, agent_packages!inner(agent_id)')
            .eq('agent_packages.agent_id', agentData.id);

          const { data: earningsData } = await supabase
            .from('shared_commission_bookings')
            .select('agent_commission')
            .eq('agent_payout_status', 'paid')
            .in('package_id', (packagesData || []).map(p => p.id));

          setPackages(packagesData || []);
          setStats({
            totalPackages: packagesData?.length || 0,
            activePromotions: promotionsData?.filter(p => p.status === 'active').length || 0,
            totalEarnings: earningsData?.reduce((sum, b) => sum + (b.agent_commission || 0), 0) || 0,
            pendingPayouts: 0,
          });
        }
      } else {
        // Fetch influencer stats
        const { data: promotionsData } = await supabase
          .from('influencer_promotions')
          .select('*, agent_packages(package_name, destination)')
          .eq('influencer_id', user.id);

        const { data: earningsData } = await supabase
          .from('shared_commission_bookings')
          .select('influencer_commission')
          .eq('influencer_payout_status', 'paid')
          .in('promotion_id', (promotionsData || []).map(p => p.id));

        setPromotions(promotionsData || []);
        setStats({
          totalPackages: 0,
          activePromotions: promotionsData?.filter(p => p.status === 'active').length || 0,
          totalEarnings: earningsData?.reduce((sum, b) => sum + (b.influencer_commission || 0), 0) || 0,
          pendingPayouts: 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access CoCurated<span className="text-xs align-super">™</span></CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">CoCurated<span className="text-base align-super">™</span> Dashboard</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAgent ? 'Manage your packages and track influencer promotions' : 'Track your promotions and earnings'}
              </p>
            </div>
            
            {isAgent && (
              <Button onClick={() => navigate('/cocurated-create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isAgent ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPackages}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activePromotions}</div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activePromotions}</div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayouts.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue={isAgent ? "packages" : "promotions"}>
          <TabsList>
            {isAgent ? (
              <>
                <TabsTrigger value="packages">My Packages</TabsTrigger>
                <TabsTrigger value="approvals">Promotion Requests</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="promotions">My Promotions</TabsTrigger>
                <TabsTrigger value="marketplace">Browse Packages</TabsTrigger>
              </>
            )}
          </TabsList>

          {isAgent ? (
            <>
              <TabsContent value="packages" className="mt-6">
                <div className="space-y-6">
                  {packages.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">No packages created yet</p>
                        <Button onClick={() => navigate('/cocurated-create')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Package
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {packages.map((pkg) => (
                        <Card key={pkg.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle>{pkg.package_name}</CardTitle>
                                <CardDescription>{pkg.destination} • {pkg.duration_days} days</CardDescription>
                              </div>
                              <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                                {pkg.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Retail Price:</span>
                                <span className="ml-2 font-semibold">${pkg.retail_price}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Your Commission:</span>
                                <span className="ml-2 font-semibold">{pkg.agent_commission_percentage}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => navigate('/creators')}
                    size="lg"
                    className="w-full"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Browse & Invite Creators
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="approvals" className="mt-6">
                <PartnershipApprovals />
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="promotions" className="mt-6">
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Promotion features have been removed</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="marketplace" className="mt-6">
                <Button onClick={() => navigate('/cocurated-marketplace')} className="w-full">
                  Go to CoCurated™ Marketplace
                </Button>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}