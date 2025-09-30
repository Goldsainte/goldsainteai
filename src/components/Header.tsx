import { Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import logomark from "@/assets/logomark-gold.png";
import wordmark from "@/assets/wordmark-gold.png";

export const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src={logomark} alt="Sainté Voyage AI Logo" className="h-10 w-10" />
              <span className="text-xl font-bold hidden sm:block font-chiffon">Sainté Voyage AI</span>
            </a>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm hover:text-accent transition-colors font-medium">
                Stays
              </a>
              <a href="#" className="text-sm hover:text-accent transition-colors font-medium">
                Flights
              </a>
              <a href="#" className="text-sm hover:text-accent transition-colors font-medium">
                Car Rentals
              </a>
              <a href="#" className="text-sm hover:text-accent transition-colors font-medium">
                Attractions
              </a>
              <a href="#" className="text-sm hover:text-accent transition-colors font-medium">
                Airport Taxis
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
