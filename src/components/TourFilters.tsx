import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Star, Clock } from "lucide-react";

interface TourFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  priceRange: [number, number];
  categories: string[];
  minRating?: number;
  duration?: string[];
}

const ACTIVITY_CATEGORIES = [
  { id: 'SIGHTSEEING', label: 'Sightseeing & Tours' },
  { id: 'SHOWS', label: 'Shows & Entertainment' },
  { id: 'SPORTS', label: 'Sports & Activities' },
  { id: 'WATER_SPORTS', label: 'Water Sports' },
  { id: 'ADVENTURE', label: 'Adventure & Outdoor' },
  { id: 'ARTS_AND_CULTURE', label: 'Museums & Culture' },
  { id: 'FOOD_AND_DINING', label: 'Food & Wine' },
  { id: 'WELLNESS', label: 'Wellness & Spa' },
  { id: 'NATURE', label: 'Nature & Wildlife' },
  { id: 'NIGHTLIFE', label: 'Nightlife' },
];

const DURATION_OPTIONS = [
  { id: 'half-day', label: 'Half Day (< 4 hours)' },
  { id: 'full-day', label: 'Full Day (4-8 hours)' },
  { id: 'multi-day', label: 'Multi-Day' },
];

export default function TourFilters({ onFilterChange }: TourFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | undefined>();
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);

  const handlePriceChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]];
    setPriceRange(newRange);
    emitFilterChange(newRange, selectedCategories, minRating, selectedDurations);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(c => c !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newCategories);
    emitFilterChange(priceRange, newCategories, minRating, selectedDurations);
  };

  const handleRatingChange = (rating: number) => {
    const newRating = minRating === rating ? undefined : rating;
    setMinRating(newRating);
    emitFilterChange(priceRange, selectedCategories, newRating, selectedDurations);
  };

  const handleDurationToggle = (durationId: string) => {
    const newDurations = selectedDurations.includes(durationId)
      ? selectedDurations.filter(d => d !== durationId)
      : [...selectedDurations, durationId];
    
    setSelectedDurations(newDurations);
    emitFilterChange(priceRange, selectedCategories, minRating, newDurations);
  };

  const emitFilterChange = (
    price: [number, number],
    categories: string[],
    rating?: number,
    durations?: string[]
  ) => {
    onFilterChange({
      priceRange: price,
      categories,
      minRating: rating,
      duration: durations,
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
              max={1000}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <Label>Activity Type</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ACTIVITY_CATEGORIES.map(category => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <label
                  htmlFor={category.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {category.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <Label>Minimum Rating</Label>
          </div>
          <div className="space-y-2">
            {[4.0, 4.5].map(rating => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={minRating === rating}
                  onCheckedChange={() => handleRatingChange(rating)}
                />
                <label
                  htmlFor={`rating-${rating}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1"
                >
                  {rating}+ <Star className="h-3 w-3 fill-current text-yellow-500" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label>Duration</Label>
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
      </CardContent>
    </Card>
  );
}
