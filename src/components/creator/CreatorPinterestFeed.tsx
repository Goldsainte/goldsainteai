import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_KEYWORDS } from "@/components/ui/CategoryChips";
import { RefinementChips } from "@/components/discovery/RefinementChips";
import { DiscoveryFeed } from "@/components/discovery/DiscoveryFeed";

export interface PinItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  storyboard_id: string;
  storyboard_title: string;
  storyboard_destination: string | null;
  owner_id?: string;
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
  const [refinementPath, setRefinementPath] = useState<string[]>([]);

  const activeCategory = refinementPath[0] || "All";

  const filteredItems = items.filter((item) => {
    if (activeBoard && item.storyboard_id !== activeBoard) return false;
    if (activeCategory !== "All") {
      const keywords = CATEGORY_KEYWORDS[activeCategory] || [];
      const haystack = [
        item.title,
        item.subtitle,
        item.storyboard_title,
        item.storyboard_destination,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!keywords.some((kw) => haystack.includes(kw))) return false;
    }
    return true;
  });

  function handleSetTopCategory(cat: string) {
    setRefinementPath([cat]);
  }

  function handleAddRefinement(term: string) {
    setRefinementPath((prev) => [...prev, term]);
  }

  function handlePopToIndex(index: number) {
    setRefinementPath((prev) => prev.slice(0, index));
  }

  function handleReset() {
    setRefinementPath([]);
  }

  function handleMoreLikeThis(tags: string[]) {
    setRefinementPath((prev) => {
      const combined = [...prev, ...tags.filter((t) => !prev.some((p) => p.toLowerCase() === t.toLowerCase()))];
      return combined.slice(0, 8);
    });
  }

  if (items.length === 0 && refinementPath.length === 0) {
    return (
      <div>
        <RefinementChips
          refinementPath={refinementPath}
          onSetTopCategory={handleSetTopCategory}
          onAddRefinement={handleAddRefinement}
          onPopToIndex={handlePopToIndex}
          onReset={handleReset}
          className="mb-2"
        />

        {refinementPath.length === 0 ? (
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
        ) : (
          <DiscoveryFeed
            refinementPath={refinementPath}
            onMoreLikeThis={handleMoreLikeThis}
            creatorId={creatorId}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Refinement discovery chips */}
      <RefinementChips
        refinementPath={refinementPath}
        onSetTopCategory={handleSetTopCategory}
        onAddRefinement={handleAddRefinement}
        onPopToIndex={handlePopToIndex}
        onReset={handleReset}
        className="mb-2"
      />

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

      {/* Discovery feed with creator pins mixed in */}
      <DiscoveryFeed
        refinementPath={refinementPath}
        creatorPins={filteredItems.map((item) => ({
          ...item,
          owner_id: creatorId,
        }))}
        onMoreLikeThis={handleMoreLikeThis}
        creatorId={creatorId}
      />
    </div>
  );
}
