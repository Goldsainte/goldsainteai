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
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" aria-label="Hero section with search form">
      {/* Full-width background with subtle overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-emerald/95 via-luxury-emerald/85 to-luxury-emerald/75" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-secondary text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight tracking-wide text-white drop-shadow-lg">
            Where Luxury Meets Intelligence
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl mb-12 text-white/95 max-w-4xl mx-auto font-light leading-relaxed">
            AI-powered planning. Expert agents bidding for your business. Creator-curated journeys. Travel reimagined for the discerning explorer.
          </p>

          <form 
            className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20" 
            onSubmit={handleSearch}
            aria-label="Hotel search form"
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative">
                <label htmlFor="location" className="sr-only">Destination</label>
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-white/70 pointer-events-none" aria-hidden="true" />
                <Input
                  id="location"
                  placeholder="Where shall we take you?"
                  className="pl-10 h-14 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/60 border-white/30 focus:border-luxury-gold focus:ring-luxury-gold w-full"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  aria-required="true"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label htmlFor="check-in" className="sr-only">Check-in date</label>
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-white/70 pointer-events-none" aria-hidden="true" />
                  <Input
                    id="check-in"
                    type="date"
                    className="pl-10 h-14 bg-white/20 backdrop-blur-sm text-white border-white/30 focus:border-luxury-gold focus:ring-luxury-gold w-full"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    aria-label="Check-in date"
                  />
                </div>

                <div className="relative">
                  <label htmlFor="check-out" className="sr-only">Check-out date</label>
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-white/70 pointer-events-none" aria-hidden="true" />
                  <Input
                    id="check-out"
                    type="date"
                    className="pl-10 h-14 bg-white/20 backdrop-blur-sm text-white border-white/30 focus:border-luxury-gold focus:ring-luxury-gold w-full"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    aria-label="Check-out date"
                  />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="guests" className="sr-only">Number of guests</label>
                <Users className="absolute left-3 top-3 h-5 w-5 text-white/70 pointer-events-none" aria-hidden="true" />
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="2 guests"
                  className="pl-10 h-14 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/60 border-white/30 focus:border-luxury-gold focus:ring-luxury-gold w-full"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  aria-label="Number of guests"
                />
              </div>

              <Button 
                type="submit"
                className="h-14 px-8 sm:px-10 bg-luxury-gold text-white hover:bg-luxury-gold/90 font-semibold w-full min-h-[48px] text-lg border-2 border-luxury-gold/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                aria-label="Begin your journey"
              >
                Begin Your Journey
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
