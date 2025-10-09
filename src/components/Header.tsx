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
                {user && (
                  <NotificationCenter />
                )}
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
              <div className="flex justify-center" data-tour="traditional-search">
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
                      className="h-10 w-10 sm:h-11 sm:w-11 hover:bg-secondary/10 transition-all duration-300"
                      aria-label="Main menu"
                      data-tour="navigation"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-80 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
                  >
                    {/* Travel Section */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em] letterspacing-wide">Travel</p>
                    </div>
                    <div className="py-2">
                      <DropdownMenuItem 
                        onClick={() => handleServiceClick('hotels')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Hotel className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Hotels & Stays</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleServiceClick('flights')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Plane className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Flights</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleServiceClick('restaurants')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <UtensilsCrossed className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Restaurants</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleServiceClick('events')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Ticket className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Events</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleServiceClick('cars')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Car className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Car Rentals</span>
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-border/50" />
                    
                    {/* Create Section */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">Create</p>
                    </div>
                    <div className="py-2">
                      <DropdownMenuItem 
                        onClick={() => navigate('/travel-feed')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Video className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Travel Feed</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/trending')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Trending</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/search')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Search className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Explore</span>
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-border/50" />
                    
                    {/* Travel Agent Marketplace Section */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">Agent Marketplace</p>
                    </div>
                    <div className="py-2 pb-3">
                      <DropdownMenuItem 
                        onClick={() => navigate('/browse-agents')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Browse Agents</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/marketplace')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Marketplace</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/agent-onboarding')} 
                        className="mx-2 px-4 py-3 gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                      >
                        <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Become an Agent</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                 </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-10 w-10 sm:h-11 sm:w-11 hover:bg-secondary/10 rounded-full border border-border shadow-sm transition-all duration-300"
                      aria-label="User menu"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-72 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
                  >
                    {user ? (
                      <>
                        <div className="py-2">
                          <DropdownMenuItem 
                            onClick={() => navigate('/dashboard')} 
                            className="mx-2 px-4 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium">Dashboard</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/my-bookings')} 
                            className="mx-2 px-4 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium">My Bookings</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/favorites')} 
                            className="mx-2 px-4 py-3 gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                          >
                            <Heart className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Favorites</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/booking-preferences')} 
                            className="mx-2 px-4 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1"
                          >
                            <span className="text-sm font-medium">Booking Preferences</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/travel-feed')} 
                            className="mx-2 px-4 py-3 gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                          >
                            <Video className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Travel Feed</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/creator-dashboard')} 
                            className="mx-2 px-4 py-3 gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group"
                          >
                            <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Creator Dashboard</span>
                          </DropdownMenuItem>
                        </div>
                        
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <div className="py-2">
                              <DropdownMenuItem 
                                onClick={() => navigate('/admin/agent-approvals')} 
                                className="mx-2 px-4 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1"
                              >
                                <span className="text-sm font-semibold text-secondary">Admin Panel</span>
                              </DropdownMenuItem>
                            </div>
                          </>
                        )}
                        
                        <DropdownMenuSeparator className="bg-border/50" />
                        
                        <div className="px-4 py-4">
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
                        
                        <DropdownMenuSeparator className="bg-border/50" />
                        
                        <div className="py-2 pb-3">
                          <DropdownMenuItem 
                            onClick={signOut} 
                            className="mx-2 px-4 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <span className="text-sm font-medium">Sign Out</span>
                          </DropdownMenuItem>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/auth')} 
                          className="mx-2 px-4 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1"
                        >
                          <span className="text-sm font-semibold">Sign In</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/auth')} 
                          className="mx-2 px-4 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1"
                        >
                          <span className="text-sm font-medium">Sign Up</span>
                        </DropdownMenuItem>
                      </div>
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
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
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
              aria-label="Create"
              data-tour="places"
            >
              <Video className="h-5 w-5" />
              <span className="text-xs">Create</span>
            </button>
            
            <button
              onClick={() => navigate('/marketplace')}
              className="flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Marketplace"
              data-tour="marketplace"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-xs">Marketplace</span>
            </button>
            
            <button
              onClick={() => user ? navigate('/travel-profile') : navigate('/auth')}
              className="flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Profile"
              data-tour="profile"
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
