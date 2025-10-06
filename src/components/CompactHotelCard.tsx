import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { DateSelectionModal } from "./DateSelectionModal";
import { useFavorites } from "@/hooks/useFavorites";
import { getHotelImage } from "@/lib/imageHelpers";
import { encodeData } from "@/lib/utils";

interface CompactHotelCardProps {
  property: any;
}

export const CompactHotelCard = ({ property }: CompactHotelCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const title = property.property?.name || property.name || property.title || "Hotel";
  const imageUrl = property.photos?.[0] || property.property?.photoUrls?.[0] || property.image;
  const image = getHotelImage(imageUrl, property.hotel_id || title);
  
  const getCityCode = () => {
    return property.cityCode || "PAR";
  };
  
  const getCleanLocation = () => {
    if (property.location) return property.location;
    if (property.address) return property.address;
    if (property.city || property.country) {
      return [property.city, property.country].filter(Boolean).join(', ');
    }
    return property.region || "Location";
  };
  
  const location = getCleanLocation();
  const rating = Number(property.property?.reviewScore ?? (property.rating ? Number(property.rating) * 2 : 0));
  const reviews = Number(property.property?.reviewCount ?? property.num_reviews ?? 0);
  
  const getCleanPrice = () => {
    if (property.price) return property.price;
    if (property.estimated_price) return property.estimated_price;
    if (property.priceBreakdown?.grossPrice?.value) {
      return property.priceBreakdown.grossPrice.value;
    }
    const label = property.accessibilityLabel || "";
    const priceMatch = label.match(/(\d+) USD/);
    return priceMatch ? parseInt(priceMatch[1]) : 0;
  };
  
  const displayPrice = getCleanPrice();
  const currency = property.currency || "USD";

  const getRatingText = (score: number) => {
    if (score >= 9) return "Superb";
    if (score >= 8.5) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    return "Pleasant";
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
    };
    return symbols[curr] || curr + ' ';
  };

  const handleAvailabilityConfirmed = (hotelOffer: any, checkIn: string, checkOut: string, adults: number) => {
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    
    const bookingData = {
      ...hotelOffer,
      hotel: property,
      hotelName: title,
      hotelAddress: location,
      hotelImage: imageUrl,
      checkIn,
      checkOut,
      adults,
      guests: adults,
      rooms: 1,
      nights,
      totalPrice: parseFloat(hotelOffer.offers?.[0]?.price?.total || displayPrice || 0),
      currency: hotelOffer.offers?.[0]?.price?.currency || currency,
    };
    
    navigate(`/hotel-booking?data=${encodeData(bookingData)}`);
  };

  const favoriteId = isFavorite('hotel', property);
  
  const handleToggleFavorite = async () => {
    if (favoriteId) {
      await removeFavorite(favoriteId);
    } else {
      await addFavorite('hotel', property);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-all overflow-hidden">
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="relative w-32 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
            {image ? (
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Hide broken image so muted background shows instead
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full animate-pulse" aria-label="No image available" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors">
                  {title}
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
              
              {rating > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 font-bold">
                    {rating.toFixed(1)}
                  </Badge>
                  <span className="text-xs font-medium">{getRatingText(rating)}</span>
                  {reviews > 0 && (
                    <span className="text-xs text-muted-foreground">({reviews})</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex flex-col items-end justify-between min-w-[140px]">
            {displayPrice > 0 && (
              <div className="text-right">
                <div className="text-xl font-bold">
                  {getCurrencySymbol(currency)}{Math.round(displayPrice)}
                </div>
                <div className="text-xs text-muted-foreground">per night</div>
              </div>
            )}
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
                className="h-7 px-3 text-xs"
                onClick={() => setShowDateModal(true)}
              >
                Reserve
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t border-border p-3 pt-3 bg-muted/30 animate-accordion-down">
            <div className="text-xs space-y-2">
              <p className="text-muted-foreground line-clamp-3">
                {property.description || "Enjoy a comfortable stay with modern amenities and excellent service."}
              </p>
              {property.amenities && property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {property.amenities.slice(0, 5).map((amenity: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <DateSelectionModal
        open={showDateModal}
        onClose={() => setShowDateModal(false)}
        onAvailabilityConfirmed={handleAvailabilityConfirmed}
        cityCode={getCityCode()}
        hotelName={title}
        currency={currency}
      />
    </>
  );
};
