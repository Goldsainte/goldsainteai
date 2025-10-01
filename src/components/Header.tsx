import { Heart, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logomark from "@/assets/logomark-seal-gold.png";

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4 min-h-20">
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:text-accent hover:bg-primary/90"
              onClick={() => navigate('/favorites')}
            >
              <Heart className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-accent hover:bg-primary/90">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/booking-preferences')} className="gap-2">
                      <Settings className="h-4 w-4" />
                      Booking Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorites')}>
                      Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => navigate('/auth')}>
                    Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
