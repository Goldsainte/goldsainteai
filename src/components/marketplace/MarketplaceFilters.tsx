import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 10000,
  ]);

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
    <div className="w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="filters" className="border-none">
          <AccordionTrigger className="flex items-center justify-between rounded-full border border-[#E5DFC6] bg-white px-4 py-3 text-sm font-medium text-[#0a2225] hover:no-underline hover:bg-[#FBF9F0] transition-colors [&[data-state=open]]:rounded-b-none [&[data-state=open]]:border-b-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#BFAD72]" />
              <span className="font-secondary">Filters</span>
              {activeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#BFAD72] text-[10px] font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="rounded-b-2xl border border-t-0 border-[#E5DFC6] bg-white px-4 pb-4 pt-2 md:px-6 md:pb-5">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">
                Trip Type
              </p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <ToggleGroup
                  type="single"
                  value={selectedFilter || ""}
                  onValueChange={(value) => handleQuickFilter(value)}
                  className="flex flex-wrap gap-2 md:gap-3"
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

              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">
                    Price range
                  </p>
                  <span className="text-xs text-[#0a2225] tabular-nums">
                    ${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}
                    {priceRange[1] >= 10000 ? "+" : ""}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                  onValueCommit={(v) =>
                    onFilterChange({ ...filters, minPrice: v[0], maxPrice: v[1] })
                  }
                  className="w-full"
                />
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
