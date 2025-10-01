import { Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import logomark from "@/assets/logomark-seal-gold.png";

export const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <a href="/" className="flex flex-col gap-1 hover:opacity-90 transition-opacity">
              <div className="flex items-center gap-3">
                <img src={logomark} alt="Logo" className="h-10 w-10" />
                <span className="text-xl font-bold hidden sm:block font-chiffon">Goldsainte.Ai</span>
              </div>
              <p className="text-sm font-medium hidden sm:block max-w-md">
                The first travel platform to combine AI precision with human passion — one platform, infinite possibilities.
              </p>
            </a>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="/search?type=hotels" className="text-sm hover:text-accent transition-colors font-medium">
                Stays
              </a>
              <a href="/search?type=flights" className="text-sm hover:text-accent transition-colors font-medium">
                Flights
              </a>
              <a href="/search?type=restaurants" className="text-sm hover:text-accent transition-colors font-medium">
                Restaurants
              </a>
              <a href="/search?type=events" className="text-sm hover:text-accent transition-colors font-medium">
                Events
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-accent hover:bg-primary/90">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-accent hover:bg-primary/90">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
