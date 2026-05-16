import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Briefcase,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";

interface AgentAnalyticsDashboardProps {
  agentId: string;
}

export function AgentAnalyticsDashboard({ agentId }: AgentAnalyticsDashboardProps) {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalJobs: 0,
    completedJobs: 0,
    activeJobs: 0,
    averageRating: 0,
    totalReviews: 0,
    pendingApproval: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [agentId]);

  const loadAnalytics = async () => {
    try {
      // Get agent details for rating
      const { data: agentData } = await supabase
        .from("travel_agents")
        .select("rating, total_reviews")
        .eq("id", agentId)
        .single();

      // Get job statistics
      const { data: jobs } = await supabase
        .from("marketplace_jobs")
        .select("status, agent_payout_amount, currency")
        .eq("assigned_agent_id", agentId);

      const totalJobs = jobs?.length || 0;
      const completedJobs = jobs?.filter((j) => j.status === "completed").length || 0;
      const activeJobs = jobs?.filter((j) => j.status === "in_progress").length || 0;
      const pendingApproval = jobs?.filter((j) => j.status === "pending_approval").length || 0;

      const totalEarnings = jobs
        ?.filter((j) => j.status === "completed")
        .reduce((sum, j) => sum + (Number(j.agent_payout_amount) || 0), 0) || 0;

      setStats({
        totalEarnings,
        totalJobs,
        completedJobs,
        activeJobs,
        averageRating: Number(agentData?.rating) || 0,
        totalReviews: agentData?.total_reviews || 0,
        pendingApproval,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      description: "From completed jobs",
    },
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: Briefcase,
      description: "All time",
    },
    {
      title: "Completed Jobs",
      value: stats.completedJobs,
      icon: CheckCircle,
      description: "Successfully finished",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Clock,
      description: "Currently in progress",
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      icon: Star,
      description: `${stats.totalReviews} reviews`,
    },
    {
      title: "Pending Approval",
      value: stats.pendingApproval,
      icon: TrendingUp,
      description: "Awaiting client review",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
            <div className="h-4 bg-[#FDF9F0] rounded animate-pulse mb-3" />
            <div className="h-8 bg-[#FDF9F0] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <div key={stat.title} className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">{stat.title}</p>
            <stat.icon className="h-4 w-4 text-[#0c4d47]" />
          </div>
          <div className="font-secondary text-3xl text-[#0a2225] mb-1">{stat.value}</div>
          <p className="text-xs text-[#6B7280]">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}
