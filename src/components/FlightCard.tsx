import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, Calendar, ExternalLink } from "lucide-react";

interface FlightCardProps {
  flight: any;
  dictionaries?: any;
}

export const FlightCard = ({ flight, dictionaries }: FlightCardProps) => {
  
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

  const handleBookFlight = () => {
    // Construct Google Flights URL with flight details
    const origin = firstSegment.departure.iataCode;
    const destination = lastSegment.arrival.iataCode;
    const departureDate = new Date(firstSegment.departure.at).toISOString().split('T')[0];
    
    // Google Flights URL format
    const googleFlightsUrl = `https://www.google.com/travel/flights/search?tfs=CBwQAhooEgoyMDI1LTEwLTA5agcIARIDJHtvcmlnaW59cgcIARIDJHtkZXN0aW5hdGlvbn0&hl=en&curr=${currency}`.replace('{origin}', origin).replace('{destination}', destination);
    
    window.open(googleFlightsUrl, '_blank');
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
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
            <Badge variant="secondary" className="text-lg">
              {currency} {price.toFixed(2)}
            </Badge>
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
            onClick={handleBookFlight}
            className="w-full group"
          >
            Book Flight
            <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </Card>
    </>
  );
};
