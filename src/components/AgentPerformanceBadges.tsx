import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Zap,
  ThumbsUp,
  Star,
  Award,
  Shield,
  Target,
  CheckCircle,
  Heart,
} from "lucide-react";

interface AgentBadge {
  badge_type: string;
  earned_at: string;
  valid_until?: string;
}

interface AgentPerformanceBadgesProps {
  agentId: string;
  showLabels?: boolean;
}

const badgeConfig = {
  quick_responder: {
    icon: Zap,
    label: "Quick Responder",
    description: "Average response time under 1 hour",
    color: "bg-yellow-500",
  },
  high_acceptance: {
    icon: ThumbsUp,
    label: "High Acceptance",
    description: "Accepts over 80% of job requests",
    color: "bg-green-500",
  },
  top_rated: {
    icon: Star,
    label: "Top Rated",
    description: "Average rating above 4.8 stars",
    color: "bg-purple-500",
  },
  experienced: {
    icon: Award,
    label: "Experienced",
    description: "Over 50 completed jobs",
    color: "bg-blue-500",
  },
  reliable: {
    icon: CheckCircle,
    label: "Reliable",
    description: "Completion rate over 95%",
    color: "bg-teal-500",
  },
  specialist: {
    icon: Target,
    label: "Specialist",
    description: "Expert in specific travel categories",
    color: "bg-indigo-500",
  },
  verified_elite: {
    icon: Shield,
    label: "Verified Elite",
    description: "All verifications completed with stellar record",
    color: "bg-red-500",
  },
  customer_favorite: {
    icon: Heart,
    label: "Customer Favorite",
    description: "Consistently praised by customers",
    color: "bg-pink-500",
  },
};

export function AgentPerformanceBadges({ agentId, showLabels = false }: AgentPerformanceBadgesProps) {
  const [badges, setBadges] = useState<AgentBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [agentId]);

  const loadBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_badges")
        .select("badge_type, earned_at, valid_until")
        .eq("agent_id", agentId)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`);

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {badges.map((badge) => {
          const config = badgeConfig[badge.badge_type as keyof typeof badgeConfig];
          if (!config) return null;

          const Icon = config.icon;

          return (
            <Tooltip key={badge.badge_type}>
              <TooltipTrigger>
                {showLabels ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                ) : (
                  <div
                    className={`${config.color} text-white p-2 rounded-full inline-flex items-center justify-center`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earned: {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}