import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Star, Wifi, Car, Coffee, Dumbbell, Waves, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

export interface HotelFilters {
  minStarRating: number;
  maxDistance: number;
  amenities: string[];
}

interface HotelFilterSidebarProps {
  filters: HotelFilters;
  onFiltersChange: (filters: HotelFilters) => void;
  resultCount: number;
}

const AMENITY_OPTIONS = [
  { id: 'wifi', label: 'Free WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'gym', label: 'Gym/Fitness', icon: Dumbbell },
  { id: 'pool', label: 'Pool', icon: Waves },
];

export function HotelFilterSidebar({ filters, onFiltersChange, resultCount }: HotelFilterSidebarProps) {
  const handleStarRatingChange = (value: number[]) => {
    onFiltersChange({ ...filters, minStarRating: value[0] });
  };

  const handleDistanceChange = (value: number[]) => {
    onFiltersChange({ ...filters, maxDistance: value[0] });
  };

  const handleAmenityToggle = (amenityId: string) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(a => a !== amenityId)
      : [...filters.amenities, amenityId];
    onFiltersChange({ ...filters, amenities: newAmenities });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      minStarRating: 0,
      maxDistance: 50,
      amenities: []
    });
  };

  const hasActiveFilters = filters.minStarRating > 0 || filters.maxDistance < 50 || filters.amenities.length > 0;

  return (
    <Sidebar className="border-r border-border bg-background w-72">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {resultCount} {resultCount === 1 ? 'hotel' : 'hotels'} found
        </p>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-6">
        {/* Star Rating Filter */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4" />
            Minimum Star Rating
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {filters.minStarRating === 0 ? 'Any' : `${filters.minStarRating}+ Stars`}
                </span>
                {filters.minStarRating > 0 && (
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < filters.minStarRating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Slider
                value={[filters.minStarRating]}
                onValueChange={handleStarRatingChange}
                min={0}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Any</span>
                <span>5★</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Distance Filter */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4" />
            Distance from Center
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {filters.maxDistance === 50 ? 'Any distance' : `Within ${filters.maxDistance} km`}
                </span>
              </div>
              <Slider
                value={[filters.maxDistance]}
                onValueChange={handleDistanceChange}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>50+ km</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Amenities Filter */}
        <SidebarGroup>
          <SidebarGroupLabel className="mb-3">
            Amenities
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const Icon = amenity.icon;
                const isChecked = filters.amenities.includes(amenity.id);
                
                return (
                  <div key={amenity.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={amenity.id}
                      checked={isChecked}
                      onCheckedChange={() => handleAmenityToggle(amenity.id)}
                    />
                    <Label
                      htmlFor={amenity.id}
                      className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {amenity.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.minStarRating > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.minStarRating}+ Stars
                </Badge>
              )}
              {filters.maxDistance < 50 && (
                <Badge variant="secondary" className="text-xs">
                  Within {filters.maxDistance}km
                </Badge>
              )}
              {filters.amenities.map(amenityId => {
                const amenity = AMENITY_OPTIONS.find(a => a.id === amenityId);
                return amenity ? (
                  <Badge key={amenityId} variant="secondary" className="text-xs">
                    {amenity.label}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
