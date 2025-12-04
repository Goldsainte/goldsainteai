import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Star } from "lucide-react";

interface LiveTripCardProps {
  trip: {
    id: string;
    slug: string;
    title: string;
    destination: string;
    cover_image_url: string | null;
    price_per_person: number;
    currency: string;
    duration_days: number;
    max_participants: number;
    current_bookings: number;
    difficulty_level: string | null;
    rating: number | null;
    review_count: number | null;
    available_from: string | null;
    available_until: string | null;
    tags: string[] | null;
    creator?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

export function LiveTripCard({ trip }: LiveTripCardProps) {
  const navigate = useNavigate();
  const spotsLeft = trip.max_participants - (trip.current_bookings || 0);
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;
  const isFull = spotsLeft <= 0;

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDateRange = () => {
    if (!trip.available_from) return null;
    const start = new Date(trip.available_from);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    if (trip.available_until) {
      const end = new Date(trip.available_until);
      return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}, ${end.getFullYear()}`;
    }
    return start.toLocaleDateString("en-US", { ...options, year: "numeric" });
  };

  const getDifficultyLabel = (level: string | null) => {
    const labels: Record<string, string> = {
      easy: "Relaxation",
      moderate: "Moderate",
      challenging: "Active",
      extreme: "Adventure",
    };
    return labels[level || "moderate"] || "Moderate";
  };

  return (
    <article
      onClick={() => navigate(`/marketplace/trip/${trip.slug || trip.id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E5DFC6]/40 bg-white shadow-sm transition-all hover:shadow-md hover:border-[#C7B892]/60"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={trip.cover_image_url || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"}
          alt={trip.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Spots Badge */}
        {!isFull && (
          <div className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
            isAlmostFull 
              ? "bg-[#C7B892] text-white" 
              : "bg-white/90 text-[#0a2225] backdrop-blur-sm"
          }`}>
            {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
          </div>
        )}
        {isFull && (
          <div className="absolute left-3 top-3 rounded-full bg-[#0a2225]/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Sold out
          </div>
        )}

        {/* Activity Level */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-[#4a4a4a] backdrop-blur-sm">
          {getDifficultyLabel(trip.difficulty_level)}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Tags */}
        {trip.tags && trip.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {trip.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#C7B892]/15 px-2 py-0.5 text-[10px] font-medium text-[#7A7151]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-secondary text-lg font-semibold leading-tight text-[#0a2225] line-clamp-2">
          {trip.title}
        </h3>

        {/* Location & Dates */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-[#4a4a4a]">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#818181]" />
            {trip.destination}
          </span>
          {formatDateRange() && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#818181]" />
              {formatDateRange()}
            </span>
          )}
        </div>

        {/* Duration & Group Size */}
        <div className="mt-2 flex items-center gap-3 text-[12px] text-[#818181]">
          <span>{trip.duration_days} days</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Up to {trip.max_participants}
          </span>
          {trip.rating && trip.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[#C7B892] text-[#C7B892]" />
              {trip.rating.toFixed(1)}
              {trip.review_count && <span>({trip.review_count})</span>}
            </span>
          )}
        </div>

        {/* Host */}
        {trip.creator && (
          <div className="mt-4 flex items-center gap-2 border-t border-[#E5DFC6]/50 pt-4">
            <img
              src={trip.creator.avatar_url || "/placeholder.svg"}
              alt={trip.creator.full_name || "Host"}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[#C7B892]/20"
            />
            <span className="text-[13px] text-[#4a4a4a]">
              Hosted by <span className="font-medium text-[#0a2225]">{trip.creator.full_name || "Creator"}</span>
            </span>
          </div>
        )}

        {/* Price & CTA */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#818181]">From</p>
            <p className="font-secondary text-xl font-semibold text-[#0a2225]">
              {formatPrice(trip.price_per_person, trip.currency)}
              <span className="text-sm font-normal text-[#4a4a4a]"> / person</span>
            </p>
          </div>
          <button
            className="rounded-full bg-[#0C4D47] px-4 py-2 text-[13px] font-medium text-[#E5DFC6] transition-colors hover:bg-[#0a3d39]"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/marketplace/trip/${trip.slug || trip.id}`);
            }}
          >
            View Trip
          </button>
        </div>
      </div>
    </article>
  );
}
