import { Shield, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TrustScoreVisualizationProps {
  score: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export const TrustScoreVisualization = ({ 
  score, 
  className,
  showLabel = true 
}: TrustScoreVisualizationProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Very Good";
    if (score >= 60) return "Good";
    return "Fair";
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <Shield className={cn("h-8 w-8", getScoreColor(score))} />
        {score >= 75 && (
          <CheckCircle2 className="h-4 w-4 text-green-600 absolute -top-1 -right-1 bg-background rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Trust Score</span>
          <span className={cn("text-sm font-bold", getScoreColor(score))}>
            {score}/100
          </span>
        </div>
        <Progress value={score} className="h-2" />
        {showLabel && (
          <p className={cn("text-xs mt-1", getScoreColor(score))}>
            {getScoreLabel(score)}
          </p>
        )}
      </div>
    </div>
  );
};
