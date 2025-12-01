import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

  const handleQuickFilter = (filter: string) => {
    const newFilter = selectedFilter === filter ? null : filter;
    setSelectedFilter(newFilter);
    onFilterChange({
      ...filters,
      category: newFilter || undefined,
    });
  };

  const activeCount = selectedFilter ? 1 : 0;

  // Desktop: horizontal scrollable row
  // Mobile: collapsible accordion
  return (
    <>
      {/* Desktop: Horizontal scroll pills */}
      <div className="hidden md:block">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {quickFilters.map((filter) => (
            <Badge
              key={filter}
              variant="outline"
              className={`cursor-pointer whitespace-nowrap rounded-full border-[#E5DFC6] px-4 py-1.5 font-secondary text-xs font-medium transition-all ${
                selectedFilter === filter
                  ? "border-[#BFAD72] bg-[#BFAD72] text-white shadow-sm"
                  : "bg-[#FBF9F0] text-[#0a2225] hover:border-[#BFAD72] hover:bg-[#BFAD72] hover:text-white hover:shadow-sm"
              }`}
              onClick={() => handleQuickFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>
      </div>

      {/* Mobile: Accordion */}
      <div className="md:hidden w-full">
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
            <AccordionContent className="rounded-b-2xl border border-t-0 border-[#E5DFC6] bg-white px-4 pb-4 pt-2">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-[#8D8D8D]">
                  Trip Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="outline"
                      className={`cursor-pointer rounded-full border-[#E5DFC6] px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                        selectedFilter === filter
                          ? "border-[#BFAD72] bg-[#BFAD72] text-white"
                          : "bg-[#FBF9F0] text-[#0a2225] hover:border-[#BFAD72]"
                      }`}
                      onClick={() => handleQuickFilter(filter)}
                    >
                      {filter}
                    </Badge>
                  ))}
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
