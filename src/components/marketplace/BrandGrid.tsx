import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { BrandSummary, BrandCard } from "./BrandCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BrandGridProps {
  brands: BrandSummary[];
}

// Brand type options matching the application form
const BRAND_TYPE_OPTIONS = [
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
  { value: "villa_home", label: "Villa / Home" },
  { value: "boutique_stay", label: "Boutique Stay" },
  { value: "restaurant_bar", label: "Restaurant / Bar" },
  { value: "experience_brand", label: "Experience Brand" },
  { value: "retail_design_brand", label: "Retail / Design Brand" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

export function BrandGrid({ brands }: BrandGridProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [brandTypeFilters, setBrandTypeFilters] = useState<string[]>([]);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => (b.categories ?? []).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [brands]);

  const allRegions = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => (b.regions ?? []).forEach((r) => set.add(r)));
    return Array.from(set).sort();
  }, [brands]);

  const filtered = useMemo(
    () =>
      brands.filter((b) => {
        const text = `${b.name} ${b.bio ?? ""}`.toLowerCase();
        if (search && !text.includes(search.toLowerCase())) return false;

        if (categoryFilter) {
          const cats = (b.categories ?? []).map((c) => c.toLowerCase());
          if (!cats.includes(categoryFilter.toLowerCase())) return false;
        }

        if (regionFilter) {
          const regions = (b.regions ?? []).map((r) => r.toLowerCase());
          if (!regions.includes(regionFilter.toLowerCase())) return false;
        }

        // Brand type filter (multi-select)
        if (brandTypeFilters.length > 0) {
          const brandType = b.brand_type?.toLowerCase() ?? "";
          if (!brandTypeFilters.some((f) => f.toLowerCase() === brandType)) {
            return false;
          }
        }

        return true;
      }),
    [brands, search, categoryFilter, regionFilter, brandTypeFilters]
  );

  // Track brand discovery - fire once per session when brands are first shown
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current || filtered.length === 0) return;
    hasTrackedRef.current = true;

    // Log first 20 visible brands as "discovered"
    // Session-level deduplication prevents duplicate tracking on page reloads
    filtered.slice(0, 20).forEach((b) => {
      void supabase.rpc("log_brand_engagement", {
        p_brand_profile_id: b.profile_id,
        p_event_type: "discovered",
        p_context_type: "marketplace",
        p_context_id: null,
        p_metadata: {},
      });
    });
  }, [filtered]);

  const toggleBrandType = (type: string) => {
    setBrandTypeFilters((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setSearch("");
    setCategoryFilter(null);
    setRegionFilter(null);
    setBrandTypeFilters([]);
  };

  const hasActiveFilters = categoryFilter || regionFilter || search || brandTypeFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search and dropdowns row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search brands by name or style…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xs rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-sm text-[#0a2225] placeholder:text-[#b3a98a] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
            />

            {/* Category filter */}
            {allCategories.length > 0 && (
              <select
                value={categoryFilter ?? ""}
                onChange={(e) =>
                  setCategoryFilter(e.target.value || null)
                }
                className="h-9 rounded-full border border-[#E5DFC6] bg-white px-3 text-xs text-[#0a2225] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
              >
                <option value="">All categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Region filter */}
            {allRegions.length > 0 && (
              <select
                value={regionFilter ?? ""}
                onChange={(e) =>
                  setRegionFilter(e.target.value || null)
                }
                className="h-9 rounded-full border border-[#E5DFC6] bg-white px-3 text-xs text-[#0a2225] focus:outline-none focus:ring-1 focus:ring-[#BFAD72]"
              >
                <option value="">All regions</option>
                {allRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="self-start rounded-full border border-[#E5DFC6] px-3 py-1 text-[11px] uppercase tracking-wide text-[#7A7151] hover:bg-[#F5F0E0] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Brand Type Accordion Filter */}
        <div className="rounded-2xl border border-[#E5DFC6] bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#F5F0E0]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#7A7151]" />
              <span className="text-sm font-medium text-[#0a2225]">
                Filter by Brand Type
              </span>
              {brandTypeFilters.length > 0 && (
                <span className="rounded-full bg-[#0a2225] px-2 py-0.5 text-[10px] font-semibold text-white">
                  {brandTypeFilters.length}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[#7A7151] transition-transform duration-200",
                isTypeFilterOpen && "rotate-180"
              )}
            />
          </button>

          {isTypeFilterOpen && (
            <div className="border-t border-[#E5DFC6] px-4 py-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {BRAND_TYPE_OPTIONS.map((option) => {
                  const isSelected = brandTypeFilters.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all",
                        isSelected
                          ? "border-[#0a2225] bg-[#0a2225] text-white"
                          : "border-[#E5DFC6] bg-white text-[#4a4a4a] hover:border-[#BFAD72] hover:bg-[#F5F0E0]"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBrandType(option.value)}
                        className="sr-only"
                      />
                      <span className="truncate">{option.label}</span>
                    </label>
                  );
                })}
              </div>
              {brandTypeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBrandTypeFilters([])}
                  className="mt-3 text-xs text-[#7A7151] hover:text-[#0a2225] underline"
                >
                  Clear type filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[#4a4a4a]">
          No brands match these filters yet. Try adjusting your search or filters.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((brand) => (
            <BrandCard key={brand.profile_id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
