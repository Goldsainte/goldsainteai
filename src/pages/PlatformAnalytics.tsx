import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  Briefcase,
  DollarSign,
  Star,
  AlertTriangle,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

interface PlatformStats {
  total_users: number;
  verified_agents: number;
  active_agents: number;
  total_jobs: number;
  open_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  total_agent_payouts: number;
  total_service_fees: number;
  total_success_fees: number;
  total_reviews: number;
  average_rating: number;
  pending_reports: number;
  open_disputes: number;
}

export default function PlatformAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }

    loadAnalytics();
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_analytics")
        .select("*")
        .single();

      if (error) throw error;
      setStats(data as any as PlatformStats);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalRevenue = stats.total_service_fees + stats.total_success_fees;
  const platformProfit = totalRevenue - stats.total_agent_payouts;

  const overviewCards = [
    {
      title: "Total Users",
      value: stats.total_users,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Active Agents",
      value: stats.active_agents,
      icon: ShieldCheck,
      description: `${stats.verified_agents} verified`,
    },
    {
      title: "Total Jobs",
      value: stats.total_jobs,
      icon: Briefcase,
      description: `${stats.completed_jobs} completed`,
    },
    {
      title: "Platform Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total fees collected",
    },
  ];

  const financialCards = [
    {
      title: "Service Fees",
      value: `$${stats.total_service_fees.toFixed(2)}`,
      icon: DollarSign,
      description: "3% of transactions",
      color: "text-[#0c4d47]",
    },
    {
      title: "Success Fees",
      value: `$${stats.total_success_fees.toFixed(2)}`,
      icon: TrendingUp,
      description: "15% of agent payouts",
      color: "text-green-600",
    },
    {
      title: "Agent Payouts",
      value: `$${stats.total_agent_payouts.toFixed(2)}`,
      icon: Users,
      description: "Total paid to agents",
      color: "text-purple-600",
    },
    {
      title: "Net Profit",
      value: `$${platformProfit.toFixed(2)}`,
      icon: TrendingUp,
      description: "After payouts",
      color: "text-primary",
    },
  ];

  const operationalCards = [
    {
      title: "Open Jobs",
      value: stats.open_jobs,
      icon: Briefcase,
      description: "Awaiting bids",
    },
    {
      title: "In Progress",
      value: stats.in_progress_jobs,
      icon: TrendingUp,
      description: "Active jobs",
    },
    {
      title: "Average Rating",
      value: stats.average_rating.toFixed(1),
      icon: Star,
      description: `${stats.total_reviews} reviews`,
    },
    {
      title: "Pending Issues",
      value: stats.pending_reports + stats.open_disputes,
      icon: AlertTriangle,
      description: `${stats.pending_reports} reports, ${stats.open_disputes} disputes`,
    },
  ];

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive platform performance metrics
          </p>
        </div>
        <Button onClick={loadAnalytics} variant="outline">
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Open</span>
                  <Badge variant="secondary">{stats.open_jobs}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">In Progress</span>
                  <Badge variant="default">{stats.in_progress_jobs}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completed</span>
                  <Badge variant="default">{stats.completed_jobs}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completion Rate</span>
                  <Badge>
                    {((stats.completed_jobs / stats.total_jobs) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Agent Verification Rate</span>
                  <Badge>
                    {((stats.verified_agents / stats.active_agents) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Rating</span>
                  <Badge className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {stats.average_rating.toFixed(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {financialCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Service Fees (3%)</p>
                    <p className="text-sm text-muted-foreground">
                      Customer transaction fees
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#0c4d47]">
                      ${stats.total_service_fees.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((stats.total_service_fees / totalRevenue) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Success Fees (15%)</p>
                    <p className="text-sm text-muted-foreground">
                      Agent completion fees
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ${stats.total_success_fees.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((stats.total_success_fees / totalRevenue) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {operationalCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Reviews</span>
                  <Badge>{stats.total_reviews}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Rating</span>
                  <Badge className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {stats.average_rating.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Verified Agents</span>
                  <Badge variant="default">
                    {stats.verified_agents} / {stats.active_agents}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trust & Safety</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending Reports</span>
                  <Badge variant={stats.pending_reports > 0 ? "destructive" : "secondary"}>
                    {stats.pending_reports}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Open Disputes</span>
                  <Badge variant={stats.open_disputes > 0 ? "destructive" : "secondary"}>
                    {stats.open_disputes}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate("/trust-safety")}
                >
                  View All Issues
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
