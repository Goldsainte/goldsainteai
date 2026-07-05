import { useState, useEffect } from "react";
import { User, Hotel, Plane, Ticket, Briefcase, Video, Bell, TrendingUp, ArrowLeft, Plus, ShoppingCart, Link2, LayoutDashboard, Settings, Info, Sparkles, PlaneTakeoff, Car, MessageCircle, BarChart3, Luggage, BookOpen, Newspaper, ChevronDown } from "lucide-react";
import { NotificationBell } from '@/components/notifications/NotificationBell';

import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
  
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import logoWordmark from "@/assets/primary-horizontal-logo-gold-2.webp";
import logomark from "@/assets/logomark-gold.webp";
import { useExpediaModal } from "@/contexts/ExpediaModalContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotificationInbox } from "@/components/NotificationInbox";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin, isCreator, isAgent: isAgentAccount, isBrand } = useUserRole();
  const isMobile = useIsMobile();
  
  
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadInitialTab, setUploadInitialTab] = useState<"photo" | "video">("photo");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const { openModal: openExpediaModal } = useExpediaModal();
  const { unreadCount: unreadMessageCount } = useUnreadMessageCount();
  const isTraveler = !isCreator && !isAgentAccount && !isBrand;
  const primaryBookingsPath = "/my-bookings";
  // Travelers use /post-trip to request a custom trip from agents.
  // Creators/agents have a dedicated "Create Trip Package" item that points
  // at /trip-builder, so we hide the traveler-facing entry for them to avoid
  // two menu items routing to the same place.
  const postTripPath = "/post-trip";
  const showRequestTrip = !isAgentAccount && !isCreator;

  useEffect(() => {
    if (!user) {
      setProfileAvatarUrl(null);
      return;
    }

    const fetchProfileAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name, full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfileAvatarUrl(data.avatar_url);
        setProfileName(data.display_name || data.full_name || null);
      }
    };

    fetchProfileAvatar();

    const channel = supabase
      .channel(`profile-avatar-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'avatar_url' in payload.new) {
            setProfileAvatarUrl(payload.new.avatar_url as string);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCreateContent = (type: string) => {
    if (!user) {
      navigate('/auth');
      toast({
        title: "Sign in required",
        description: "Please sign in to create content",
      });
      return;
    }
    if (type === "reel") {
      setCreateSheetOpen(false);
      setUploadInitialTab("video");
      setUploadModalOpen(true);
    } else if (type === "post") {
      setCreateSheetOpen(false);
      setUploadInitialTab("photo");
      setUploadModalOpen(true);
    } else if (type === "moments-vault") {
      toast({
        title: "Moments Vault",
        description: "Go to your profile to create moments vaults",
      });
      setCreateSheetOpen(false);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      navigate('/auth');
      toast({
        title: "Sign in required",
        description: "Please sign in to create content",
      });
      return;
    }
    setCreateSheetOpen(true);
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
  };

  const getProfilePath = () => {
    if (isCreator) return `/creators/${user?.id}`;
    if (isAgentAccount) return '/agent-dashboard';
    return '/traveler';
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
    { label: "Events", icon: Ticket, service: "events" },
  ];

  return (
    <>
      <header className="bg-[#0c4d47] border-b border-border sticky top-0 z-50 touch-manipulation font-secondary">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          {/* Mobile Layout */}
          {isMobile ? (
            <div className="flex flex-col gap-2 py-2">
              {/* Top row: Logo + Notifications + Profile Menu */}
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center hover:opacity-90 transition-opacity">
                  <img src={logomark} alt="Goldsainte Logo" className="h-8 w-8" loading="lazy"/>
                </a>
                
                <div className="flex items-center gap-2">
                  {user && (
                    <>
                       <NotificationBell />
                    </>
                  )}
                  {!user && (
                    <Button
                      onClick={() => navigate('/auth?mode=signup')}
                      className="rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] h-10 px-4 text-xs font-semibold"
                    >
                      Get Started
                    </Button>
                  )}

                  {/* Unified Profile Menu - Mobile */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-12 w-12 min-h-[48px] min-w-[48px] hover:bg-[#BFAD72] rounded-full border border-border shadow-sm transition-all duration-300 group touch-manipulation focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-[#BFAD72]"
                          aria-label="Menu"
                        >
                          <User className="h-6 w-6 text-[#BFAD72] group-hover:text-[#0a2225] group-focus-visible:text-[#0a2225] transition-colors" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-80 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100]"
                    >
                      {user ? (
                        <>
                          {/* Greeting */}
                          <div className="px-4 py-3 border-b border-border/30">
                            <p className="text-sm font-semibold text-[#BFAD72]">
                              Hello, {profileName || 'there'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isCreator ? 'Creator Account' : isAgentAccount ? 'Agent Account' : isBrand ? 'Brand Account' : 'Traveler Account'}
                            </p>
                          </div>

                          {/* Core Experience */}
                          <div className="py-2">
                            <DropdownMenuItem
                              onClick={() => navigate('/marketplace')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <ShoppingCart className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Travel Marketplace</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(primaryBookingsPath)}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <Luggage className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">My Bookings</span>
                            </DropdownMenuItem>
                            {showRequestTrip && (
                              <DropdownMenuItem
                                onClick={() => navigate(postTripPath)}
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <PlaneTakeoff className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Request a Trip</span>
                              </DropdownMenuItem>
                            )}
                            {!isAgentAccount && !isCreator && (
                              <DropdownMenuItem
                                onClick={() => navigate('/my-purchases')}
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">My Guides</span>
                              </DropdownMenuItem>
                            )}
                            {isAgentAccount && (
                              <DropdownMenuItem 
                                onClick={() => navigate('/agent-trips')} 
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Available Trips</span>
                              </DropdownMenuItem>
                            )}
                            {(isCreator || isAgentAccount) && (
                              <DropdownMenuItem 
                                onClick={() => navigate('/trip-builder')} 
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Create Trip Package</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => navigate('/messages')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <div className="relative flex-shrink-0">
                                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                                {unreadMessageCount > 0 && (
                                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center px-1">
                                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-medium">Messages</span>
                            </DropdownMenuItem>
                          </div>

                          <DropdownMenuSeparator className="bg-border/50" />

                          {/* Account */}
                          <div className="py-2">
                            <DropdownMenuItem
                              onClick={() => navigate(getProfilePath())}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">My Profile</span>
                            </DropdownMenuItem>
                            {isCreator && (
                              <DropdownMenuItem
                                onClick={() => navigate('/creator-dashboard')}
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <BarChart3 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Creator Dashboard</span>
                              </DropdownMenuItem>
                            )}
                            {isAgentAccount && (
                              <DropdownMenuItem
                                onClick={() => navigate('/agent-dashboard')}
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <LayoutDashboard className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Agent Dashboard</span>
                              </DropdownMenuItem>
                            )}
                          </div>

                          <DropdownMenuSeparator className="bg-border/50" />

                          {/* Secondary */}
                          <div className="py-2">
                            <DropdownMenuItem 
                              onClick={() => navigate('/auth?mode=signup&role=agent')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Become an Agent</span>
                            </DropdownMenuItem>
                          </div>

                          <DropdownMenuSeparator className="bg-border/50" />

                          {/* Informational */}
                          <div className="py-2">
                            <DropdownMenuItem
                              onClick={() => navigate('/about')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">About</span>
                            </DropdownMenuItem>
                          </div>

                          {/* ADMIN Section - Admin only */}
                          {isAdmin && (
                            <Accordion type="multiple" className="w-full">
                              <AccordionItem value="admin" className="border-b-0">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/5 [&[data-state=open]]:bg-secondary/5">
                                  <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Admin</p>
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                  <div className="py-1">
                                    {[
                                      { label: 'Admin overview', path: '/admin' },
                                      { label: 'Applications', path: '/admin/applications' },
                                      { label: 'Agents dashboard', path: '/admin/agents' },
                                      { label: 'Creators dashboard', path: '/admin/creators' },
                                      { label: 'Bookings & revenue', path: '/admin/bookings' },
                                      { label: 'Disputes', path: '/admin/disputes' },
                                      { label: 'Newsroom', path: '/admin/newsroom' },
                                    ].map((item) => (
                                      <DropdownMenuItem
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className="mx-2 px-4 py-3 min-h-[44px] cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                                      >
                                        <span className="text-sm font-semibold text-[#0c4d47]">{item.label}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                          
                          
                          
                          
                           <DropdownMenuSeparator className="bg-border/50" />
                          
                          <div className="py-2 pb-3">
                            <DropdownMenuItem 
                              onClick={signOut} 
                              className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                            >
                              <span className="text-sm font-medium">Sign Out</span>
                            </DropdownMenuItem>
                          </div>
                        </>
                      ) : (
                        /* Logged Out - Simple Sign In / Sign Up */
                        <div className="py-2">
                          <DropdownMenuItem 
                            onClick={() => navigate('/auth')} 
                            className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                          >
                            <span className="text-sm font-semibold">Sign In</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/auth?mode=signup')} 
                            className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg hover:bg-secondary/10 bg-secondary/5 touch-manipulation"
                          >
                            <span className="text-sm font-medium">Sign Up</span>
                          </DropdownMenuItem>
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
            </div>
          ) : (
            /* Desktop Layout */
            <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 h-14 sm:h-16 md:h-20">
              {/* Logo - Left */}
              <a href="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0 min-h-[44px]">
                <img src={logoWordmark} alt="Goldsainte Logo" className="h-6 sm:h-7 md:h-8 w-auto" loading="lazy"/>
              </a>

              {/* Primary nav — TrovaTrip-style accordion dropdowns (desktop only).
                  Every link targets a route that exists today; nothing aspirational. */}
              <nav className="hidden lg:flex items-center gap-1 flex-1 ml-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="font-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium text-[#E5DFC6] hover:bg-white/10 transition-colors focus:outline-none data-[state=open]:bg-white/10"
                    >
                      Travel
                      <ChevronDown className="h-3.5 w-3.5 transition-transform data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-white border-[#E5DFC6] font-primary">
                    <DropdownMenuItem onClick={() => navigate('/marketplace')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Marketplace</p>
                        <p className="text-xs text-[#6B7280]">Browse curated trips</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/marketplace?tab=itinerary-guides')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Itinerary Guides</p>
                        <p className="text-xs text-[#6B7280]">Downloadable day-by-day guides</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/post-trip')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Post a Trip Request</p>
                        <p className="text-xs text-[#6B7280]">Get tailored proposals from specialists</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  onClick={() => navigate('/creators')}
                  className="font-primary rounded-full px-4 py-2 text-[15px] font-medium text-[#E5DFC6] hover:bg-white/10 transition-colors"
                >
                  Creators
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="font-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium text-[#E5DFC6] hover:bg-white/10 transition-colors focus:outline-none data-[state=open]:bg-white/10"
                    >
                      Partner
                      <ChevronDown className="h-3.5 w-3.5 transition-transform data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-white border-[#E5DFC6] font-primary">
                    <DropdownMenuItem onClick={() => navigate('/apply/agent')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Become an Agent</p>
                        <p className="text-xs text-[#6B7280]">Sell trips and guides on Goldsainte</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/apply/brand')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Partner Your Brand</p>
                        <p className="text-xs text-[#6B7280]">Reach travelers through creators</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              {/* Right side actions - Single Profile Menu */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {user && (
                  <>
                     <NotificationBell />
                  </>
                )}
                {!user && (
                  <Button
                    onClick={() => navigate('/auth?mode=signup')}
                    className="rounded-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] h-10 px-5 text-sm font-semibold mr-1"
                  >
                    Get Started
                  </Button>
                )}

                {/* Unified Profile Menu - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-12 w-12 min-h-[48px] min-w-[48px] sm:h-12 sm:w-12 hover:bg-[#BFAD72] rounded-full border border-border shadow-sm transition-all duration-300 group touch-manipulation focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-[#BFAD72]"
                      aria-label="Menu"
                      data-tour="navigation"
                    >
                      <User className="h-6 w-6 text-[#BFAD72] group-hover:text-[#0a2225] group-focus-visible:text-[#0a2225] transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-80 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
                  >
                    {user ? (
                      <>
                        {/* Greeting */}
                        <div className="px-4 py-3 border-b border-border/30">
                          <p className="text-sm font-semibold text-[#BFAD72]">
                            Hello, {profileName || 'there'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isCreator ? 'Creator Account' : isAgentAccount ? 'Agent Account' : isBrand ? 'Brand Account' : 'Traveler Account'}
                          </p>
                        </div>

                        {/* Core Experience */}
                        <div className="py-2">
                          <DropdownMenuItem
                            onClick={() => navigate('/marketplace')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Travel Marketplace</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(primaryBookingsPath)}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Luggage className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">My Bookings</span>
                          </DropdownMenuItem>
                          {showRequestTrip && (
                            <DropdownMenuItem
                              onClick={() => navigate(postTripPath)}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <PlaneTakeoff className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Request a Trip</span>
                            </DropdownMenuItem>
                          )}
                          {!isAgentAccount && !isCreator && (
                            <DropdownMenuItem
                              onClick={() => navigate('/my-purchases')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">My Guides</span>
                            </DropdownMenuItem>
                          )}
                          {isAgentAccount && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/agent-trips')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Available Trips</span>
                            </DropdownMenuItem>
                          )}
                          {(isCreator || isAgentAccount) && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/trip-builder')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Create Trip Package</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => navigate('/messages')} 
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <div className="relative flex-shrink-0">
                              <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300" />
                              {unreadMessageCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center px-1">
                                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium">Messages</span>
                          </DropdownMenuItem>
                        </div>

                        <DropdownMenuSeparator className="bg-border/50" />

                        {/* Account */}
                        <div className="py-2">
                          <DropdownMenuItem
                            onClick={() => navigate(getProfilePath())}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <User className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">My Profile</span>
                          </DropdownMenuItem>
                          {isCreator && (
                            <DropdownMenuItem
                              onClick={() => navigate('/creator-dashboard')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <BarChart3 className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Creator Dashboard</span>
                            </DropdownMenuItem>
                          )}
                          {isAgentAccount && (
                            <DropdownMenuItem
                              onClick={() => navigate('/agent-dashboard')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <LayoutDashboard className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Agent Dashboard</span>
                            </DropdownMenuItem>
                          )}
                        </div>

                        <DropdownMenuSeparator className="bg-border/50" />

                        {/* Secondary */}
                        <div className="py-2">
                          <DropdownMenuItem 
                            onClick={() => navigate('/auth?mode=signup&role=agent')} 
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Become an Agent</span>
                          </DropdownMenuItem>
                        </div>

                        <DropdownMenuSeparator className="bg-border/50" />

                        {/* Informational */}
                        <div className="py-2">
                          <DropdownMenuItem
                            onClick={() => navigate('/about')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Info className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">About</span>
                          </DropdownMenuItem>
                        </div>

                        {/* ADMIN Section - Admin only */}
                        {isAdmin && (
                          <Accordion type="multiple" className="w-full">
                            <AccordionItem value="admin" className="border-b-0">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/5 [&[data-state=open]]:bg-secondary/5">
                                <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Admin</p>
                              </AccordionTrigger>
                              <AccordionContent className="pb-0">
                                <div className="py-1">
                                  {[
                                    { label: 'Admin overview', path: '/admin' },
                                    { label: 'Applications', path: '/admin/applications' },
                                    { label: 'Agents dashboard', path: '/admin/agents' },
                                    { label: 'Creators dashboard', path: '/admin/creators' },
                                    { label: 'Bookings & revenue', path: '/admin/bookings' },
                                    { label: 'Disputes', path: '/admin/disputes' },
                                    { label: 'Newsroom', path: '/admin/newsroom' },
                                  ].map((item) => (
                                    <DropdownMenuItem
                                      key={item.path}
                                      onClick={() => navigate(item.path)}
                                      className="mx-2 px-4 py-3 min-h-[44px] cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 touch-manipulation"
                                    >
                                      <span className="text-sm font-semibold text-[#0c4d47]">{item.label}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                        
                        
                        
                         <DropdownMenuSeparator className="bg-border/50" />
                        
                        <div className="py-2 pb-3">
                          <DropdownMenuItem 
                            onClick={signOut} 
                            className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg transition-all duration-300 hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                          >
                            <span className="text-sm font-medium">Sign Out</span>
                          </DropdownMenuItem>
                        </div>
                      </>
                    ) : (
                      /* Logged Out - Simple Sign In / Sign Up */
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/auth')} 
                          className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 touch-manipulation"
                        >
                          <span className="text-sm font-semibold">Sign In</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/auth?mode=signup')} 
                          className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 touch-manipulation"
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

    </>
  );
};
