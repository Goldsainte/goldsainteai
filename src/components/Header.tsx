import { useState, useEffect } from "react";
import { Heart, User, Menu, Hotel, Plane, Ticket, Car, Briefcase, Video, Search, Bell, TrendingUp, ArrowLeft, Plus, Coins, ShoppingCart, Link2, LayoutDashboard, Calendar, Settings, Info, Crown, CreditCard } from "lucide-react";
import CreateContentSheet from "@/components/CreateContentSheet";
import ContentUploadModal from "@/components/ContentUploadModal";
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
import { CompactHeaderSearch } from "@/components/CompactHeaderSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { CollaborationInvites } from "@/components/CollaborationInvites";
import { PartnershipApprovals } from "@/components/PartnershipApprovals";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/SearchBar";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { BuyCoinsModal } from "@/components/BuyCoinsModal";
import { LanguageSelector } from "@/components/LanguageSelector";

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
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadInitialTab, setUploadInitialTab] = useState<"photo" | "video">("photo");
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);
  const [createMomentOpen, setCreateMomentOpen] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const { balance } = useCoinBalance();

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
              {/* Top row: Logo + Navigation + User Menu */}
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center hover:opacity-90 transition-opacity">
                  <img src={logomark} alt="Goldsainte Logo" className="h-8 w-8" />
                </a>
                
                <div className="flex items-center gap-2">
                  {user && <NotificationCenter />}
                  <LanguageSelector
                    variant="ghost" 
                    size="sm" 
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                  />
                  
                  {/* Mobile Navigation Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-12 w-12 min-h-[48px] min-w-[48px] hover:bg-[#BFAD72] transition-all duration-300 group touch-manipulation"
                          aria-label="Main menu"
                        >
                          <Menu className="h-6 w-6 text-[#BFAD72] group-hover:text-white transition-colors" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-80 max-h-[75vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100]"
                    >
                      {/* Discover Section */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">{t('navigation.discover')}</p>
                      </div>
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/travel-feed')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <Video className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.journeys')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/cocurated-journeys')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <Plane className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.cocuratedJourneys')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/browse-creators')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.browseCreators')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/browse-agents')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.browseAgents')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/marketplace')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <ShoppingCart className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.marketplace')}</span>
                        </DropdownMenuItem>
                      </div>
                      
                      <DropdownMenuSeparator className="bg-border/50" />
                      
                      {/* Professional Section */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">{t('navigation.professional')}</p>
                      </div>
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/agent-onboarding')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.becomeAgent')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/transportation-vendor-partners')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <Car className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.becomeTransportVendor')}</span>
                        </DropdownMenuItem>
                      </div>
                      
                      <DropdownMenuSeparator className="bg-border/50" />
                      
                      {/* Shop & Commerce Section */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">{t('navigation.shopAndEarn')}</p>
                      </div>
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/shop')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <ShoppingCart className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.shop')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/affiliate-manager')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <Link2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.affiliateLinks')}</span>
                        </DropdownMenuItem>
                      </div>
                      
                      <DropdownMenuSeparator className="bg-border/50" />
                      
                      {/* Company Section */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">{t('navigation.company')}</p>
                      </div>
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/subscription')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <Crown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.subscription')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/about')} 
                          className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                        >
                          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{t('navigation.about')}</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Mobile User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-12 w-12 min-h-[48px] min-w-[48px] hover:bg-[#BFAD72] rounded-full border border-border shadow-sm transition-all duration-300 group touch-manipulation"
                          aria-label="User menu"
                        >
                          <User className="h-6 w-6 text-[#BFAD72] group-hover:text-white transition-colors" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-72 max-h-[75vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100]"
                    >
                      {user ? (
                        <>
                          {/* Coin Balance Section */}
                          <div className="px-4 py-3 border-b border-border/50">
                            <div 
                              className="flex items-center justify-between cursor-pointer hover:bg-secondary/10 -mx-2 px-2 py-1 rounded-lg transition-colors"
                              onClick={() => setBuyCoinsOpen(true)}
                            >
                              <div className="flex items-center gap-2">
                                <Coins className="h-5 w-5 text-secondary" />
                                <span className="text-sm font-medium">Coin Balance</span>
                              </div>
                              <span className="text-lg font-bold text-secondary">{balance}</span>
                            </div>
                          </div>

                          <DropdownMenuItem 
                            onClick={() => navigate('/profile')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                          >
                            <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium">Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/dashboard')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                          >
                            <LayoutDashboard className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium">Dashboard</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/price-alerts')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                          >
                            <Bell className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium">Price Alerts</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/billing-dashboard')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                          >
                            <CreditCard className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium">Billing</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={handleCreateClick} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                          >
                            <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium">Create Content</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-border/50" />
                          
                          <DropdownMenuItem 
                            onClick={signOut} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 text-destructive touch-manipulation"
                          >
                            <User className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm font-medium">Sign Out</span>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem 
                            onClick={() => navigate('/auth')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 touch-manipulation"
                          >
                            <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium">Sign In</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/auth?mode=signup')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg hover:bg-secondary/10 bg-secondary/20 touch-manipulation"
                          >
                            <User className="h-5 w-5 text-secondary flex-shrink-0" />
                            <span className="text-sm font-medium text-secondary">Sign Up</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Horizontal scrolling travel categories */}
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="w-max mx-auto flex gap-2 pb-2">
                  {travelCategories.map((category) => (
                    <Button
                      key={category.service}
                      variant="outline"
                      size="sm"
                      onClick={() => handleServiceClick(category.service)}
                      className="flex items-center gap-2 shrink-0 rounded-full px-4 h-9 border-2 border-secondary hover:bg-secondary/10 hover:border-secondary transition-all duration-300"
                    >
                      <category.icon className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-medium">{category.label}</span>
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
                <LanguageSelector 
                  variant="ghost" 
                  size="sm"
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                />
                {user && <NotificationCenter />}
                
                {/* Main Navigation - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-12 w-12 min-h-[48px] min-w-[48px] sm:h-12 sm:w-12 hover:bg-[#BFAD72] transition-all duration-300 group touch-manipulation"
                      aria-label="Main menu"
                      data-tour="navigation"
                    >
                      <Menu className="h-6 w-6 text-[#BFAD72] group-hover:text-white transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-80 max-h-[75vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
                  >
                    {/* Travel Section */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em] letterspacing-wide">Travel</p>
                    </div>
                    <div className="py-2">
                      <DropdownMenuItem 
                        onClick={() => handleServiceClick('hotels')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Hotel className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Hotels & Stays</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleServiceClick('flights')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Plane className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Flights</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleServiceClick('events')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Ticket className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Events</span>
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-border/50" />
                    
                    {/* Discover Section */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">Discover</p>
                    </div>
                    <div className="py-2">
                      <DropdownMenuItem 
                        onClick={() => navigate('/travel-feed')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Video className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Journeys</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/cocurated-journeys')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Plane className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">CoCurated Journeys</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/browse-creators')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <User className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Browse Creators</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/browse-agents')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Browse Agents</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/marketplace')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Marketplace</span>
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-border/50" />
                    
                    {/* Professional Section */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">Professional</p>
                    </div>
                    <div className="py-2 pb-3">
                      <DropdownMenuItem 
                        onClick={() => navigate('/agent-onboarding')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Become an Agent</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/transportation-vendor-partners')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Car className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Become a Transport Vendor</span>
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-border/50" />
                    
                    {/* Shop & Commerce Section */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">Shop & Earn</p>
                    </div>
                    <div className="py-2 pb-3">
                      <DropdownMenuItem 
                        onClick={() => navigate('/shop')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Shop</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/affiliate-manager')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Link2 className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Affiliate Links</span>
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-border/50" />
                    
                    {/* Company Section */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-[0.15em]">Company</p>
                    </div>
                    <div className="py-2 pb-3">
                      <DropdownMenuItem 
                        onClick={() => navigate('/subscription')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Crown className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">Subscription</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/about')} 
                        className="mx-2 px-4 py-4 min-h-[48px] gap-4 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                      >
                        <Info className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                        <span className="text-sm font-medium">About</span>
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
                      className="h-12 w-12 min-h-[48px] min-w-[48px] sm:h-12 sm:w-12 hover:bg-[#BFAD72] rounded-full border border-border shadow-sm transition-all duration-300 group touch-manipulation"
                      aria-label="User menu"
                    >
                      <User className="h-6 w-6 text-[#BFAD72] group-hover:text-white transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-72 max-h-[75vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
                  >
                    {user ? (
                      <>
                        {/* Coin Balance Section */}
                        <div className="px-4 py-3 border-b border-border/50" data-tour="coin-balance">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">{balance} Coins</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBuyCoinsOpen(true)}
                              className="h-7 text-xs hover:bg-secondary/10"
                              data-tour="buy-coins"
                            >
                              Buy
                            </Button>
                          </div>
                        </div>

                        <div className="py-2">
                          <DropdownMenuItem 
                            onClick={() => navigate('/dashboard')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Dashboard</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/price-alerts')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Price Alerts</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/billing-dashboard')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <CreditCard className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Billing</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={handleCreateClick} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                          >
                            <Plus className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Create Content</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/creator-dashboard')} 
                            className="mx-2 px-4 py-4 min-h-[48px] gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 group touch-manipulation"
                            data-tour="creator-dashboard"
                          >
                            <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors duration-300 flex-shrink-0" />
                            <span className="text-sm font-medium">Creator Dashboard</span>
                          </DropdownMenuItem>
                        </div>
                        
                        <DropdownMenuSeparator className="bg-border/50" />
                        
                        <div className="px-2 py-2">
                          <CollaborationInvites />
                          <PartnershipApprovals />
                        </div>
                        
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <div className="py-2">
                              <DropdownMenuItem 
                                onClick={() => navigate('/admin/agent-approvals')} 
                                className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 touch-manipulation"
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
                            className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg transition-all duration-300 hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                          >
                            <span className="text-sm font-medium">Sign Out</span>
                          </DropdownMenuItem>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/auth')} 
                          className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg transition-all duration-300 hover:bg-secondary/10 hover:translate-x-1 touch-manipulation"
                        >
                          <span className="text-sm font-semibold">Sign In</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/auth')} 
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
              aria-label="Journeys"
              data-tour="places"
            >
              <Video className="h-5 w-5" />
              <span className="text-xs">Journeys</span>
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
                  <AvatarImage src={profileAvatarUrl || user.user_metadata?.avatar_url} />
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

      {/* Create Content Sheet */}
      <CreateContentSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSelectType={handleCreateContent}
      />

      {/* Upload Modal */}
      <ContentUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={handleUploadSuccess}
        initialTab={uploadInitialTab}
      />

      {/* Create Moment Modal */}
      <CreateMomentModal
        open={createMomentOpen}
        onOpenChange={setCreateMomentOpen}
      />

      {/* Buy Coins Modal */}
      <BuyCoinsModal
        open={buyCoinsOpen}
        onOpenChange={setBuyCoinsOpen}
      />

    </>
  );
};
