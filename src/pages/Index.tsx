import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Hotel, MapPin, Compass, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logomark from "@/assets/logomark-gold.png";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (type: string) => {
    if (!searchQuery.trim()) return;
    
    const params = new URLSearchParams({
      type,
      location: searchQuery,
    });

    if (type === "hotels") {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      params.append("checkIn", today.toISOString().split('T')[0]);
      params.append("checkOut", tomorrow.toISOString().split('T')[0]);
      params.append("guests", "2");
    }

    navigate(`/search?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch('hotels');
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <img src={logomark} alt="Goldsainte" className="h-16 w-16" />
        </div>

        {/* Main Search Input */}
        <div className="w-full space-y-4">
          <div className="relative">
            <Input
              placeholder="Where Can Goldsainte AI Help You Travel To"
              className="w-full h-14 px-6 pr-12 text-base border-border rounded-3xl shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              onClick={() => handleSearch('hotels')}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              className="rounded-full h-10 px-4 border-border hover:bg-muted"
              onClick={() => handleSearch('hotels')}
            >
              <Hotel className="h-4 w-4 mr-2" />
              Hotels
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10 px-4 border-border hover:bg-muted"
              onClick={() => handleSearch('flights')}
            >
              <Plane className="h-4 w-4 mr-2" />
              Flights
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10 px-4 border-border hover:bg-muted"
              onClick={() => handleSearch('destinations')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Destinations
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10 px-4 border-border hover:bg-muted"
              onClick={() => handleSearch('explore')}
            >
              <Compass className="h-4 w-4 mr-2" />
              Explore
            </Button>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-auto pt-12">
          <p className="text-sm text-muted-foreground text-center">
            By using Goldsainte AI, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">
              Terms
            </a>{" "}
            and have read our{" "}
            <a href="#" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
};

export default Index;
