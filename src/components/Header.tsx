import { useState, useEffect } from "react";
import { Heart, User, Globe, Menu, Hotel, Plane, UtensilsCrossed, Ticket, Car, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logomark from "@/assets/logomark-seal-gold.png";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [usePreferences, setUsePreferences] = useState(true);

  // Fetch user's preference setting
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_booking_preferences')
        .select('use_preferences_in_search')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setUsePreferences(data.use_preferences_in_search ?? true);
      }
    };
    
    fetchPreferences();
  }, [user]);

  const togglePreferences = async (checked: boolean) => {
    setUsePreferences(checked);
    
    if (!user) return;
    
    const { error } = await supabase
      .from('user_booking_preferences')
      .upsert({
        user_id: user.id,
        use_preferences_in_search: checked
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error('Error updating preference:', error);
      toast({
        title: "Error",
        description: "Failed to save preference",
        variant: "destructive",
      });
    } else {
      toast({
        title: checked ? "Preferences enabled" : "Preferences disabled",
        description: checked 
          ? "Search results will match your saved preferences" 
          : "Search results will show all available options",
      });
    }
  };

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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/browse-agents')} className="gap-3 cursor-pointer">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>Travel Agents</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/marketplace')} className="gap-3 cursor-pointer">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>Marketplace</span>
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
              onClick={() => navigate('/agent-onboarding')}
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
              <DropdownMenuContent align="end" className="w-64 bg-background border-border z-[100]">
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
                    
                    <DropdownMenuSeparator />
                    
                    <div className="px-2 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="preferences-toggle" className="text-sm font-medium cursor-pointer flex-1">
                          Use My Preferences
                        </Label>
                        <Switch
                          id="preferences-toggle"
                          checked={usePreferences}
                          onCheckedChange={togglePreferences}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Apply saved preferences to searches
                      </p>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer">
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
