import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/FilterChip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, SlidersHorizontal, X, Plane, Clock, DollarSign, Luggage } from "lucide-react";

interface FlightFilter {
  stops: string[];
  airlines: string[];
  priceRange: [number, number];
  departureTime: string[];
  arrivalTime: string[];
  duration: [number, number];
  baggage: string[];
}

interface AdvancedFlightFiltersProps {
  onFilterChange: (filters: FlightFilter) => void;
  onSortChange: (sortBy: string) => void;
  currentSort?: string;
  resultsCount: number;
  availableAirlines?: string[];
}

export const AdvancedFlightFilters = ({
  onFilterChange,
  onSortChange,
  currentSort = 'best',
  resultsCount,
  availableAirlines = ['American Airlines', 'Delta', 'United', 'JetBlue', 'Southwest']
}: AdvancedFlightFiltersProps) => {
  const [filters, setFilters] = useState<FlightFilter>({
    stops: [],
    airlines: [],
    priceRange: [0, 5000],
    departureTime: [],
    arrivalTime: [],
    duration: [0, 24],
    baggage: []
  });

  const updateFilter = (key: keyof FlightFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof FlightFilter, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    const resetFilters: FlightFilter = {
      stops: [],
      airlines: [],
      priceRange: [0, 5000],
      departureTime: [],
      arrivalTime: [],
      duration: [0, 24],
      baggage: []
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    onSortChange('best');
  };

  const hasActiveFilters = filters.stops.length > 0 || 
    filters.airlines.length > 0 || 
    filters.departureTime.length > 0 || 
    filters.arrivalTime.length > 0 ||
    filters.baggage.length > 0 ||
    currentSort !== 'best';

  const activeFilterCount = filters.stops.length + 
    filters.airlines.length + 
    filters.departureTime.length + 
    filters.arrivalTime.length +
    filters.baggage.length;

  return (
    <div className="space-y-3">
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-accent/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{resultsCount} flights</span>
        </div>

         <div className="flex items-center gap-2 flex-1">
           <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
           <Select value={currentSort} onValueChange={onSortChange}>
             <SelectTrigger className="w-[180px]">
               <SelectValue placeholder="Sort by" />
             </SelectTrigger>
             <SelectContent className="bg-background">
               <SelectItem value="best">Best</SelectItem>
               <SelectItem value="price">Cheapest</SelectItem>
               <SelectItem value="duration">Shortest</SelectItem>
               <SelectItem value="departure_early">Earliest Departure</SelectItem>
               <SelectItem value="departure_late">Latest Departure</SelectItem>
             </SelectContent>
           </Select>
 
           {/* Quick Price Slider */}
           <div className="flex items-center gap-2 ml-4">
             <DollarSign className="h-4 w-4 text-muted-foreground" />
             <div className="w-48">
               <Slider
                 min={0}
                 max={5000}
                 step={100}
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
              <SheetTitle>Filter Flights</SheetTitle>
              <SheetDescription>
                Refine your search with advanced filters
              </SheetDescription>
            </SheetHeader>

            <Accordion type="multiple" defaultValue={["stops", "price", "time", "airlines"]} className="mt-6">
              {/* Stops */}
              <AccordionItem value="stops">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Stops
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    { value: 'nonstop', label: 'Nonstop only' },
                    { value: '1-stop', label: '1 stop or fewer' },
                    { value: '2-stops', label: '2+ stops' }
                  ].map((stop) => (
                    <div key={stop.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={stop.value}
                        checked={filters.stops.includes(stop.value)}
                        onCheckedChange={() => toggleArrayFilter('stops', stop.value)}
                      />
                      <label
                        htmlFor={stop.value}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {stop.label}
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
                    max={5000}
                    step={100}
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Departure Time */}
              <AccordionItem value="time">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Times
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div>
                    <div className="text-sm font-medium mb-2">Departure</div>
                    <div className="space-y-2">
                      {[
                        { value: 'early-morning', label: 'Early morning (12am - 8am)' },
                        { value: 'morning', label: 'Morning (8am - 12pm)' },
                        { value: 'afternoon', label: 'Afternoon (12pm - 6pm)' },
                        { value: 'evening', label: 'Evening (6pm - 12am)' }
                      ].map((time) => (
                        <div key={time.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dep-${time.value}`}
                            checked={filters.departureTime.includes(time.value)}
                            onCheckedChange={() => toggleArrayFilter('departureTime', time.value)}
                          />
                          <label
                            htmlFor={`dep-${time.value}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {time.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Arrival</div>
                    <div className="space-y-2">
                      {[
                        { value: 'early-morning', label: 'Early morning (12am - 8am)' },
                        { value: 'morning', label: 'Morning (8am - 12pm)' },
                        { value: 'afternoon', label: 'Afternoon (12pm - 6pm)' },
                        { value: 'evening', label: 'Evening (6pm - 12am)' }
                      ].map((time) => (
                        <div key={time.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`arr-${time.value}`}
                            checked={filters.arrivalTime.includes(time.value)}
                            onCheckedChange={() => toggleArrayFilter('arrivalTime', time.value)}
                          />
                          <label
                            htmlFor={`arr-${time.value}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {time.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Duration */}
              <AccordionItem value="duration">
                <AccordionTrigger className="text-base font-semibold">
                  Flight Duration
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {filters.duration[0]}h
                    </span>
                    <span className="text-muted-foreground">
                      {filters.duration[1]}h+
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={24}
                    step={1}
                    value={filters.duration}
                    onValueChange={(value) => updateFilter('duration', value as [number, number])}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Airlines */}
              <AccordionItem value="airlines">
                <AccordionTrigger className="text-base font-semibold">
                  Airlines
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {availableAirlines.map((airline) => (
                    <div key={airline} className="flex items-center space-x-2">
                      <Checkbox
                        id={airline}
                        checked={filters.airlines.includes(airline)}
                        onCheckedChange={() => toggleArrayFilter('airlines', airline)}
                      />
                      <label
                        htmlFor={airline}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {airline}
                      </label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Baggage */}
              <AccordionItem value="baggage">
                <AccordionTrigger className="text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <Luggage className="h-4 w-4" />
                    Baggage
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {[
                    { value: 'carry-on', label: 'Carry-on included' },
                    { value: 'checked', label: 'Checked bag included' },
                    { value: 'no-baggage-fee', label: 'No baggage fees' }
                  ].map((baggage) => (
                    <div key={baggage.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={baggage.value}
                        checked={filters.baggage.includes(baggage.value)}
                        onCheckedChange={() => toggleArrayFilter('baggage', baggage.value)}
                      />
                      <label
                        htmlFor={baggage.value}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {baggage.label}
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
      {(filters.stops.length > 0 || filters.airlines.length > 0 || filters.departureTime.length > 0) && (
        <div className="flex flex-wrap gap-2 px-4">
          {filters.stops.map((stop) => (
            <FilterChip
              key={stop}
              removeLabel={`Remove ${stop}`}
              onRemove={() => toggleArrayFilter('stops', stop)}
            >
              {stop}
            </FilterChip>
          ))}
          {filters.airlines.map((airline) => (
            <FilterChip
              key={airline}
              removeLabel={`Remove ${airline}`}
              onRemove={() => toggleArrayFilter('airlines', airline)}
            >
              {airline}
            </FilterChip>
          ))}
          {filters.departureTime.map((time) => (
            <FilterChip
              key={`dep-${time}`}
              removeLabel={`Remove ${time}`}
              onRemove={() => toggleArrayFilter('departureTime', time)}
            >
              Dep: {time}
            </FilterChip>
          ))}
          {filters.arrivalTime.map((time) => (
            <FilterChip
              key={`arr-${time}`}
              removeLabel={`Remove ${time}`}
              onRemove={() => toggleArrayFilter('arrivalTime', time)}
            >
              Arr: {time}
            </FilterChip>
          ))}
          {filters.baggage.map((bag) => (
            <Badge key={bag} variant="secondary" className="gap-1">
              {bag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('baggage', bag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
