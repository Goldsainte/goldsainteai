import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, ArrowUpDown, X, DollarSign, Utensils } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface RestaurantFiltersProps {
  onSortChange: (sortBy: string) => void;
  onPriceRangeChange?: (min: number, max: number) => void;
  onCuisineChange?: (cuisines: string[]) => void;
  onDietaryChange?: (dietary: string[]) => void;
  currentSort?: string;
  currentPriceRange?: [number, number];
  resultsCount: number;
}

export const RestaurantFilters = ({ 
  onSortChange, 
  onPriceRangeChange,
  onCuisineChange,
  onDietaryChange,
  currentSort = 'rating',
  currentPriceRange = [0, 200],
  resultsCount 
}: RestaurantFiltersProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>(currentPriceRange);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  
  const cuisineTypes = [
    "Italian",
    "Japanese",
    "Chinese",
    "Mexican",
    "Indian",
    "French",
    "Thai",
    "American",
    "Mediterranean",
    "Steakhouse",
    "Seafood",
    "Vegetarian",
    "Vegan"
  ];

  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Halal",
    "Kosher",
    "Dairy-Free"
  ];
  
  const handlePriceChange = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setPriceRange(range);
    onPriceRangeChange?.(range[0], range[1]);
  };
  
  const handleCuisineToggle = (cuisine: string) => {
    const newSelection = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter(c => c !== cuisine)
      : [...selectedCuisines, cuisine];
    setSelectedCuisines(newSelection);
    onCuisineChange?.(newSelection);
  };

  const handleDietaryToggle = (option: string) => {
    const newSelection = selectedDietary.includes(option)
      ? selectedDietary.filter(d => d !== option)
      : [...selectedDietary, option];
    setSelectedDietary(newSelection);
    onDietaryChange?.(newSelection);
  };
  
  const clearAllFilters = () => {
    setPriceRange([0, 200]);
    setSelectedCuisines([]);
    setSelectedDietary([]);
    onPriceRangeChange?.(0, 200);
    onCuisineChange?.([]);
    onDietaryChange?.([]);
    onSortChange('rating');
  };
  
  const hasActiveFilters = 
    selectedCuisines.length > 0 || 
    selectedDietary.length > 0 ||
    priceRange[0] !== 0 || 
    priceRange[1] !== 200;
  
  const activeFilterCount = 
    selectedCuisines.length + 
    selectedDietary.length +
    (priceRange[0] !== 0 || priceRange[1] !== 200 ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Quick filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{resultsCount} restaurants</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Restaurant Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <FilterContent
                  priceRange={priceRange}
                  handlePriceChange={handlePriceChange}
                  cuisineTypes={cuisineTypes}
                  selectedCuisines={selectedCuisines}
                  handleCuisineToggle={handleCuisineToggle}
                  dietaryOptions={dietaryOptions}
                  selectedDietary={selectedDietary}
                  handleDietaryToggle={handleDietaryToggle}
                  clearAllFilters={clearAllFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium">Active filters:</span>
          
          {priceRange[0] !== 0 || priceRange[1] !== 200 ? (
            <Badge variant="secondary" className="gap-1">
              ${priceRange[0]} - ${priceRange[1]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handlePriceChange([0, 200])}
              />
            </Badge>
          ) : null}
          
          {selectedCuisines.map(cuisine => (
            <Badge key={cuisine} variant="secondary" className="gap-1">
              {cuisine}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleCuisineToggle(cuisine)}
              />
            </Badge>
          ))}

          {selectedDietary.map(option => (
            <Badge key={option} variant="secondary" className="gap-1">
              {option}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleDietaryToggle(option)}
              />
            </Badge>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="ml-auto"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

// Extracted filter content component for reuse
const FilterContent = ({ 
  priceRange, 
  handlePriceChange, 
  cuisineTypes, 
  selectedCuisines, 
  handleCuisineToggle,
  dietaryOptions,
  selectedDietary,
  handleDietaryToggle,
  clearAllFilters, 
  hasActiveFilters 
}: any) => (
  <Accordion type="multiple" className="w-full" defaultValue={["price", "cuisine"]}>
    <AccordionItem value="price">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price per Person
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            max={200}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="cuisine">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          Cuisine Type
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          {cuisineTypes.map((cuisine: string) => (
            <div key={cuisine} className="flex items-center space-x-2">
              <Checkbox
                id={`cuisine-${cuisine}`}
                checked={selectedCuisines.includes(cuisine)}
                onCheckedChange={() => handleCuisineToggle(cuisine)}
              />
              <Label 
                htmlFor={`cuisine-${cuisine}`} 
                className="text-sm cursor-pointer"
              >
                {cuisine}
              </Label>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="dietary">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          Dietary Options
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          {dietaryOptions.map((option: string) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`dietary-${option}`}
                checked={selectedDietary.includes(option)}
                onCheckedChange={() => handleDietaryToggle(option)}
              />
              <Label 
                htmlFor={`dietary-${option}`} 
                className="text-sm cursor-pointer"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>

    {hasActiveFilters && (
      <div className="pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearAllFilters}
          className="w-full"
        >
          Clear All Filters
        </Button>
      </div>
    )}
  </Accordion>
);
