import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Star } from "lucide-react";

interface Trip {
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
}

interface TripGridProps {
  trips: Trip[];
}

export function TripGrid({ trips }: TripGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <div
          key={trip.id}
          onClick={() => navigate(`/marketplace/trip/${trip.id}`)}
          className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E5DFC6]/30 bg-white shadow-sm transition-all hover:shadow-md"
        >
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
            {trip.cover_image_url ? (
              <img
                src={trip.cover_image_url}
                alt={trip.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FBF9F0] to-[#E5DFC6]/20">
                <MapPin className="h-12 w-12 text-[#BFAD72]" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="mb-2 font-display text-xl text-[#0a2225] line-clamp-2">
              {trip.title}
            </h3>

            <div className="mb-3 flex items-center gap-2 text-sm text-[#8D8D8D]">
              <MapPin className="h-4 w-4" />
              <span>{trip.destination}</span>
              {trip.duration_days && (
                <>
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  <span>{trip.duration_days} days</span>
                </>
              )}
            </div>

            {trip.rating && (
              <div className="mb-3 flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-[#BFAD72] text-[#BFAD72]" />
                <span className="text-sm font-medium text-[#0a2225]">{trip.rating}</span>
                {trip.review_count && (
                  <span className="text-xs text-[#8D8D8D]">
                    ({trip.review_count} reviews)
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-semibold text-[#0a2225]">
                  ${trip.price_per_person}
                </span>
                <span className="ml-1 text-sm text-[#8D8D8D]">per person</span>
              </div>
            </div>

            {trip.creator_name && (
              <p className="mt-3 text-xs text-[#8D8D8D]">By {trip.creator_name}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
