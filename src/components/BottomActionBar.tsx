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
      "sticky bottom-0 z-10",
      "bg-background/95 backdrop-blur-md border-t border-border",
      "px-2 py-2 sm:px-4 sm:py-3",
      "safe-area-inset-bottom",
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
                    size="icon"
                    onClick={action.onClick}
                    className={cn(
                      "relative h-11 w-11 sm:h-12 sm:w-12 touch-manipulation",
                      action.active && "bg-primary text-primary-foreground"
                    )}
                  >
                    {action.icon}
                    {action.badge !== undefined && action.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </Button>
                  {showLabels && (
                    <span className="text-[10px] text-muted-foreground">{action.label}</span>
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
