import { useState } from "react";
import { Search, MapPin, Calendar as CalendarIcon, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface PackageSearchHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onOpenFilters: () => void;
  dataSource: 'amadeus' | 'agent';
  onDataSourceChange: (source: 'amadeus' | 'agent') => void;
}

export const PackageSearchHero = ({
  searchQuery,
  onSearchChange,
  onSearch,
  onOpenFilters,
  dataSource,
  onDataSourceChange,
}: PackageSearchHeroProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="relative h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-30"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80')"
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-[36px] sm:text-[45px] md:text-[54px] font-bold text-white mb-4 font-secondary">
          CoCurated Journeys + Live Deals
        </h1>
        <p className="text-xl text-white/90 mb-6">
          Discover exclusive travel experiences co-created with top creators and agents, alongside real-time packages you can book instantly. Curated inspiration meets live deals, all in one place.
        </p>

        {/* Data Source Toggle */}
        <div className="flex justify-center mb-6">
          <ToggleGroup 
            type="single" 
            value={dataSource} 
            onValueChange={(value) => value && onDataSourceChange(value as 'amadeus' | 'agent')}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="amadeus" 
              className="data-[state=on]:bg-white data-[state=on]:text-primary text-white px-6 hover:bg-[#bfad72] hover:text-white transition-colors"
            >
              Amadeus Tours
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="agent" 
              className="data-[state=on]:bg-white data-[state=on]:text-primary text-white px-6 hover:bg-[#bfad72] hover:text-white transition-colors"
            >
              CoCurated by Agents
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {/* Search Bar - Viator Style */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Where to */}
            <div className="flex-1 flex items-center gap-3 px-6 py-4 border-b md:border-b-0 md:border-r border-border hover:bg-[#bfad72]/20 transition-colors cursor-pointer">
              <div className="flex-shrink-0">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <label className="text-xs font-semibold text-foreground block mb-1">Where to?</label>
                <Input
                  type="text"
                  placeholder="Search for a place or activity"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  className="border-0 focus-visible:ring-0 p-0 h-auto text-base placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* When */}
            <div className="flex-1">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-[#bfad72]/20 transition-colors">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-foreground block mb-1">When</label>
                      <span className="text-base text-muted-foreground">
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
                <PopoverContent className="w-auto p-0" align="start">
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
                    numberOfMonths={2}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Button */}
            <div className="flex items-center p-2">
              <Button onClick={onSearch} size="lg" className="rounded-xl px-8 h-full">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Button Below */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={onOpenFilters}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          {["Adventure", "Luxury", "Family-Friendly", "Budget", "Romantic"].map((tag) => (
            <button
              key={tag}
              className="px-4 py-2 bg-white/20 hover:bg-[#bfad72] hover:text-white text-white rounded-full text-sm font-medium transition-colors backdrop-blur-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
