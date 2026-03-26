import { useNavigate } from "react-router-dom";
import { Bookmark, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryboardCard {
  id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  destination?: string | null;
  tags?: string[] | null;
  items_count?: number;
}

interface Props {
  storyboards: StoryboardCard[];
  displayName: string;
  creatorId: string;
  onRequestTrip: () => void;
}

export function CreatorStoryboardGrid({ storyboards, displayName, creatorId, onRequestTrip }: Props) {
  const navigate = useNavigate();

  const sectionTitle = `Travel Inspiration by ${displayName}`;

  // Empty state
  if (storyboards.length === 0) {
    return (
      <section>
        <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-6">
          {sectionTitle}
        </h2>
        <div className="rounded-xl border border-dashed border-[#E5DFC6] bg-white/60 p-10 text-center">
          <p className="font-secondary text-lg text-[#0a2225] mb-2">
            No storyboards yet
          </p>
          <p className="text-sm text-[#6B7280] mb-5 max-w-md mx-auto">
            {displayName} hasn't published any travel storyboards yet — but you can still start a custom trip.
          </p>
          <Button
            onClick={onRequestTrip}
            className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-6"
          >
            Get a custom itinerary
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-6">
        {sectionTitle}
      </h2>

      {/* Pinterest-style masonry */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {storyboards.map((sb, idx) => {
          // Vary aspect ratios for visual interest
          const aspectClass = idx % 3 === 0 ? "aspect-[3/4]" : idx % 3 === 1 ? "aspect-square" : "aspect-[4/5]";

          return (
            <div
              key={sb.id}
              className="break-inside-avoid rounded-xl overflow-hidden bg-white border border-[#E5DFC6] group cursor-pointer transition-all hover:shadow-lg hover:border-[#C7A962]/50"
              onClick={() => navigate(`/storyboards/${sb.id}`)}
            >
              {/* Image area */}
              <div className={`relative ${aspectClass} overflow-hidden bg-[#E5DFC6]`}>
                {sb.cover_image_url ? (
                  <img
                    src={sb.cover_image_url}
                    alt={sb.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#E5DFC6] to-[#C7A962]/20">
                    <MapPin className="h-8 w-8 text-[#C7A962]/60" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Bookmark icon — visible on hover */}
                <button
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: save/bookmark functionality
                  }}
                >
                  <Bookmark className="h-4 w-4" />
                </button>

                {/* Items count badge */}
                {sb.items_count != null && sb.items_count > 0 && (
                  <span className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                    {sb.items_count} items
                  </span>
                )}

                {/* Title overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-secondary text-base md:text-lg text-white leading-tight">
                    {sb.title}
                  </h3>
                  {sb.destination && (
                    <p className="text-white/70 text-xs mt-1">{sb.destination}</p>
                  )}
                </div>
              </div>

              {/* Hover CTA bar */}
              <div
                className="px-4 py-3 flex items-center justify-between bg-white border-t border-[#E5DFC6]/50 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/post-trip?fromCreator=${creatorId}&storyboard=${sb.id}${sb.destination ? `&destination=${encodeURIComponent(sb.destination)}` : ""}`);
                }}
              >
                <span className="text-xs font-medium text-[#0c4d47]">Plan a trip like this</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#0c4d47]" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
