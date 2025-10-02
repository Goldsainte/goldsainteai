import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, Calendar, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { FlightBookingModal } from "./FlightBookingModal";
import { getCurrencyFromLocation } from "@/lib/currencyHelpers";

interface FlightCardProps {
  flight: any;
  dictionaries?: any;
}

export const FlightCard = ({ flight, dictionaries }: FlightCardProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  
  const firstSegment = flight.itineraries[0].segments[0];
  const lastSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];
  const basePrice = parseFloat(flight.price.total);
  const markedUpPrice = (basePrice * 1.15).toFixed(2);
  
  // Get currency symbol from destination
  const destination = lastSegment.arrival.iataCode;
  const currencyInfo = getCurrencyFromLocation(destination);
  const currencySymbol = currencyInfo.symbol;

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDuration = (duration: string) => {
    return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm');
  };

  const getAirlineName = (code: string) => {
    return dictionaries?.carriers?.[code] || code;
  };

  const favoriteId = isFavorite('flight', { flight, dictionaries });
  
  const handleToggleFavorite = async () => {
    if (favoriteId) {
      await removeFavorite(favoriteId);
    } else {
      await addFavorite('flight', { flight, dictionaries });
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Plane className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">
                  {firstSegment.departure.iataCode} → {lastSegment.arrival.iataCode}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getAirlineName(firstSegment.carrierCode)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg">
                {currencySymbol}{markedUpPrice}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="hover:bg-primary/10"
              >
                <Heart className={`h-5 w-5 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>

          {/* Flight Details */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Departure</span>
              </div>
              <p className="font-semibold">{formatTime(firstSegment.departure.at)}</p>
              <p className="text-sm text-muted-foreground">{formatDate(firstSegment.departure.at)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span>Duration</span>
              </div>
              <p className="font-semibold">{getDuration(flight.itineraries[0].duration)}</p>
              <p className="text-sm text-muted-foreground">
                {flight.itineraries[0].segments.length === 1 ? 'Direct' : `${flight.itineraries[0].segments.length - 1} stop(s)`}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Arrival</span>
              </div>
              <p className="font-semibold">{formatTime(lastSegment.arrival.at)}</p>
              <p className="text-sm text-muted-foreground">{formatDate(lastSegment.arrival.at)}</p>
            </div>
          </div>

          {/* Actions */}
          <Button 
            className="w-full"
            onClick={() => setBookingModalOpen(true)}
          >
            Book Now - {currencySymbol}{markedUpPrice}
          </Button>
        </div>
      </Card>

      <FlightBookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        flight={flight}
        dictionaries={dictionaries}
      />
    </>
  );
};
