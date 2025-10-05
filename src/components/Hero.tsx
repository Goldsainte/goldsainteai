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

  const handleSearch = () => {
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
    <section className="bg-gradient-hero text-primary-foreground py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Your trip, your way: Book yourself, let AI handle it, or have luxury agents compete for you.
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
            Search deals on hotels, homes, and much more...
          </p>

          <div className="bg-card rounded-lg shadow-xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Where are you going?"
                  className="pl-10 h-12 bg-background text-foreground"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10 h-12 bg-background text-foreground"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10 h-12 bg-background text-foreground"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="flex-1 relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="2 adults"
                  className="pl-10 h-12 bg-background text-foreground"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                />
              </div>

              <Button 
                className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
