import { useState } from "react";
import { Star, MapPin, Phone, Globe, Heart, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RestaurantDetailsModal } from "@/components/RestaurantDetailsModal";
import { useFavorites } from "@/hooks/useFavorites";

interface RestaurantCardProps {
  id: string;
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  address?: string;
  photoUrl?: string;
  openNow?: boolean;
  phone?: string;
  website?: string;
  hours?: any;
  photos?: any[];
  cuisine?: string;
  description?: string;
  reservationUrl?: string;
}

export const RestaurantCard = ({
  id,
  name,
  rating,
  userRatingsTotal,
  priceLevel,
  address,
  photoUrl,
  openNow,
  phone,
  website,
  hours,
  photos,
  cuisine,
  description,
  reservationUrl,
}: RestaurantCardProps) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const restaurantData = {
    id,
    name,
    rating,
    userRatingsTotal,
    priceLevel,
    address,
    photoUrl,
    openNow,
    phone,
    website,
    hours,
    photos,
    cuisine,
    description,
  };
  
  const favoriteId = isFavorite('restaurant', restaurantData);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteId) {
      await removeFavorite(favoriteId);
    } else {
      await addFavorite('restaurant', restaurantData);
    }
  };

  const handleCardClick = () => {
    setShowDetailsModal(true);
  };

  const handleBookTable = () => {
    if (reservationUrl) {
      window.open(reservationUrl, "_blank");
    } else {
      const searchQuery = encodeURIComponent(`${name} restaurant reservation`);
      window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
    }
  };

  const getPriceLevelSymbol = () => {
    if (!priceLevel) return "";
    return "$".repeat(priceLevel);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
        <div className="relative h-48 overflow-hidden" onClick={handleCardClick}>
          <img
            src={photoUrl || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
          >
            <Heart
              className={`h-5 w-5 ${favoriteId ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </button>
          {openNow !== undefined && (
            <Badge
              className={`absolute top-3 left-3 ${openNow ? "bg-green-500" : "bg-red-500"}`}
            >
              {openNow ? "Open Now" : "Closed"}
            </Badge>
          )}
        </div>

        <CardContent className="p-4" onClick={handleCardClick}>
          {rating && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-[#C7A962] text-[#C7A962] mr-1" />
                <span className="font-semibold">{Number(rating).toFixed(1)}</span>
              </div>
              {userRatingsTotal && (
                <span className="text-sm text-muted-foreground">
                  ({userRatingsTotal.toLocaleString()} reviews)
                </span>
              )}
              {priceLevel && (
                <span className="text-sm text-muted-foreground ml-auto">
                  {getPriceLevelSymbol()}
                </span>
              )}
            </div>
          )}

          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{name}</h3>

          {cuisine && (
            <Badge variant="secondary" className="mb-2">
              {cuisine}
            </Badge>
          )}

          {address && (
            <div className="flex items-start text-muted-foreground text-sm mb-2">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{address}</span>
            </div>
          )}

          {phone && (
            <div className="flex items-center text-muted-foreground text-sm mb-2">
              <Phone className="h-4 w-4 mr-1" />
              <span>{phone}</span>
            </div>
          )}

          {website && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Globe className="h-4 w-4 mr-1" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                Website
              </a>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button onClick={handleBookTable} className="w-full" size="lg">
            <Calendar className="h-4 w-4 mr-2" />
            Make Reservation
          </Button>
        </CardFooter>
      </Card>

      <RestaurantDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        restaurant={{
          id,
          name,
          rating,
          userRatingsTotal,
          priceLevel,
          address,
          photoUrl,
          openNow,
          phone,
          website,
          hours,
          photos,
          cuisine,
          description,
        }}
      />
    </>
  );
};
