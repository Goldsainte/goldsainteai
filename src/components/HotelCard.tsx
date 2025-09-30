import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hotel, Star, MapPin, Eye } from "lucide-react";
import { useState } from "react";
import { BookingModal } from "./BookingModal";
import { DateSelectionModal } from "./DateSelectionModal";
import { HotelDetailsModal } from "./HotelDetailsModal";

interface HotelCardProps {
  hotel: any;
}

export const HotelCard = ({ hotel }: HotelCardProps) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedHotelOffer, setSelectedHotelOffer] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingDates, setBookingDates] = useState<{ checkIn: string; checkOut: string; adults: number } | null>(null);
  
  const hotelData = hotel.hotel;
  const offer = hotel.offers?.[0];
  const price = parseFloat(offer?.price?.total || 0);
  const currency = offer?.price?.currency || 'USD';

  const handleAvailabilityConfirmed = (hotelOffer: any, checkIn: string, checkOut: string, adults: number) => {
    setSelectedHotelOffer(hotelOffer);
    setBookingDates({ checkIn, checkOut, adults });
    setShowBookingModal(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary">
        <div className="aspect-video relative overflow-hidden bg-muted">
          {hotelData.media?.[0]?.uri ? (
            <img 
              src={hotelData.media[0].uri} 
              alt={hotelData.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Hotel className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
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
        onSelectRoom={(room) => {
          setSelectedRoom(room);
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

      {showBookingModal && selectedHotelOffer && bookingDates && (
        <BookingModal
          open={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedHotelOffer(null);
            setBookingDates(null);
          }}
          bookingType="hotel"
          bookingData={{
            ...selectedHotelOffer,
            selectedRoom,
            checkInDate: bookingDates.checkIn,
            checkOutDate: bookingDates.checkOut,
            adults: bookingDates.adults
          }}
          totalPrice={selectedRoom?.price || (selectedHotelOffer.offers?.[0]?.price?.total ? parseFloat(selectedHotelOffer.offers[0].price.total) : price)}
          currency={selectedHotelOffer.offers?.[0]?.price?.currency || currency}
        />
      )}
    </>
  );
};
