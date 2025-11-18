import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hotel, Star, MapPin, Eye, Sparkles } from "lucide-react";
import { HotelDetailsModal } from "./HotelDetailsModal";
import { DateSelectionModal } from "./DateSelectionModal";
import { getHotelImage } from "@/lib/imageHelpers";
import { toast } from "sonner";
import { getCurrencyFromLocation } from "@/lib/currencyHelpers";

interface HotelCardProps {
  hotel: any;
}

export const HotelCard = ({ hotel }: HotelCardProps) => {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  
  const hotelData = hotel.hotel;
  const offer = hotel.offers?.[0];
  const price = parseFloat(offer?.price?.total || 0);
  
  // Check if this is a curated recommendation
  const isCurated = hotel.id?.startsWith('curated-');
  
  // Get currency symbol based on hotel location
  const hotelCity = hotelData.address?.cityName || hotelData.cityCode;
  const currencyInfo = getCurrencyFromLocation(hotelCity);
  const currencySymbol = currencyInfo.symbol;

  const handleAvailabilityConfirmed = ({ checkIn, checkOut, adults }: { checkIn: string; checkOut: string; adults: number }) => {
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    
    // Use base price if available (for booking backend), otherwise use displayed price
    const displayPrice = parseFloat(offer?.price?.total || 0);
    const basePrice = parseFloat(offer?.price?.base || displayPrice / 1.15);
    
    const bookingData = {
      available: true,
      hotel: hotelData,
      hotelName: hotelData.name,
      hotelAddress: hotelData.address?.lines?.[0] || hotelData.address,
      hotelImage: hotelData.image,
      checkIn,
      checkOut,
      adults,
      guests: adults,
      rooms: 1,
      nights,
      totalPrice: displayPrice, // Customer-facing price with markup
      basePrice: basePrice, // Original price for backend
      currency: offer?.price?.currency || 'USD',
    };
    
    toast.success("We'll finish this booking inside your trip brief.");
    navigate('/post-trip', { state: { hotel: bookingData } });
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary h-full flex flex-col">
        <div className="aspect-video relative overflow-hidden bg-muted flex-shrink-0">
          {(() => {
            const src = getHotelImage(
              hotel.photos?.[0] || hotelData.media?.[0]?.uri,
              hotelData.hotelId || hotelData.name
            );
            return src ? (
              <img
                src={src}
                alt={hotelData.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // Hide broken image; keep muted background visible
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full animate-pulse" aria-label="No image available" />
            );
          })()}
          <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
            {isCurated && (
              <Badge className="text-xs flex items-center gap-1 bg-primary/90 text-primary-foreground hover:bg-primary">
                <Sparkles className="h-3 w-3" />
                Curated
              </Badge>
            )}
            <Badge className="text-xs md:text-sm" variant="secondary">
              {currencySymbol}{price.toFixed(2)}
            </Badge>
          </div>
        </div>
        <div className="p-3 md:p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-secondary font-semibold text-base md:text-lg line-clamp-2 md:line-clamp-1">{hotelData.name}</h3>
              {hotelData.rating && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-semibold">{hotelData.rating}</span>
                </div>
              )}
            </div>
            {hotelData.address?.lines?.[0] && (
              <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">{hotelData.address.lines[0]}</span>
              </div>
            )}
          </div>

          {offer?.room && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium line-clamp-1">{offer.room.typeEstimated?.category || 'Room'}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {offer.room.description?.text || 'Standard room'}
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-auto">
            <Button 
              onClick={() => setShowDetailsModal(true)}
              variant="outline"
              className="flex-1 h-11 text-sm"
            >
              <Eye className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">View Details</span>
            </Button>
            <Button 
              onClick={() => setShowDateModal(true)}
              className="flex-1 h-11 text-sm"
            >
              <span className="hidden sm:inline">Check Availability</span>
              <span className="sm:hidden">Check</span>
            </Button>
          </div>
        </div>
      </Card>

      <HotelDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        hotel={hotel}
        onSelectRoom={() => {
          setShowDetailsModal(false);
          setShowDateModal(true);
        }}
      />

      <DateSelectionModal
        open={showDateModal}
        onClose={() => setShowDateModal(false)}
        onAvailabilityConfirmed={handleAvailabilityConfirmed}
        cityCode={hotelData.cityCode || hotelData.iataCode || "PAR"}
        hotelName={hotelData.name}
        propertyId={hotel.id || hotelData.hotelId}
      />
    </>
  );
};
