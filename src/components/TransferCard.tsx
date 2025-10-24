import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Users, Clock, DollarSign } from "lucide-react";

interface TransferCardProps {
  transfer: {
    code: string;
    name: string;
    category: string;
    vehicle: {
      name: string;
      maxCapacity: number;
    };
    price: number;
    currency: string;
    duration: string;
    from: string;
    to: string;
  };
  onBook?: () => void;
}

export const TransferCard = ({ transfer, onBook }: TransferCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-base">{transfer.name}</h3>
              <p className="text-sm text-muted-foreground">{transfer.vehicle.name}</p>
            </div>
          </div>
          <Badge variant="secondary">{transfer.category}</Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Max {transfer.vehicle.maxCapacity} passengers</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{transfer.duration}</span>
          </div>

          <div className="text-xs text-muted-foreground">
            From: {transfer.from} → To: {transfer.to}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-xl font-bold">
              {transfer.price.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">{transfer.currency}</span>
          </div>
          
          {onBook && (
            <Button onClick={onBook} size="sm">
              Book Transfer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
