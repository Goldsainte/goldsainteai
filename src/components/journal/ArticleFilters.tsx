import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface ArticleFiltersProps {
  onFilterChange: (filters: {
    category: string;
    location: string;
    search: string;
  }) => void;
}

const CATEGORIES = [
  "All",
  "Destinations",
  "Inspiration",
  "Food & Drink",
  "Culture",
  "Adventure",
];

export function ArticleFilters({ onFilterChange }: ArticleFiltersProps) {
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFilterChange({ category: value, location, search });
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    onFilterChange({ category, location: value, search });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ category, location, search: value });
  };

  const handleClearFilters = () => {
    setCategory("All");
    setLocation("");
    setSearch("");
    onFilterChange({ category: "All", location: "", search: "" });
  };

  const hasActiveFilters = category !== "All" || location || search;

  return (
    <div className="bg-background/50 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 mb-8">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Location
            </label>
            <Input
              placeholder="Search locations..."
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
            />
          </div>

          {/* Search Input */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
