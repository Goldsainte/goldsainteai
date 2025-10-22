import { Star, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RestaurantCardProps {
  id: string;
  name: string;
  city?: string;
  country?: string;
  cuisine?: string[];
  priceLevel?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  rank?: number;
  tags?: string[];
  onViewDetails: () => void;
}

export const RestaurantCard = ({
  name,
  city,
  country,
  cuisine = [],
  priceLevel = 3,
  rating,
  reviewCount,
  imageUrl,
  rank,
  tags = [],
  onViewDetails,
}: RestaurantCardProps) => {
  const getPriceLevelSymbol = (level: number) => {
    return '$'.repeat(Math.min(level, 4));
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
        <img
          src={imageUrl || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        {rank && (
          <Badge className="absolute top-3 right-3 bg-luxury-gold text-luxury-emerald text-[10px] sm:text-xs">
            Rank #{rank}
          </Badge>
        )}
      </div>

      <CardContent className="p-2.5 sm:p-3 md:p-4">
        {/* Cuisine Badge */}
        {cuisine.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs border-luxury-gold/30 text-luxury-emerald">
              {cuisine[0]}
            </Badge>
          </div>
        )}

        {/* Title */}
        <h3 className="font-secondary text-sm sm:text-base md:text-lg font-light text-luxury-emerald mb-2 line-clamp-2 group-hover:text-luxury-emerald/80 transition-colors">
          {name}
        </h3>

        {/* Location */}
        {(city || country) && (
          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">
              {city}{city && country ? ', ' : ''}{country}
            </span>
          </div>
        )}

        {/* Details Row */}
        <div className="flex items-center gap-4 text-sm mb-3">
          {/* Price Level */}
          <div className="flex items-center text-luxury-gold">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">{getPriceLevelSymbol(priceLevel)}</span>
          </div>

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-luxury-gold text-luxury-gold" />
              <span className="font-semibold text-luxury-emerald">{rating.toFixed(1)}</span>
              {reviewCount && reviewCount > 0 && (
                <span className="text-muted-foreground">
                  ({reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-luxury-gold/10 text-luxury-emerald">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2.5 sm:p-3 md:p-4 pt-0">
        <Button 
          onClick={onViewDetails} 
          variant="outline" 
          className="w-full min-h-[44px] text-xs sm:text-sm border-luxury-gold/30 text-luxury-emerald hover:bg-luxury-gold/10"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
