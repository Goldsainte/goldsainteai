import { useState } from "react";
import { Search, MapPin, Calendar, User, Plane, Hotel, Car, Plus, Minus, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { cn } from "@/lib/utils";

export const CompactHeaderSearch = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchType, setSearchType] = useState<"flights" | "hotels" | "cars">("hotels");
  
  // Common fields
  const [location, setLocation] = useState("");
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  
  // Guest details (like Airbnb)
  const [guests, setGuests] = useState({
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0
  });
  
  const [showGuestPopover, setShowGuestPopover] = useState(false);

  const totalGuests = guests.adults + guests.children + guests.infants;
  
  const getGuestText = () => {
    if (totalGuests === 0) return "Add guests";
    const parts = [];
    if (guests.adults > 0) parts.push(`${guests.adults} adult${guests.adults > 1 ? 's' : ''}`);
    if (guests.children > 0) parts.push(`${guests.children} child${guests.children > 1 ? 'ren' : ''}`);
    if (guests.infants > 0) parts.push(`${guests.infants} infant${guests.infants > 1 ? 's' : ''}`);
    if (guests.pets > 0) parts.push(`${guests.pets} pet${guests.pets > 1 ? 's' : ''}`);
    return parts.join(", ");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("type", searchType);
    
    if (location) params.set("location", location);
    if (checkInDate) params.set("checkIn", format(checkInDate, "yyyy-MM-dd"));
    if (checkOutDate) params.set("checkOut", format(checkOutDate, "yyyy-MM-dd"));
    params.set("adults", guests.adults.toString());
    params.set("children", guests.children.toString());
    params.set("infants", guests.infants.toString());

    setOpen(false);
    navigate(`/search-results?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Mobile Button - Compact */}
        <Button
          variant="outline"
          className="flex md:hidden items-center gap-2 px-3 h-10 rounded-full border-border shadow-sm hover:shadow-md transition-all bg-background w-full max-w-[280px]"
        >
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex items-center gap-2 text-xs truncate">
            <span className="font-medium truncate">{location || "Search"}</span>
            {checkInDate && (
              <>
                <div className="h-4 w-px bg-border" />
                <span className="text-muted-foreground">{format(checkInDate, "MMM d")}</span>
              </>
            )}
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogTrigger asChild>
        {/* Desktop Button - Full */}
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 px-4 h-12 rounded-full border-border shadow-sm hover:shadow-md transition-all bg-background w-full max-w-3xl"
        >
          <div className="flex items-center gap-3 text-sm w-full justify-between">
            <span className="font-medium">{location || "Where"}</span>
            <div className="h-6 w-px bg-border" />
            <span className="font-medium">{checkInDate ? format(checkInDate, "MMM d") : "When"}</span>
            <div className="h-6 w-px bg-border" />
            <span className="font-medium">{searchType === "hotels" ? "Hotels" : searchType === "flights" ? "Flights" : "Cars"}</span>
            <div className="h-6 w-px bg-border" />
            <span className="text-muted-foreground">{totalGuests > 0 ? getGuestText() : "Who"}</span>
          </div>
          <div className="ml-2 p-2 bg-primary rounded-full flex-shrink-0">
            <Search className="h-3 w-3 text-primary-foreground" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-muted/50 p-3 sm:p-4 rounded-2xl">
            {/* Where */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Where</label>
              <Input
                placeholder="Search destinations"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-0 bg-background"
              />
            </div>

            {/* When - Check in */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Check in</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className={cn("w-full justify-start text-left font-normal h-10 px-3 hover:bg-background bg-background", !checkInDate && "text-muted-foreground")}>
                    {checkInDate ? format(checkInDate, "MMM d") : "Add dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={checkInDate} onSelect={setCheckInDate} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* When - Check out */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Check out</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className={cn("w-full justify-start text-left font-normal h-10 px-3 hover:bg-background bg-background", !checkOutDate && "text-muted-foreground")}>
                    {checkOutDate ? format(checkOutDate, "MMM d") : "Add dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={checkOutDate} onSelect={setCheckOutDate} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Who */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Who</label>
              <Popover open={showGuestPopover} onOpenChange={setShowGuestPopover}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start text-left font-normal h-10 px-3 hover:bg-background bg-background text-muted-foreground">
                    {totalGuests > 0 ? `${totalGuests} guest${totalGuests > 1 ? 's' : ''}` : "Add guests"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 space-y-4">
                    {/* Adults */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Adults</div>
                        <div className="text-sm text-muted-foreground">Ages 13 or above</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setGuests(prev => ({ ...prev, adults: Math.max(0, prev.adults - 1) }))}
                          disabled={guests.adults === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{guests.adults}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setGuests(prev => ({ ...prev, adults: prev.adults + 1 }))}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Children */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Children</div>
                        <div className="text-sm text-muted-foreground">Ages 2-12</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setGuests(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                          disabled={guests.children === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{guests.children}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setGuests(prev => ({ ...prev, children: prev.children + 1 }))}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Infants */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Infants</div>
                        <div className="text-sm text-muted-foreground">Under 2</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setGuests(prev => ({ ...prev, infants: Math.max(0, prev.infants - 1) }))}
                          disabled={guests.infants === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{guests.infants}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setGuests(prev => ({ ...prev, infants: prev.infants + 1 }))}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Pets */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Pets</div>
                        <div className="text-sm text-muted-foreground">Bringing a service animal?</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setGuests(prev => ({ ...prev, pets: Math.max(0, prev.pets - 1) }))}
                          disabled={guests.pets === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{guests.pets}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setGuests(prev => ({ ...prev, pets: prev.pets + 1 }))}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Type of Service Selector */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold">Type of Service</label>
            <Select value={searchType} onValueChange={(v) => setSearchType(v as any)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotels">
                  <div className="flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    <span>Hotels & Stays</span>
                  </div>
                </SelectItem>
                <SelectItem value="flights">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    <span>Flights</span>
                  </div>
                </SelectItem>
                <SelectItem value="cars">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>Car Rentals</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSearch} className="w-full h-11 sm:h-12 text-base" size="lg">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
