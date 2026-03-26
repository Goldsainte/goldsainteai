import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Bucket List",
  "Luxury Escapes",
  "Food & Culture",
  "Wellness & Reset",
  "Group Trips",
  "Romantic Getaways",
  "Solo Travel",
  "Cinematic Destinations",
  "City Energy",
  "Nature & Adventure",
] as const;

export type TravelCategory = (typeof CATEGORIES)[number];

interface CategoryChipsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function CategoryChips({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryChipsProps) {
  return (
    <div
      className={cn(
        "flex overflow-x-auto scrollbar-hide gap-2.5 py-3 -mx-4 px-4 scroll-smooth",
        className
      )}
    >
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat === "All" ? "All" : cat)}
          className={cn(
            "whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-200 ease-out shrink-0",
            activeCategory === cat
              ? "bg-[#C7A962] text-white shadow-sm scale-[1.02]"
              : "bg-[#f7f3ea] text-[#6B7280] hover:bg-[#efeadf] hover:text-[#0a2225] hover:shadow-sm hover:-translate-y-px"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// Keyword map for filtering content against categories
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Bucket List": ["bucket list", "once in a lifetime", "dream", "iconic", "wonder"],
  "Luxury Escapes": ["luxury", "high-end", "premium", "five star", "5-star", "exclusive", "villa"],
  "Food & Culture": ["food", "culinary", "culture", "gastronomy", "cuisine", "dining", "art", "museum", "heritage"],
  "Wellness & Reset": ["wellness", "spa", "retreat", "yoga", "meditation", "detox", "reset", "mindful"],
  "Group Trips": ["group", "friends", "squad", "crew", "team", "party"],
  "Romantic Getaways": ["romantic", "honeymoon", "couples", "romance", "valentine", "anniversary", "intimate"],
  "Solo Travel": ["solo", "alone", "independent", "backpack"],
  "Cinematic Destinations": ["cinematic", "film", "movie", "scenic", "photogenic", "instagram", "views", "dramatic"],
  "City Energy": ["city", "urban", "nightlife", "downtown", "metropolitan", "cosmopolitan"],
  "Nature & Adventure": ["nature", "adventure", "hiking", "trek", "safari", "mountain", "jungle", "wildlife", "outdoor", "camping"],
};
