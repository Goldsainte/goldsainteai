import { Badge } from "@/components/ui/badge";
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
  const handleQuickFilter = (filter: string) => {
    onFilterChange({
      ...filters,
      category: filter,
      destination: filter,
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => (
        <Badge
          key={filter}
          variant="outline"
          className="cursor-pointer rounded-full border-[#E5DFC6] bg-[#FBF9F0] px-4 py-1.5 font-secondary text-xs font-medium text-[#0a2225] transition-all hover:border-[#BFAD72] hover:bg-[#BFAD72] hover:text-white hover:shadow-sm"
          onClick={() => handleQuickFilter(filter)}
        >
          {filter}
        </Badge>
      ))}
    </div>
  );
}
