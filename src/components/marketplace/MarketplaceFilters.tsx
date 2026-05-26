import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SearchFilters } from "@/pages/Marketplace";

interface MarketplaceFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

const quickFilters = [
  "Top Rated",
  "Luxury",
  "Budget Friendly",
  "All-Inclusive",
  "Adventure",
  "Family",
  "Solo Travel",
  "Wellness",
  "Design-led",
  "Eco-conscious",
  "Adults only",
  "City breaks",
];

export function MarketplaceFilters({ filters, onFilterChange }: MarketplaceFiltersProps) {
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
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
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const sortOptions: { value: NonNullable<SearchFilters["sortBy"]>; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "top-rated", label: "Top Rated" },
    { value: "price-low", label: "Price: Low" },
    { value: "price-high", label: "Price: High" },
  ];
  const activeSort = filters.sortBy ?? "newest";

  const handleQuickFilter = (filter: string) => {
    const newFilter = selectedFilter === filter ? null : filter;
    setSelectedFilter(newFilter);
    onFilterChange({
      ...filters,
      category: newFilter || undefined,
    });
  };

  const priceActive = (filters.minPrice ?? 0) > 0 || (filters.maxPrice ?? 10000) < 10000;
  const activeCount = (selectedFilter ? 1 : 0) + (priceActive ? 1 : 0);

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
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">
              Trip Type
            </p>
            <div className="flex flex-wrap gap-2">
              <ToggleGroup
                type="single"
                value={selectedFilter || ""}
                onValueChange={(value) => handleQuickFilter(value)}
                className="flex flex-wrap gap-2"
              >
                {quickFilters.map((filter) => (
                  <ToggleGroupItem
                    key={filter}
                    value={filter}
                    variant="standard"
                    size="mobile"
                    className="whitespace-nowrap"
                  >
                    {filter}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            {selectedFilter && (
              <button
                onClick={() => {
                  setSelectedFilter(null);
                  onFilterChange({ ...filters, category: undefined });
                }}
                className="mt-2 text-xs font-medium text-[#BFAD72] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-[#E5DFC6]">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D] pt-2">
              Sort by
            </p>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => {
                const isActive = activeSort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, sortBy: opt.value })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? "bg-[#0c4d47] text-white"
                        : "border border-[#E5DFC6] bg-white text-[#4a4a4a] hover:bg-[#FBF9F0]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

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
            {priceActive && (
              <button
                onClick={() => {
                  setPriceRange([0, 10000]);
                  onFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined });
                }}
                className="text-xs font-medium text-[#BFAD72] hover:underline"
              >
                Reset price
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
