import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Users, Search, Plane, Hotel, UtensilsCrossed, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "2");

  // Update form when URL params change
  useEffect(() => {
    const type = searchParams.get("type");
    if (type) setSearchType(type);
    const loc = searchParams.get("location");
    if (loc) setLocation(loc);
  }, [searchParams]);

  const handleSearch = () => {
    if (!location.trim()) return;
    
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
    trackSearch(searchType as any, {
      location,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      guests: guests || null
    });
    
    const params = new URLSearchParams({
      type: searchType,
      location,
      ...(searchType === "hotels" && { checkIn, checkOut, guests }),
      ...(searchType === "flights" && { checkIn }),
      ...(searchType === "events" && { checkIn })
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
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0">
      <div className="bg-card border border-border rounded-2xl shadow-sm p-4 md:p-6">
        <Tabs value={searchType} onValueChange={setSearchType} className="mb-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="hotels" className="gap-1 md:gap-2 py-3 text-xs md:text-sm">
              <Hotel className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Hotels</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="gap-1 md:gap-2 py-3 text-xs md:text-sm">
              <Plane className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="gap-1 md:gap-2 py-3 text-xs md:text-sm">
              <UtensilsCrossed className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Restaurants</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1 md:gap-2 py-3 text-xs md:text-sm">
              <Ticket className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchType === "flights" ? "From where?" : "Where to?"}
              className="pl-10 h-12 border-border text-base"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {searchType === "hotels" && (
            <>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  placeholder="Check-in"
                  className="pl-10 h-12 border-border text-base"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  placeholder="Check-out"
                  className="pl-10 h-12 border-border text-base"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="relative">
                <Users className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  placeholder="2 guests"
                  className="pl-10 h-12 border-border text-base"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                />
              </div>
            </>
          )}

          {searchType === "flights" && (
            <div className="relative md:col-span-3">
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                placeholder="Departure date"
                className="pl-10 h-12 border-border text-base"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
          )}

          {searchType === "events" && (
            <div className="relative md:col-span-3">
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                placeholder="Event date"
                className="pl-10 h-12 border-border text-base"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
          )}

          {searchType === "restaurants" && (
            <div className="md:col-span-3" />
          )}
        </div>

        <Button 
          className="w-full mt-4 h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium"
          onClick={handleSearch}
        >
          <Search className="h-5 w-5 mr-2" />
          {getSearchButtonText()}
        </Button>
      </div>
    </div>
  );
};
