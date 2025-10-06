import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Calendar, MapPin, Users, Search, Plane, Hotel, UtensilsCrossed, Ticket, ArrowLeftRight, Plus, Minus, X, Car } from "lucide-react";
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

export const EnhancedSearchBar = () => {
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

  // Car-specific states
  const [carTripType, setCarTripType] = useState<"round-trip" | "one-way">(
    (searchParams.get("carTripType") as any) || "round-trip"
  );
  const [pickupLocation, setPickupLocation] = useState(searchParams.get("pickup") || "");
  const [dropoffLocation, setDropoffLocation] = useState(searchParams.get("dropoff") || "");
  const [pickupDateCar, setPickupDateCar] = useState<Date | undefined>(
    parseLocalDate(searchParams.get("pickupDate"))
  );
  const [returnDateCar, setReturnDateCar] = useState<Date | undefined>(
    parseLocalDate(searchParams.get("returnDate"))
  );


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

  // Restaurant states
  const [restaurantLocation, setRestaurantLocation] = useState(searchParams.get("location") || "");
  const [restaurantDate, setRestaurantDate] = useState<Date | undefined>(
    parseLocalDate(searchParams.get("date"))
  );
  const [partySize, setPartySize] = useState(parseInt(searchParams.get("partySize") || "2"));
  const [restaurantTime, setRestaurantTime] = useState(searchParams.get("time") || "19:00");

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
      const checkIn = params.get("checkIn");
      const checkOut = params.get("checkOut");
      if (checkIn) setCheckInDate(new Date(checkIn));
      if (checkOut) setCheckOutDate(new Date(checkOut));
    } else if (currentType === "restaurants") {
      setRestaurantLocation(loc);
      const date = params.get("date");
      const time = params.get("time");
      if (date) setRestaurantDate(new Date(date));
      if (time) setRestaurantTime(time);
    } else if (currentType === "events") {
      setEventLocation(loc);
      const date = params.get("date");
      if (date) setEventDate(parseLocalDate(date));
    } else if (currentType === "flights") {
      const origin = params.get("origin");
      const destination = params.get("destination");
      const departureDate = params.get("departureDate");
      const returnDate = params.get("returnDate");

      if (origin) setOrigin(origin);
      if (destination) setDestination(destination);
      if (departureDate) setDepartureDate(parseLocalDate(departureDate));
      if (returnDate) setReturnDate(parseLocalDate(returnDate));
    } else if (currentType === "cars") {
      const pu = params.get("pickup");
      const doLoc = params.get("dropoff");
      const puDate = params.get("pickupDate");
      const rtDate = params.get("returnDate");
      const tt = (params.get("carTripType") as any) || "round-trip";
      if (pu) setPickupLocation(pu);
      if (doLoc) setDropoffLocation(doLoc);
      if (puDate) setPickupDateCar(parseLocalDate(puDate));
      if (rtDate) setReturnDateCar(parseLocalDate(rtDate));
      setCarTripType(tt);
    }
  }, [routeLocation.search]);

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
    } else if (searchType === "restaurants") {
      if (!restaurantLocation.trim()) {
        return;
      }
      searchData = {
        ...searchData,
        location: restaurantLocation,
        date: restaurantDate ? format(restaurantDate, "yyyy-MM-dd") : null,
        time: restaurantTime,
        partySize: partySize.toString(),
      };
      params.append("location", restaurantLocation);
      if (restaurantDate) params.append("date", format(restaurantDate, "yyyy-MM-dd"));
      params.append("time", restaurantTime);
      params.append("partySize", partySize.toString());
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
    } else if (searchType === "cars") {
      if (!pickupLocation.trim() || !pickupDateCar || !returnDateCar) {
        return;
      }
      const finalDrop = carTripType === 'one-way' ? dropoffLocation.trim() : pickupLocation.trim();
      searchData = {
        ...searchData,
        pickup: pickupLocation,
        dropoff: finalDrop,
        pickupDate: format(pickupDateCar, "yyyy-MM-dd"),
        returnDate: format(returnDateCar, "yyyy-MM-dd"),
        carTripType,
      };
      params.append("pickup", pickupLocation);
      params.append("dropoff", finalDrop);
      params.append("pickupDate", format(pickupDateCar, "yyyy-MM-dd"));
      params.append("returnDate", format(returnDateCar, "yyyy-MM-dd"));
      params.append("carTripType", carTripType);
    }

    addSearch(searchData);
    // Normalize search type to singular form for database
    const normalizedType = searchType.replace(/s$/, '') as 'hotel' | 'flight' | 'car' | 'restaurant' | 'event' | 'destination';
    trackSearch(normalizedType, searchData);
    navigate(`/search?${params.toString()}`);
  };

  // Flight Search UI
  const renderFlightSearch = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={flightType === "round-trip" ? "default" : "outline"}
          onClick={() => setFlightType("round-trip")}
          className="flex-1 h-11"
        >
          Round-trip
        </Button>
        <Button
          type="button"
          variant={flightType === "one-way" ? "default" : "outline"}
          onClick={() => setFlightType("one-way")}
          className="flex-1 h-11"
        >
          One-way
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Origin */}
        <div className="md:col-span-5">
          <AirportAutocomplete
            value={origin}
            onChange={setOrigin}
            placeholder="From (e.g., JFK, New York)"
          />
        </div>

        {/* Swap button */}
        <div className="md:col-span-2 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapLocations}
            className="h-10 w-10 rounded-full border border-border hover:bg-accent"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Destination */}
        <div className="md:col-span-5">
          <AirportAutocomplete
            value={destination}
            onChange={setDestination}
            placeholder="To (e.g., LAX, Los Angeles)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Departure Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-12 justify-start text-left font-normal", !departureDate && "text-muted-foreground")}>
              <Calendar className="mr-2 h-4 w-4" />
              {departureDate ? format(departureDate, "MMM dd, yyyy") : "Departure"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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
              <Button variant="outline" className={cn("h-12 justify-start text-left font-normal", !returnDate && "text-muted-foreground")}> 
                <Calendar className="mr-2 h-4 w-4" />
                {returnDate ? format(returnDate, "MMM dd, yyyy") : "Return"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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

        {/* Passengers & Class */}
        <Popover open={showPassengerPopover} onOpenChange={setShowPassengerPopover}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-12 justify-start text-left font-normal">
              <Users className="mr-2 h-4 w-4" />
              {totalFlightPassengers} Passenger{totalFlightPassengers !== 1 ? "s" : ""}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
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
        <Select value={cabinClass} onValueChange={setCabinClass}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ECONOMY">Economy</SelectItem>
            <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
            <SelectItem value="BUSINESS">Business</SelectItem>
            <SelectItem value="FIRST">First Class</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Hotel Search UI
  const renderHotelSearch = () => (
    <div className="space-y-4">
      <div className="relative">
        <CityAutocomplete
          value={hotelLocation}
          onChange={setHotelLocation}
          placeholder="Where are you going? (City, hotel name, or landmark)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Check-in */}
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-12 justify-start text-left font-normal", !checkInDate && "text-muted-foreground")}>
              <Calendar className="mr-2 h-4 w-4" />
              {checkInDate ? format(checkInDate, "MMM dd") : "Check-in"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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
            <Button variant="outline" className={cn("h-12 justify-start text-left font-normal", !checkOutDate && "text-muted-foreground")}>
              <Calendar className="mr-2 h-4 w-4" />
              {checkOutDate ? format(checkOutDate, "MMM dd") : "Check-out"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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
            <Button variant="outline" className="h-12 justify-start text-left font-normal md:col-span-2">
              <Users className="mr-2 h-4 w-4" />
              {totalHotelGuests} Guest{totalHotelGuests !== 1 ? "s" : ""}, {rooms} Room{rooms !== 1 ? "s" : ""}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
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

  // Restaurant Search UI
  const renderRestaurantSearch = () => (
    <div className="space-y-4">
      <div className="relative">
        <CityAutocomplete
          placeholder="City, restaurant name, or cuisine"
          className="h-12"
          value={restaurantLocation}
          onChange={setRestaurantLocation}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-12 justify-start text-left font-normal", !restaurantDate && "text-muted-foreground")}>
              <Calendar className="mr-2 h-4 w-4" />
              {restaurantDate ? format(restaurantDate, "MMM dd, yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <CalendarComponent 
              mode="single" 
              selected={restaurantDate} 
              onSelect={setRestaurantDate} 
              initialFocus 
              disabled={(date) => date < new Date()} 
              className={cn("pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Select value={restaurantTime} onValueChange={setRestaurantTime}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 48 }, (_, i) => {
              const hour = Math.floor(i / 2);
              const minute = i % 2 === 0 ? "00" : "30";
              const time = `${hour.toString().padStart(2, "0")}:${minute}`;
              return <SelectItem key={time} value={time}>{time}</SelectItem>;
            })}
          </SelectContent>
        </Select>

        <Select value={partySize.toString()} onValueChange={(v) => setPartySize(parseInt(v))}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Party size" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((size) => (
              <SelectItem key={size} value={size.toString()}>{size} {size === 1 ? "Guest" : "Guests"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Events Search UI
  const renderEventSearch = () => (
    <div className="space-y-4">
      <div className="relative">
        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          placeholder="City or venue"
          className="pl-10 h-12 border-border text-base"
          value={eventLocation}
          onChange={(e) => setEventLocation(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-12 justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
              <Calendar className="mr-2 h-4 w-4" />
              {eventDate ? format(eventDate, "MMM dd, yyyy") : "Event date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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

        <Select value={eventCategory} onValueChange={setEventCategory}>
          <SelectTrigger className="h-12">
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
      </div>
    </div>
  );

  // Car Search UI
  const renderCarSearch = () => (
    <div className="space-y-4 max-w-full">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={carTripType === "round-trip" ? "default" : "outline"}
          onClick={() => setCarTripType("round-trip")}
          className="flex-1 h-auto py-2 text-xs sm:text-sm px-2 whitespace-normal text-center leading-tight"
        >
          Same location
        </Button>
        <Button
          type="button"
          variant={carTripType === "one-way" ? "default" : "outline"}
          onClick={() => setCarTripType("one-way")}
          className="flex-1 h-auto py-2 text-xs sm:text-sm px-2 whitespace-normal text-center leading-tight"
        >
          Different location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-full">
        <div className="min-w-0">
          <AirportAutocomplete value={pickupLocation} onChange={setPickupLocation} placeholder="Pick-up location" />
        </div>
        {carTripType === 'one-way' ? (
          <div className="min-w-0">
            <AirportAutocomplete value={dropoffLocation} onChange={setDropoffLocation} placeholder="Drop-off location" />
          </div>
        ) : (
          <Input value={pickupLocation} readOnly className="h-12" aria-label="Drop-off same as pickup" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-12 justify-start text-left font-normal w-full", !pickupDateCar && "text-muted-foreground")}>
              <Calendar className="mr-2 h-4 w-4" />
              {pickupDateCar ? format(pickupDateCar, "MMM dd, yyyy") : "Pick-up date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <CalendarComponent 
              mode="single" 
              selected={pickupDateCar} 
              onSelect={setPickupDateCar}
              disabled={(date) => date < new Date()}
              initialFocus
              className={cn("pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-12 justify-start text-left font-normal w-full", !returnDateCar && "text-muted-foreground")}>
              <Calendar className="mr-2 h-4 w-4" />
              {returnDateCar ? format(returnDateCar, "MMM dd, yyyy") : "Return date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <CalendarComponent 
              mode="single" 
              selected={returnDateCar} 
              onSelect={setReturnDateCar}
              disabled={(date) => date < (pickupDateCar || new Date())}
              initialFocus
              className={cn("pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto md:max-w-6xl">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4 md:p-6">
        {/* Mobile-first instruction */}
        <div className="mb-4 md:hidden">
          <p className="text-sm text-muted-foreground text-center">
            Step 1: Select service type
          </p>
        </div>
        
        <Tabs value={searchType} onValueChange={setSearchType} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 h-auto bg-muted gap-1 p-1">
            <TabsTrigger 
              value="hotels" 
              className="flex flex-col gap-1 py-3 px-2 data-[state=active]:bg-background hover:bg-[#BFAD72]/20 hover:text-[#BFAD72] transition-colors min-h-[60px] md:min-h-[48px]"
            >
              <Hotel className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm">Hotels</span>
            </TabsTrigger>
            <TabsTrigger 
              value="flights" 
              className="flex flex-col gap-1 py-3 px-2 data-[state=active]:bg-background hover:bg-[#BFAD72]/20 hover:text-[#BFAD72] transition-colors min-h-[60px] md:min-h-[48px]"
            >
              <Plane className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm">Flights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cars" 
              className="flex flex-col gap-1 py-3 px-2 data-[state=active]:bg-background hover:bg-[#BFAD72]/20 hover:text-[#BFAD72] transition-colors min-h-[60px] md:min-h-[48px]"
            >
              <Car className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm">Cars</span>
            </TabsTrigger>
            <TabsTrigger 
              value="restaurants" 
              className="flex flex-col gap-1 py-3 px-2 data-[state=active]:bg-background hover:bg-[#BFAD72]/20 hover:text-[#BFAD72] transition-colors min-h-[60px] md:min-h-[48px]"
            >
              <UtensilsCrossed className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm">Dining</span>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex flex-col gap-1 py-3 px-2 data-[state=active]:bg-background hover:bg-[#BFAD72]/20 hover:text-[#BFAD72] transition-colors min-h-[60px] md:min-h-[48px]"
            >
              <Ticket className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm">Events</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Mobile-first instruction for form */}
        <div className="mb-4 md:hidden">
          <p className="text-sm text-muted-foreground text-center">
            Step 2: Fill in your details
          </p>
        </div>

        {searchType === "flights" && renderFlightSearch()}
        {searchType === "hotels" && renderHotelSearch()}
        {searchType === "restaurants" && renderRestaurantSearch()}
        {searchType === "events" && renderEventSearch()}
        {searchType === "cars" && renderCarSearch()}

        <Button className="w-full mt-6 h-14 text-lg font-semibold bg-primary hover:bg-primary/90" onClick={handleSearch}>
          <Search className="h-5 w-5 mr-2" />
          Search {searchType}
        </Button>
      </div>
    </div>
  );
};