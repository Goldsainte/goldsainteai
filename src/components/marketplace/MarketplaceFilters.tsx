import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import type { SearchFilters } from "@/pages/Marketplace";

interface MarketplaceFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  /** Quick destination chips derived from live inventory — never hardcoded. */
  destinationOptions?: string[];
}

/* Every control here filters on a REAL column (destination, duration_days,
   price, created_at, view_count/rating). The previous version showed twelve
   aspirational category chips wired to a tags column nothing ever writes,
   so picking one silently zeroed the results — the exact opposite of a
   trustworthy filter system. */
export function MarketplaceFilters({ filters, onFilterChange, destinationOptions = [] }: MarketplaceFiltersProps) {
  const [open, setOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 10000,
  ]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    // "click", not "mousedown": closing on mousedown re-renders the page
    // between a user's mousedown and mouseup, which swallows their click on
    // whatever they were actually trying to press (e.g. a removable chip).
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const sortOptions: { value: NonNullable<SearchFilters["sortBy"]>; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "top-rated", label: "Most popular" },
    { value: "price-low", label: "Price: Low" },
    { value: "price-high", label: "Price: High" },
  ];
  const activeSort = filters.sortBy ?? "newest";

  const durationOptions: { value: NonNullable<SearchFilters["durationBucket"]>; label: string }[] = [
    { value: "1-3", label: "1–3 days" },
    { value: "4-6", label: "4–6 days" },
    { value: "7+", label: "7+ days" },
  ];

  const priceActive = (filters.minPrice ?? 0) > 0 || (filters.maxPrice ?? 10000) < 10000;
  const activeCount =
    (filters.durationBucket ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (filters.destination ? 1 : 0);

  const chipClass = (isActive: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      isActive
        ? "bg-[#0c4d47] text-white"
        : "border border-[#E5DFC6] bg-white text-[#4a4a4a] hover:bg-[#FBF9F0]"
    }`;

  const clearAll = () => {
    setPriceRange([0, 10000]);
    onFilterChange({
      ...filters,
      destination: "",
      durationBucket: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: undefined,
    });
  };

  return (
    <div className="w-full md:w-auto relative" ref={wrapperRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between gap-2 w-full rounded-full border border-[#E5DFC6] bg-white px-4 py-3 text-sm font-medium text-[#0a2225] hover:bg-[#FBF9F0] transition-colors ${open ? "bg-[#FBF9F0]" : ""}`}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#BFAD72]" />
          <span className="font-secondary">Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#BFAD72] text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Floating panel */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[340px] rounded-2xl border border-[#E5DFC6] bg-white shadow-lg px-5 py-5 space-y-4">
          {/* Destinations — from real inventory */}
          {destinationOptions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">
                Destinations
              </p>
              <div className="flex flex-wrap gap-2">
                {destinationOptions.map((city) => {
                  const isActive = (filters.destination || "").toLowerCase() === city.toLowerCase();
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() =>
                        onFilterChange({ ...filters, destination: isActive ? "" : city })
                      }
                      className={chipClass(isActive)}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Duration */}
          <div className={`space-y-3 ${destinationOptions.length > 0 ? "pt-2 border-t border-[#E5DFC6]" : ""}`}>
            <p className={`text-xs font-medium uppercase tracking-wider text-[#8D8D8D] ${destinationOptions.length > 0 ? "pt-2" : ""}`}>
              Duration
            </p>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((opt) => {
                const isActive = filters.durationBucket === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        durationBucket: isActive ? undefined : opt.value,
                      })
                    }
                    className={chipClass(isActive)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-3 pt-2 border-t border-[#E5DFC6]">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D] pt-2">
              Sort by
            </p>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFilterChange({ ...filters, sortBy: opt.value })}
                  className={chipClass(activeSort === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="space-y-3 pt-2 border-t border-[#E5DFC6]">
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">
                Price range
              </p>
              <span className="text-xs text-[#0a2225] tabular-nums">
                ${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}
                {priceRange[1] >= 10000 ? "+" : ""}
              </span>
            </div>
            <SliderPrimitive.Root
              min={0}
              max={10000}
              step={100}
              value={priceRange}
              onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
              onValueCommit={(v) =>
                onFilterChange({ ...filters, minPrice: v[0], maxPrice: v[1] })
              }
              className="relative flex w-full touch-none select-none items-center"
            >
              <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[#E5DFC6]">
                <SliderPrimitive.Range className="absolute h-full bg-[#BFAD72]" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-[#BFAD72] bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFAD72]" />
              <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-[#BFAD72] bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFAD72]" />
            </SliderPrimitive.Root>
          </div>

          {activeCount > 0 && (
            <div className="pt-2 border-t border-[#E5DFC6]">
              <button
                onClick={clearAll}
                className="pt-2 text-xs font-medium text-[#BFAD72] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
