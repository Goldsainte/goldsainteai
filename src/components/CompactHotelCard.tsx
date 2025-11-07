import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { DateSelectionModal } from "./DateSelectionModal";
import { useFavorites } from "@/hooks/useFavorites";
import { getHotelImage } from "@/lib/imageHelpers";
import { encodeData } from "@/lib/utils";
import { format, addDays } from "date-fns";

interface CompactHotelCardProps {
  property: any;
  searchDates?: { checkIn: string; checkOut: string };
}

export const CompactHotelCard = ({ property, searchDates }: CompactHotelCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
    // Priority to priceBreakdown (most reliable from tool results)
    if (property.priceBreakdown?.grossPrice?.value) {
      return property.priceBreakdown.grossPrice.value;
    }
    if (property.price) return property.price;
    if (property.estimated_price) return property.estimated_price;
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

  const handleAvailabilityConfirmed = ({ checkIn, checkOut, adults }: { checkIn: string; checkOut: string; adults: number }) => {
    // Use provided dates OR fall back to searchDates from AI context
    const finalCheckIn = checkIn || searchDates?.checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const finalCheckOut = checkOut || searchDates?.checkOut || format(addDays(new Date(), 3), 'yyyy-MM-dd');
    const nights = Math.ceil((new Date(finalCheckOut).getTime() - new Date(finalCheckIn).getTime()) / (1000 * 60 * 60 * 24));
    
    const bookingData = {
      available: true,
      hotel: property,
      hotelName: title,
      hotelAddress: location,
      hotelImage: imageUrl,
      checkIn: finalCheckIn,
      checkOut: finalCheckOut,
      adults,
      guests: adults,
      rooms: 1,
      nights,
      totalPrice: displayPrice,
      perNightPrice: displayPrice,
      currency: currency,
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
                <h3 className="font-secondary font-semibold text-sm leading-tight whitespace-normal break-words line-clamp-4 sm:line-clamp-3 md:line-clamp-2 lg:line-clamp-1 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 hidden sm:inline-flex"
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
          <div className="flex flex-col items-end justify-between min-w-[120px] md:min-w-[140px]">
            {displayPrice > 0 && (
              <div className="text-right">
                <div className="text-lg sm:text-xl font-bold">
                  {getCurrencySymbol(currency)}{Math.round(displayPrice)}
                </div>
                <div className="text-xs text-muted-foreground">per night</div>
                <div className="text-xs text-muted-foreground">+taxes & fees</div>
              </div>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="hidden md:flex h-7 px-2 text-xs"
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

        {/* Expanded Details - Always show on mobile, conditional on desktop */}
        {(isMobile || expanded) && (
          <div className="border-t border-border p-3 pt-3 bg-muted/30 animate-accordion-down">
            <div className="text-xs space-y-2">
              {property.isCurated && (
                <Badge variant="default" className="mb-2 bg-accent text-accent-foreground">
                  ⭐ Curated Recommendation
                </Badge>
              )}
              <p className="text-muted-foreground line-clamp-3">
                {property.description || "Enjoy a comfortable stay with modern amenities and excellent service."}
              </p>
              {property.amenities && property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {property.amenities.slice(0, 6).map((amenity: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                      {amenity}
                    </Badge>
                  ))}
                  {property.amenities.length > 6 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      +{property.amenities.length - 6} more
                    </Badge>
                  )}
                </div>
              )}
              {property.property?.reviews && property.property.reviews.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="font-medium text-xs">Recent Reviews:</p>
                  {property.property.reviews.slice(0, 2).map((review: any, idx: number) => (
                    <div key={idx} className="bg-background rounded p-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="font-medium">{review.rating}/5</span>
                        <span className="text-muted-foreground">· {review.author}</span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{review.text}</p>
                    </div>
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
        initialCheckIn={searchDates?.checkIn}
        initialCheckOut={searchDates?.checkOut}
      />
    </>
  );
};
