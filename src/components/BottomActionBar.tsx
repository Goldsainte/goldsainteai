import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionButton {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  active?: boolean;
}

interface BottomActionBarProps {
  actions: ActionButton[];
  className?: string;
  showLabels?: boolean;
}

export const BottomActionBar = ({ actions, className, showLabels = false }: BottomActionBarProps) => {
  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-md border-t border-border",
      "px-2 py-2 sm:px-4 sm:py-3",
      "pb-safe",
      className
    )}>
      <div className="flex items-center justify-around max-w-2xl mx-auto gap-1">
        <TooltipProvider>
          {actions.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={action.active ? "default" : "ghost"}
                    onClick={action.onClick}
                    className={cn(
                      "relative !h-14 !w-14 !min-h-[56px] !min-w-[56px] sm:!h-16 sm:!w-16 sm:!min-h-[64px] sm:!min-w-[64px] p-0 touch-manipulation rounded-md",
                      action.active && "bg-primary text-primary-foreground"
                    )}
                  >
                    <div className="[&_svg]:!size-6 [&_svg]:!shrink-0 sm:[&_svg]:!size-7">{action.icon}</div>
                    {action.badge !== undefined && action.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-micro"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </Button>
                  {showLabels && (
                    <span className="text-caption text-muted-foreground">{action.label}</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};
