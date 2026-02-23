import { useNavigate } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";

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

  const getDuration = (): number => {
    return trip.duration_nights ?? trip.duration_days ?? 0;
  };

  return (
    <article
      onClick={() => navigate(`/marketplace/trip/${trip.slug || trip.id}`)}
      className="group cursor-pointer space-y-2.5"
    >
      {/* Clean image — no overlay, no badges on image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl">
        <img
          src={trip.cover_image_url || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"}
          alt={trip.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Content below image */}
      <div className="space-y-1 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1">
            {trip.title}
          </h3>
          <span className="text-sm md:text-[15px] font-semibold text-[#0a2225] whitespace-nowrap">
            {formatPrice(trip.price_per_person, trip.currency)}
          </span>
        </div>

        <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{trip.destination}</span>
        </p>

        <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{getDuration()} nights</span>
        </p>
      </div>
    </article>
  );
}
