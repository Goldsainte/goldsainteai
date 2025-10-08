import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Hero = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    const params = new URLSearchParams({
      type: "hotels",
      location,
      checkIn,
      checkOut,
      guests
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="bg-gradient-hero text-primary-foreground py-8 sm:py-12 md:py-16 lg:py-24 px-3 sm:px-4" aria-label="Hero section with search form">
      <div className="container mx-auto">
        <div className="max-w-4xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight">
            Your trip, your way: Book yourself, let AI handle it, or have luxury agents compete for you.
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-primary-foreground/90 max-w-3xl leading-relaxed">
            AI-powered search, expert agents on demand, or full control — the choice is yours.
          </p>

          <form 
            className="bg-card rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 md:p-6" 
            onSubmit={handleSearch}
            aria-label="Hotel search form"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
              <div className="sm:col-span-2 lg:col-span-1 relative">
                <label htmlFor="location" className="sr-only">Destination</label>
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="location"
                  placeholder="Where are you going?"
                  className="pl-10 h-12 bg-background text-foreground"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  aria-required="true"
                />
              </div>

              <div className="relative">
                <label htmlFor="check-in" className="sr-only">Check-in date</label>
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="check-in"
                  type="date"
                  className="pl-10 h-12 bg-background text-foreground"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  aria-label="Check-in date"
                />
              </div>

              <div className="relative">
                <label htmlFor="check-out" className="sr-only">Check-out date</label>
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="check-out"
                  type="date"
                  className="pl-10 h-12 bg-background text-foreground"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  aria-label="Check-out date"
                />
              </div>

              <div className="relative">
                <label htmlFor="guests" className="sr-only">Number of guests</label>
                <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="2 guests"
                  className="pl-10 h-12 bg-background text-foreground"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  aria-label="Number of guests"
                />
              </div>

              <Button 
                type="submit"
                className="h-12 sm:h-13 md:h-14 px-6 sm:px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold w-full min-h-[48px] text-base sm:text-lg"
                aria-label="Search hotels"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
