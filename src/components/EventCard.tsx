import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Music, ExternalLink } from "lucide-react";
import { getCurrencyFromLocation } from "@/lib/currencyHelpers";

interface EventCardProps {
  event: any;
}

export const EventCard = ({ event }: EventCardProps) => {
  const imageUrl = event.images?.find((img: any) => img.ratio === "16_9")?.url || event.images?.[0]?.url;
  const venue = event._embedded?.venues?.[0];
  const priceRange = event.priceRanges?.[0];
  
  // Get currency symbol based on venue location
  const venueCity = venue?.city?.name || venue?.country?.name || 'US';
  const currencyInfo = getCurrencyFromLocation(venueCity);
  const currencySymbol = currencyInfo.symbol;
  
  const date = new Date(event.dates?.start?.dateTime || event.dates?.start?.localDate);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    ...(event.dates?.start?.dateTime && { hour: '2-digit', minute: '2-digit' })
  });

  const handleBookTickets = () => {
    window.open(event.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary">
      <div className="aspect-video relative overflow-hidden bg-muted">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={event.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {priceRange && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            {currencySymbol}{priceRange.min} - {currencySymbol}{priceRange.max}
          </Badge>
        )}
        {event.classifications?.[0] && (
          <Badge className="absolute top-2 left-2" variant="default">
            {event.classifications[0].segment?.name}
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">{event.name}</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{formattedDate}</span>
            </div>
            {venue && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">{venue.name}</span>
              </div>
            )}
            {venue?.city && (
              <div className="text-xs text-muted-foreground ml-5">
                {venue.city.name}, {venue.state?.stateCode || venue.country?.name}
              </div>
            )}
          </div>
        </div>

        {event.info && (
          <p className="text-xs text-muted-foreground line-clamp-2">{event.info}</p>
        )}

        <Button 
          onClick={handleBookTickets}
          className="w-full"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Book Tickets
        </Button>
      </div>
    </Card>
  );
};