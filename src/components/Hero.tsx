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
    <section className="bg-gradient-hero text-primary-foreground py-12 sm:py-16 md:py-24" aria-label="Hero section with search form">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Your trip, your way: Book yourself, let AI handle it, or have luxury agents compete for you.
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl">
            AI-powered search, expert agents on demand, or full control — the choice is yours.
          </p>

          <form 
            className="bg-card rounded-lg shadow-xl p-4 sm:p-6" 
            onSubmit={handleSearch}
            aria-label="Hotel search form"
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative">
                <label htmlFor="location" className="sr-only">Destination</label>
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="location"
                  placeholder="Where are you going?"
                  className="pl-10 h-12 bg-background text-foreground w-full"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  aria-required="true"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label htmlFor="check-in" className="sr-only">Check-in date</label>
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                  <Input
                    id="check-in"
                    type="date"
                    className="pl-10 h-12 bg-background text-foreground w-full"
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
                    className="pl-10 h-12 bg-background text-foreground w-full"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    aria-label="Check-out date"
                  />
                </div>
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
                  className="pl-10 h-12 bg-background text-foreground w-full"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  aria-label="Number of guests"
                />
              </div>

              <Button 
                type="submit"
                className="h-12 px-6 sm:px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold w-full min-h-[48px]"
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
