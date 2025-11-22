import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Heart, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { FlightBookingModal } from "./FlightBookingModal";
import { formatCurrency } from "@/lib/currencyHelpers";

const AirlineLogo = ({ carrierCode, className }: { carrierCode: string; className?: string }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  if (!carrierCode || imageError) {
    return <Plane className={className} />;
  }
  
  return (
    <>
      {!imageLoaded && <Plane className={className} />}
      <img 
        src={`https://images.kiwi.com/airlines/64/${carrierCode}.png`}
        alt={carrierCode}
        className={`${className} ${!imageLoaded ? 'hidden' : ''}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </>
  );
};

interface CompactFlightCardProps {
  flight: any;
  dictionaries?: any;
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  cabinClass?: string;
}

export const CompactFlightCard = ({ 
  flight, 
  dictionaries,
  origin,
  destination,
  departureDate,
  returnDate,
  adults,
  cabinClass
}: CompactFlightCardProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Add null checks to prevent crashes
  if (!flight || !flight.itineraries || flight.itineraries.length === 0 || 
      !flight.itineraries[0].segments || flight.itineraries[0].segments.length === 0) {
    console.warn('Invalid flight data structure:', flight);
    return null;
  }
  
  const firstSegment = flight.itineraries[0].segments[0];
  const lastSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];
  
  // Handle price gracefully - DON'T return null if missing
  let basePrice: number = 0;
  let currency: string = 'USD';
  let hasPriceData: boolean = false;
  
  if (flight.price) {
    if (typeof flight.price === 'number') {
      basePrice = flight.price;
      currency = flight.travelerPricings?.[0]?.price?.currency || 'USD';
      hasPriceData = true;
    } else if (typeof flight.price === 'object') {
      const priceValue = parseFloat(flight.price.total || flight.price.base || '0');
      if (!isNaN(priceValue) && priceValue > 0) {
        basePrice = priceValue;
        currency = flight.price.currency || 'USD';
        hasPriceData = true;
      }
    }
  }
  
  if (!hasPriceData) {
    console.warn('Flight has no valid price data:', flight.id);
    // Don't return null - continue rendering the card
  }
  
  const markedUpPrice = hasPriceData ? basePrice * 1.15 : 0;

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
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

  const getCabinClass = () => {
    const cabin = flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin;
    return cabin || "Economy";
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-all overflow-hidden">
        {/* Mobile Layout: Stack vertically */}
        <div className="flex flex-col sm:hidden gap-3 p-3">
          {/* Top Row: Route and Logo */}
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 flex-shrink-0 rounded bg-white flex items-center justify-center p-1.5">
              <AirlineLogo carrierCode={firstSegment.carrierCode} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-base">{firstSegment.departure.iataCode}</span>
                <div className="flex-1 h-px bg-border relative max-w-[60px]">
                  <Plane className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                </div>
                <span className="font-bold text-base">{lastSegment.arrival.iataCode}</span>
              </div>
              <div className="text-caption text-muted-foreground truncate">
                {getAirlineName(firstSegment.carrierCode)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleToggleFavorite}
            >
              <Heart className={`h-4 w-4 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </div>

          {/* Middle Row: Times and Duration */}
          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="font-medium">{formatTime(firstSegment.departure.at)}</div>
              <div className="text-caption text-muted-foreground">Depart</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-caption text-muted-foreground">{getDuration(flight.itineraries[0].duration)}</div>
              <div className="text-caption text-muted-foreground">
                {flight.itineraries[0].segments.length === 1 ? 'Direct' : `${flight.itineraries[0].segments.length - 1} stop`}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatTime(lastSegment.arrival.at)}</div>
              <div className="text-caption text-muted-foreground">Arrive</div>
            </div>
          </div>

          {/* Bottom Row: Price and Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <div>
              {hasPriceData ? (
                <>
                  <div className="text-lg font-bold">{formatCurrency(markedUpPrice, currency)}</div>
                  <div className="text-caption text-muted-foreground">{getCabinClass()}</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-muted-foreground">Price</div>
                  <div className="text-sm text-muted-foreground">Contact us</div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                className="h-8 px-4"
                onClick={() => setBookingModalOpen(true)}
              >
                Select
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout: Horizontal */}
        <div className="hidden sm:flex gap-3 p-3 items-center">
          {/* Airline Logo */}
          <div className="w-12 h-12 flex-shrink-0 rounded bg-white flex items-center justify-center p-2">
            <AirlineLogo carrierCode={firstSegment.carrierCode} className="w-full h-full object-contain" />
          </div>

          {/* Flight Route */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm">{firstSegment.departure.iataCode}</span>
              <div className="flex-1 h-px bg-border relative">
                <Plane className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <span className="font-bold text-sm">{lastSegment.arrival.iataCode}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTime(firstSegment.departure.at)} - {formatTime(lastSegment.arrival.at)}</span>
              <span>•</span>
              <span>{getDuration(flight.itineraries[0].duration)}</span>
              <span>•</span>
              <span>{flight.itineraries[0].segments.length === 1 ? 'Direct' : `${flight.itineraries[0].segments.length - 1} stop`}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {getAirlineName(firstSegment.carrierCode)} • {getCabinClass()}
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              {hasPriceData ? (
                <>
                  <div className="text-xl font-bold">{formatCurrency(markedUpPrice, currency)}</div>
                  <div className="text-xs text-muted-foreground">total</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-muted-foreground">Price</div>
                  <div className="text-sm text-muted-foreground">Contact us</div>
                </>
              )}
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-4 w-4 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setBookingModalOpen(true)}
              >
                Select
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t border-border p-3 pt-3 bg-muted/30 animate-accordion-down">
            <div className="space-y-3">
              {/* Outbound */}
              <div>
                <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <Plane className="h-3 w-3" />
                  Outbound Flight
                </div>
                <div className="space-y-2">
                  {flight.itineraries[0].segments.map((segment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 rounded bg-background">
                      <div>
                        <div className="font-medium">{segment.departure.iataCode} → {segment.arrival.iataCode}</div>
                        <div className="text-muted-foreground">{getAirlineName(segment.carrierCode)} {segment.number}</div>
                      </div>
                      <div className="text-right">
                        <div>{formatTime(segment.departure.at)} - {formatTime(segment.arrival.at)}</div>
                        <div className="text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {getDuration(segment.duration)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Flight if exists */}
              {flight.itineraries[1] && (
                <div>
                  <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                    <Plane className="h-3 w-3 rotate-180" />
                    Return Flight
                  </div>
                  <div className="space-y-2">
                    {flight.itineraries[1].segments.map((segment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs p-2 rounded bg-background">
                        <div>
                          <div className="font-medium">{segment.departure.iataCode} → {segment.arrival.iataCode}</div>
                          <div className="text-muted-foreground">{getAirlineName(segment.carrierCode)} {segment.number}</div>
                        </div>
                        <div className="text-right">
                          <div>{formatTime(segment.departure.at)} - {formatTime(segment.arrival.at)}</div>
                          <div className="text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            {getDuration(segment.duration)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
