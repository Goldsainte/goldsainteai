import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Calendar, MapPin, Users, Search, Plane, Hotel, Ticket, ArrowLeftRight, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSearchTracking } from "@/hooks/useSearchTracking";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { CityAutocomplete } from "@/components/CityAutocomplete";

// Helper to parse date strings as local dates (not UTC)
const parseLocalDate = (dateString: string | null): Date | undefined => {
  if (!dateString) return undefined;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Add days to a date (preserving local time)
const addDays = (date: Date, days: number): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
};

interface EnhancedSearchBarProps {
  isCompact?: boolean;
}

export const EnhancedSearchBar = ({ isCompact = false }: EnhancedSearchBarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeLocation = useLocation();
  const { addSearch } = useSearchHistory();
  const { trackSearch } = useSearchTracking();

  // Common states
  const [searchType, setSearchType] = useState(searchParams.get("type") || "hotels");

  // Flight-specific states
  const [flightType, setFlightType] = useState<"one-way" | "round-trip" | "multi-city">("round-trip");
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    parseLocalDate(searchParams.get("departureDate"))
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    parseLocalDate(searchParams.get("returnDate"))
  );
  const [cabinClass, setCabinClass] = useState(searchParams.get("cabinClass") || "ECONOMY");
  const [flightPassengers, setFlightPassengers] = useState({
    adults: parseInt(searchParams.get("adults") || "1"),
    children: parseInt(searchParams.get("children") || "0"),
    infants: parseInt(searchParams.get("infants") || "0"),
  });

  // Hotel-specific states
  const [hotelLocation, setHotelLocation] = useState(searchParams.get("location") || "");
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    parseLocalDate(searchParams.get("checkIn"))
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    parseLocalDate(searchParams.get("checkOut"))
  );
  const [rooms, setRooms] = useState(parseInt(searchParams.get("rooms") || "1"));
  const [hotelGuests, setHotelGuests] = useState({
    adults: parseInt(searchParams.get("adults") || "2"),
    children: parseInt(searchParams.get("children") || "0"),
  });

  // Events states
  const [eventLocation, setEventLocation] = useState(searchParams.get("location") || "");
  const [eventDate, setEventDate] = useState<Date | undefined>(
    parseLocalDate(searchParams.get("date"))
  );
  const [eventCategory, setEventCategory] = useState(searchParams.get("category") || "all");

  const [showPassengerPopover, setShowPassengerPopover] = useState(false);
  // Sync state with URL parameters when they change
  useEffect(() => {
    const params = new URLSearchParams(routeLocation.search);
    const currentType = params.get("type") || "hotels";
    const loc = params.get("location") || "";

    setSearchType(currentType);

    if (currentType === "hotels") {
      setHotelLocation(loc);
      const checkInParam = params.get("checkIn");
      const checkOutParam = params.get("checkOut");
      
      if (checkInParam) {
        const newCheckIn = new Date(checkInParam);
        if (!checkInDate || newCheckIn.getTime() !== checkInDate.getTime()) {
          setCheckInDate(newCheckIn);
        }
      }
      if (checkOutParam) {
        const newCheckOut = new Date(checkOutParam);
        if (!checkOutDate || newCheckOut.getTime() !== checkOutDate.getTime()) {
          setCheckOutDate(newCheckOut);
        }
      }
    } else if (currentType === "events") {
      setEventLocation(loc);
      const dateParam = params.get("date");
      
      if (dateParam) {
        const newDate = parseLocalDate(dateParam);
        if (!eventDate || !newDate || newDate.getTime() !== eventDate.getTime()) {
          setEventDate(newDate);
        }
      }
    } else if (currentType === "flights") {
      const originParam = params.get("origin");
      const destinationParam = params.get("destination");
      const departureDateParam = params.get("departureDate");
      const returnDateParam = params.get("returnDate");

      if (originParam) setOrigin(originParam);
      if (destinationParam) setDestination(destinationParam);
      
      if (departureDateParam) {
        const newDepartureDate = parseLocalDate(departureDateParam);
        if (!departureDate || !newDepartureDate || newDepartureDate.getTime() !== departureDate.getTime()) {
          setDepartureDate(newDepartureDate);
        }
      }
      
      if (returnDateParam) {
        const newReturnDate = parseLocalDate(returnDateParam);
        if (!returnDate || !newReturnDate || newReturnDate.getTime() !== returnDate.getTime()) {
          setReturnDate(newReturnDate);
        }
      }
    }
  }, [routeLocation.search, checkInDate, checkOutDate, eventDate, departureDate, returnDate]);

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const totalFlightPassengers = flightPassengers.adults + flightPassengers.children + flightPassengers.infants;
  const totalHotelGuests = hotelGuests.adults + hotelGuests.children;

  const handleSearch = () => {
    let searchData: any = { type: searchType };
    let params = new URLSearchParams({ type: searchType });

    if (searchType === "flights") {
      if (!origin.trim() || !destination.trim() || !departureDate) {
        return;
      }
      searchData = {
        ...searchData,
        origin,
        destination,
        departureDate: format(departureDate, "yyyy-MM-dd"),
        returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : null,
        cabinClass,
        adults: flightPassengers.adults.toString(),
        children: flightPassengers.children.toString(),
        infants: flightPassengers.infants.toString(),
        flightType,
      };
      params.append("origin", origin);
      params.append("destination", destination);
      params.append("departureDate", format(departureDate, "yyyy-MM-dd"));
      if (returnDate && flightType === "round-trip") {
        params.append("returnDate", format(returnDate, "yyyy-MM-dd"));
      }
      params.append("cabinClass", cabinClass);
      params.append("adults", flightPassengers.adults.toString());
      params.append("children", flightPassengers.children.toString());
      params.append("infants", flightPassengers.infants.toString());
      params.append("flightType", flightType);
    } else if (searchType === "hotels") {
      if (!hotelLocation.trim() || !checkInDate || !checkOutDate) {
        return;
      }
      searchData = {
        ...searchData,
        location: hotelLocation,
        checkIn: format(checkInDate, "yyyy-MM-dd"),
        checkOut: format(checkOutDate, "yyyy-MM-dd"),
        rooms: rooms.toString(),
        adults: hotelGuests.adults.toString(),
        children: hotelGuests.children.toString(),
      };
      params.append("location", hotelLocation);
      params.append("checkIn", format(checkInDate, "yyyy-MM-dd"));
      params.append("checkOut", format(checkOutDate, "yyyy-MM-dd"));
      params.append("rooms", rooms.toString());
      params.append("adults", hotelGuests.adults.toString());
      params.append("children", hotelGuests.children.toString());
    } else if (searchType === "events") {
      if (!eventLocation.trim()) {
        return;
      }
      searchData = {
        ...searchData,
        location: eventLocation,
        date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
        category: eventCategory !== "all" ? eventCategory : null,
      };
      params.append("location", eventLocation);
      if (eventDate) params.append("date", format(eventDate, "yyyy-MM-dd"));
      if (eventCategory && eventCategory !== "all") params.append("category", eventCategory);
    }

    addSearch(searchData);
    // Normalize search type to singular form for database
    const normalizedType = searchType.replace(/s$/, '') as 'hotel' | 'flight' | 'car' | 'restaurant' | 'event' | 'destination';
    trackSearch(normalizedType, searchData);
    navigate(`/search-results?${params.toString()}`);
  };

  // Flight Search UI
  const renderFlightSearch = () => (
    <div className={cn("space-y-4", isCompact && "space-y-2")}>
      {!isCompact && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={flightType === "round-trip" ? "default" : "outline"}
            onClick={() => setFlightType("round-trip")}
            className="flex-1 h-11 text-sm md:text-base"
          >
            Round-trip
          </Button>
          <Button
            type="button"
            variant={flightType === "one-way" ? "default" : "outline"}
            onClick={() => setFlightType("one-way")}
            className="flex-1 h-11 text-sm md:text-base"
          >
            One-way
          </Button>
        </div>
      )}

      <div className={cn("space-y-3", isCompact && "space-y-2")}>
        {/* Origin */}
        <div>
          <AirportAutocomplete
            value={origin}
            onChange={setOrigin}
            placeholder="From (e.g., JFK, New York)"
          />
        </div>

        {/* Swap button - centered on mobile - hide when compact */}
        {!isCompact && (
          <div className="flex justify-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapLocations}
              className="h-10 w-10 rounded-full border border-border hover:bg-accent"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Destination */}
        <div>
          <AirportAutocomplete
            value={destination}
            onChange={setDestination}
            placeholder="To (e.g., LAX, Los Angeles)"
          />
        </div>
      </div>

      {/* Dates - stacked on mobile, side-by-side on desktop */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", isCompact && "gap-2")}>
        {/* Departure Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", isCompact ? "h-9 text-xs" : "h-11 md:h-12 text-sm md:text-base", !departureDate && "text-muted-foreground")}>
              <Calendar className={cn("mr-2 flex-shrink-0", isCompact ? "h-3 w-3" : "h-4 w-4")} />
              <span className="truncate">{departureDate ? format(departureDate, "MMM dd, yyyy") : "Departure"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background z-[100]" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
            <CalendarComponent
              mode="single"
              selected={departureDate}
              onSelect={(date) => {
                if (!date) return;
                setDepartureDate(date);
                if (flightType === "round-trip" && (!returnDate || date >= returnDate)) {
                  setReturnDate(addDays(date, 1));
                }
              }}
              disabled={(date) => date < new Date()}
              initialFocus
              className={cn("pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Return Date */}
        {flightType === "round-trip" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", isCompact ? "h-9 text-xs" : "h-11 md:h-12 text-sm md:text-base", !returnDate && "text-muted-foreground")}> 
                <Calendar className={cn("mr-2 flex-shrink-0", isCompact ? "h-3 w-3" : "h-4 w-4")} />
                <span className="truncate">{returnDate ? format(returnDate, "MMM dd, yyyy") : "Return"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background z-[100]" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
              <CalendarComponent 
                mode="single" 
                selected={returnDate} 
                onSelect={setReturnDate}
                disabled={(date) => date < (departureDate || new Date())}
                initialFocus
                className={cn("pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Passengers & Cabin - stacked on mobile - hide cabin when compact */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", isCompact && "gap-2")}>
        <Popover open={showPassengerPopover} onOpenChange={setShowPassengerPopover}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", isCompact ? "h-9 text-xs" : "h-11 md:h-12 text-sm md:text-base")}>
              <Users className={cn("mr-2 flex-shrink-0", isCompact ? "h-3 w-3" : "h-4 w-4")} />
              <span className="truncate">{totalFlightPassengers} Passenger{totalFlightPassengers !== 1 ? "s" : ""}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-sm bg-background z-[100]" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Adults</p>
                  <p className="text-sm text-muted-foreground">Age 12+</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setFlightPassengers({ ...flightPassengers, adults: Math.max(1, flightPassengers.adults - 1) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{flightPassengers.adults}</span>
                  <Button variant="outline" size="icon" onClick={() => setFlightPassengers({ ...flightPassengers, adults: Math.min(9, flightPassengers.adults + 1) })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Children</p>
                  <p className="text-sm text-muted-foreground">Age 2-11</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setFlightPassengers({ ...flightPassengers, children: Math.max(0, flightPassengers.children - 1) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{flightPassengers.children}</span>
                  <Button variant="outline" size="icon" onClick={() => setFlightPassengers({ ...flightPassengers, children: Math.min(9, flightPassengers.children + 1) })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Infants</p>
                  <p className="text-sm text-muted-foreground">Under 2</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setFlightPassengers({ ...flightPassengers, infants: Math.max(0, flightPassengers.infants - 1) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{flightPassengers.infants}</span>
                  <Button variant="outline" size="icon" onClick={() => setFlightPassengers({ ...flightPassengers, infants: Math.min(flightPassengers.adults, flightPassengers.infants + 1) })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Cabin Class */}
        {!isCompact && (
          <Select value={cabinClass} onValueChange={setCabinClass}>
            <SelectTrigger className="h-11 md:h-12 text-sm md:text-base">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent className="bg-background z-[100]">
              <SelectItem value="ECONOMY">Economy</SelectItem>
              <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
              <SelectItem value="FIRST">First Class</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );

  // Hotel Search UI
  const renderHotelSearch = () => (
    <div className={cn("space-y-4", isCompact && "space-y-2")}>
      <div className="relative">
        <CityAutocomplete
          value={hotelLocation}
          onChange={setHotelLocation}
          placeholder="Where are you going? (City, hotel name, or landmark)"
        />
      </div>

      {/* Dates & Guests - all stacked on mobile */}
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-3", isCompact && "gap-2")}>
        {/* Check-in */}
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", isCompact ? "h-9 text-xs" : "h-11 md:h-12 text-sm md:text-base", !checkInDate && "text-muted-foreground")}>
              <Calendar className={cn("mr-2 flex-shrink-0", isCompact ? "h-3 w-3" : "h-4 w-4")} />
              <span className="truncate">{checkInDate ? format(checkInDate, "MMM dd") : "Check-in"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background z-[100]" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
            <CalendarComponent 
              mode="single" 
              selected={checkInDate} 
              onSelect={setCheckInDate} 
              initialFocus 
              disabled={(date) => date < new Date()} 
              className={cn("pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Check-out */}
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", isCompact ? "h-9 text-xs" : "h-11 md:h-12 text-sm md:text-base", !checkOutDate && "text-muted-foreground")}>
              <Calendar className={cn("mr-2 flex-shrink-0", isCompact ? "h-3 w-3" : "h-4 w-4")} />
              <span className="truncate">{checkOutDate ? format(checkOutDate, "MMM dd") : "Check-out"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background z-[100]" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
            <CalendarComponent 
              mode="single" 
              selected={checkOutDate} 
              onSelect={setCheckOutDate} 
              initialFocus 
              disabled={(date) => date < (checkInDate || new Date())} 
              className={cn("pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Guests & Rooms */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", isCompact ? "h-9 text-xs" : "h-11 md:h-12 text-sm md:text-base")}>
              <Users className={cn("mr-2 flex-shrink-0", isCompact ? "h-3 w-3" : "h-4 w-4")} />
              <span className="truncate">{totalHotelGuests} Guest{totalHotelGuests !== 1 ? "s" : ""}, {rooms} Room{rooms !== 1 ? "s" : ""}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-sm bg-background z-[100]" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Rooms</p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setRooms(Math.max(1, rooms - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{rooms}</span>
                  <Button variant="outline" size="icon" onClick={() => setRooms(Math.min(8, rooms + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Adults</p>
                  <p className="text-sm text-muted-foreground">Age 18+</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setHotelGuests({ ...hotelGuests, adults: Math.max(1, hotelGuests.adults - 1) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{hotelGuests.adults}</span>
                  <Button variant="outline" size="icon" onClick={() => setHotelGuests({ ...hotelGuests, adults: Math.min(30, hotelGuests.adults + 1) })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Children</p>
                  <p className="text-sm text-muted-foreground">Age 0-17</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setHotelGuests({ ...hotelGuests, children: Math.max(0, hotelGuests.children - 1) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{hotelGuests.children}</span>
                  <Button variant="outline" size="icon" onClick={() => setHotelGuests({ ...hotelGuests, children: Math.min(10, hotelGuests.children + 1) })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  // Events Search UI
  const renderEventSearch = () => (
    <div className={cn("space-y-4", isCompact && "space-y-2")}>
      <div className="relative">
        <CityAutocomplete
          value={eventLocation}
          onChange={setEventLocation}
          placeholder="City or venue"
        />
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", isCompact && "gap-2")}>
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", isCompact ? "h-9 text-xs" : "h-11 md:h-12 text-sm md:text-base", !eventDate && "text-muted-foreground")}>
              <Calendar className={cn("mr-2 flex-shrink-0", isCompact ? "h-3 w-3" : "h-4 w-4")} />
              <span className="truncate">{eventDate ? format(eventDate, "MMM dd, yyyy") : "Event date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background z-[100]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <CalendarComponent 
              mode="single" 
              selected={eventDate} 
              onSelect={setEventDate} 
              initialFocus 
              disabled={(date) => date < new Date()} 
              className={cn("pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {!isCompact && (
          <Select value={eventCategory} onValueChange={setEventCategory}>
            <SelectTrigger className="h-11 md:h-12 text-sm md:text-base">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="arts">Arts & Theater</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="festivals">Festivals</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto md:max-w-6xl">
      <div className={cn(
        "bg-card border border-border rounded-2xl shadow-lg transition-all duration-300",
        isCompact ? "p-3 md:p-4" : "p-4 md:p-6"
      )}>
        {/* Mobile-first instruction - hide when compact */}
        {!isCompact && (
          <div className="mb-4 md:hidden">
            <p className="text-sm text-muted-foreground text-center">
              Step 1: Select service type
            </p>
          </div>
        )}
        
        <Tabs value={searchType} onValueChange={setSearchType} className={cn("transition-all", isCompact ? "mb-3" : "mb-6")}>
          <TabsList className={cn(
            "grid w-full grid-cols-3 bg-muted gap-1 p-1 transition-all",
            isCompact ? "h-auto" : "h-auto"
          )}>
            <TabsTrigger 
              value="hotels" 
              className={cn(
                "flex gap-1 data-[state=active]:bg-background hover:bg-[#BFAD72]/20 hover:text-[#BFAD72] transition-all",
                isCompact ? "flex-row items-center py-2 px-2 min-h-[40px]" : "flex-col py-3 px-2 min-h-[60px] md:min-h-[48px]"
              )}
            >
              <Hotel className={cn("flex-shrink-0", isCompact ? "h-4 w-4" : "h-5 w-5")} />
              <span className={cn(isCompact ? "text-xs" : "text-xs md:text-sm")}>Hotels</span>
            </TabsTrigger>
            <TabsTrigger 
              value="flights" 
              className={cn(
                "flex gap-1 data-[state=active]:bg-background hover:bg-[#BFAD72]/20 hover:text-[#BFAD72] transition-all",
                isCompact ? "flex-row items-center py-2 px-2 min-h-[40px]" : "flex-col py-3 px-2 min-h-[60px] md:min-h-[48px]"
              )}
            >
              <Plane className={cn("flex-shrink-0", isCompact ? "h-4 w-4" : "h-5 w-5")} />
              <span className={cn(isCompact ? "text-xs" : "text-xs md:text-sm")}>Flights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className={cn(
                "flex gap-1 data-[state=active]:bg-background hover:bg-[#BFAD72]/20 hover:text-[#BFAD72] transition-all",
                isCompact ? "flex-row items-center py-2 px-2 min-h-[40px]" : "flex-col py-3 px-2 min-h-[60px] md:min-h-[48px]"
              )}
            >
              <Ticket className={cn("flex-shrink-0", isCompact ? "h-4 w-4" : "h-5 w-5")} />
              <span className={cn(isCompact ? "text-xs" : "text-xs md:text-sm")}>Events</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Mobile-first instruction for form - hide when compact */}
        {!isCompact && (
          <div className="mb-4 md:hidden">
            <p className="text-sm text-muted-foreground text-center">
              Step 2: Fill in your details
            </p>
          </div>
        )}

        {searchType === "flights" && renderFlightSearch()}
        {searchType === "hotels" && renderHotelSearch()}
        {searchType === "events" && renderEventSearch()}

        <Button 
          className={cn(
            "w-full font-semibold bg-primary hover:bg-primary/90 transition-all",
            isCompact ? "mt-3 h-10 text-sm" : "mt-6 h-12 md:h-14 text-base md:text-lg"
          )} 
          onClick={handleSearch}
        >
          <Search className={cn("mr-2 flex-shrink-0", isCompact ? "h-4 w-4" : "h-5 w-5")} />
          Search {searchType}
        </Button>
      </div>
    </div>
  );
};