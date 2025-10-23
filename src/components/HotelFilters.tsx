import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { SlidersHorizontal, ArrowUpDown, X, DollarSign, Star, Building2, Home } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface HotelFiltersProps {
  onSortChange: (sortBy: string) => void;
  onMinRatingChange: (rating: number | null) => void;
  onPriceRangeChange?: (min: number, max: number) => void;
  onAmenitiesChange?: (amenities: string[]) => void;
  onPropertyTypesChange?: (types: string[]) => void;
  onStarRatingsChange?: (ratings: number[]) => void;
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
  onPropertyTypesChange,
  onStarRatingsChange,
  currentSort = 'popularity',
  currentMinRating,
  currentPriceRange = [0, 1000],
  resultsCount 
}: HotelFiltersProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>(currentPriceRange);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedStarRatings, setSelectedStarRatings] = useState<number[]>([]);
  
  const propertyTypes = [
    "Hotels",
    "Apartments",
    "Resorts",
    "Villas",
    "Vacation Homes",
    "Guesthouses",
    "Homestays",
    "Hostels",
    "Motels",
    "Bed & Breakfast"
  ];

  const amenitiesList = [
    "Free WiFi",
    "Free Parking",
    "Swimming Pool",
    "Fitness Center",
    "Restaurant",
    "Room Service",
    "Bar/Lounge",
    "Airport Shuttle",
    "Spa",
    "Pet Friendly",
    "Business Center",
    "Concierge",
    "Kitchen/Kitchenette",
    "Air Conditioning",
    "Non-smoking Rooms"
  ];

  const handleAmenityToggle = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    onAmenitiesChange?.(updated);
  };

  const handlePropertyTypeToggle = (type: string) => {
    const updated = selectedPropertyTypes.includes(type)
      ? selectedPropertyTypes.filter(t => t !== type)
      : [...selectedPropertyTypes, type];
    setSelectedPropertyTypes(updated);
    onPropertyTypesChange?.(updated);
  };

  const handleStarRatingToggle = (rating: number) => {
    const updated = selectedStarRatings.includes(rating)
      ? selectedStarRatings.filter(r => r !== rating)
      : [...selectedStarRatings, rating];
    setSelectedStarRatings(updated);
    onStarRatingsChange?.(updated);
  };

  const hasActiveFilters = currentMinRating || currentSort !== 'popularity' || 
    selectedAmenities.length > 0 || selectedPropertyTypes.length > 0 || selectedStarRatings.length > 0;

  return (
    <div className="space-y-3">
      {/* Quick Filters Bar */}
      <div className="flex items-center justify-between p-3 bg-card border border-accent/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{resultsCount} properties</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={currentSort} onValueChange={onSortChange}>
              <SelectTrigger className="w-[160px]" aria-label="Sort properties">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-background z-[100]">
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="price">Lowest Price</SelectItem>
                <SelectItem value="review_score">Highest Rated</SelectItem>
                <SelectItem value="price_desc">Highest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Rating Filters */}
          <Star className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {[7, 8, 9].map((rating) => (
              <Button
                key={rating}
                variant={currentMinRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => onMinRatingChange(currentMinRating === rating ? null : rating)}
                className="h-7 min-w-[2.5rem] text-xs"
              >
                {rating}+
              </Button>
            ))}
          </div>

          {/* Advanced Filters Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-7">
                <SlidersHorizontal className="h-3 w-3" />
                Filters
                {(selectedAmenities.length + selectedPropertyTypes.length + selectedStarRatings.length) > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1">
                    {selectedAmenities.length + selectedPropertyTypes.length + selectedStarRatings.length}
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
            
            <Accordion type="multiple" className="space-y-4 mt-6">
              {/* Price Range */}
              <AccordionItem value="price" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">Price Range</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
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
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Property Type */}
              <AccordionItem value="property-type" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-semibold">Property Type</span>
                    {selectedPropertyTypes.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedPropertyTypes.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3">
                    {propertyTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedPropertyTypes.includes(type)}
                          onCheckedChange={() => handlePropertyTypeToggle(type)}
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Star Rating */}
              <AccordionItem value="star-rating" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span className="font-semibold">Star Rating</span>
                    {selectedStarRatings.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedStarRatings.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`star-${rating}`}
                          checked={selectedStarRatings.includes(rating)}
                          onCheckedChange={() => handleStarRatingToggle(rating)}
                        />
                        <label
                          htmlFor={`star-${rating}`}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                        >
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                          ))}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Amenities */}
              <AccordionItem value="amenities" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span className="font-semibold">Amenities</span>
                    {selectedAmenities.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedAmenities.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
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
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Apply Button */}
            <div className="mt-6">
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
                setSelectedPropertyTypes([]);
                onPropertyTypesChange?.([]);
                setSelectedStarRatings([]);
                onStarRatingsChange?.([]);
                setPriceRange([0, 1000]);
                onPriceRangeChange?.(0, 1000);
              }}
              className="text-xs gap-1 h-7"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedAmenities.length > 0 || selectedPropertyTypes.length > 0 || selectedStarRatings.length > 0 || currentMinRating) && (
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
          {selectedPropertyTypes.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handlePropertyTypeToggle(type)}
              />
            </Badge>
          ))}
          {selectedStarRatings.map((rating) => (
            <Badge key={rating} variant="secondary" className="gap-1">
              {rating} Star
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleStarRatingToggle(rating)}
              />
            </Badge>
          ))}
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
