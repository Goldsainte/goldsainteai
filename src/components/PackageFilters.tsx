import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PackageFiltersProps {
  onFilterChange: (filters: PackageFilterState) => void;
  availableDestinations?: string[];
}

export interface PackageFilterState {
  priceRange: [number, number];
  durationRanges: string[];
  destinations: string[];
  tripTypes: string[];
  minRating: number;
  dateRange: { from?: Date; to?: Date };
}

const DURATION_OPTIONS = [
  { id: '1-3', label: '1-3 Days', min: 1, max: 3 },
  { id: '4-7', label: '4-7 Days', min: 4, max: 7 },
  { id: '8-14', label: '8-14 Days', min: 8, max: 14 },
  { id: '15+', label: '15+ Days', min: 15, max: 999 },
];

const TRIP_TYPES = [
  { value: "adventure", label: "Adventure" },
  { value: "luxury", label: "Luxury" },
  { value: "cultural", label: "Cultural" },
  { value: "family", label: "Family" },
  { value: "romantic", label: "Romantic" },
  { value: "budget", label: "Budget" },
];

const PackageFilters = ({ onFilterChange, availableDestinations = [] }: PackageFiltersProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedTripTypes, setSelectedTripTypes] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);

  const emitFilterChange = () => {
    onFilterChange({
      priceRange,
      durationRanges: selectedDurations,
      destinations: selectedDestinations,
      tripTypes: selectedTripTypes,
      minRating,
      dateRange: {},
    });
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
    setTimeout(emitFilterChange, 0);
  };

  const handleDurationToggle = (durationId: string) => {
    const newDurations = selectedDurations.includes(durationId)
      ? selectedDurations.filter(d => d !== durationId)
      : [...selectedDurations, durationId];
    setSelectedDurations(newDurations);
    setTimeout(emitFilterChange, 0);
  };

  const handleDestinationToggle = (destination: string) => {
    const newDestinations = selectedDestinations.includes(destination)
      ? selectedDestinations.filter(d => d !== destination)
      : [...selectedDestinations, destination];
    setSelectedDestinations(newDestinations);
    setTimeout(emitFilterChange, 0);
  };

  const handleTripTypeToggle = (type: string) => {
    const newTypes = selectedTripTypes.includes(type)
      ? selectedTripTypes.filter(t => t !== type)
      : [...selectedTripTypes, type];
    setSelectedTripTypes(newTypes);
    setTimeout(emitFilterChange, 0);
  };

  const clearAllFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedDurations([]);
    setSelectedDestinations([]);
    setSelectedTripTypes([]);
    setMinRating(0);
    setTimeout(emitFilterChange, 0);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filter Packages</h3>
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          Clear All
        </Button>
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Price Range</h4>
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            max={10000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Trip Duration</h4>
          <div className="space-y-2">
            {DURATION_OPTIONS.map(duration => (
              <div key={duration.id} className="flex items-center space-x-2">
                <Checkbox
                  id={duration.id}
                  checked={selectedDurations.includes(duration.id)}
                  onCheckedChange={() => handleDurationToggle(duration.id)}
                />
                <label
                  htmlFor={duration.id}
                  className="text-sm cursor-pointer"
                >
                  {duration.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Type Filter */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Trip Type</h4>
          <div className="space-y-2">
            {TRIP_TYPES.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${value}`}
                  checked={selectedTripTypes.includes(value)}
                  onCheckedChange={() => handleTripTypeToggle(value)}
                />
                <label
                  htmlFor={`type-${value}`}
                  className="text-sm cursor-pointer"
                >
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Filter */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Minimum Rating</h4>
          <div className="space-y-2">
            {[0, 3, 4, 4.5].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={minRating === rating}
                  onCheckedChange={() => {
                    setMinRating(rating);
                    setTimeout(emitFilterChange, 0);
                  }}
                />
                <label
                  htmlFor={`rating-${rating}`}
                  className="text-sm cursor-pointer"
                >
                  {rating === 0 ? "Any Rating" : `${rating}+ Stars`}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Filter */}
        {availableDestinations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Destination</h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {availableDestinations.map((destination) => (
                  <div key={destination} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dest-${destination}`}
                      checked={selectedDestinations.includes(destination)}
                      onCheckedChange={() => handleDestinationToggle(destination)}
                    />
                    <label
                      htmlFor={`dest-${destination}`}
                      className="text-sm cursor-pointer"
                    >
                      {destination}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </Card>
  );
};

export { PackageFilters, DURATION_OPTIONS as DURATION_FILTERS };
