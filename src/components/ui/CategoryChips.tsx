import { useRef, useState, useEffect } from "react";
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

// Deep refinement suggestions keyed by subcategory
export const DEEP_REFINEMENTS: Record<string, string[]> = {
  "Beach Villas": ["Maldives", "Bali", "Amalfi Coast", "Caribbean", "Sunset", "Overwater", "Private Pool"],
  "Private Islands": ["Fiji", "Seychelles", "Caribbean", "Tropical", "Barefoot Luxury"],
  "Safari Lodges": ["Kenya", "Tanzania", "Botswana", "Big Five", "Bush Camp", "Sunset"],
  "Desert Resorts": ["Dubai", "Sahara", "Atacama", "Wadi Rum", "Stargazing", "Oasis"],
  "Yacht Travel": ["Mediterranean", "Greek Islands", "Caribbean", "Sunset Cruise", "Catamaran"],
  "Spa Retreats": ["Bali", "Thailand", "Swiss Alps", "Hot Stone", "Infinity Pool"],
  "City Luxury": ["Paris", "Dubai", "Tokyo", "New York", "Penthouse", "Rooftop"],
  "Street Food": ["Bangkok", "Tokyo", "Mexico City", "Istanbul", "Night Market", "Hawker"],
  "Fine Dining": ["Paris", "Tokyo", "Copenhagen", "Michelin Star", "Tasting Menu"],
  "Wine Regions": ["Tuscany", "Napa Valley", "Bordeaux", "Mendoza", "Vineyard Tour"],
  "Local Markets": ["Marrakech", "Istanbul", "Bangkok", "Oaxaca", "Spice Market"],
  "Cooking Classes": ["Italy", "Thailand", "Japan", "Peru", "Farm to Table"],
  "Cultural Hotels": ["Kyoto", "Rajasthan", "Havana", "Fez", "Heritage"],
  "Yoga Retreats": ["Bali", "India", "Costa Rica", "Sunrise", "Beachfront"],
  "Detox Resorts": ["Thailand", "Bali", "Austria", "Juice Cleanse", "Digital Free"],
  "Meditation Centers": ["Tibet", "Japan", "India", "Silent Retreat", "Mountain"],
  "Hot Springs": ["Iceland", "Japan", "New Zealand", "Volcanic", "Natural Pool"],
  "Forest Bathing": ["Japan", "Scandinavia", "Pacific Northwest", "Redwood", "Misty"],
  "Digital Detox": ["Remote Island", "Mountain Cabin", "Treehouse", "Off Grid"],
  "Honeymoon": ["Maldives", "Santorini", "Bora Bora", "Tuscany", "Sunset", "Private"],
  "Overwater Villas": ["Maldives", "Tahiti", "Bora Bora", "Fiji", "Glass Floor"],
  "Sunset Dinners": ["Santorini", "Amalfi", "Bali", "Maldives", "Cliffside"],
  "Couples Spa": ["Bali", "Maldives", "Swiss Alps", "Candlelit", "Outdoor"],
  "Private Excursions": ["Yacht Charter", "Helicopter", "Wine Tour", "Island Hop"],
  "Festival Travel": ["Coachella", "Tomorrowland", "Rio Carnival", "Holi", "Burning Man"],
  "Bachelor/Bachelorette": ["Las Vegas", "Ibiza", "Miami", "Cancun", "Yacht Party"],
  "Family Reunion": ["Beach Resort", "Mountain Lodge", "Villa Rental", "All Inclusive"],
  "Friends Getaway": ["Road Trip", "Beach House", "Ski Lodge", "City Break"],
  "Team Retreat": ["Countryside", "Mountain", "Coastal", "Workshop Space"],
  "Backpacking": ["Southeast Asia", "South America", "Europe", "Budget", "Hostel"],
  "Spiritual Journey": ["India", "Nepal", "Bali", "Camino de Santiago", "Temple"],
  "City Solo": ["Tokyo", "Lisbon", "Copenhagen", "Melbourne", "Café Culture"],
  "Hostel Culture": ["Berlin", "Bangkok", "Barcelona", "Social", "Rooftop"],
  "Volunteer Travel": ["Africa", "Southeast Asia", "Central America", "Conservation"],
  "Wonders of the World": ["Petra", "Taj Mahal", "Colosseum", "Chichen Itza", "Christ the Redeemer"],
  "Northern Lights": ["Iceland", "Norway", "Finland", "Lapland", "Glass Igloo"],
  "Great Barrier Reef": ["Snorkeling", "Diving", "Coral", "Marine Life", "Boat Tour"],
  "Machu Picchu": ["Inca Trail", "Sacred Valley", "Cusco", "Sunrise", "Llamas"],
  "African Safari": ["Serengeti", "Masai Mara", "Kruger", "Big Five", "Migration"],
  "Antarctic Expedition": ["Penguin Colony", "Iceberg", "Drake Passage", "Research Station"],
  "Film Locations": ["New Zealand", "Iceland", "Croatia", "Morocco", "Scotland"],
  "Dramatic Landscapes": ["Patagonia", "Iceland", "Norway Fjords", "Grand Canyon", "Dolomites"],
  "Golden Hour Spots": ["Santorini", "Bagan", "Angkor Wat", "Sahara", "Cappadocia"],
  "Aerial Views": ["Drone", "Helicopter", "Hot Air Balloon", "Cliffside", "Panoramic"],
  "Hidden Gems": ["Faroe Islands", "Azores", "Slovenia", "Georgia", "Oman"],
  "Nightlife": ["Berlin", "Tokyo", "Ibiza", "New York", "Bangkok"],
  "Rooftop Bars": ["Bangkok", "New York", "Singapore", "Barcelona", "Skyline"],
  "Street Art": ["Berlin", "Melbourne", "Lisbon", "Bogotá", "Bushwick"],
  "Shopping Districts": ["Paris", "Milan", "Tokyo", "Dubai", "London"],
  "Live Music": ["Nashville", "Havana", "New Orleans", "Austin", "Jazz"],
  "Architecture": ["Barcelona", "Dubai", "Chicago", "Tokyo", "Brutalist"],
  "Hiking Trails": ["Patagonia", "Dolomites", "Appalachian", "Camino", "Alpine"],
  "Jungle Treks": ["Borneo", "Amazon", "Costa Rica", "Congo", "Canopy Walk"],
  "Mountain Peaks": ["Himalayas", "Alps", "Andes", "Kilimanjaro", "Summit"],
  "Diving & Snorkeling": ["Maldives", "Red Sea", "Cenotes", "Palau", "Wreck Dive"],
  "Camping": ["Yosemite", "Patagonia", "Outback", "Glamping", "Stargazing"],
  "Wildlife Safari": ["Galápagos", "Borneo", "Madagascar", "Costa Rica", "Whale Watching"],
};

// Generic mood/style refinements for depth 2+
export const MOOD_REFINEMENTS = [
  "Golden Hour", "Secluded", "Romantic", "Aerial View", "Vibrant",
  "Minimalist", "Dramatic", "Cozy", "Wild", "Serene",
  "Misty", "Tropical", "Rustic", "Modern", "Ancient",
];

/**
 * Returns contextual refinement suggestions based on the current path.
 * Level 0 (just top category) → subcategories
 * Level 1 (subcategory selected) → deep refinements for that subcategory
 * Level 2+ → mood/style pills filtered to exclude already-selected terms
 */
export function getRefinementSuggestions(path: string[]): string[] {
  if (path.length === 0) return [];

  const topCategory = path[0];
  // Level 0: show subcategories
  if (path.length === 1) {
    return SUBCATEGORIES[topCategory] || [];
  }

  const lastStep = path[path.length - 1];
  const selectedSet = new Set(path.map((p) => p.toLowerCase()));

  // Level 1: show deep refinements for the subcategory
  if (path.length === 2) {
    const deep = DEEP_REFINEMENTS[lastStep] || DEEP_REFINEMENTS[path[1]] || [];
    const filtered = deep.filter((r) => !selectedSet.has(r.toLowerCase()));
    if (filtered.length > 0) return filtered;
  }

  // Level 2+: show mood refinements + remaining deep refinements
  const subcategory = path[1];
  const deepPool = DEEP_REFINEMENTS[subcategory] || [];
  const combined = [...deepPool, ...MOOD_REFINEMENTS];
  return combined.filter((r) => !selectedSet.has(r.toLowerCase())).slice(0, 10);
}

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = dragScrollLeft.current - (x - dragStartX.current);
  };

  const stopDrag = () => {
    if (!scrollRef.current) return;
    isDragging.current = false;
    scrollRef.current.style.cursor = "";
    scrollRef.current.style.userSelect = "";
  };

  return (
    <div className={cn("relative -mx-4", className)}>
      {/* Left fade */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 h-full w-10 z-10 transition-opacity duration-200",
          "bg-gradient-to-r from-[#FDF9F0] to-transparent",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Right fade */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 h-full w-14 z-10 transition-opacity duration-200",
          "bg-gradient-to-l from-[#FDF9F0] to-transparent",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide gap-2.5 py-3 px-4 scroll-smooth select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
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
          "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium tracking-wide transition-all duration-200 ease-out shrink-0",
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
            "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium tracking-wide transition-all duration-200 ease-out shrink-0",
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
