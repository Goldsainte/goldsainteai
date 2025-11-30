import { useState } from "react";
import { MapPin, Calendar, Users, Clock, Star } from "lucide-react";

interface TripHeroProps {
  trip: {
    title: string;
    destination: string;
    cover_image_url: string | null;
    image_gallery: unknown;
    duration_days: number;
    duration_nights: number | null;
    max_participants: number;
    difficulty_level: string | null;
    available_from: string | null;
    available_until: string | null;
    rating: number | null;
    review_count: number | null;
  };
  spotsLeft: number;
}

export function TripHero({ trip, spotsLeft }: TripHeroProps) {
  const galleryImages = Array.isArray(trip.image_gallery) ? trip.image_gallery : [];
  const images = [
    trip.cover_image_url,
    ...galleryImages,
  ].filter(Boolean) as string[];

  const [activeImage, setActiveImage] = useState(0);

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
    <section className="mx-auto max-w-6xl px-4 pt-4 pb-8">
      {/* Image Gallery */}
      <div className="overflow-hidden rounded-2xl">
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          <img
            src={images[activeImage] || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200"}
            alt={trip.title}
            className="h-full w-full object-cover"
          />
          
          {/* Spots Remaining Badge */}
          {spotsLeft > 0 && spotsLeft <= 5 && (
            <div className="absolute left-4 top-4 rounded-full bg-[#C7B892] px-4 py-2 text-[13px] font-semibold text-white">
              Only {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left!
            </div>
          )}
          {spotsLeft <= 0 && (
            <div className="absolute left-4 top-4 rounded-full bg-[#0a2225]/80 px-4 py-2 text-[13px] font-semibold text-white">
              Sold Out
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {images.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                  activeImage === idx
                    ? "ring-2 ring-[#C7B892] ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`View ${idx + 1}`}
                  className="h-16 w-24 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trip Title & Info Bar */}
      <div className="mt-6">
        <h1 className="font-secondary text-2xl font-semibold text-[#0a2225] md:text-3xl lg:text-4xl">
          {trip.title}
        </h1>

        {/* Info Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-3 py-1.5 text-[13px] text-[#4a4a4a]">
            <MapPin className="h-4 w-4 text-[#818181]" />
            {trip.destination}
          </span>

          {formatDateRange() && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-3 py-1.5 text-[13px] text-[#4a4a4a]">
              <Calendar className="h-4 w-4 text-[#818181]" />
              {formatDateRange()}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-3 py-1.5 text-[13px] text-[#4a4a4a]">
            <Clock className="h-4 w-4 text-[#818181]" />
            {trip.duration_days} days{trip.duration_nights ? ` / ${trip.duration_nights} nights` : ""}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-3 py-1.5 text-[13px] text-[#4a4a4a]">
            <Users className="h-4 w-4 text-[#818181]" />
            Max {trip.max_participants} travelers
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C7B892]/15 px-3 py-1.5 text-[13px] font-medium text-[#7A7151]">
            {getDifficultyLabel(trip.difficulty_level)}
          </span>

          {trip.rating && trip.rating > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFC6] bg-white px-3 py-1.5 text-[13px] text-[#4a4a4a]">
              <Star className="h-4 w-4 fill-[#C7B892] text-[#C7B892]" />
              {trip.rating.toFixed(1)}
              {trip.review_count && <span className="text-[#818181]">({trip.review_count} reviews)</span>}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
