import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Calendar, MapPin } from "lucide-react";

interface PackageFiltersProps {
  onFilterChange: (filters: PackageFilterState) => void;
  availableDestinations?: string[];
}

export interface PackageFilterState {
  priceRange: [number, number];
  durationRanges: string[];
  destinations: string[];
}

const DURATION_OPTIONS = [
  { id: '1-3', label: '1-3 Days', min: 1, max: 3 },
  { id: '4-7', label: '4-7 Days', min: 4, max: 7 },
  { id: '8-14', label: '8-14 Days', min: 8, max: 14 },
  { id: '15+', label: '15+ Days', min: 15, max: 999 },
];

export default function PackageFilters({ onFilterChange, availableDestinations = [] }: PackageFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);

  const handlePriceChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]];
    setPriceRange(newRange);
    emitFilterChange(newRange, selectedDurations, selectedDestinations);
  };

  const handleDurationToggle = (durationId: string) => {
    const newDurations = selectedDurations.includes(durationId)
      ? selectedDurations.filter(d => d !== durationId)
      : [...selectedDurations, durationId];
    
    setSelectedDurations(newDurations);
    emitFilterChange(priceRange, newDurations, selectedDestinations);
  };

  const handleDestinationToggle = (destination: string) => {
    const newDestinations = selectedDestinations.includes(destination)
      ? selectedDestinations.filter(d => d !== destination)
      : [...selectedDestinations, destination];
    
    setSelectedDestinations(newDestinations);
    emitFilterChange(priceRange, selectedDurations, newDestinations);
  };

  const emitFilterChange = (
    price: [number, number],
    durations: string[],
    destinations: string[]
  ) => {
    onFilterChange({
      priceRange: price,
      durationRanges: durations,
      destinations,
    });
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Label>Price Range</Label>
          </div>
          <div className="space-y-2">
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
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label>Trip Duration</Label>
          </div>
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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {duration.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Destinations */}
        {availableDestinations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label>Destination</Label>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableDestinations.map(destination => (
                <div key={destination} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dest-${destination}`}
                    checked={selectedDestinations.includes(destination)}
                    onCheckedChange={() => handleDestinationToggle(destination)}
                  />
                  <label
                    htmlFor={`dest-${destination}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {destination}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const DURATION_FILTERS = DURATION_OPTIONS;
