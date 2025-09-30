import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

interface FlightFiltersProps {
  onSortChange: (sortBy: string) => void;
  currentSort?: string;
  resultsCount: number;
  onClearFilters?: () => void;
}

export const FlightFilters = ({ 
  onSortChange, 
  currentSort = 'best',
  resultsCount,
  onClearFilters
}: FlightFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{resultsCount} flight{resultsCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex items-center gap-2 flex-1">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="best">Best</SelectItem>
            <SelectItem value="price">Cheapest</SelectItem>
            <SelectItem value="duration">Shortest Duration</SelectItem>
            <SelectItem value="departure_early">Earliest Departure</SelectItem>
            <SelectItem value="departure_late">Latest Departure</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {currentSort !== 'best' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSortChange('best');
            onClearFilters?.();
          }}
          className="text-xs gap-1"
        >
          <X className="h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
};
