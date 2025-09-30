import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

interface HotelFiltersProps {
  onSortChange: (sortBy: string) => void;
  onMinRatingChange: (rating: number | null) => void;
  currentSort?: string;
  currentMinRating?: number;
  resultsCount: number;
}

export const HotelFilters = ({ 
  onSortChange, 
  onMinRatingChange, 
  currentSort = 'popularity',
  currentMinRating,
  resultsCount 
}: HotelFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{resultsCount} properties</span>
      </div>

      <div className="flex items-center gap-2 flex-1">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Most Popular</SelectItem>
            <SelectItem value="price">Lowest Price</SelectItem>
            <SelectItem value="review_score">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Min Rating:</span>
        <div className="flex gap-2">
          {[7, 8, 9].map((rating) => (
            <Button
              key={rating}
              variant={currentMinRating === rating ? "default" : "outline"}
              size="sm"
              onClick={() => onMinRatingChange(currentMinRating === rating ? null : rating)}
              className="h-8"
            >
              {rating}+
            </Button>
          ))}
        </div>
      </div>

      {(currentMinRating || currentSort !== 'popularity') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSortChange('popularity');
            onMinRatingChange(null);
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
