import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PinItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  storyboard_id: string;
  storyboard_title: string;
  storyboard_destination: string | null;
}

export interface BoardSummary {
  id: string;
  title: string;
  destination: string | null;
  is_public: boolean;
}

interface Props {
  items: PinItem[];
  storyboards: BoardSummary[];
  creatorId: string;
  isOwnProfile?: boolean;
  onCreateNew?: () => void;
  onDeleteItem?: (itemId: string) => void;
}

export function CreatorPinterestFeed({
  items,
  storyboards,
  creatorId,
  isOwnProfile,
  onCreateNew,
  onDeleteItem,
}: Props) {
  const navigate = useNavigate();
  const [activeBoard, setActiveBoard] = useState<string | null>(null);

  const filteredItems = activeBoard
    ? items.filter((i) => i.storyboard_id === activeBoard)
    : items;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white/60 p-12 text-center">
        <p className="font-secondary text-lg text-[#0a2225] mb-2">
          {isOwnProfile ? "Create your first storyboard" : "No inspiration yet"}
        </p>
        <p className="text-sm text-[#6B7280] mb-6 max-w-md mx-auto">
          {isOwnProfile
            ? "Pin photos, places, and experiences to build visual travel collections that inspire your audience."
            : "This creator hasn't published any travel pins yet — check back soon."}
        </p>
        {isOwnProfile && onCreateNew && (
          <Button
            onClick={onCreateNew}
            className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white rounded-full px-8 h-11"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Storyboard
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Board filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveBoard(null)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
            activeBoard === null
              ? "bg-[#C7A962] text-white shadow-sm"
              : "bg-white border border-[#E5DFC6] text-[#6B7280] hover:border-[#C7A962] hover:text-[#0a2225]"
          }`}
        >
          All
        </button>
        {storyboards.map((sb) => (
          <button
            key={sb.id}
            onClick={() => setActiveBoard(sb.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
              activeBoard === sb.id
                ? "bg-[#C7A962] text-white shadow-sm"
                : "bg-white border border-[#E5DFC6] text-[#6B7280] hover:border-[#C7A962] hover:text-[#0a2225]"
            }`}
          >
            {sb.title}
            {isOwnProfile && !sb.is_public && (
              <span className="ml-1 opacity-60">· Draft</span>
            )}
          </button>
        ))}
        {isOwnProfile && onCreateNew && (
          <button
            onClick={onCreateNew}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed border-[#E5DFC6] text-[#C7A962] hover:border-[#C7A962] transition-all flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            New Board
          </button>
        )}
      </div>

      {/* Masonry grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="break-inside-avoid mb-4 group relative cursor-pointer"
            onClick={() => navigate(`/storyboards/${item.storyboard_id}`)}
          >
            <img
              src={item.image_url}
              alt={item.title || "Travel inspiration"}
              className="w-full rounded-2xl object-cover"
              loading="lazy"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-between p-4">
              <div className="flex justify-between items-start">
                <span className="text-white/70 text-[10px] uppercase tracking-wider font-medium flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {item.storyboard_destination || item.storyboard_title}
                </span>
                {isOwnProfile && onDeleteItem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>

              <div>
                {item.title && (
                  <p className="font-secondary text-white text-base leading-snug mb-1">
                    {item.title}
                  </p>
                )}
                {item.subtitle && (
                  <p className="text-white/70 text-xs line-clamp-2 mb-3">
                    {item.subtitle}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/post-trip?fromCreator=${creatorId}&storyboard=${item.storyboard_id}${
                        item.storyboard_destination
                          ? `&destination=${encodeURIComponent(item.storyboard_destination)}`
                          : ""
                      }`
                    );
                  }}
                  className="inline-flex items-center gap-1.5 text-white text-xs font-medium bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/30 transition-colors"
                >
                  Plan a trip like this
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
