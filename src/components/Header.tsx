import { useState, useEffect } from "react";
import { Heart, User, Menu, Hotel, Plane, UtensilsCrossed, Ticket, Car, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import logoWordmark from "@/assets/primary-horizontal-logo-gold-2.png";
import { CompactHeaderSearch } from "@/components/CompactHeaderSearch";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
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
    <header className="bg-background border-b border-border sticky top-0 z-50 touch-manipulation">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 md:gap-4 h-14 sm:h-16 md:h-20">
          {/* Logo - Left */}
          <a href="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0 min-h-[44px]">
            <img src={logoWordmark} alt="Goldsainte Logo" className="h-6 sm:h-7 md:h-8 w-auto" />
          </a>

          {/* Compact Search Bar - Center (desktop and mobile) */}
          <div className="flex justify-center">
            <CompactHeaderSearch />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="gap-1 text-xs sm:text-sm font-medium hover:bg-muted hidden sm:flex h-10 sm:h-11 px-2 sm:px-3"
                  aria-label="Services menu"
                >
                  <Briefcase className="h-4 w-4 sm:h-4 sm:w-4" />
                  <span className="hidden md:inline">Services</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-background border-border z-[100] touch-manipulation">
                <DropdownMenuItem onClick={() => handleServiceClick('hotels')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                  <Hotel className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Hotels & Stays</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceClick('flights')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                  <Plane className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Flights</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceClick('restaurants')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                  <UtensilsCrossed className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Restaurants</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceClick('events')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                  <Ticket className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Events</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceClick('cars')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                  <Car className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Car Rentals</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/browse-agents')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                  <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Travel Agents</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/marketplace')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                  <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Marketplace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="sm"
              className="hidden lg:flex gap-2 text-xs sm:text-sm font-medium hover:bg-muted rounded-full px-2 sm:px-3 h-10 sm:h-11"
              onClick={() => navigate('/agent-onboarding')}
            >
              <span className="hidden xl:inline">Become an Agent</span>
              <span className="xl:hidden">Agent</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="gap-1 sm:gap-1.5 hover:bg-muted rounded-full border border-border shadow-sm px-2 sm:px-3 h-10 sm:h-11 min-w-[44px]"
                  aria-label="User menu"
                >
                  <Menu className="h-4 w-4 md:h-4 md:w-4" />
                  <User className="h-5 w-5 md:h-5 md:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-background border-border z-[100] touch-manipulation" aria-label="User navigation menu">
                {user ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer min-h-[44px] text-sm">
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-bookings')} className="cursor-pointer min-h-[44px] text-sm">
                      My Bookings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorites')} className="cursor-pointer gap-2 min-h-[44px] text-sm">
                      <Heart className="h-4 w-4 flex-shrink-0" />
                      Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/booking-preferences')} className="cursor-pointer min-h-[44px] text-sm">
                      Booking Preferences
                    </DropdownMenuItem>
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin/agent-approvals')} className="cursor-pointer min-h-[44px] text-sm font-medium text-primary">
                          Admin Panel
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <div className="px-2 py-3 min-h-[60px]">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="preferences-toggle" className="text-sm font-medium cursor-pointer flex-1 leading-tight">
                          Use My Preferences
                        </Label>
                        <Switch
                          id="preferences-toggle"
                          checked={usePreferences}
                          onCheckedChange={togglePreferences}
                          className="flex-shrink-0"
                          aria-label="Toggle search preferences"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Apply saved preferences to searches
                      </p>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer min-h-[44px] text-sm">
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer font-medium min-h-[44px] text-sm">
                      Sign In
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/auth')} className="cursor-pointer min-h-[44px] text-sm">
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
