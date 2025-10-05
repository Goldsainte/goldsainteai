import { Heart, User, Globe, Menu, Hotel, Plane, UtensilsCrossed, Ticket, Car, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logomark from "@/assets/logomark-seal-gold.png";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleServiceClick = (service: string) => {
    if (location.pathname === '/') {
      // If already on home page, use URL params to trigger action
      navigate(`/?service=${service}`, { replace: true });
    } else {
      // Navigate to home with service param
      navigate(`/?service=${service}`);
    }
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img src={logomark} alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-bold font-chiffon text-primary hidden sm:block">Goldsainte.Ai</span>
          </a>

          {/* Services Dropdown - Center */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="gap-2 text-sm font-medium hover:bg-muted"
                >
                  <Briefcase className="h-4 w-4" />
                  Services
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-background border-border z-[100]">
                <DropdownMenuItem onClick={() => handleServiceClick('hotels')} className="gap-3 cursor-pointer">
                  <Hotel className="h-4 w-4 text-primary" />
                  <span>Hotels & Stays</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceClick('flights')} className="gap-3 cursor-pointer">
                  <Plane className="h-4 w-4 text-primary" />
                  <span>Flights</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceClick('restaurants')} className="gap-3 cursor-pointer">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  <span>Restaurants</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceClick('events')} className="gap-3 cursor-pointer">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span>Events</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceClick('cars')} className="gap-3 cursor-pointer">
                  <Car className="h-4 w-4 text-primary" />
                  <span>Car Rentals</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/browse-agents')} className="gap-3 cursor-pointer border-t mt-2 pt-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>Travel Agents</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="hidden sm:flex gap-2 text-sm font-medium hover:bg-muted rounded-full"
              onClick={() => navigate('/browse-agents')}
            >
              Become an Agent
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-muted rounded-full"
            >
              <Globe className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="gap-2 hover:bg-muted rounded-full border border-border shadow-sm px-3 h-10"
                >
                  <Menu className="h-4 w-4" />
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border z-[100]">
                {user ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-bookings')} className="cursor-pointer">
                      My Bookings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorites')} className="cursor-pointer gap-2">
                      <Heart className="h-4 w-4" />
                      Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/booking-preferences')} className="cursor-pointer">
                      Booking Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer border-t mt-2 pt-2">
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer font-medium">
                      Sign In
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer">
                      Sign Up
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
