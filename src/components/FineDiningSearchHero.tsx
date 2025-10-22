import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import fineDiningHeroImage from "@/assets/fine-dining-search-hero.jpg";

interface FineDiningSearchHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onOpenFilters: () => void;
  onClearSearch?: () => void;
}

export const FineDiningSearchHero = ({
  searchQuery,
  onSearchChange,
  onSearch,
  onOpenFilters,
  onClearSearch,
}: FineDiningSearchHeroProps) => {
  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px] flex items-center justify-center">
      <img
        src={fineDiningHeroImage}
        alt="Fine Dining Experience"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-luxury-emerald/90 via-luxury-emerald/50 to-luxury-emerald/30" />
      
      <div className="relative z-10 w-full max-w-5xl px-3 sm:px-4 md:px-6">
        <div className="w-20 h-1 bg-luxury-gold mx-auto mb-6" />
        <h1 className="font-secondary text-3xl md:text-4xl lg:text-5xl text-white text-center mb-4 font-light">
          Your Passport to Culinary Excellence
        </h1>
        <p className="text-white/90 text-center text-base md:text-lg mb-8 max-w-2xl mx-auto">
          Explore the finest restaurants and gastronomic experiences worldwide
        </p>
        
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Where to */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 min-h-[56px] hover:bg-luxury-gold/10 transition-all duration-300 cursor-pointer">
              <div className="flex-shrink-0">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <label className="text-[10px] sm:text-xs font-semibold text-foreground block mb-1">Where to?</label>
                <Input
                  type="text"
                  placeholder="Search for a city or destination"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  className="border-0 focus-visible:ring-0 p-0 h-auto text-sm sm:text-base placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-center p-2">
              <Button onClick={onSearch} size="sm" className="rounded-xl px-4 md:px-6 h-10 sm:h-12 md:h-14">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Button Below */}
        <div className="mt-4 mb-3 sm:mb-4 flex flex-wrap gap-3 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className="bg-luxury-ivory/20 hover:bg-luxury-gold/90 text-white border-luxury-gold/30 backdrop-blur-sm transition-all duration-300 rounded-full h-9 px-3 text-xs sm:h-11 sm:px-4 sm:text-sm"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          {(searchQuery?.trim() && onClearSearch) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSearch}
              className="bg-luxury-ivory/20 hover:bg-red-500/90 text-white border-luxury-gold/30 backdrop-blur-sm transition-all duration-300 rounded-full h-9 px-3 text-xs sm:h-11 sm:px-4 sm:text-sm"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Search
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
