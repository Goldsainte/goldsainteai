import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryChips, SubcategoryChips, CATEGORY_KEYWORDS } from "@/components/ui/CategoryChips";
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
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [discoveryTags, setDiscoveryTags] = useState<string[]>([]);

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

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    setActiveSubcategory(null);
    setDiscoveryTags([]);
  }

  function handleSubcategoryChange(sub: string | null) {
    setActiveSubcategory(sub);
    setDiscoveryTags([]);
  }

  function handleMoreLikeThis(tags: string[]) {
    setDiscoveryTags((prev) => {
      const combined = [...new Set([...prev, ...tags])];
      return combined.slice(0, 6);
    });
  }

  if (items.length === 0 && activeCategory === "All") {
    return (
      <div>
        <CategoryChips
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          className="mb-2"
        />
        {activeCategory !== "All" && (
          <SubcategoryChips
            parentCategory={activeCategory}
            activeSubcategory={activeSubcategory}
            onSubcategoryChange={handleSubcategoryChange}
            className="mb-4"
          />
        )}

        {activeCategory === "All" ? (
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
            category={activeCategory}
            subcategory={activeSubcategory}
            tags={discoveryTags}
            onMoreLikeThis={handleMoreLikeThis}
            creatorId={creatorId}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Category discovery chips */}
      <CategoryChips
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        className="mb-2"
      />

      {/* Subcategory drill-down */}
      {activeCategory !== "All" && (
        <SubcategoryChips
          parentCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onSubcategoryChange={handleSubcategoryChange}
          className="mb-4"
        />
      )}

      {/* Active refinement tags */}
      {discoveryTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {discoveryTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0a2225]/5 text-[#0a2225] text-xs font-medium"
            >
              {tag}
              <button
                onClick={() => setDiscoveryTags((t) => t.filter((x) => x !== tag))}
                className="ml-0.5 opacity-50 hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

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
        category={activeCategory}
        subcategory={activeSubcategory}
        tags={discoveryTags}
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
