import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, TrendingUp } from "lucide-react";

interface UberProduct {
  product_id: string;
  display_name: string;
  description: string;
  capacity: number;
  image_url?: string;
  price_estimate?: {
    low: number;
    high: number;
    currency: string;
    surge_multiplier: number;
    duration_minutes: number;
    distance_miles: number;
  };
}

interface UberProductCardProps {
  product: UberProduct;
  onBook: () => void;
}

export function UberProductCard({ product, onBook }: UberProductCardProps) {
  const hasSurge = product.price_estimate && product.price_estimate.surge_multiplier > 1;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {product.image_url && (
              <img 
                src={product.image_url} 
                alt={product.display_name}
                className="w-16 h-16 object-contain"
              loading="lazy"/>
            )}
            <div>
              <CardTitle className="text-lg">{product.display_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
          </div>
          {hasSurge && (
            <div className="flex items-center gap-1 text-warning">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">
                {product.price_estimate!.surge_multiplier.toFixed(1)}x
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{product.capacity} seats</span>
          </div>
          {product.price_estimate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{product.price_estimate.duration_minutes} min</span>
            </div>
          )}
        </div>

        {product.price_estimate && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                ${product.price_estimate.low} - ${product.price_estimate.high}
              </p>
              <p className="text-xs text-muted-foreground">Estimated fare</p>
            </div>
            <Button onClick={onBook}>
              Book Now
            </Button>
          </div>
        )}

        {!product.price_estimate && (
          <Button onClick={onBook} className="w-full">
            Request Ride
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
