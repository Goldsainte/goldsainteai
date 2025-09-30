import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, Calendar, ExternalLink, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

interface FlightCardProps {
  flight: any;
  dictionaries?: any;
}

export const FlightCard = ({ flight, dictionaries }: FlightCardProps) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const firstSegment = flight.itineraries[0].segments[0];
  const lastSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];
  const price = parseFloat(flight.price.total);
  const currency = flight.price.currency;

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

  const getAirlineBookingUrl = () => {
    const origin = firstSegment.departure.iataCode;
    const destination = lastSegment.arrival.iataCode;
    const departureDate = new Date(firstSegment.departure.at).toISOString().split('T')[0];
    const returnDate = flight.itineraries[1] ? new Date(flight.itineraries[1].segments[0].departure.at).toISOString().split('T')[0] : '';
    const airline = firstSegment.carrierCode;
    
    // Format dates for URLs (remove hyphens for some airlines)
    const depDateCompact = departureDate.replace(/-/g, '');
    const retDateCompact = returnDate.replace(/-/g, '');
    
    // Construct airline-specific booking URLs with parameters
    const airlineUrls: { [key: string]: string } = {
      // US Airlines
      'AA': `https://www.aa.com/booking/search?slices=${origin}|${destination}|${departureDate}${returnDate ? `&slices=${destination}|${origin}|${returnDate}` : ''}`,
      'DL': `https://www.delta.com/flight-search/book-a-flight?origin=${origin}&destination=${destination}&departureDate=${departureDate}${returnDate ? `&returnDate=${returnDate}` : ''}`,
      'UA': `https://www.united.com/en/us/fsr/choose-flights?f=${origin}&t=${destination}&d=${departureDate}${returnDate ? `&r=${returnDate}` : '&tt=1'}`,
      'WN': `https://www.southwest.com/air/booking/select.html?originationAirportCode=${origin}&destinationAirportCode=${destination}&returnAirportCode=${returnDate ? origin : ''}&departureDate=${departureDate}&departureTimeOfDay=ALL_DAY${returnDate ? `&returnDate=${returnDate}` : ''}`,
      'B6': `https://www.jetblue.com/booking/flights?from=${origin}&to=${destination}&depart=${departureDate}${returnDate ? `&return=${returnDate}` : ''}`,
      'AS': `https://www.alaskaair.com/booking/shopping?from=${origin}&to=${destination}&departure=${departureDate}${returnDate ? `&return=${returnDate}` : ''}`,
      'F9': `https://www.flyfrontier.com/travel/book/?outboundRouting=${origin}~${destination}~${depDateCompact}${returnDate ? `&returnRouting=${destination}~${origin}~${retDateCompact}` : ''}`,
      'NK': `https://www.spirit.com/book/flights?airport-origin=${origin}&airport-destination=${destination}&date-departing=${departureDate}${returnDate ? `&date-returning=${returnDate}` : ''}`,
      
      // International carriers - many don't support deep linking, using search aggregators
      'BA': `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
      'LH': `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
      'AF': `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
      'KL': `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
      'EK': `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
      'QR': `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
      'SQ': `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
      'AC': `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
    };
    
    // Return airline-specific URL or Google Flights as fallback
    return airlineUrls[airline] || `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`;
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
                {currency} {price.toFixed(2)}
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
            asChild
            className="w-full"
          >
            <a 
              href={getAirlineBookingUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              Book on {getAirlineName(firstSegment.carrierCode)}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>
    </>
  );
};
