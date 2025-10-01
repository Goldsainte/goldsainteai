import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Users, Search, Plane, Hotel, UtensilsCrossed, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SearchBar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchType, setSearchType] = useState(searchParams.get("type") || "hotels");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "2");

  const handleSearch = () => {
    if (!location.trim()) return;
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <Tabs value={searchType} onValueChange={setSearchType} className="mb-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hotels" className="gap-2">
              <Hotel className="h-4 w-4" />
              <span className="hidden sm:inline">Hotels</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="gap-2">
              <Plane className="h-4 w-4" />
              <span className="hidden sm:inline">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">Restaurants</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchType === "flights" ? "From where?" : "Where to?"}
              className="pl-10 h-11 border-border"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {searchType === "hotels" && (
            <>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Check-in"
                  className="pl-10 h-11 border-border"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Check-out"
                  className="pl-10 h-11 border-border"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="2 guests"
                  className="pl-10 h-11 border-border"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                />
              </div>
            </>
          )}

          {searchType === "flights" && (
            <div className="relative md:col-span-3">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Departure date"
                className="pl-10 h-11 border-border"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
          )}

          {searchType === "events" && (
            <div className="relative md:col-span-3">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Event date"
                className="pl-10 h-11 border-border"
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
          className="w-full mt-4 h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSearch}
        >
          <Search className="h-4 w-4 mr-2" />
          {getSearchButtonText()}
        </Button>
      </div>
    </div>
  );
};
