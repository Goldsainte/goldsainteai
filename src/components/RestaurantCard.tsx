import { Card } from "@/components/ui/card";
import { Star, MapPin, DollarSign } from "lucide-react";

interface RestaurantCardProps {
  name: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  vicinity: string;
  photo: string | null;
  types: string[];
}

export const RestaurantCard = ({ 
  name, 
  rating, 
  userRatingsTotal,
  priceLevel,
  vicinity, 
  photo,
  types 
}: RestaurantCardProps) => {
  const getPriceLevelDisplay = (level?: number) => {
    if (!level) return null;
    return '$'.repeat(level);
  };

  const cuisine = types.find(t => 
    !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)
  )?.replace(/_/g, ' ');

  return (
    <Card className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-accent/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-500" />
      
      <div className="relative h-64 overflow-hidden">
        {photo ? (
          <img 
            src={photo} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <MapPin className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />
        
        <div className="absolute top-4 right-4 flex gap-2">
          {rating > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
            </div>
          )}
          {priceLevel && (
            <div className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border">
              <span className="text-sm font-medium text-muted-foreground">{getPriceLevelDisplay(priceLevel)}</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2 transform transition-all duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors duration-300">
                {name}
              </h3>
              {cuisine && (
                <p className="text-sm text-muted-foreground capitalize">
                  {cuisine}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{vicinity}</span>
          </div>

          {userRatingsTotal > 0 && (
            <p className="text-xs text-muted-foreground">
              {userRatingsTotal.toLocaleString()} reviews
            </p>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500 group-hover:w-full" />
    </Card>
  );
};
