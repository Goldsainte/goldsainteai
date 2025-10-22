import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface RestaurantFilterState {
  priceRange: [number, number];
  cuisineTypes: string[];
  features: string[];
  dietary: string[];
  minRating: number;
}

interface RestaurantFiltersProps {
  filters: RestaurantFilterState;
  onFiltersChange: (filters: RestaurantFilterState) => void;
  onClearAll: () => void;
}

const cuisineOptions = [
  'French', 'Italian', 'Japanese', 'Chinese', 'Indian', 'Thai',
  'Mediterranean', 'Middle Eastern', 'American', 'Steakhouse',
  'Seafood', 'Vegetarian/Vegan', 'Fusion'
];

const featureOptions = [
  'Michelin Star', 'Fine Dining', 'Romantic', 'Outdoor Seating',
  'Tasting Menu', "Chef's Table", 'Wine Pairing'
];

const dietaryOptions = [
  'Vegetarian Options', 'Vegan Options', 'Gluten-Free', 'Halal', 'Kosher'
];

export const RestaurantFilters = ({
  filters,
  onFiltersChange,
  onClearAll,
}: RestaurantFiltersProps) => {
  const handlePriceChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [value[0], value[1]],
    });
  };

  const handleCuisineToggle = (cuisine: string) => {
    const newCuisines = filters.cuisineTypes.includes(cuisine)
      ? filters.cuisineTypes.filter(c => c !== cuisine)
      : [...filters.cuisineTypes, cuisine];
    
    onFiltersChange({
      ...filters,
      cuisineTypes: newCuisines,
    });
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter(f => f !== feature)
      : [...filters.features, feature];
    
    onFiltersChange({
      ...filters,
      features: newFeatures,
    });
  };

  const handleDietaryToggle = (dietary: string) => {
    const newDietary = filters.dietary.includes(dietary)
      ? filters.dietary.filter(d => d !== dietary)
      : [...filters.dietary, dietary];
    
    onFiltersChange({
      ...filters,
      dietary: newDietary,
    });
  };

  const handleRatingChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      minRating: value[0],
    });
  };

  const clearAllFilters = () => {
    onClearAll();
  };

  const hasActiveFilters = 
    filters.priceRange[0] > 1 || 
    filters.priceRange[1] < 4 ||
    filters.cuisineTypes.length > 0 ||
    filters.features.length > 0 ||
    filters.dietary.length > 0 ||
    filters.minRating > 0;

  const activeFilterCount = 
    (filters.priceRange[0] > 1 || filters.priceRange[1] < 4 ? 1 : 0) +
    filters.cuisineTypes.length +
    filters.features.length +
    filters.dietary.length +
    (filters.minRating > 0 ? 1 : 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Filters</h2>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-luxury-gold/20 text-luxury-emerald">
              {activeFilterCount} Active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-luxury-emerald hover:text-luxury-emerald/80"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filters Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <Accordion type="multiple" defaultValue={["price", "cuisine", "features", "dietary", "rating"]} className="space-y-4">
            {/* Price Level */}
            <AccordionItem value="price" className="border-luxury-gold/20">
              <AccordionTrigger className="text-luxury-emerald hover:text-luxury-emerald/80">
                Price Level
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>{'$'.repeat(filters.priceRange[0])}</span>
                    <span>{'$'.repeat(filters.priceRange[1])}</span>
                  </div>
                  <Slider
                    min={1}
                    max={4}
                    step={1}
                    value={filters.priceRange}
                    onValueChange={handlePriceChange}
                    className="[&_[role=slider]]:bg-luxury-gold [&_[role=slider]]:border-luxury-gold"
                  />
                  <div className="text-xs text-muted-foreground">
                    $ = Budget • $$ = Moderate • $$$ = Upscale • $$$$ = Fine Dining
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cuisine Types */}
            <AccordionItem value="cuisine" className="border-luxury-gold/20">
              <AccordionTrigger className="text-luxury-emerald hover:text-luxury-emerald/80">
                Cuisine Type
                {filters.cuisineTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-luxury-gold/20">
                    {filters.cuisineTypes.length}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                  {cuisineOptions.map((cuisine) => (
                    <div key={cuisine} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cuisine-${cuisine}`}
                        checked={filters.cuisineTypes.includes(cuisine)}
                        onCheckedChange={() => handleCuisineToggle(cuisine)}
                        className="border-luxury-gold data-[state=checked]:bg-luxury-gold data-[state=checked]:text-luxury-emerald"
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

            {/* Features */}
            <AccordionItem value="features" className="border-luxury-gold/20">
              <AccordionTrigger className="text-luxury-emerald hover:text-luxury-emerald/80">
                Restaurant Features
                {filters.features.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-luxury-gold/20">
                    {filters.features.length}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                  {featureOptions.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={`feature-${feature}`}
                        checked={filters.features.includes(feature)}
                        onCheckedChange={() => handleFeatureToggle(feature)}
                        className="border-luxury-gold data-[state=checked]:bg-luxury-gold data-[state=checked]:text-luxury-emerald"
                      />
                      <Label
                        htmlFor={`feature-${feature}`}
                        className="text-sm cursor-pointer"
                      >
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dietary Options */}
            <AccordionItem value="dietary" className="border-luxury-gold/20">
              <AccordionTrigger className="text-luxury-emerald hover:text-luxury-emerald/80">
                Dietary Options
                {filters.dietary.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-luxury-gold/20">
                    {filters.dietary.length}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                  {dietaryOptions.map((dietary) => (
                    <div key={dietary} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dietary-${dietary}`}
                        checked={filters.dietary.includes(dietary)}
                        onCheckedChange={() => handleDietaryToggle(dietary)}
                        className="border-luxury-gold data-[state=checked]:bg-luxury-gold data-[state=checked]:text-luxury-emerald"
                      />
                      <Label
                        htmlFor={`dietary-${dietary}`}
                        className="text-sm cursor-pointer"
                      >
                        {dietary}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Rating */}
            <AccordionItem value="rating" className="border-luxury-gold/20">
              <AccordionTrigger className="text-luxury-emerald hover:text-luxury-emerald/80">
                Minimum Rating
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Any Rating</span>
                    <span>{filters.minRating > 0 ? `${filters.minRating.toFixed(1)}+ Stars` : 'All'}</span>
                  </div>
                  <Slider
                    min={0}
                    max={5}
                    step={0.5}
                    value={[filters.minRating]}
                    onValueChange={handleRatingChange}
                    className="[&_[role=slider]]:bg-luxury-gold [&_[role=slider]]:border-luxury-gold"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
};
