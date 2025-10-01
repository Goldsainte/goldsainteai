import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { SlidersHorizontal, ArrowUpDown, X, DollarSign, Star } from "lucide-react";
import { Label } from "@/components/ui/label";

interface HotelFiltersProps {
  onSortChange: (sortBy: string) => void;
  onMinRatingChange: (rating: number | null) => void;
  onPriceRangeChange?: (min: number, max: number) => void;
  onAmenitiesChange?: (amenities: string[]) => void;
  currentSort?: string;
  currentMinRating?: number;
  currentPriceRange?: [number, number];
  resultsCount: number;
}

export const HotelFilters = ({ 
  onSortChange, 
  onMinRatingChange,
  onPriceRangeChange,
  onAmenitiesChange,
  currentSort = 'popularity',
  currentMinRating,
  currentPriceRange = [0, 1000],
  resultsCount 
}: HotelFiltersProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>(currentPriceRange);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  const amenitiesList = [
    "Free WiFi",
    "Free Parking",
    "Pool",
    "Gym",
    "Restaurant",
    "Room Service",
    "Airport Shuttle",
    "Pet Friendly"
  ];

  const handleAmenityToggle = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    onAmenitiesChange?.(updated);
  };

  const hasActiveFilters = currentMinRating || currentSort !== 'popularity' || selectedAmenities.length > 0;

  return (
    <div className="space-y-3">
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-accent/20 rounded-lg">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{resultsCount} properties</span>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="price">Lowest Price</SelectItem>
              <SelectItem value="review_score">Highest Rated</SelectItem>
              <SelectItem value="price_desc">Highest Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Rating Filters */}
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {[7, 8, 9].map((rating) => (
              <Button
                key={rating}
                variant={currentMinRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => onMinRatingChange(currentMinRating === rating ? null : rating)}
                className="h-8 min-w-[3rem]"
              >
                {rating}+
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              More Filters
              {selectedAmenities.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1">
                  {selectedAmenities.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Properties</SheetTitle>
              <SheetDescription>
                Refine your search with advanced filters
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price Range
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    ${priceRange[0]} - ${priceRange[1]}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={1000}
                  step={50}
                  value={priceRange}
                  onValueChange={(value) => {
                    setPriceRange(value as [number, number]);
                    onPriceRangeChange?.(value[0], value[1]);
                  }}
                  className="mt-2"
                />
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Amenities</Label>
                <div className="space-y-3">
                  {amenitiesList.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={selectedAmenities.includes(amenity)}
                        onCheckedChange={() => handleAmenityToggle(amenity)}
                      />
                      <label
                        htmlFor={amenity}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <SheetClose asChild>
                <Button className="w-full">
                  Apply Filters
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSortChange('popularity');
              onMinRatingChange(null);
              setSelectedAmenities([]);
              onAmenitiesChange?.([]);
              setPriceRange([0, 1000]);
              onPriceRangeChange?.(0, 1000);
            }}
            className="text-xs gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedAmenities.length > 0 || currentMinRating) && (
        <div className="flex flex-wrap gap-2 px-4">
          {currentMinRating && (
            <Badge variant="secondary" className="gap-1">
              Rating: {currentMinRating}+
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onMinRatingChange(null)}
              />
            </Badge>
          )}
          {selectedAmenities.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="gap-1">
              {amenity}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleAmenityToggle(amenity)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
