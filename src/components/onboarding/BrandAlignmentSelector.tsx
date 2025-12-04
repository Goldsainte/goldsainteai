import { LuxurySelectionCard } from "./LuxurySelectionCard";
import { Label } from "@/components/ui/label";
import { Building2, Star, Sparkles, Leaf, Crown, Gem } from "lucide-react";

const BRAND_TIERS = [
  { value: "ultra_luxury", label: "Ultra-Luxury", description: "Aman, Four Seasons, Rosewood", icon: Crown },
  { value: "luxury", label: "Luxury", description: "Ritz-Carlton, St. Regis, Mandarin Oriental", icon: Gem },
  { value: "premium", label: "Premium", description: "Hyatt, Marriott, Hilton flagship properties", icon: Star },
  { value: "boutique", label: "Boutique", description: "Design hotels, independent properties", icon: Sparkles },
  { value: "eco_luxury", label: "Eco-Luxury", description: "Sustainable luxury, eco-lodges", icon: Leaf },
];

const HOTEL_BRANDS = [
  "Aman Resorts", "Four Seasons", "Rosewood", "One&Only",
  "Ritz-Carlton", "St. Regis", "Mandarin Oriental", "Peninsula",
  "Park Hyatt", "Waldorf Astoria", "Edition", "Six Senses",
  "Belmond", "Oetker Collection", "Rocco Forte", "Firmdale",
];

const AESTHETIC_STYLES = [
  { value: "minimalist", label: "Minimalist & Modern", description: "Clean lines, understated elegance" },
  { value: "maximalist", label: "Maximalist & Bold", description: "Rich colors, eclectic patterns" },
  { value: "heritage", label: "Heritage & Classic", description: "Traditional luxury, timeless design" },
  { value: "organic", label: "Organic & Natural", description: "Earthy tones, natural materials" },
  { value: "avant_garde", label: "Avant-Garde", description: "Cutting-edge, artistic spaces" },
  { value: "coastal", label: "Coastal & Relaxed", description: "Beachy, breezy, laid-back luxury" },
];

interface BrandAlignmentSelectorProps {
  selectedTiers: string[];
  onTiersChange: (tiers: string[]) => void;
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  selectedAesthetics: string[];
  onAestheticsChange: (aesthetics: string[]) => void;
}

export function BrandAlignmentSelector({
  selectedTiers,
  onTiersChange,
  selectedBrands,
  onBrandsChange,
  selectedAesthetics,
  onAestheticsChange,
}: BrandAlignmentSelectorProps) {
  const toggleTier = (value: string) => {
    onTiersChange(
      selectedTiers.includes(value)
        ? selectedTiers.filter((t) => t !== value)
        : [...selectedTiers, value]
    );
  };

  const toggleBrand = (brand: string) => {
    onBrandsChange(
      selectedBrands.includes(brand)
        ? selectedBrands.filter((b) => b !== brand)
        : [...selectedBrands, brand]
    );
  };

  const toggleAesthetic = (value: string) => {
    onAestheticsChange(
      selectedAesthetics.includes(value)
        ? selectedAesthetics.filter((a) => a !== value)
        : [...selectedAesthetics, value]
    );
  };

  return (
    <div className="space-y-8">
      {/* Brand Tiers */}
      <div>
        <Label className="text-[#0a2225] font-medium mb-3 block">
          Brand Tier Preferences <span className="text-[#6B7280] font-normal">(select all that apply)</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BRAND_TIERS.map((tier) => (
            <LuxurySelectionCard
              key={tier.value}
              label={tier.label}
              description={tier.description}
              icon={tier.icon}
              selected={selectedTiers.includes(tier.value)}
              onSelect={() => toggleTier(tier.value)}
            />
          ))}
        </div>
      </div>

      {/* Hotel Brands */}
      <div>
        <Label className="text-[#0a2225] font-medium mb-3 block">
          Preferred Hotel Brands <span className="text-[#6B7280] font-normal">(optional)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {HOTEL_BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => toggleBrand(brand)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedBrands.includes(brand)
                  ? "bg-[#C7A962] text-white"
                  : "bg-[#FDF9F0] text-[#0a2225] border border-[#E5DFC6] hover:border-[#C7A962]"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Aesthetic Alignment */}
      <div>
        <Label className="text-[#0a2225] font-medium mb-3 block">
          Your Aesthetic Style <span className="text-[#6B7280] font-normal">(how your content feels)</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AESTHETIC_STYLES.map((style) => (
            <LuxurySelectionCard
              key={style.value}
              label={style.label}
              description={style.description}
              selected={selectedAesthetics.includes(style.value)}
              onSelect={() => toggleAesthetic(style.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
