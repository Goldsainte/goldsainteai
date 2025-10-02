import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, SlidersHorizontal, X, Calendar, DollarSign, MapPin } from "lucide-react";

interface EventFilter {
  categories: string[];
  priceRange: [number, number];
  dates: string[];
  venues: string[];
  distance: number;
}

interface AdvancedEventFiltersProps {
  onFilterChange: (filters: EventFilter) => void;
  onSortChange: (sortBy: string) => void;
  currentSort?: string;
  resultsCount: number;
}

export const AdvancedEventFilters = ({
  onFilterChange,
  onSortChange,
  currentSort = 'relevance',
  resultsCount
}: AdvancedEventFiltersProps) => {
  const [filters, setFilters] = useState<EventFilter>({
    categories: [],
    priceRange: [0, 500],
    dates: [],
    venues: [],
    distance: 50
  });

  const updateFilter = (key: keyof EventFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof EventFilter, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    const resetFilters: EventFilter = {
      categories: [],
      priceRange: [0, 500],
      dates: [],
      venues: [],
      distance: 50
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    onSortChange('relevance');
  };

  const hasActiveFilters = filters.categories.length > 0 || 
    filters.dates.length > 0 || 
    filters.venues.length > 0 ||
    currentSort !== 'relevance';

  const activeFilterCount = filters.categories.length + 
    filters.dates.length + 
    filters.venues.length;

  const eventCategories = [
    'Concerts', 'Sports', 'Theater', 'Comedy', 'Arts', 'Family',
    'Festivals', 'Food & Drink', 'Nightlife', 'Museums'
  ];

  return (
    <div className="space-y-3">
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-accent/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{resultsCount} events</span>
        </div>

         <div className="flex items-center gap-2 flex-1">
           <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
           <Select value={currentSort} onValueChange={onSortChange}>
             <SelectTrigger className="w-[180px]">
               <SelectValue placeholder="Sort by" />
             </SelectTrigger>
             <SelectContent className="bg-background">
               <SelectItem value="relevance">Most Relevant</SelectItem>
               <SelectItem value="date">Date</SelectItem>
               <SelectItem value="price">Price</SelectItem>
               <SelectItem value="popularity">Popularity</SelectItem>
               <SelectItem value="distance">Distance</SelectItem>
             </SelectContent>
           </Select>
 
           {/* Quick Price Slider */}
           <div className="flex items-center gap-2 ml-4">
             <DollarSign className="h-4 w-4 text-muted-foreground" />
             <div className="w-48">
               <Slider
                 min={0}
                 max={500}
                 step={10}
                 value={filters.priceRange}
                 onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
               />
               <div className="flex justify-between text-xs text-muted-foreground">
                 <span>${filters.priceRange[0]}</span>
                 <span>${filters.priceRange[1]}</span>
               </div>
             </div>
           </div>
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
              <SheetTitle>Filter Events</SheetTitle>
              <SheetDescription>
                Find the perfect events for your trip
              </SheetDescription>
            </SheetHeader>

            <Accordion type="multiple" defaultValue={["categories", "price", "dates"]} className="mt-6">
              {/* Categories */}
              <AccordionItem value="categories">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event Categories
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {eventCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() => toggleArrayFilter('categories', category)}
                      />
                      <label
                        htmlFor={category}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Price Range */}
              <AccordionItem value="price">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price Range
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      ${filters.priceRange[0]}
                    </span>
                    <span className="text-muted-foreground">
                      ${filters.priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={500}
                    step={10}
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Dates */}
              <AccordionItem value="dates">
                <AccordionTrigger className="text-base font-semibold">
                  Date Range
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    { value: 'today', label: 'Today' },
                    { value: 'tomorrow', label: 'Tomorrow' },
                    { value: 'this-weekend', label: 'This Weekend' },
                    { value: 'this-week', label: 'This Week' },
                    { value: 'next-week', label: 'Next Week' },
                    { value: 'this-month', label: 'This Month' }
                  ].map((date) => (
                    <div key={date.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={date.value}
                        checked={filters.dates.includes(date.value)}
                        onCheckedChange={() => toggleArrayFilter('dates', date.value)}
                      />
                      <label
                        htmlFor={date.value}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {date.label}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Distance */}
              <AccordionItem value="distance">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Distance from Location
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Within</span>
                    <span className="font-medium">{filters.distance} miles</span>
                  </div>
                  <Slider
                    min={1}
                    max={100}
                    step={5}
                    value={[filters.distance]}
                    onValueChange={(value) => updateFilter('distance', value[0])}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Venue Type */}
              <AccordionItem value="venues">
                <AccordionTrigger className="text-base font-semibold">
                  Venue Type
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    'Stadium', 'Arena', 'Theater', 'Club', 'Outdoor', 'Museum', 'Gallery', 'Concert Hall'
                  ].map((venue) => (
                    <div key={venue} className="flex items-center space-x-2">
                      <Checkbox
                        id={venue}
                        checked={filters.venues.includes(venue)}
                        onCheckedChange={() => toggleArrayFilter('venues', venue)}
                      />
                      <label
                        htmlFor={venue}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {venue}
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
      {(filters.categories.length > 0 || filters.dates.length > 0 || filters.venues.length > 0) && (
        <div className="flex flex-wrap gap-2 px-4">
          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('categories', category)}
              />
            </Badge>
          ))}
          {filters.dates.map((date) => (
            <Badge key={date} variant="secondary" className="gap-1">
              {date}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('dates', date)}
              />
            </Badge>
          ))}
          {filters.venues.map((venue) => (
            <Badge key={venue} variant="secondary" className="gap-1">
              {venue}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('venues', venue)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
