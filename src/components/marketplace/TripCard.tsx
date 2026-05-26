import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getTripRequestImageUrl } from "@/utils/tripImages";

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
  };
}

export const TripCard = ({ trip }: TripCardProps) => {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleCardClick = () => {
    navigate(`/marketplace/trip/${trip.slug || trip.id}`);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
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
    <div className="group overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/80 transition hover:-translate-y-1 hover:shadow-lg">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={getTripRequestImageUrl(trip.destination, trip.cover_image_url)}
          alt={trip.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = getTripRequestImageUrl(trip.destination, null);
            if (img.src !== fallback) img.src = fallback;
          }}
        />
        
        {/* Top badges */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between">
          {trip.is_verified && (
            <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm backdrop-blur-sm">
              Verified
            </span>
          )}
          <button 
            onClick={handleWishlistClick}
            className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background transition"
          >
            <Heart 
              className={`h-4 w-4 transition ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-foreground/60'}`} 
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 px-3.5 pb-3.5 pt-3">
        {/* Title and Rating */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
            {trip.title}
          </h3>
          {trip.rating !== undefined && trip.review_count !== undefined && trip.review_count > 0 && (
            <div className="flex items-center gap-0.5 text-xs text-foreground">
              <span>★</span>
              <span>{trip.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({trip.review_count})
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        <p className="text-xs text-muted-foreground">{trip.destination}</p>

        {/* Price */}
        <p className="mt-0.5 text-sm font-semibold text-foreground">
          {formatPrice(trip.price_per_person, trip.currency)}
          <span className="text-xs font-normal text-muted-foreground"> / person · {trip.duration_days}d</span>
        </p>

        {/* Tags and Creator */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {trip.tags?.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          {trip.creator_name && (
            <span className="text-[11px] text-muted-foreground">
              by {trip.creator_name}
            </span>
          )}
        </div>

        {/* CTA Button */}
        <button 
          onClick={handleCardClick}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition"
        >
          View trip details
        </button>
      </div>
    </div>
  );
};
