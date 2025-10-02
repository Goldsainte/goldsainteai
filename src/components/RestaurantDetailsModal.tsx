import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Globe, Clock, Calendar, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RestaurantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: {
    id: string;
    name: string;
    rating: number;
    userRatingsTotal: number;
    priceLevel?: number;
    address: string;
    photoUrl: string | null;
    openNow?: boolean;
    phone?: string;
    website?: string;
    hours?: any;
    photos?: Array<{ url: string; caption?: string }>;
    cuisine?: string;
    description?: string;
  };
}

export const RestaurantDetailsModal = ({
  isOpen,
  onClose,
  restaurant
}: RestaurantDetailsModalProps) => {
  const numericRating = typeof restaurant.rating === 'number' ? restaurant.rating : Number(restaurant.rating) || 0;

  const getPriceLevelSymbol = (level?: number) => {
    if (!level) return '';
    return '$'.repeat(level);
  };

  const websiteUrl = restaurant.website
    ? (/^https?:\/\//i.test(restaurant.website) ? restaurant.website : `https://${restaurant.website}`)
    : undefined;

  const handleMakeReservation = () => {
    const query = encodeURIComponent(`${restaurant.name} ${restaurant.address} reservations`);
    const reservationUrl = `https://www.google.com/search?q=${query}`;
    window.open(reservationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[90vh]">
          {/* Image Gallery */}
          {restaurant.photos && restaurant.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-1">
              {restaurant.photos.slice(0, 4).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo.url}
                  alt={photo.caption || restaurant.name}
                  className={`w-full object-cover ${idx === 0 ? 'col-span-2 h-64' : 'h-48'}`}
                />
              ))}
            </div>
          ) : restaurant.photoUrl ? (
            <img
              src={restaurant.photoUrl}
              alt={restaurant.name}
              className="w-full h-64 object-cover"
            />
          ) : null}

          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold">{restaurant.name}</DialogTitle>
            </DialogHeader>

            {/* Rating and Price */}
            <div className="flex items-center gap-4 flex-wrap">
              {numericRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="text-lg font-semibold">{numericRating.toFixed(1)}</span>
                  {restaurant.userRatingsTotal > 0 && (
                    <span className="text-muted-foreground">({restaurant.userRatingsTotal} reviews)</span>
                  )}
                </div>
              )}
              {restaurant.priceLevel && (
                <Badge variant="outline" className="text-base">
                  {getPriceLevelSymbol(restaurant.priceLevel)}
                </Badge>
              )}
              {restaurant.cuisine && (
                <Badge variant="secondary">{restaurant.cuisine}</Badge>
              )}
              {restaurant.openNow !== undefined && (
                <Badge variant={restaurant.openNow ? "default" : "secondary"}>
                  {restaurant.openNow ? "Open Now" : "Closed"}
                </Badge>
              )}
            </div>

            {/* Description */}
            {restaurant.description && (
              <p className="text-muted-foreground leading-relaxed">{restaurant.description}</p>
            )}

            {/* Contact Information */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold text-lg">Contact & Location</h3>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm">{restaurant.address}</span>
              </div>

              {restaurant.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${restaurant.phone}`} className="text-sm hover:underline">
                    {restaurant.phone}
                  </a>
                </div>
              )}

              {websiteUrl && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm hover:underline text-primary"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>

            {/* Hours */}
            {restaurant.hours?.weekday_text && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Hours
                </h3>
                <div className="space-y-1">
                  {restaurant.hours.weekday_text.map((day: string, idx: number) => (
                    <p key={idx} className="text-sm text-muted-foreground">{day}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {websiteUrl && (
                <Button asChild variant="outline" className="flex-1">
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Menu on Website
                  </a>
                </Button>
              )}
              <Button
                onClick={handleMakeReservation}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Make Reservation
              </Button>
            </div>

            {!websiteUrl && (
              <p className="text-sm text-muted-foreground text-center">
                Menu information may be available when you make a reservation
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
