import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, DollarSign } from "lucide-react";

interface RestaurantCardProps {
  name: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  address: string;
  photoUrl: string | null;
  openNow?: boolean;
}

export const RestaurantCard = ({ 
  name, 
  rating, 
  userRatingsTotal, 
  priceLevel, 
  address, 
  photoUrl,
  openNow 
}: RestaurantCardProps) => {
  const getPriceLevelSymbol = (level?: number) => {
    if (!level) return '';
    return '$'.repeat(level);
  };

  return (
    <Card className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl border-0 h-[400px]">
      {/* Image with overlay */}
      <div className="absolute inset-0">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 text-white">
        {/* Status Badge */}
        {openNow !== undefined && (
          <Badge 
            className="absolute top-4 right-4 bg-background/90 hover:bg-background"
            variant={openNow ? "default" : "secondary"}
          >
            {openNow ? "Open Now" : "Closed"}
          </Badge>
        )}

        <div className="transform transition-all duration-500 group-hover:translate-y-0 translate-y-2">
          {/* Rating and Price */}
          <div className="flex items-center gap-3 mb-3">
            {rating > 0 && (
              <div className="flex items-center gap-1 bg-primary/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                <span className="text-xs text-primary-foreground/70">({userRatingsTotal})</span>
              </div>
            )}
            {priceLevel && (
              <div className="flex items-center gap-1 bg-accent/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                <DollarSign className="h-3 w-3 text-accent" />
                <span className="text-sm font-semibold text-accent-foreground">
                  {getPriceLevelSymbol(priceLevel)}
                </span>
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-2 tracking-tight line-clamp-1">{name}</h3>
          
          <div className="flex items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <MapPin className="h-4 w-4 text-primary-foreground/80 mt-1 flex-shrink-0" />
            <p className="text-sm text-primary-foreground/90 leading-relaxed line-clamp-2">
              {address}
            </p>
          </div>
        </div>

        {/* Decorative accent */}
        <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500 group-hover:w-full" />
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </Card>
  );
};
