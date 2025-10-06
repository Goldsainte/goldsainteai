import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, Calendar, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { FlightBookingModal } from "./FlightBookingModal";
import { getCurrencyFromLocation } from "@/lib/currencyHelpers";

const AirlineLogo = ({ carrierCode, className }: { carrierCode: string; className?: string }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return <Plane className={className} />;
  }
  
  return (
    <img 
      src={`https://images.kiwi.com/airlines/64/${carrierCode}.png`}
      alt={carrierCode}
      className={className}
      onError={() => setImageError(true)}
    />
  );
};

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
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-all border-2 hover:border-primary">
        <div className="space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded bg-white flex items-center justify-center p-1.5">
                  <AirlineLogo carrierCode={firstSegment.carrierCode} className="w-full h-full object-contain" />
                </div>
                <span className="font-semibold text-base sm:text-lg truncate">
                  {firstSegment.departure.iataCode} → {lastSegment.arrival.iataCode}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {getAirlineName(firstSegment.carrierCode)}
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <Badge variant="secondary" className="text-base sm:text-lg whitespace-nowrap">
                {currencySymbol}{markedUpPrice}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="hover:bg-primary/10 flex-shrink-0"
              >
                <Heart className={`h-5 w-5 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>

          {/* Flight Details */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 sm:py-4 border-y">
            <div className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                <span className="text-[10px] sm:text-xs">Departure</span>
              </div>
              <p className="font-semibold text-sm sm:text-base truncate">{formatTime(firstSegment.departure.at)}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{formatDate(firstSegment.departure.at)}</p>
            </div>
            <div className="text-center min-w-0">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                <span className="text-[10px] sm:text-xs">Duration</span>
              </div>
              <p className="font-semibold text-sm sm:text-base truncate">{getDuration(flight.itineraries[0].duration)}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                {flight.itineraries[0].segments.length === 1 ? 'Direct' : `${flight.itineraries[0].segments.length - 1} stop(s)`}
              </p>
            </div>
            <div className="text-right min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-1 sm:gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                <span className="text-[10px] sm:text-xs">Arrival</span>
              </div>
              <p className="font-semibold text-sm sm:text-base truncate">{formatTime(lastSegment.arrival.at)}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{formatDate(lastSegment.arrival.at)}</p>
            </div>
          </div>

          {/* Actions */}
          <Button 
            className="w-full text-sm sm:text-base"
            onClick={() => setBookingModalOpen(true)}
          >
            <span className="truncate">Select</span>
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
