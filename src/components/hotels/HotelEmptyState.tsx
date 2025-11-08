import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Hotel, TrendingUp } from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface HotelEmptyStateProps {
  title: string;
  description: string;
  actions?: EmptyStateAction[];
}

export const HotelEmptyState = ({ title, description, actions = [] }: HotelEmptyStateProps) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Hotel className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
        
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={index === 0 ? "default" : "outline"}
                className="gap-2"
              >
                {index === 0 && <TrendingUp className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-xs text-muted-foreground space-y-1">
          <p>💡 Try these suggestions:</p>
          <ul className="list-disc list-inside text-left inline-block">
            <li>Increase your budget</li>
            <li>Adjust your travel dates</li>
            <li>Expand search radius</li>
            <li>Consider nearby cities</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
