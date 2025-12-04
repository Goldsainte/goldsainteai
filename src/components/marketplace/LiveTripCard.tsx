import { useNavigate } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LiveTripCardProps {
  trip: {
    id: string;
    slug: string;
    title: string;
    destination: string;
    cover_image_url: string | null;
    price_per_person: number;
    currency: string;
    duration_nights?: number | null;
    duration_days?: number;
    highlights?: string[] | null;
    tags?: string[] | null;
    creator_type?: string | null;
  };
}

export function LiveTripCard({ trip }: LiveTripCardProps) {
  const navigate = useNavigate();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Derive vibe tags from highlights or tags, fallback to defaults
  const getVibeTags = (): string[] => {
    if (trip.highlights && trip.highlights.length > 0) {
      return trip.highlights.slice(0, 3);
    }
    if (trip.tags && trip.tags.length > 0) {
      return trip.tags.slice(0, 3);
    }
    return ['Curated', 'Luxury'];
  };

  const getCuratorLabel = (): string => {
    return trip.creator_type === 'creator' 
      ? 'Creator + Agent collab'
      : 'Agent-curated journey';
  };

  // Use duration_nights if available, otherwise fall back to duration_days
  const getDuration = (): number => {
    return trip.duration_nights ?? trip.duration_days ?? 0;
  };

  return (
    <article
      onClick={() => navigate(`/marketplace/trip/${trip.slug || trip.id}`)}
      className="group overflow-hidden rounded-xl md:rounded-2xl bg-white shadow-sm border border-[#E5DFC6] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
    >
      {/* Image with gradient and badges */}
      <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden">
        <img
          src={trip.cover_image_url || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"}
          alt={trip.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Duration badge - top right */}
        <Badge className="absolute top-2 right-2 md:top-3 md:right-3 rounded-full text-[9px] md:text-[10px] bg-white/95 text-[#0a2225] border-0 shadow-sm px-2 py-0.5">
          <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
          {getDuration()} nights
        </Badge>

        {/* Price badge - top left */}
        <Badge className="absolute top-2 left-2 md:top-3 md:left-3 rounded-full text-[10px] md:text-[11px] bg-[#0c4d47] text-white border-0 shadow-sm px-2.5 py-1 font-medium">
          From {formatPrice(trip.price_per_person, trip.currency)}
        </Badge>

        {/* Bottom overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
          <h3 className="font-secondary text-sm md:text-base text-white font-medium leading-tight mb-1">
            {trip.title}
          </h3>
          <p className="flex items-center gap-1 text-[10px] md:text-xs text-white/90">
            <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
            <span className="truncate">{trip.destination}</span>
          </p>
        </div>
      </div>
      
      {/* Content below image */}
      <div className="p-2.5 md:p-4 space-y-2">
        {/* Vibe tags */}
        <div className="flex flex-wrap gap-1">
          {getVibeTags().map((tag) => (
            <Badge 
              key={tag} 
              variant="outline" 
              className="rounded-full text-[8px] md:text-[9px] px-1.5 md:px-2 py-0 border-[#E5DFC6] text-[#6B7280] bg-[#FDF9F0]/50"
            >
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Curator credit */}
        <p className="text-[9px] md:text-[10px] text-[#8D8D8D]">{getCuratorLabel()}</p>
      </div>
    </article>
  );
}
