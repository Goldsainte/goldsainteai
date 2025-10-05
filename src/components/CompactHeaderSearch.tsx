import { useState } from "react";
import { Search, MapPin, Calendar, User, Plane, Hotel, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { cn } from "@/lib/utils";

export const CompactHeaderSearch = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchType, setSearchType] = useState<"flights" | "hotels" | "cars">("hotels");
  
  // Hotels
  const [hotelLocation, setHotelLocation] = useState("");
  const [hotelCheckIn, setHotelCheckIn] = useState<Date>();
  const [hotelCheckOut, setHotelCheckOut] = useState<Date>();
  const [hotelGuests, setHotelGuests] = useState(2);
  
  // Flights
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState(1);
  
  // Cars
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupDate, setPickupDate] = useState<Date>();
  const [returnDateCar, setReturnDateCar] = useState<Date>();

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchType === "hotels") {
      params.set("type", "hotels");
      if (hotelLocation) params.set("location", hotelLocation);
      if (hotelCheckIn) params.set("checkIn", format(hotelCheckIn, "yyyy-MM-dd"));
      if (hotelCheckOut) params.set("checkOut", format(hotelCheckOut, "yyyy-MM-dd"));
      params.set("adults", hotelGuests.toString());
      params.set("rooms", "1");
    } else if (searchType === "flights") {
      params.set("type", "flights");
      if (origin) params.set("origin", origin);
      if (destination) params.set("destination", destination);
      if (departureDate) params.set("departureDate", format(departureDate, "yyyy-MM-dd"));
      if (returnDate) params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
      params.set("adults", passengers.toString());
    } else if (searchType === "cars") {
      params.set("type", "cars");
      if (pickupLocation) params.set("pickup", pickupLocation);
      if (dropoffLocation) params.set("dropoff", dropoffLocation);
      if (pickupDate) params.set("pickupDate", format(pickupDate, "yyyy-MM-dd"));
      if (returnDateCar) params.set("returnDate", format(returnDateCar, "yyyy-MM-dd"));
    }

    setOpen(false);
    navigate(`/search-results?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 px-4 h-12 rounded-full border-border shadow-sm hover:shadow-md transition-all bg-background"
        >
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">Anywhere</span>
            <div className="h-6 w-px bg-border" />
            <span className="font-medium">Any week</span>
            <div className="h-6 w-px bg-border" />
            <span className="text-muted-foreground">Add guests</span>
          </div>
          <div className="ml-2 p-2 bg-primary rounded-full">
            <Search className="h-3 w-3 text-primary-foreground" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <div className="space-y-6">
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hotels" className="gap-2">
                <Hotel className="h-4 w-4" />
                Hotels
              </TabsTrigger>
              <TabsTrigger value="flights" className="gap-2">
                <Plane className="h-4 w-4" />
                Flights
              </TabsTrigger>
              <TabsTrigger value="cars" className="gap-2">
                <Car className="h-4 w-4" />
                Cars
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {searchType === "hotels" && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Where</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search destinations"
                    value={hotelLocation}
                    onChange={(e) => setHotelLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check in</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !hotelCheckIn && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {hotelCheckIn ? format(hotelCheckIn, "PP") : "Add date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={hotelCheckIn} onSelect={setHotelCheckIn} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check out</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !hotelCheckOut && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {hotelCheckOut ? format(hotelCheckOut, "PP") : "Add date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={hotelCheckOut} onSelect={setHotelCheckOut} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Guests</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    value={hotelGuests}
                    onChange={(e) => setHotelGuests(parseInt(e.target.value) || 1)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {searchType === "flights" && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <AirportAutocomplete
                  value={origin}
                  onChange={setOrigin}
                  placeholder="Origin airport"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <AirportAutocomplete
                  value={destination}
                  onChange={setDestination}
                  placeholder="Destination airport"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !departureDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {departureDate ? format(departureDate, "PP") : "Add date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={departureDate} onSelect={setDepartureDate} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !returnDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PP") : "Add date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={returnDate} onSelect={setReturnDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Passengers</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {searchType === "cars" && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pick-up location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City or airport"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Drop-off location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City or airport"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pick-up</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !pickupDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {pickupDate ? format(pickupDate, "PP") : "Add date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={pickupDate} onSelect={setPickupDate} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !returnDateCar && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {returnDateCar ? format(returnDateCar, "PP") : "Add date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={returnDateCar} onSelect={setReturnDateCar} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleSearch} className="w-full" size="lg">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
