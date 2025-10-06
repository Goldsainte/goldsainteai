import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Users, Search, Plane, Hotel, UtensilsCrossed, Ticket } from "lucide-react";
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
      case "restaurants": return "Search restaurants";
      case "events": return "Search events";
      default: return "Search";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0">
      <div className="bg-card border border-border rounded-3xl shadow-lg p-6 md:p-8" role="search" aria-label="Travel search">
        <div className="mb-6 text-center" aria-live="polite" aria-atomic="true">
          <p className="text-lg md:text-xl text-muted-foreground transition-opacity duration-500">
            {rotatingMessages[currentMessageIndex]}
          </p>
        </div>
        <Tabs value={searchType} onValueChange={setSearchType} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 h-auto" aria-label="Search type selection">
            <TabsTrigger value="hotels" className="gap-2 py-4 text-sm md:text-base min-h-[48px]" aria-label="Search hotels">
              <Hotel className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Hotels</span>
              <span className="sm:hidden sr-only">Hotels</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="gap-2 py-4 text-sm md:text-base min-h-[48px]" aria-label="Search flights">
              <Plane className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Flights</span>
              <span className="sm:hidden sr-only">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="gap-2 py-4 text-sm md:text-base min-h-[48px]" aria-label="Search restaurants">
              <UtensilsCrossed className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Restaurants</span>
              <span className="sm:hidden sr-only">Restaurants</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2 py-4 text-sm md:text-base min-h-[48px]" aria-label="Search events">
              <Ticket className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Events</span>
              <span className="sm:hidden sr-only">Events</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
          <div className="relative">
            {searchType === "restaurants" ? (
              <CityAutocomplete
                placeholder="City, restaurant name, or cuisine"
                className="h-16 text-lg rounded-xl pl-12"
                value={location}
                onChange={setLocation}
              />
            ) : (
              <>
                <MapPin className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={searchType === "flights" ? "From where?" : "Where to?"}
                  className="pl-12 h-16 border-border text-lg rounded-xl"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </>
            )}
          </div>

          {searchType === "hotels" && (
            <>
              <div className="md:col-span-2">
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>

              <div className="relative">
                <label htmlFor="guests" className="sr-only">Number of guests</label>
                <Users className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="2 guests"
                  className="pl-12 h-16 border-border text-lg rounded-xl"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  aria-label="Number of guests"
                />
              </div>
            </>
          )}

          {searchType === "flights" && (
            <div className="relative md:col-span-3">
              <label htmlFor="departure-date" className="sr-only">Departure date</label>
              <Calendar className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                id="departure-date"
                type="date"
                placeholder="Departure date"
                className="pl-12 h-16 border-border text-lg rounded-xl"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                aria-label="Departure date"
              />
            </div>
          )}

          {searchType === "events" && (
            <div className="relative md:col-span-3">
              <label htmlFor="event-date" className="sr-only">Event date</label>
              <Calendar className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                id="event-date"
                type="date"
                placeholder="Event date"
                className="pl-12 h-16 border-border text-lg rounded-xl"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                aria-label="Event date"
              />
            </div>
          )}

          {searchType === "restaurants" && (
            <div className="md:col-span-3" />
          )}
        </div>

        <Button 
          className="w-full mt-6 h-16 bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-semibold rounded-xl min-h-[48px]"
          onClick={handleSearch}
          aria-label={`${getSearchButtonText()}`}
        >
          <Search className="h-6 w-6 mr-2" aria-hidden="true" />
          {getSearchButtonText()}
        </Button>
      </div>
    </div>
  );
};
