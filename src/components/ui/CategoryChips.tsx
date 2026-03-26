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

export const SUBCATEGORIES: Record<string, string[]> = {
  "Bucket List": ["Wonders of the World", "Northern Lights", "Great Barrier Reef", "Machu Picchu", "African Safari", "Antarctic Expedition"],
  "Luxury Escapes": ["Beach Villas", "Private Islands", "Safari Lodges", "Desert Resorts", "Yacht Travel", "Spa Retreats", "City Luxury"],
  "Food & Culture": ["Street Food", "Fine Dining", "Wine Regions", "Local Markets", "Cooking Classes", "Cultural Hotels"],
  "Wellness & Reset": ["Yoga Retreats", "Detox Resorts", "Meditation Centers", "Hot Springs", "Forest Bathing", "Digital Detox"],
  "Group Trips": ["Festival Travel", "Bachelor/Bachelorette", "Family Reunion", "Friends Getaway", "Team Retreat"],
  "Romantic Getaways": ["Honeymoon", "Overwater Villas", "Sunset Dinners", "Couples Spa", "Private Excursions"],
  "Solo Travel": ["Backpacking", "Spiritual Journey", "City Solo", "Hostel Culture", "Volunteer Travel"],
  "Cinematic Destinations": ["Film Locations", "Dramatic Landscapes", "Golden Hour Spots", "Aerial Views", "Hidden Gems"],
  "City Energy": ["Nightlife", "Rooftop Bars", "Street Art", "Shopping Districts", "Live Music", "Architecture"],
  "Nature & Adventure": ["Hiking Trails", "Jungle Treks", "Mountain Peaks", "Diving & Snorkeling", "Camping", "Wildlife Safari"],
};

// Maps subcategory to Unsplash search terms
export const SUBCATEGORY_SEARCH_TERMS: Record<string, string> = {
  "Beach Villas": "luxury beach villa resort",
  "Private Islands": "private island tropical",
  "Safari Lodges": "luxury safari lodge africa",
  "Desert Resorts": "desert resort luxury",
  "Yacht Travel": "luxury yacht travel ocean",
  "Spa Retreats": "luxury spa retreat",
  "City Luxury": "luxury hotel city penthouse",
  "Street Food": "street food market travel",
  "Fine Dining": "fine dining restaurant luxury",
  "Wine Regions": "wine vineyard travel",
  "Local Markets": "local market travel culture",
  "Cooking Classes": "cooking class travel culinary",
  "Cultural Hotels": "boutique cultural hotel",
  "Yoga Retreats": "yoga retreat tropical",
  "Detox Resorts": "wellness detox resort",
  "Meditation Centers": "meditation retreat peaceful",
  "Hot Springs": "natural hot springs travel",
  "Forest Bathing": "forest nature therapy",
  "Digital Detox": "remote cabin nature escape",
  "Honeymoon": "romantic honeymoon tropical",
  "Overwater Villas": "overwater villa maldives",
  "Sunset Dinners": "romantic sunset dinner beach",
  "Couples Spa": "couples spa luxury retreat",
  "Private Excursions": "private excursion romantic",
  "Festival Travel": "music festival travel",
  "Bachelor/Bachelorette": "bachelor party travel",
  "Family Reunion": "family travel group",
  "Friends Getaway": "friends trip travel group",
  "Team Retreat": "team retreat travel",
  "Backpacking": "backpacking solo travel",
  "Spiritual Journey": "spiritual travel temple",
  "City Solo": "solo city travel explore",
  "Hostel Culture": "hostel travel social",
  "Volunteer Travel": "volunteer travel community",
  "Wonders of the World": "world wonder iconic landmark",
  "Northern Lights": "northern lights aurora travel",
  "Great Barrier Reef": "great barrier reef snorkeling",
  "Machu Picchu": "machu picchu peru travel",
  "African Safari": "african safari wildlife",
  "Antarctic Expedition": "antarctica expedition travel",
  "Film Locations": "movie film location travel",
  "Dramatic Landscapes": "dramatic landscape cinematic",
  "Golden Hour Spots": "golden hour photography travel",
  "Aerial Views": "aerial view travel drone",
  "Hidden Gems": "hidden gem travel secret",
  "Nightlife": "nightlife city travel",
  "Rooftop Bars": "rooftop bar city view",
  "Street Art": "street art urban travel",
  "Shopping Districts": "luxury shopping district travel",
  "Live Music": "live music venue travel",
  "Architecture": "architecture travel iconic building",
  "Hiking Trails": "hiking trail mountain travel",
  "Jungle Treks": "jungle trek rainforest",
  "Mountain Peaks": "mountain peak summit travel",
  "Diving & Snorkeling": "diving snorkeling ocean travel",
  "Camping": "camping nature outdoor travel",
  "Wildlife Safari": "wildlife safari animals",
};

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

interface SubcategoryChipsProps {
  parentCategory: string;
  activeSubcategory: string | null;
  onSubcategoryChange: (sub: string | null) => void;
  className?: string;
}

export function SubcategoryChips({
  parentCategory,
  activeSubcategory,
  onSubcategoryChange,
  className,
}: SubcategoryChipsProps) {
  const subs = SUBCATEGORIES[parentCategory];
  if (!subs || subs.length === 0) return null;

  return (
    <div
      className={cn(
        "flex overflow-x-auto scrollbar-hide gap-2 py-2 -mx-4 px-4 scroll-smooth",
        className
      )}
    >
      <button
        onClick={() => onSubcategoryChange(null)}
        className={cn(
          "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ease-out shrink-0",
          activeSubcategory === null
            ? "bg-[#0a2225] text-white shadow-sm"
            : "bg-white border border-[#E5DFC6] text-[#6B7280] hover:border-[#C7A962] hover:text-[#0a2225]"
        )}
      >
        All {parentCategory}
      </button>
      {subs.map((sub) => (
        <button
          key={sub}
          onClick={() => onSubcategoryChange(sub)}
          className={cn(
            "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ease-out shrink-0",
            activeSubcategory === sub
              ? "bg-[#0a2225] text-white shadow-sm"
              : "bg-white border border-[#E5DFC6] text-[#6B7280] hover:border-[#C7A962] hover:text-[#0a2225]"
          )}
        >
          {sub}
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
