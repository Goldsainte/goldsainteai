import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Heart, ChevronDown, ChevronUp, Calendar, DollarSign } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { buildReservationRedirect } from "@/lib/urlHelpers";

interface CompactRestaurantCardProps {
  restaurant: any;
}

export const CompactRestaurantCard = ({ restaurant }: CompactRestaurantCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const name = restaurant.name || "Restaurant";
  const imageUrl = restaurant.photos?.[0]?.url || restaurant.photoUrl;
  const location = restaurant.address || restaurant.city || "Location";
  const rating = Number(restaurant.rating) || 0;
  const numReviews = Number(restaurant.num_reviews) || 0;
  const cuisine = restaurant.cuisine || "";
  const priceLevel = restaurant.price_level || "";

  const getPriceLevelSymbol = (level: string) => {
    switch (level) {
      case "$": return "$";
      case "$$-$$$": return "$$";
      case "$$$$": return "$$$";
      default: return level;
    }
  };

// Build a best-effort reservation URL prioritizing official sources
const websiteUrl = restaurant.website && /^https?:\/\//i.test(restaurant.website) ? restaurant.website : (restaurant.website ? `https://${restaurant.website}` : undefined);
const mapsFallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${location}`)}`;
const reservationUrl = restaurant.reservationUrl || websiteUrl || restaurant.web_url || mapsFallback;

  const favoriteId = isFavorite('restaurant', restaurant);
  
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteId) {
      await removeFavorite(favoriteId);
    } else {
      await addFavorite('restaurant', restaurant);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative w-32 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='48' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E🍽️%3C/text%3E%3C/svg%3E";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🍽️
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {name}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-4 w-4 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{location}</span>
            </p>
            
            <div className="flex items-center gap-2 mb-1">
              {rating > 0 && (
                <>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {rating.toFixed(1)}
                  </Badge>
                  {numReviews > 0 && (
                    <span className="text-xs text-muted-foreground">({numReviews})</span>
                  )}
                </>
              )}
              {priceLevel && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {getPriceLevelSymbol(priceLevel)}
                </Badge>
              )}
            </div>

            {cuisine && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {cuisine}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end justify-between min-w-[140px]">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Less' : 'More'}
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                try { window.open(buildReservationRedirect(reservationUrl), '_blank', 'noopener'); } catch {}
              }}
            >
              <Calendar className="h-3 w-3" />
              Reserve
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border p-3 pt-3 bg-muted/30 animate-accordion-down">
          <div className="text-xs space-y-2">
            {restaurant.description && (
              <p className="text-muted-foreground line-clamp-3">
                {restaurant.description}
              </p>
            )}
            {restaurant.phone && (
              <p className="text-muted-foreground">
                <strong>Phone:</strong> {restaurant.phone}
              </p>
            )}
            {restaurant.website && (
              <a 
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline block"
              >
                Visit Website →
              </a>
            )}
            {restaurant.hours?.weekday_text && restaurant.hours.weekday_text.length > 0 && (
              <div>
                <strong>Hours:</strong>
                <p className="text-muted-foreground mt-1">
                  {restaurant.hours.weekday_text[new Date().getDay()]?.replace(/^[^:]+:\s*/, '') || 'Not available'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
