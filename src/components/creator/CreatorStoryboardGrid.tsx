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
  hideTitle?: boolean;
}

export function CreatorStoryboardGrid({ storyboards, displayName, creatorId, onRequestTrip, hideTitle }: Props) {
  const navigate = useNavigate();

  const sectionTitle = `Travel Inspiration by ${displayName}`;

  if (storyboards.length === 0) {
    return (
      <section>
        {!hideTitle && (
          <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-6">
            {sectionTitle}
          </h2>
        )}
        <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white/60 p-12 text-center">
          <p className="font-secondary text-lg text-[#0a2225] mb-2">
            No storyboards yet
          </p>
          <p className="text-sm text-[#6B7280] mb-6 max-w-md mx-auto">
            {displayName} hasn't published any travel storyboards yet — but you can still start a custom trip.
          </p>
          <Button
            onClick={onRequestTrip}
            className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-8 h-11"
          >
            Get Custom Itinerary
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section>
      {!hideTitle && (
        <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-6">
          {sectionTitle}
        </h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {storyboards.map((sb, idx) => {
          const isLarge = idx === 0;
          const isMedium = idx === 1 || idx === 2;

          return (
            <div
              key={sb.id}
              className={`rounded-xl overflow-hidden bg-white border border-[#E5DFC6] group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-[#C7A962]/30 hover:-translate-y-0.5 relative ${
                isLarge ? "col-span-2 row-span-2" : ""
              }`}
              onClick={() => navigate(`/storyboards/${sb.id}`)}
            >
              {/* Gold accent strip */}
              <div className="h-[2px] bg-gradient-to-r from-[#C7A962]/60 via-[#C7A962] to-[#C7A962]/60" />

              <div className={`relative overflow-hidden bg-[#E5DFC6] ${
                isLarge ? "aspect-[4/3]" : isMedium ? "aspect-[3/4]" : "aspect-[4/5]"
              }`}>
                {sb.cover_image_url ? (
                  <img
                    src={sb.cover_image_url}
                    alt={sb.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#E5DFC6] to-[#C7A962]/20">
                    <MapPin className="h-8 w-8 text-[#C7A962]/60" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <button
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Bookmark className="h-4 w-4" />
                </button>

                {sb.items_count != null && sb.items_count > 0 && (
                  <span className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                    {sb.items_count} items
                  </span>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <h3 className={`font-secondary text-white leading-tight ${
                    isLarge ? "text-xl md:text-2xl" : "text-base md:text-lg"
                  }`}>
                    {sb.title}
                  </h3>
                  {sb.destination && (
                    <p className="text-white/70 text-xs mt-1">{sb.destination}</p>
                  )}
                  {isLarge && sb.description && (
                    <p className="text-white/60 text-xs mt-1.5 line-clamp-2">{sb.description}</p>
                  )}
                </div>
              </div>

              <div
                className="px-4 py-3 flex items-center justify-between bg-white border-t border-[#E5DFC6]/50 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/post-trip?fromCreator=${creatorId}&storyboard=${sb.id}${sb.destination ? `&destination=${encodeURIComponent(sb.destination)}` : ""}`);
                }}
              >
                <span className="text-xs font-primary font-medium text-[#0c4d47]">Plan a trip like this</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#C7A962]" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
