import { useState } from "react";
import { Search, SlidersHorizontal, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import fineDiningHero from "@/assets/fine-dining-hero.webp";

interface RestaurantSearchHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
  quickFilters?: string[];
  selectedQuickFilter?: string;
  onQuickFilterSelect?: (filter: string) => void;
}

export const RestaurantSearchHero = ({
  searchQuery,
  onSearchChange,
  onOpenFilters,
  quickFilters = ['Michelin Star', 'Fine Dining', 'Romantic', 'Tasting Menu', 'Local Cuisine'],
  selectedQuickFilter,
  onQuickFilterSelect,
}: RestaurantSearchHeroProps) => {
  return (
    <div className="relative h-[400px] sm:h-[500px] md:h-[550px] lg:h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={fineDiningHero}
          alt="Fine Dining Experience"
          className="w-full h-full object-cover"
        loading="lazy"/>
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-emerald/70 via-luxury-emerald/50 to-luxury-emerald/70" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 sm:w-20 h-1 bg-luxury-gold mb-4 sm:mb-6" />
        <h1 className="font-secondary text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light mb-3 sm:mb-4">
          The World's Finest Restaurants
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mb-6 sm:mb-8">
          From Michelin-starred institutions to hidden culinary gems
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-lg shadow-2xl p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-3 sm:gap-4">
              {/* Where Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search city, cuisine, or restaurant name..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 h-12 text-base border-luxury-gold/20 focus:border-luxury-gold"
                />
              </div>

              {/* When Picker - Optional */}
              <div className="relative hidden md:block">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="When?"
                  className="pl-10 h-12 text-base border-luxury-gold/20 focus:border-luxury-gold"
                  readOnly
                />
              </div>

              {/* Filters Button */}
              <Button
                onClick={onOpenFilters}
                size="lg"
                className="h-12 bg-luxury-gold text-luxury-emerald hover:bg-luxury-gold/90 font-medium min-w-[120px]"
              >
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Filters
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-luxury-gold/20">
              {quickFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant={selectedQuickFilter === filter ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedQuickFilter === filter
                      ? "bg-luxury-gold text-luxury-emerald hover:bg-luxury-gold/90"
                      : "border-luxury-gold/30 text-luxury-emerald hover:bg-luxury-gold/10"
                  }`}
                  onClick={() => onQuickFilterSelect?.(filter)}
                >
                  {filter}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
