import { CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SimpleVerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const SimpleVerifiedBadge = ({ 
  size = 'sm',
  className = '' 
}: SimpleVerifiedBadgeProps) => {
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle2 
            className={`${sizeMap[size]} text-blue-500 fill-blue-500 flex-shrink-0 ${className}`}
            aria-label="Verified"
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Verified Account</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
