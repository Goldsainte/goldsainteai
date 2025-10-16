import { Badge } from "@/components/ui/badge";
import verifiedBadgeIcon from "@/assets/verified-badge.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomerVerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const CustomerVerifiedBadge = ({ 
  size = 'sm', 
  showText = false,
  className = '' 
}: CustomerVerifiedBadgeProps) => {
  const sizeClasses = {
    xs: 'h-5 px-1.5 py-0.5 text-[10px]',
    sm: 'h-6 px-2 py-0.5 text-xs',
    md: 'h-7 px-2.5 py-1 text-sm',
    lg: 'h-8 px-3 py-1 text-base'
  };

  const iconSizeClasses = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${sizeClasses[size]} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 flex items-center gap-1 ${className}`}
          >
            <img src={verifiedBadgeIcon} alt="Verified" className={iconSizeClasses[size]} />
            {showText && <span>Verified</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">
            <strong>Verified Customer</strong>
            <br />
            Identity confirmed via Stripe subscription
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
