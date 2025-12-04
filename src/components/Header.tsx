import { useState, useEffect } from "react";
import { User, Hotel, Plane, Ticket, Briefcase, Video, Bell, TrendingUp, ArrowLeft, Plus, ShoppingCart, Link2, LayoutDashboard, Calendar, Settings, Info, Sparkles, CreditCard, PlaneTakeoff, HandCoins, ShieldCheck, Car, MessageCircle } from "lucide-react";
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { CreateMomentModal } from "@/components/CreateMomentModal";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import logoWordmark from "@/assets/primary-horizontal-logo-gold-2.png";
import logomark from "@/assets/logomark-gold.png";
import { useExpediaModal } from "@/contexts/ExpediaModalContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/SearchBar";

import { LanguageSelector } from "@/components/LanguageSelector";
import { NotificationInbox } from "@/components/NotificationInbox";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const { language: currentLanguage, setLanguage: setCurrentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [usePreferences, setUsePreferences] = useState(true);
  
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadInitialTab, setUploadInitialTab] = useState<"photo" | "video">("photo");
  const [createMomentOpen, setCreateMomentOpen] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const { openModal: openExpediaModal } = useExpediaModal();
  const { unreadCount: unreadMessageCount } = useUnreadMessageCount();
  const accountType = ((user as any)?.user_metadata?.account_type as string | undefined)?.toLowerCase() ?? null;
  const isTraveler = !accountType || accountType === "traveler";
  const isCreator = accountType === "creator";
  const isAgentAccount = accountType === "agent";
  const isBrand = accountType === "brand";
  const showPartnerBookings = isCreator || isAgentAccount;
  const primaryBookingsPath = showPartnerBookings ? "/partner-bookings" : "/my-bookings";

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    toast({
      title: t('language.changed'),
      description: t('language.setTo', { language: language.toUpperCase() }),
    });
  };

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

  // Fetch and subscribe to profile avatar changes
  useEffect(() => {
    if (!user) {
      setProfileAvatarUrl(null);
      return;
    }

    const fetchProfileAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfileAvatarUrl(data.avatar_url);
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
    } else if (type === "moment") {
      setCreateSheetOpen(false);
      setCreateMomentOpen(true);
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
                  <img src={logomark} alt="Goldsainte Logo" className="h-8 w-8" />
                </a>
                
                <div className="flex items-center gap-2">
                  {user && <NotificationBell />}
                  
                  {/* Unified Profile Menu - Mobile */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-12 w-12 min-h-[48px] min-w-[48px] hover:bg-[#BFAD72] rounded-full border border-border shadow-sm transition-all duration-300 group touch-manipulation"
                          aria-label="Menu"
                        >
                          <User className="h-6 w-6 text-[#BFAD72] group-hover:text-white transition-colors" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-80 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100]"
                    >
                      {user ? (
                        <>
                          {/* DISCOVER Section */}
                          <div className="px-4 py-3 border-b border-border/50">
                            <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Discover</p>
                          </div>
                          <div className="py-2">
                            <DropdownMenuItem
                              onClick={() => navigate('/storyboards')}
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <Plane className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Storyboards</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => navigate('/creators')} 
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Browse Creators</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => navigate('/browse-agents')} 
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Browse Agents</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => navigate('/marketplace')} 
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <ShoppingCart className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Marketplace</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate('/post-trip')}
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <PlaneTakeoff className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Post a Trip</span>
                            </DropdownMenuItem>
                            {(isCreator || isAgentAccount || isBrand) && (
                              <DropdownMenuItem 
                                onClick={() => navigate('/tiktok-lab')} 
                                className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <Video className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Goldsainte Creator Studio</span>
                              </DropdownMenuItem>
                            )}
                          </div>
                          
                          <DropdownMenuSeparator className="bg-border/50" />
                          
                          {/* MY ACCOUNT Section */}
                          <div className="px-4 py-3 border-b border-border/50">
                            <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">My Account</p>
                          </div>
                          <div className="py-2">
                            {isTraveler && (
                              <DropdownMenuItem
                                onClick={() => navigate('/traveler')}
                                className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <LayoutDashboard className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Dashboard</span>
                              </DropdownMenuItem>
                            )}
                            
                            {isTraveler && (
                              <DropdownMenuItem 
                                onClick={() => navigate('/my-trips')} 
                                className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <Plane className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">My Trips</span>
                              </DropdownMenuItem>
                            )}
                            
                            {isTraveler && (
                              <DropdownMenuItem 
                                onClick={() => navigate('/collections')} 
                                className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <Sparkles className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">My Collections</span>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => navigate('/messages')} 
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
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
                            
                            {isAgentAccount && (
                              <DropdownMenuItem 
                                onClick={() => navigate('/agent-trips')} 
                                className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Available Trips</span>
                              </DropdownMenuItem>
                            )}
                            
                            {isCreator && (
                              <DropdownMenuItem 
                                onClick={() => navigate('/creator-trips')} 
                                className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <Video className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Collab Opportunities</span>
                              </DropdownMenuItem>
                            )}
                            
                            {showPartnerBookings && (
                              <DropdownMenuItem 
                                onClick={() => navigate('/partner-bookings')} 
                                className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                              >
                                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">Partner Bookings</span>
                              </DropdownMenuItem>
                            )}
                          </div>
                          
                          {/* EARNINGS & BILLING Section - Creators/Agents/Brands only */}
                          {(isCreator || isAgentAccount || isBrand) && (
                            <>
                              <DropdownMenuSeparator className="bg-border/50" />
                              <div className="px-4 py-3 border-b border-border/50">
                                <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Earnings & Billing</p>
                              </div>
                              <div className="py-2">
                                {isCreator && (
                                  <DropdownMenuItem 
                                    onClick={() => navigate('/tiktok-lab/earnings')} 
                                    className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                                  >
                                    <HandCoins className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm font-medium">Earnings</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => navigate('/partner/escrow')} 
                                  className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                                >
                                  <ShieldCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm font-medium">Escrow & Milestones</span>
                                </DropdownMenuItem>
                                {!isCreator && (
                                  <DropdownMenuItem 
                                    onClick={() => navigate('/billing-dashboard')} 
                                    className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                                  >
                                    <CreditCard className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm font-medium">Billing</span>
                                  </DropdownMenuItem>
                                )}
                              </div>
                            </>
                          )}
                          
                          <DropdownMenuSeparator className="bg-border/50" />
                          
                          {/* PROFESSIONAL Section */}
                          <div className="px-4 py-3 border-b border-border/50">
                            <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Professional</p>
                          </div>
                          <div className="py-2">
                            <DropdownMenuItem 
                              onClick={() => navigate('/apply/agent')} 
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Become an Agent</span>
                            </DropdownMenuItem>
                          </div>
                          
                          <DropdownMenuSeparator className="bg-border/50" />
                          
                          {/* COMPANY Section */}
                          <div className="px-4 py-3 border-b border-border/50">
                            <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Company</p>
                          </div>
                          <div className="py-2">
                            <DropdownMenuItem
                              onClick={() => navigate('/concierge')}
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <Sparkles className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">Concierge</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate('/about')}
                              className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                            >
                              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium">About</span>
                            </DropdownMenuItem>
                          </div>
                          
                          {/* ADMIN Section - Admin only */}
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator className="bg-border/50" />
                              <div className="px-4 py-3 border-b border-border/50">
                                <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Admin</p>
                              </div>
                              <div className="py-2">
                                {[
                                  { label: 'Admin overview', path: '/admin' },
                                  { label: 'Applications', path: '/admin/applications' },
                                  { label: 'Agents dashboard', path: '/admin/agents' },
                                  { label: 'Creators dashboard', path: '/admin/creators' },
                                  { label: 'Bookings & revenue', path: '/admin/bookings' },
                                  { label: 'Disputes', path: '/admin/disputes' },
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
                            </>
                          )}
                          
                          {isTraveler && (
                            <>
                              <DropdownMenuSeparator className="bg-border/50" />
                              
                              {/* SETTINGS Section */}
                              <div className="px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                  <Label htmlFor="preferences-toggle-mobile" className="text-sm font-medium cursor-pointer flex-1 leading-tight">
                                    Use My Preferences
                                  </Label>
                                  <Switch
                                    id="preferences-toggle-mobile"
                                    checked={usePreferences}
                                    onCheckedChange={togglePreferences}
                                    className="flex-shrink-0 h-6 w-11"
                                    aria-label="Toggle search preferences"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                  Apply saved preferences to searches
                                </p>
                              </div>
                            </>
                          )}
                          
                          <DropdownMenuSeparator className="bg-border/50" />
                          
                          {/* Language Selector */}
                          <div className="px-4 py-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Language</p>
                            <LanguageSelector
                              variant="outline" 
                              size="sm" 
                              currentLanguage={currentLanguage}
                              onLanguageChange={handleLanguageChange}
                            />
                          </div>
                          
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
                <img src={logoWordmark} alt="Goldsainte Logo" className="h-6 sm:h-7 md:h-8 w-auto" />
              </a>

              {/* Right side actions - Single Profile Menu */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {user && <NotificationBell />}
                
                {/* Unified Profile Menu - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-12 w-12 min-h-[48px] min-w-[48px] sm:h-12 sm:w-12 hover:bg-[#BFAD72] rounded-full border border-border shadow-sm transition-all duration-300 group touch-manipulation"
                      aria-label="Menu"
                      data-tour="navigation"
                    >
                      <User className="h-6 w-6 text-[#BFAD72] group-hover:text-white transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-80 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
                  >
                    {user ? (
                      <>
                        {/* DISCOVER Section */}
                        <div className="px-4 py-3 border-b border-border/50">
                          <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Discover</p>
                        </div>
                        <div className="py-2">
                          <DropdownMenuItem
                            onClick={() => navigate('/storyboards')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Plane className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Storyboards</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/creators')} 
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <User className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Browse Creators</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/browse-agents')} 
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Browse Agents</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/marketplace')} 
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Marketplace</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate('/post-trip')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <PlaneTakeoff className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Post a Trip</span>
                          </DropdownMenuItem>
                          {(isCreator || isAgentAccount || isBrand) && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/tiktok-lab')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <Video className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Goldsainte Creator Studio</span>
                            </DropdownMenuItem>
                          )}
                        </div>

                        <DropdownMenuSeparator className="bg-border/50" />

                        {/* MY ACCOUNT Section */}
                        <div className="px-4 py-3 border-b border-border/50">
                          <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">My Account</p>
                        </div>
                        <div className="py-2">
                          {isTraveler && (
                            <DropdownMenuItem
                              onClick={() => navigate('/traveler')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <LayoutDashboard className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Dashboard</span>
                            </DropdownMenuItem>
                          )}
                          
                          {isTraveler && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/my-trips')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <Plane className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">My Trips</span>
                            </DropdownMenuItem>
                          )}
                          
                          {isTraveler && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/collections')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">My Collections</span>
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
                          
                          {isAgentAccount && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/agent-trips')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Available Trips</span>
                            </DropdownMenuItem>
                          )}
                          
                          {isCreator && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => navigate('/creator-trips')} 
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                              >
                                <Video className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                                <span className="text-sm font-medium">Collab Opportunities</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => navigate('/creator-dashboard')} 
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                                data-tour="creator-dashboard"
                              >
                                <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                                <span className="text-sm font-medium">Creator Dashboard</span>
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {showPartnerBookings && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/partner-bookings')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            >
                              <Calendar className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                              <span className="text-sm font-medium">Partner Bookings</span>
                            </DropdownMenuItem>
                          )}
                        </div>

                        {/* EARNINGS & BILLING Section - Creators/Agents/Brands only */}
                        {(isCreator || isAgentAccount || isBrand) && (
                          <>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <div className="px-4 py-3 border-b border-border/50">
                              <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Earnings & Billing</p>
                            </div>
                            <div className="py-2">
                              {isCreator && (
                                <DropdownMenuItem 
                                  onClick={() => navigate('/tiktok-lab/earnings')} 
                                  className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                                >
                                  <HandCoins className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                                  <span className="text-sm font-medium">Earnings</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => navigate('/partner/escrow')} 
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                              >
                                <ShieldCheck className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                                <span className="text-sm font-medium">Escrow & Milestones</span>
                              </DropdownMenuItem>
                              {!isCreator && (
                                <DropdownMenuItem 
                                  onClick={() => navigate('/billing-dashboard')} 
                                  className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                                >
                                  <CreditCard className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                                  <span className="text-sm font-medium">Billing</span>
                                </DropdownMenuItem>
                              )}
                            </div>
                          </>
                        )}

                        <DropdownMenuSeparator className="bg-border/50" />

                        {/* PROFESSIONAL Section */}
                        <div className="px-4 py-3 border-b border-border/50">
                          <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Professional</p>
                        </div>
                        <div className="py-2">
                          <DropdownMenuItem 
                            onClick={() => navigate('/apply/agent')} 
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Become an Agent</span>
                          </DropdownMenuItem>
                        </div>
                        
                        <DropdownMenuSeparator className="bg-border/50" />
                        
                        {/* COMPANY Section */}
                        <div className="px-4 py-3 border-b border-border/50">
                          <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Company</p>
                        </div>
                        <div className="py-2">
                          <DropdownMenuItem
                            onClick={() => navigate('/concierge')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Concierge</span>
                          </DropdownMenuItem>
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
                          <>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <div className="px-4 py-3 border-b border-border/50">
                              <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">Admin</p>
                            </div>
                            <div className="py-2">
                              {[
                                { label: 'Admin overview', path: '/admin' },
                                { label: 'Applications', path: '/admin/applications' },
                                { label: 'Agents dashboard', path: '/admin/agents' },
                                { label: 'Creators dashboard', path: '/admin/creators' },
                                { label: 'Bookings & revenue', path: '/admin/bookings' },
                                { label: 'Disputes', path: '/admin/disputes' },
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
                          </>
                        )}
                        
                        {isTraveler && (
                          <>
                            <DropdownMenuSeparator className="bg-border/50" />
                            
                            {/* SETTINGS Section */}
                            <div className="px-4 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="preferences-toggle" className="text-sm font-medium cursor-pointer flex-1 leading-tight">
                                  Use My Preferences
                                </Label>
                                <Switch
                                  id="preferences-toggle"
                                  checked={usePreferences}
                                  onCheckedChange={togglePreferences}
                                  className="flex-shrink-0 h-6 w-11"
                                  aria-label="Toggle search preferences"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Apply saved preferences to searches
                              </p>
                            </div>
                          </>
                        )}
                        
                        <DropdownMenuSeparator className="bg-border/50" />
                        
                        {/* Language Selector */}
                        <div className="px-4 py-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Language</p>
                          <LanguageSelector
                            variant="outline" 
                            size="sm" 
                            currentLanguage={currentLanguage}
                            onLanguageChange={handleLanguageChange}
                          />
                        </div>
                        
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <div className="grid grid-cols-4 h-16">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex flex-col items-center justify-center gap-0.5 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Marketplace"
              data-tour="marketplace"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-[10px]">Marketplace</span>
            </button>

            <button
              onClick={() => (user ? navigate('/collections') : navigate('/auth'))}
              className="flex flex-col items-center justify-center gap-0.5 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Collections"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-[10px]">Collections</span>
            </button>

            <button
              onClick={() => navigate('/concierge')}
              className="flex flex-col items-center justify-center gap-0.5 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Concierge"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-[10px]">Concierge</span>
            </button>

            <button
              onClick={() => {
                if (!user) {
                  navigate('/auth');
                  return;
                }
                // Role-based profile routing (same logic as MobileBottomNav)
                switch (accountType) {
                  case "creator":
                    navigate(`/creator/${user.id}`);
                    break;
                  case "agent":
                    navigate("/agent-dashboard");
                    break;
                  default:
                    navigate("/traveler"); // Travelers and default
                }
              }}
              className="flex flex-col items-center justify-center gap-0.5 hover:bg-muted transition-colors min-h-[44px]"
              aria-label="Profile"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px]">Profile</span>
            </button>
          </div>
        </nav>
      )}

      {/* Create Content Modal */}
      <CreateMomentModal open={createMomentOpen} onOpenChange={setCreateMomentOpen} />
    </>
  );
};
