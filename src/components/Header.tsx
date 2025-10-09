import { useState, useEffect } from "react";
import { Heart, User, Menu, Hotel, Plane, UtensilsCrossed, Ticket, Car, Briefcase, Video, Search, Bell, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import logoWordmark from "@/assets/primary-horizontal-logo-gold-2.png";
import logomark from "@/assets/logomark-gold.png";
import { CompactHeaderSearch } from "@/components/CompactHeaderSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/SearchBar";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const [usePreferences, setUsePreferences] = useState(true);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);

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

  const travelCategories = [
    { label: "Hotels", icon: Hotel, service: "hotels" },
    { label: "Flights", icon: Plane, service: "flights" },
    { label: "Restaurants", icon: UtensilsCrossed, service: "restaurants" },
    { label: "Events", icon: Ticket, service: "events" },
    { label: "Car Rentals", icon: Car, service: "cars" },
  ];

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-50 touch-manipulation">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          {/* Mobile Layout */}
          {isMobile ? (
            <div className="flex flex-col gap-2 py-2">
              {/* Top row: Logo + Notifications */}
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center hover:opacity-90 transition-opacity">
                  <img src={logomark} alt="Goldsainte Logo" className="h-8 w-8" />
                </a>
                {user && <NotificationCenter />}
              </div>
              
              {/* Horizontal scrolling travel categories */}
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {travelCategories.map((category) => (
                    <Button
                      key={category.service}
                      variant="outline"
                      size="sm"
                      onClick={() => handleServiceClick(category.service)}
                      className="flex items-center gap-2 shrink-0 rounded-full px-4 h-9"
                    >
                      <category.icon className="h-4 w-4" />
                      <span className="text-sm">{category.label}</span>
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          ) : (
            /* Desktop Layout */
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 md:gap-4 h-14 sm:h-16 md:h-20">
              {/* Logo - Left */}
              <a href="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0 min-h-[44px]">
                <img src={logoWordmark} alt="Goldsainte Logo" className="h-6 sm:h-7 md:h-8 w-auto" />
              </a>

              {/* Compact Search Bar - Center */}
              <div className="flex justify-center">
                <CompactHeaderSearch />
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {user && <NotificationCenter />}
                
                {/* Main Navigation - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-10 w-10 sm:h-11 sm:w-11"
                      aria-label="Main menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 bg-background border-border z-[100]">
                    {/* Travel Section */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">Travel</p>
                    </div>
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
                    
                    {/* Places Section */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">Places</p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/travel-feed')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                      <Video className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Travel Feed</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/trending')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                      <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Trending</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/search')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                      <Search className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Explore</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Travel Agent Marketplace Section */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">Agent Marketplace</p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/browse-agents')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                      <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Browse Agents</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/marketplace')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                      <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Marketplace</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/agent-onboarding')} className="gap-3 cursor-pointer min-h-[44px] text-sm">
                      <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Become an Agent</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
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
                  <DropdownMenuContent align="end" className="w-64 bg-background border-border z-[100]">
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
                        <DropdownMenuItem onClick={() => navigate('/travel-feed')} className="cursor-pointer gap-2 min-h-[44px] text-sm">
                          <Video className="h-4 w-4 flex-shrink-0" />
                          Travel Feed
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
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
          <div className="grid grid-cols-4 h-16">
            <button
              onClick={() => setSearchSheetOpen(true)}
              className="flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
              <span className="text-xs">Search</span>
            </button>
            
            <button
              onClick={() => navigate('/travel-feed')}
              className="flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Places"
            >
              <Video className="h-5 w-5" />
              <span className="text-xs">Places</span>
            </button>
            
            <button
              onClick={() => navigate('/marketplace')}
              className="flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Marketplace"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-xs">Marketplace</span>
            </button>
            
            <button
              onClick={() => user ? navigate('/travel-profile') : navigate('/auth')}
              className="flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Profile"
            >
              {user ? (
                <Avatar className="h-6 w-6 ring-2 ring-primary/20">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </nav>
      )}

      {/* Mobile Search Sheet */}
      {isMobile && (
        <Sheet open={searchSheetOpen} onOpenChange={setSearchSheetOpen}>
          <SheetContent side="bottom" className="h-full max-h-[100dvh] p-0 rounded-t-3xl">
            <div className="flex flex-col h-full">
              <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSearchSheetOpen(false)}
                    className="flex items-center gap-2 text-foreground hover:opacity-70 transition-opacity"
                    aria-label="Close search"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="text-sm font-medium">Back to Search</span>
                  </button>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto pb-20">
                <div className="p-6">
                  <SearchBar />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
