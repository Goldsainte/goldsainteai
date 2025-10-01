import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Heart, Bed, Users, Home, Eye } from "lucide-react";
import { HotelDetailsModal } from "./HotelDetailsModal";
import { DateSelectionModal } from "./DateSelectionModal";
import { useFavorites } from "@/hooks/useFavorites";
import { getHotelImage } from "@/lib/imageHelpers";
import { encodeData } from "@/lib/utils";

interface SimplePropertyCardProps {
  property: any;
  type?: string;
}

export const SimplePropertyCard = ({ property, type = "hotels" }: SimplePropertyCardProps) => {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  // Parse Booking.com API data properly
  const title = property.property?.name || property.title || property.label || "Hotel";
  const imageUrl = property.property?.photoUrls?.[0] || property.image;
  const image = getHotelImage(imageUrl, property.hotel_id || property.property?.name || title);
  const propertyUrl = property.property?.externalUrls?.default || property.url || "#";
  
  // Extract city code for Amadeus (would need proper mapping in production)
  const getCityCode = () => {
    // This is a simplified version - in production, you'd need a proper city code mapping
    const location = property.location || property.region || "";
    // For now, return a common code or extract from property data
    return property.cityCode || "PAR"; // Default to Paris for demo
  };
  
  // Extract clean location from accessibilityLabel
  const getCleanLocation = () => {
    if (property.location) return property.location;
    if (property.region) return property.region;
    
    // Parse accessibilityLabel to get just the district and distance
    const label = property.accessibilityLabel || "";
    const districtMatch = label.match(/(\d+(?:st|nd|rd|th) arr\.)/);
    const distanceMatch = label.match(/(\d+\.?\d* km from downtown)/);
    
    if (districtMatch && distanceMatch) {
      return `${districtMatch[1]} • ${distanceMatch[1]}`;
    }
    if (districtMatch) return districtMatch[1];
    
    return label.split('.')[0] || "Location";
  };
  
  const location = getCleanLocation();
  const rating = Number(property.property?.reviewScore || property.rating || 0);
  const reviews = Number(property.property?.reviewCount || property.reviews || 0);
  
  // Extract clean price
  const getCleanPrice = () => {
    if (property.price) return property.price;
    if (property.priceBreakdown?.grossPrice?.value) {
      return property.priceBreakdown.grossPrice.value;
    }
    
    // Try to parse from accessibilityLabel
    const label = property.accessibilityLabel || "";
    const priceMatch = label.match(/Current price (\d+) USD/);
    if (priceMatch) return parseInt(priceMatch[1]);
    
    const singlePriceMatch = label.match(/(\d+) USD/);
    if (singlePriceMatch) return parseInt(singlePriceMatch[1]);
    
    return 0;
  };
  
  const displayPrice = getCleanPrice();
  const currency = property.priceBreakdown?.grossPrice?.currency || "USD";

  // Get rating descriptor
  const getRatingText = (score: number) => {
    if (score >= 9) return "Superb";
    if (score >= 8.5) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    return "Pleasant";
  };

  // Format currency symbol
  const getCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
    };
    return symbols[curr] || curr + ' ';
  };

  const handleViewClick = () => {
    if (propertyUrl && propertyUrl !== "#") {
      window.open(propertyUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleAvailabilityConfirmed = (hotelOffer: any, checkIn: string, checkOut: string, adults: number) => {
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    
    const bookingData = {
      ...hotelOffer,
      hotel: property,
      hotelName: title,
      hotelAddress: property.location || property.address,
      hotelImage: property.photoUrls?.[0] || property.image,
      checkIn,
      checkOut,
      adults,
      guests: adults,
      rooms: 1,
      nights,
      totalPrice: parseFloat(hotelOffer.offers?.[0]?.price?.total || hotelOffer.price?.total || displayPrice || 0),
      currency: hotelOffer.offers?.[0]?.price?.currency || hotelOffer.price?.currency || currency,
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
      <div className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row min-h-[280px]">
        <div className="relative w-full md:w-80 h-64 md:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = getHotelImage(undefined, property.hotel_id || title);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
            onClick={handleToggleFavorite}
          >
            <Heart className={`h-5 w-5 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        <div className="flex-1 p-5 flex flex-col justify-between min-h-[200px]">
          <div className="space-y-3 flex-1">
            <div className="space-y-2">
              <h3 className="font-semibold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{location}</span>
              </p>
            </div>

            {rating > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="gap-1 font-bold text-base px-3 py-1">
                  {rating.toFixed(1)}
                </Badge>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {getRatingText(rating)}
                  </span>
                  {reviews > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {reviews.toLocaleString()} reviews
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {displayPrice > 0 && (
            <div className="pt-4 mt-auto border-t border-border">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {getCurrencySymbol(currency)}{Math.round(displayPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground">nightly</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total includes taxes and fees
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    size="default" 
                    variant="outline"
                    onClick={() => setShowDetailsModal(true)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="default"
                    onClick={() => setShowDateModal(true)}
                  >
                    Reserve
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <HotelDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        hotel={{ hotel: property, property }}
        onSelectRoom={() => {
          setShowDetailsModal(false);
          setShowDateModal(true);
        }}
      />

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
