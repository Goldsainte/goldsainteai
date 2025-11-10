import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Users, Search, Plane, Hotel, Ticket } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSearchTracking } from "@/hooks/useSearchTracking";

export const SearchBar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addSearch } = useSearchHistory(); // localStorage for sidebar
  const { trackSearch } = useSearchTracking(); // database for authenticated users
  const [searchType, setSearchType] = useState(searchParams.get("type") || "hotels");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "2");
  
  // Date range for hotels
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    if (checkInParam && checkOutParam) {
      return {
        from: new Date(checkInParam),
        to: new Date(checkOutParam)
      };
    }
    return undefined;
  });
  
  // Single date for flights/events
  const [singleDate, setSingleDate] = useState(searchParams.get("checkIn") || "");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const rotatingMessages = [
    "Where luxury meets adventure...",
    "Discover your next destination...",
    "Experience world-class hospitality...",
    "Find exclusive travel experiences...",
    "Your journey begins here..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update form when URL params change
  useEffect(() => {
    const type = searchParams.get("type");
    if (type) setSearchType(type);
    const loc = searchParams.get("location");
    if (loc) setLocation(loc);
  }, [searchParams]);

  const handleSearch = () => {
    if (!location.trim()) return;
    
    const checkIn = searchType === "hotels" && dateRange?.from 
      ? format(dateRange.from, "yyyy-MM-dd")
      : singleDate;
    const checkOut = searchType === "hotels" && dateRange?.to 
      ? format(dateRange.to, "yyyy-MM-dd")
      : undefined;
    
    const searchData = {
      type: searchType,
      location,
      ...(searchType === "hotels" && { checkIn, checkOut, guests }),
      ...(searchType === "flights" && { checkIn }),
      ...(searchType === "events" && { checkIn })
    };
    
    // Save to localStorage for sidebar (immediate)
    addSearch(searchData);
    
    // Save to database for authenticated users (async)
    // Normalize search type to singular form for database
    const normalizedType = searchType.replace(/s$/, '') as 'hotel' | 'flight' | 'car' | 'restaurant' | 'event' | 'destination';
    trackSearch(normalizedType, {
      location,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      guests: guests || null
    });
    
    const params = new URLSearchParams({
      type: searchType,
      location,
      ...(searchType === "hotels" && checkIn && checkOut && { checkIn, checkOut, guests }),
      ...(searchType === "flights" && checkIn && { checkIn }),
      ...(searchType === "events" && checkIn && { checkIn })
    });
    navigate(`/search?${params.toString()}`);
  };

  const getSearchButtonText = () => {
    switch (searchType) {
      case "hotels": return "Search hotels";
      case "flights": return "Search flights";
      case "events": return "Search events";
      default: return "Search";
    }
  };

  return (
    <div className="w-full">
      <div className="bg-background" role="search" aria-label="Travel search">
        <Tabs value={searchType} onValueChange={setSearchType} className="mb-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-auto rounded-xl" aria-label="Search type selection">
            <TabsTrigger 
              value="hotels" 
              className="gap-1 py-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" 
              aria-label="Search hotels"
            >
              <Hotel className="h-4 w-4" aria-hidden="true" />
            </TabsTrigger>
            <TabsTrigger 
              value="flights" 
              className="gap-1 py-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" 
              aria-label="Search flights"
            >
              <Plane className="h-4 w-4" aria-hidden="true" />
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="gap-1 py-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" 
              aria-label="Search events"
            >
              <Ticket className="h-4 w-4" aria-hidden="true" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          <div className="w-full flex justify-center">
            <div className="relative w-full" style={{ maxWidth: 'clamp(320px, 100%, 960px)' }}>
              <MapPin className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
              <Input
                type="search"
                placeholder={searchType === "flights" ? "From where?" : "Where to?"}
                className="w-full rounded-full border border-[#D8C89B] bg-white/90 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B44]/30 focus:border-[#0E4B44] placeholder:text-gray-500 text-gray-900 transition h-[52px] sm:h-14 lg:h-16 pl-12 sm:pl-[3.25rem] pr-4 sm:pr-5 text-base sm:text-[17px] lg:text-lg leading-[1.25] touch-manipulation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label={searchType === "flights" ? "Departure location" : "Destination"}
              />
            </div>
          </div>

          {searchType === "hotels" && (
            <>
              <div>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>

              <div className="w-full flex justify-center">
                <div className="relative w-full" style={{ maxWidth: 'clamp(320px, 100%, 960px)' }}>
                  <label htmlFor="guests" className="sr-only">Number of guests</label>
                  <Users className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
                  <Input
                    id="guests"
                    type="text"
                    placeholder="1 Guest, 1 Room"
                    className="w-full rounded-full border border-[#D8C89B] bg-white/90 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B44]/30 focus:border-[#0E4B44] placeholder:text-gray-500 text-gray-900 transition h-[52px] sm:h-14 lg:h-16 pl-12 sm:pl-[3.25rem] pr-4 sm:pr-5 text-base sm:text-[17px] lg:text-lg leading-[1.25] touch-manipulation"
                    value={guests ? `${guests} Guest${parseInt(guests) > 1 ? 's' : ''}, 1 Room` : ""}
                    onChange={(e) => {
                      const match = e.target.value.match(/\d+/);
                      if (match) setGuests(match[0]);
                    }}
                    aria-label="Number of guests and rooms"
                  />
                </div>
              </div>
            </>
          )}

          {searchType === "flights" && (
            <div className="w-full flex justify-center">
              <div className="relative w-full" style={{ maxWidth: 'clamp(320px, 100%, 960px)' }}>
                <label htmlFor="departure-date" className="sr-only">Departure date</label>
                <Calendar className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
                <Input
                  id="departure-date"
                  type="date"
                  placeholder="Departure date"
                  className="w-full rounded-full border border-[#D8C89B] bg-white/90 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B44]/30 focus:border-[#0E4B44] placeholder:text-gray-500 text-gray-900 transition h-[52px] sm:h-14 lg:h-16 pl-12 sm:pl-[3.25rem] pr-4 sm:pr-5 text-base sm:text-[17px] lg:text-lg leading-[1.25] touch-manipulation"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  aria-label="Departure date"
                />
              </div>
            </div>
          )}

          {searchType === "events" && (
            <div className="w-full flex justify-center">
              <div className="relative w-full" style={{ maxWidth: 'clamp(320px, 100%, 960px)' }}>
                <label htmlFor="event-date" className="sr-only">Event date</label>
                <Calendar className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
                <Input
                  id="event-date"
                  type="date"
                  placeholder="Event date"
                  className="w-full rounded-full border border-[#D8C89B] bg-white/90 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B44]/30 focus:border-[#0E4B44] placeholder:text-gray-500 text-gray-900 transition h-[52px] sm:h-14 lg:h-16 pl-12 sm:pl-[3.25rem] pr-4 sm:pr-5 text-base sm:text-[17px] lg:text-lg leading-[1.25] touch-manipulation"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  aria-label="Event date"
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex justify-center">
          <Button 
            className="w-full mt-4 h-[52px] sm:h-14 lg:h-16 bg-[#0E4B44] text-white hover:opacity-95 text-base sm:text-[17px] lg:text-lg font-semibold rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E4B44] touch-manipulation"
            style={{ maxWidth: 'clamp(320px, 100%, 960px)' }}
            onClick={handleSearch}
            aria-label={`${getSearchButtonText()}`}
          >
            <Search className="h-5 w-5 mr-2" aria-hidden="true" />
            {getSearchButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
};
