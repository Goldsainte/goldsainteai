import { useNavigate } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryboardCard {
  id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  destination?: string | null;
  tags?: string[] | null;
  items_count?: number;
  item_images?: string[];
}

interface Props {
  storyboards: StoryboardCard[];
  displayName: string;
  creatorId: string;
  onRequestTrip: () => void;
  hideTitle?: boolean;
}

function BoardCollage({ coverImage, itemImages }: { coverImage?: string | null; itemImages?: string[] }) {
  const images = itemImages?.length ? itemImages : [];
  const hasCollage = coverImage && images.length >= 2;

  if (hasCollage) {
    return (
      <div className="grid grid-cols-3 gap-[2px] aspect-[4/5] overflow-hidden rounded-t-2xl bg-[#E5DFC6]">
        <div className="col-span-2 row-span-2 overflow-hidden">
          <img src={coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="overflow-hidden">
          <img src={images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="overflow-hidden">
          <img src={images[1]} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      </div>
    );
  }

  // Single image fallback
  return (
    <div className="aspect-[4/5] overflow-hidden rounded-t-2xl bg-[#E5DFC6]">
      {coverImage ? (
        <img src={coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#E5DFC6] to-[#C7A962]/20">
          <MapPin className="h-8 w-8 text-[#C7A962]/60" />
        </div>
      )}
    </div>
  );
}

export function CreatorStoryboardGrid({ storyboards, displayName, creatorId, onRequestTrip, hideTitle }: Props) {
  const navigate = useNavigate();

  if (storyboards.length === 0) {
    return (
      <section>
        {!hideTitle && (
          <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-6">
            Travel Inspiration by {displayName}
          </h2>
        )}
        <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white/60 p-12 text-center">
          <p className="font-secondary text-lg text-[#0a2225] mb-2">No storyboards yet</p>
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
          Travel Inspiration by {displayName}
        </h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {storyboards.map((sb) => (
          <div
            key={sb.id}
            className="rounded-2xl overflow-hidden bg-white border border-[#E5DFC6] group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            onClick={() => navigate(`/storyboards/${sb.id}`)}
          >
            <BoardCollage coverImage={sb.cover_image_url} itemImages={sb.item_images} />

            {/* Board metadata */}
            <div className="p-4">
              <h3 className="font-secondary text-base md:text-lg text-[#0a2225] leading-snug line-clamp-2">
                {sb.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-[#6B7280]">
                {sb.items_count != null && sb.items_count > 0 && (
                  <span>{sb.items_count} pins</span>
                )}
                {sb.destination && (
                  <>
                    {sb.items_count != null && sb.items_count > 0 && <span>·</span>}
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {sb.destination}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Hover CTA */}
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
        ))}
      </div>
    </section>
  );
}
