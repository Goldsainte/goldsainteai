import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Users, ChevronDown, ChevronUp, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { formatCurrency } from "@/lib/currencyHelpers";

interface CompactCarCardProps {
  car: any;
}

export const CompactCarCard = ({ car }: CompactCarCardProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [expanded, setExpanded] = useState(false);
  
  if (!car || !car.vehicle) {
    console.warn('Invalid car data:', car);
    return null;
  }
  
  const vehicle = car.vehicle;
  const price = car.price || {};
  const category = vehicle.category || "Unknown";
  const transmission = vehicle.transmission || "Manual";
  const fuelType = vehicle.fuelType || "Gasoline";
  const seats = vehicle.seats || 4;
  const doors = vehicle.doors || 4;
  const airConditioning = vehicle.airConditioning !== false;
  
  const totalPrice = parseFloat(price.total || 0);
  const currency = price.currency || "USD";
  const dailyRate = parseFloat(price.dailyRate || (totalPrice / 7).toFixed(2));
  
  const pickupDate = car.pickupDate;
  const dropoffDate = car.dropoffDate;
  
  const favoriteId = isFavorite('car', car);
  
  const handleToggleFavorite = async () => {
    if (favoriteId) {
      await removeFavorite(favoriteId);
    } else {
      await addFavorite('car', car);
    }
  };

  const getBadge = () => {
    if (car.badge) {
      const badgeMap: Record<string, { icon: string; variant: "default" | "secondary" | "outline" }> = {
        "🏆 Best Value": { icon: "🏆", variant: "default" },
        "💰 Cheapest Option": { icon: "💰", variant: "secondary" },
        "⭐ Highest Rated": { icon: "⭐", variant: "default" },
      };
      const badge = badgeMap[car.badge] || { icon: "", variant: "outline" as const };
      return <Badge variant={badge.variant} className="text-xs">{car.badge}</Badge>;
    }
    return null;
  };

  return (
    <Card className="group hover:shadow-md transition-all overflow-hidden">
      {/* Mobile Layout */}
      <div className="flex flex-col sm:hidden gap-3 p-3">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 flex-shrink-0 rounded bg-muted flex items-center justify-center">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm line-clamp-1">{vehicle.make} {vehicle.model || category}</div>
            <div className="text-xs text-muted-foreground">{category} • {transmission}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleToggleFavorite}
          >
            <Heart className={`h-4 w-4 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        {getBadge() && <div className="flex gap-2">{getBadge()}</div>}

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {seats}
            </div>
            <div>{doors} doors</div>
            {airConditioning && <div>A/C</div>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <div>
            <div className="text-lg font-bold">{formatCurrency(dailyRate, currency)}/day</div>
            <div className="text-xs text-muted-foreground">Total: {formatCurrency(totalPrice, currency)}</div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button size="sm" className="h-8 px-4">
              Select
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex gap-3 p-3 items-center">
        <div className="w-12 h-12 flex-shrink-0 rounded bg-muted flex items-center justify-center">
          <Car className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{vehicle.make} {vehicle.model || category}</span>
            {getBadge()}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{category}</span>
            <span>•</span>
            <span>{transmission}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {seats} seats
            </span>
            <span>•</span>
            <span>{doors} doors</span>
            {airConditioning && (
              <>
                <span>•</span>
                <span>A/C</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-bold">{formatCurrency(dailyRate, currency)}</div>
            <div className="text-xs text-muted-foreground">per day</div>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleFavorite}
            >
              <Heart className={`h-4 w-4 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs">
              Select
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border p-3 pt-3 bg-muted/30 animate-accordion-down">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuel Type:</span>
              <span className="font-medium">{fuelType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup:</span>
              <span className="font-medium">{pickupDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dropoff:</span>
              <span className="font-medium">{dropoffDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Cost:</span>
              <span className="font-bold">{formatCurrency(totalPrice, currency)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
