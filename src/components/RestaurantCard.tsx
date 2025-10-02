import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, DollarSign, Calendar, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { RestaurantReservationModal } from "./RestaurantReservationModal";

interface RestaurantCardProps {
  id: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  address: string;
  photoUrl: string | null;
  openNow?: boolean;
}

export const RestaurantCard = ({ 
  id,
  name, 
  rating, 
  userRatingsTotal, 
  priceLevel, 
  address, 
  photoUrl,
  openNow 
}: RestaurantCardProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [showReservationModal, setShowReservationModal] = useState(false);

  // Safely convert rating to number
  const numericRating = typeof rating === 'number' ? rating : Number(rating) || 0;

  const restaurantData = { id, name, rating: numericRating, userRatingsTotal, priceLevel, address, photoUrl, openNow };
  const favoriteId = isFavorite('restaurant', restaurantData);
  
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteId) {
      await removeFavorite(favoriteId);
    } else {
      await addFavorite('restaurant', restaurantData);
    }
  };

  const handleBookTable = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReservationModal(true);
  };

  const getPriceLevelSymbol = (level?: number) => {
    if (!level) return '';
    return '$'.repeat(level);
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl border-0">
      {/* Image with overlay */}
      <div className="relative h-64 overflow-hidden">
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
        
        {/* Status and Favorite */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {openNow !== undefined && (
            <Badge 
              className="bg-background/90 hover:bg-background"
              variant={openNow ? "default" : "secondary"}
            >
              {openNow ? "Open Now" : "Closed"}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/90 backdrop-blur-sm hover:bg-background"
            onClick={handleToggleFavorite}
          >
            <Heart className={`h-5 w-5 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">

        <div className="transform transition-all duration-500 group-hover:translate-y-0 translate-y-2">
          {/* Rating and Price */}
          <div className="flex items-center gap-3 mb-3">
            {(numericRating > 0 || userRatingsTotal > 0) && (
              <div className="flex items-center gap-1 bg-primary/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {numericRating > 0 && (
                  <>
                    <span className="text-sm font-semibold">{numericRating.toFixed(1)}</span>
                    {userRatingsTotal > 0 && (
                      <span className="text-xs text-primary-foreground/70">({userRatingsTotal})</span>
                    )}
                  </>
                )}
                {numericRating === 0 && userRatingsTotal > 0 && (
                  <span className="text-xs text-primary-foreground/70">{userRatingsTotal} reviews</span>
                )}
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
          
          <div className="flex items-start gap-2 transition-opacity duration-500">
            <MapPin className="h-4 w-4 text-primary-foreground/80 mt-1 flex-shrink-0" />
            <p className="text-sm text-primary-foreground/90 leading-relaxed line-clamp-2">
              {address}
            </p>
          </div>

          {/* Booking Button */}
          <Button 
            onClick={handleBookTable}
            className="mt-4 w-full relative z-10"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Make Reservation
          </Button>
        </div>

        {/* Decorative accent */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500" />
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Reservation Modal */}
      <RestaurantReservationModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        restaurant={{
          id,
          name,
          address,
          photoUrl
        }}
      />
    </Card>
  );
};
