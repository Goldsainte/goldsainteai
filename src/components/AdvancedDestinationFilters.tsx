import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, SlidersHorizontal, X, MapPin, DollarSign, Sun, Mountain } from "lucide-react";

interface DestinationFilter {
  regions: string[];
  climates: string[];
  activities: string[];
  budgetRange: [number, number];
  travelTime: string[];
  seasons: string[];
}

interface AdvancedDestinationFiltersProps {
  onFilterChange: (filters: DestinationFilter) => void;
  onSortChange: (sortBy: string) => void;
  currentSort?: string;
  resultsCount: number;
}

export const AdvancedDestinationFilters = ({
  onFilterChange,
  onSortChange,
  currentSort = 'popular',
  resultsCount
}: AdvancedDestinationFiltersProps) => {
  const [filters, setFilters] = useState<DestinationFilter>({
    regions: [],
    climates: [],
    activities: [],
    budgetRange: [0, 10000],
    travelTime: [],
    seasons: []
  });

  const updateFilter = (key: keyof DestinationFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof DestinationFilter, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    const resetFilters: DestinationFilter = {
      regions: [],
      climates: [],
      activities: [],
      budgetRange: [0, 10000],
      travelTime: [],
      seasons: []
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    onSortChange('popular');
  };

  const hasActiveFilters = filters.regions.length > 0 || 
    filters.climates.length > 0 || 
    filters.activities.length > 0 ||
    filters.travelTime.length > 0 ||
    filters.seasons.length > 0 ||
    currentSort !== 'popular';

  const activeFilterCount = filters.regions.length + 
    filters.climates.length + 
    filters.activities.length +
    filters.travelTime.length +
    filters.seasons.length;

  return (
    <div className="space-y-3">
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-accent/20 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{resultsCount} destinations</span>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="budget">Budget Friendly</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Destinations</SheetTitle>
              <SheetDescription>
                Find your perfect getaway
              </SheetDescription>
            </SheetHeader>

            <Accordion type="multiple" defaultValue={["regions", "budget", "activities"]} className="mt-6">
              {/* Regions */}
              <AccordionItem value="regions">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Regions
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    'Europe', 'Asia', 'North America', 'South America', 
                    'Africa', 'Middle East', 'Caribbean', 'Pacific'
                  ].map((region) => (
                    <div key={region} className="flex items-center space-x-2">
                      <Checkbox
                        id={region}
                        checked={filters.regions.includes(region)}
                        onCheckedChange={() => toggleArrayFilter('regions', region)}
                      />
                      <label
                        htmlFor={region}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {region}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Budget */}
              <AccordionItem value="budget">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Trip Budget
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      ${filters.budgetRange[0]}
                    </span>
                    <span className="text-muted-foreground">
                      ${filters.budgetRange[1]}+
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={10000}
                    step={500}
                    value={filters.budgetRange}
                    onValueChange={(value) => updateFilter('budgetRange', value as [number, number])}
                  />
                  <p className="text-xs text-muted-foreground">Per person estimate</p>
                </AccordionContent>
              </AccordionItem>

              {/* Climate */}
              <AccordionItem value="climate">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Climate
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    'Tropical', 'Warm', 'Mild', 'Cool', 'Cold', 'Desert', 'Mediterranean'
                  ].map((climate) => (
                    <div key={climate} className="flex items-center space-x-2">
                      <Checkbox
                        id={climate}
                        checked={filters.climates.includes(climate)}
                        onCheckedChange={() => toggleArrayFilter('climates', climate)}
                      />
                      <label
                        htmlFor={climate}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {climate}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Activities */}
              <AccordionItem value="activities">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <Mountain className="h-4 w-4" />
                    Activities
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    'Beach', 'Hiking', 'Skiing', 'Culture', 'Nightlife', 
                    'Shopping', 'Food Tours', 'Adventure', 'Wildlife', 'Wellness'
                  ].map((activity) => (
                    <div key={activity} className="flex items-center space-x-2">
                      <Checkbox
                        id={activity}
                        checked={filters.activities.includes(activity)}
                        onCheckedChange={() => toggleArrayFilter('activities', activity)}
                      />
                      <label
                        htmlFor={activity}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {activity}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Travel Time */}
              <AccordionItem value="travel-time">
                <AccordionTrigger className="text-base font-semibold">
                  Travel Time from US
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    { value: 'short', label: 'Under 4 hours' },
                    { value: 'medium', label: '4-8 hours' },
                    { value: 'long', label: '8-12 hours' },
                    { value: 'very-long', label: '12+ hours' }
                  ].map((time) => (
                    <div key={time.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={time.value}
                        checked={filters.travelTime.includes(time.value)}
                        onCheckedChange={() => toggleArrayFilter('travelTime', time.value)}
                      />
                      <label
                        htmlFor={time.value}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {time.label}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Best Season */}
              <AccordionItem value="season">
                <AccordionTrigger className="text-base font-semibold">
                  Best Travel Season
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    'Spring', 'Summer', 'Fall', 'Winter', 'Year-Round'
                  ].map((season) => (
                    <div key={season} className="flex items-center space-x-2">
                      <Checkbox
                        id={season}
                        checked={filters.seasons.includes(season)}
                        onCheckedChange={() => toggleArrayFilter('seasons', season)}
                      />
                      <label
                        htmlFor={season}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {season}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-6 space-y-3">
              <Button 
                className="w-full" 
                onClick={() => document.body.click()}
              >
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.regions.length > 0 || filters.climates.length > 0 || filters.activities.length > 0) && (
        <div className="flex flex-wrap gap-2 px-4">
          {filters.regions.map((region) => (
            <Badge key={region} variant="secondary" className="gap-1">
              {region}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('regions', region)}
              />
            </Badge>
          ))}
          {filters.climates.map((climate) => (
            <Badge key={climate} variant="secondary" className="gap-1">
              {climate}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('climates', climate)}
              />
            </Badge>
          ))}
          {filters.activities.map((activity) => (
            <Badge key={activity} variant="secondary" className="gap-1">
              {activity}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('activities', activity)}
              />
            </Badge>
          ))}
          {filters.travelTime.map((time) => (
            <Badge key={time} variant="secondary" className="gap-1">
              Travel: {time}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('travelTime', time)}
              />
            </Badge>
          ))}
          {filters.seasons.map((season) => (
            <Badge key={season} variant="secondary" className="gap-1">
              {season}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('seasons', season)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
