import { useState } from "react";
import { Search, MapPin, Calendar as CalendarIcon, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import resortPoolHero from "@/assets/luxury-resort-pool.webp";

interface PackageSearchHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onOpenFilters: () => void;
  onQuickFilterClick?: (filterType: string) => void;
  onClearSearch?: () => void;
}

export const PackageSearchHero = ({
  searchQuery,
  onSearchChange,
  onSearch,
  onOpenFilters,
  onQuickFilterClick,
  onClearSearch,
}: PackageSearchHeroProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px] flex items-center justify-center">
      <img
        src={resortPoolHero}
        alt="Luxury Travel Destination"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-luxury-emerald/90 via-luxury-emerald/50 to-luxury-emerald/30" />
      
      <div className="relative z-10 w-full max-w-5xl px-3 sm:px-4 md:px-6">
        <div className="w-20 h-1 bg-luxury-gold mx-auto mb-6" />
        <h1 className="hidden sm:block font-secondary text-3xl md:text-4xl lg:text-5xl text-white text-center mb-4 font-light">
          Discover Your Perfect Journey
        </h1>
        <p className="hidden sm:block text-white/90 text-center text-base md:text-lg mb-8 max-w-2xl mx-auto">
          Handpicked luxury travel experiences curated for the discerning explorer
        </p>

        
        {/* Search Bar - Viator Style */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Where to */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 min-h-[56px] border-b md:border-b-0 md:border-r border-border hover:bg-luxury-gold/10 transition-all duration-300 cursor-pointer">
              <div className="flex-shrink-0">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <label className="text-[10px] sm:text-xs font-semibold text-foreground block mb-1">Where to?</label>
                <Input
                  type="text"
                  placeholder="Search for a place or activity"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  className="border-0 focus-visible:ring-0 p-0 h-auto text-sm sm:text-base placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* When */}
            <div className="flex-1">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 min-h-[56px] text-left hover:bg-luxury-gold/10 transition-all duration-300">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] sm:text-xs font-semibold text-foreground block mb-1">When</label>
                      <span className="text-sm sm:text-base text-muted-foreground">
                        {dateRange?.from ? (
                          dateRange.to ? (
                            `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                          ) : (
                            format(dateRange.from, "MMM dd, yyyy")
                          )
                        ) : (
                          "Select Dates"
                        )}
                      </span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      if (range?.from && range?.to) {
                        setCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={window.innerWidth < 768 ? 1 : 2}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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

        {/* Quick Filter Chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto flex-nowrap px-3 pb-2 scrollbar-none relative z-10">
          {['Adventure', 'Luxury', 'Family-Friendly', 'Budget', 'Romantic'].map((filter) => (
            <button
              key={filter}
              onClick={() => onQuickFilterClick?.(filter)}
              className="h-8 px-3 bg-luxury-ivory/10 hover:bg-luxury-gold text-white hover:text-luxury-emerald rounded-full text-[11px] backdrop-blur-sm border border-luxury-gold/30 transition-all duration-300 whitespace-nowrap flex-shrink-0"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
