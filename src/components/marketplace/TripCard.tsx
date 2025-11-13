import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TripCardProps {
  trip: {
    id: string;
    title: string;
    slug?: string;
    destination: string;
    cover_image_url?: string;
    price_per_person: number;
    currency: string;
    duration_days: number;
    rating?: number;
    review_count?: number;
    tags?: string[];
    creator_name?: string;
    is_verified?: boolean;
    max_participants?: number;
  };
}

export const TripCard = ({ trip }: TripCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/marketplace/trip/${trip.slug || trip.id}`);
  };

  const formatPrice = (price: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(price);
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {trip.cover_image_url ? (
          <img
            src={trip.cover_image_url}
            alt={trip.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Verified badge */}
        {trip.is_verified && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              ✓ Verified
            </Badge>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            <Calendar className="mr-1 h-3 w-3" />
            {trip.duration_days} {trip.duration_days === 1 ? 'day' : 'days'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4" />
          <span className="font-medium">{trip.destination}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2">
          {trip.title}
        </h3>

        {/* Rating & Reviews */}
        {trip.rating !== undefined && trip.review_count !== undefined && trip.review_count > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{trip.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({trip.review_count} {trip.review_count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {/* Tags */}
        {trip.tags && trip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trip.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: Price & Creator */}
        <div className="flex items-end justify-between pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground">From</div>
            <div className="text-xl font-bold text-foreground">
              {formatPrice(trip.price_per_person, trip.currency)}
            </div>
            <div className="text-xs text-muted-foreground">per person</div>
          </div>

          {trip.max_participants && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Max {trip.max_participants}</span>
            </div>
          )}
        </div>

        {/* Creator */}
        {trip.creator_name && (
          <div className="text-xs text-muted-foreground">
            by {trip.creator_name}
          </div>
        )}
      </div>
    </Card>
  );
};
