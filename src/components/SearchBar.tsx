import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Users, Search, Plane, Hotel, UtensilsCrossed, Ticket, Car } from "lucide-react";
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
      case "cars": return "Search cars";
      case "restaurants": return "Search restaurants";
      case "events": return "Search events";
      default: return "Search";
    }
  };

  return (
    <div className="w-full">
      <div className="bg-background" role="search" aria-label="Travel search">
        <Tabs value={searchType} onValueChange={setSearchType} className="mb-4">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 h-auto rounded-xl" aria-label="Search type selection">
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
              value="cars" 
              className="gap-1 py-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" 
              aria-label="Search cars"
            >
              <Car className="h-4 w-4" aria-hidden="true" />
            </TabsTrigger>
            <TabsTrigger 
              value="restaurants" 
              className="gap-1 py-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" 
              aria-label="Search restaurants"
            >
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
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
          <div className="relative">
            {searchType === "restaurants" ? (
              <CityAutocomplete
                placeholder="City, restaurant name, or cuisine"
                className="h-14 text-base rounded-xl pl-12 bg-muted/30 border-muted"
                value={location}
                onChange={setLocation}
              />
            ) : (
              <>
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                <Input
                  placeholder={searchType === "flights" ? "From where?" : searchType === "cars" ? "Pick-up location" : "Where to?"}
                  className="pl-12 h-14 border-muted bg-muted/30 text-base rounded-xl"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </>
            )}
          </div>

          {searchType === "hotels" && (
            <>
              <div>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>

              <div className="relative">
                <label htmlFor="guests" className="sr-only">Number of guests</label>
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
                <Input
                  id="guests"
                  type="text"
                  placeholder="1 Guest, 1 Room"
                  className="pl-12 h-14 border-muted bg-muted/30 text-base rounded-xl"
                  value={guests ? `${guests} Guest${parseInt(guests) > 1 ? 's' : ''}, 1 Room` : ""}
                  onChange={(e) => {
                    const match = e.target.value.match(/\d+/);
                    if (match) setGuests(match[0]);
                  }}
                  aria-label="Number of guests and rooms"
                />
              </div>
            </>
          )}

          {(searchType === "flights" || searchType === "cars") && (
            <div className="relative">
              <label htmlFor="departure-date" className="sr-only">
                {searchType === "cars" ? "Pick-up date" : "Departure date"}
              </label>
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
              <Input
                id="departure-date"
                type="date"
                placeholder={searchType === "cars" ? "Pick-up date" : "Departure date"}
                className="pl-12 h-14 border-muted bg-muted/30 text-base rounded-xl"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                aria-label={searchType === "cars" ? "Pick-up date" : "Departure date"}
              />
            </div>
          )}

          {searchType === "events" && (
            <div className="relative">
              <label htmlFor="event-date" className="sr-only">Event date</label>
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
              <Input
                id="event-date"
                type="date"
                placeholder="Event date"
                className="pl-12 h-14 border-muted bg-muted/30 text-base rounded-xl"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                aria-label="Event date"
              />
            </div>
          )}
        </div>

        <Button 
          className="w-full mt-4 h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold rounded-xl min-h-[48px] shadow-lg"
          onClick={handleSearch}
          aria-label={`${getSearchButtonText()}`}
        >
          <Search className="h-5 w-5 mr-2" aria-hidden="true" />
          {getSearchButtonText()}
        </Button>
      </div>
    </div>
  );
};
