import { Badge } from "@/components/ui/badge";
import { Clock, Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransparencyBadgesProps {
  avgResponseMinutes?: number;
  acceptanceRate?: number;
  lastActiveAt?: string;
  showMoneyBack?: boolean;
}

export const TransparencyBadges = ({
  avgResponseMinutes,
  acceptanceRate,
  lastActiveAt,
  showMoneyBack = true,
}: TransparencyBadgesProps) => {
  const getLastActiveText = (timestamp: string) => {
    const now = new Date();
    const lastActive = new Date(timestamp);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return "Active now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return "Active 7+ days ago";
  };

  const isRecentlyActive = lastActiveAt 
    ? (new Date().getTime() - new Date(lastActiveAt).getTime()) < (24 * 60 * 60 * 1000)
    : false;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Response Time Guarantee */}
      {avgResponseMinutes !== undefined && avgResponseMinutes < 120 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700 border-green-200">
                <Clock className="h-3 w-3" />
                {avgResponseMinutes < 60 
                  ? `${Math.round(avgResponseMinutes)}m response` 
                  : `${Math.round(avgResponseMinutes / 60)}h response`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average response time: {Math.round(avgResponseMinutes)} minutes</p>
              <p className="text-xs text-muted-foreground mt-1">
                This agent typically responds quickly
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Acceptance Rate */}
      {acceptanceRate !== undefined && acceptanceRate >= 70 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 border-blue-200">
                <TrendingUp className="h-3 w-3" />
                {Math.round(acceptanceRate)}% accepted
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Acceptance rate: {Math.round(acceptanceRate)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                High likelihood of accepting your request
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Last Active */}
      {lastActiveAt && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge 
                variant="outline" 
                className={`text-xs gap-1 ${
                  isRecentlyActive 
                    ? 'bg-green-50 text-green-700 border-green-300' 
                    : 'text-muted-foreground'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${isRecentlyActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                {getLastActiveText(lastActiveAt)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last active: {new Date(lastActiveAt).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Money-Back Guarantee */}
      {showMoneyBack && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-xs gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                <Shield className="h-3 w-3" />
                Money-Back
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">100% Money-Back Guarantee</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                If you're not satisfied with the service, you can request a full refund within 24 hours of booking
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
