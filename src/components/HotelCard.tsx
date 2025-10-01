import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hotel, Star, MapPin, Eye } from "lucide-react";
import { HotelDetailsModal } from "./HotelDetailsModal";
import { DateSelectionModal } from "./DateSelectionModal";
import { getHotelImage } from "@/lib/imageHelpers";
import { encodeData } from "@/lib/utils";

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
  const currency = offer?.price?.currency || 'USD';

  const handleAvailabilityConfirmed = (hotelOffer: any, checkIn: string, checkOut: string, adults: number) => {
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    
    const bookingData = {
      ...hotelOffer,
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
      totalPrice: parseFloat(hotelOffer.offers?.[0]?.price?.total || hotelOffer.price?.total || 0),
      currency: hotelOffer.offers?.[0]?.price?.currency || hotelOffer.price?.currency || 'USD',
    };
    
    navigate(`/hotel-booking?data=${encodeData(bookingData)}`);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary">
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img 
            src={getHotelImage(hotelData.media?.[0]?.uri, hotelData.hotelId || hotelData.name)} 
            alt={hotelData.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = getHotelImage(undefined, hotelData.hotelId || hotelData.name);
            }}
          />
          <Badge className="absolute top-2 right-2" variant="secondary">
            {currency} {price.toFixed(2)}
          </Badge>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-lg line-clamp-1">{hotelData.name}</h3>
              {hotelData.rating && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-semibold">{hotelData.rating}</span>
                </div>
              )}
            </div>
            {hotelData.address?.lines?.[0] && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{hotelData.address.lines[0]}</span>
              </div>
            )}
          </div>

          {offer?.room && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium">{offer.room.typeEstimated?.category || 'Room'}</p>
              <p className="text-xs text-muted-foreground">
                {offer.room.description?.text || 'Standard room'}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowDetailsModal(true)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button 
              onClick={() => setShowDateModal(true)}
              className="flex-1"
            >
              Check Availability
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
      />
    </>
  );
};
