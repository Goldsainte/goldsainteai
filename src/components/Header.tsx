import { useState, useEffect, useRef } from "react";
import { User, Hotel, Plane, Ticket, Briefcase, Video, Bell, TrendingUp, ArrowLeft, Plus, ShoppingCart, Link2, LayoutDashboard, Settings, Info, Sparkles, PlaneTakeoff, Car, MessageCircle, BarChart3, Luggage, BookOpen, Newspaper, ChevronDown, Users, HelpCircle, FileText, Compass, Globe, Send } from "lucide-react";
import { NotificationBell } from '@/components/notifications/NotificationBell';

import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
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

const GsAgentPromoArt = () => (
  <svg width="54" height="54" viewBox="0 0 60 60" aria-hidden="true">
    <defs><linearGradient id="gsBagG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E3C57E"/><stop offset="100%" stopColor="#A9812F"/></linearGradient></defs>
    <ellipse cx="30" cy="52" rx="20" ry="3" fill="#0a2225" opacity="0.12"/>
    <rect x="12" y="20" width="36" height="26" rx="5" fill="url(#gsBagG)"/>
    <rect x="12" y="20" width="36" height="9" rx="5" fill="#0c4d47"/>
    <rect x="24" y="13" width="12" height="9" rx="3" fill="none" stroke="#0c4d47" strokeWidth="3"/>
    <rect x="26.5" y="28" width="7" height="5" rx="1.5" fill="#fdfaf2"/>
    <circle cx="19" cy="25" r="1.6" fill="#E3C57E" opacity="0.9"/>
  </svg>
);

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin, isCreator, isAgent: isAgentAccount, isBrand } = useUserRole();
  const [menuAvatar, setMenuAvatar] = useState<string | null>(null);
  const avatarFor = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id || avatarFor.current === user.id) return;
    avatarFor.current = user.id;
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setMenuAvatar(data?.avatar_url ?? null));
  }, [user?.id]);
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
    if (isAgentAccount) return `/agents/${user?.id}`;
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

  const navPath = location.pathname;
  const travelActive = navPath.startsWith('/marketplace') || navPath.startsWith('/post-trip') || navPath.startsWith('/trips');
  const creatorsActive = navPath.startsWith('/creators');
  const specialistsActive = navPath.startsWith('/agents') || navPath.startsWith('/guides');
  const partnerActive = navPath.startsWith('/apply');

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
                  <LanguageSelector />
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
                          {user && menuAvatar ? (
                          <img src={menuAvatar} alt="Your profile" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-[#BFAD72] group-hover:text-[#0a2225] group-focus-visible:text-[#0a2225] transition-colors" />
                        )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="!w-[280px] max-h-[80vh] !overflow-y-auto !rounded-2xl !border-0 !bg-white py-1 !shadow-[0_8px_28px_rgba(10,34,37,0.22)] z-[100]"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {user ? (
                        <>

                          {/* Three-zone regroup (Jul 17): EXPLORE (where do I go) /
                              MY TRAVEL (what's mine) / MY WORK (partner pipeline,
                              collapsed — same accordion pattern as Admin below).
                              Every destination kept; only the grouping changed. */}
                          <div className="pb-1 pt-2">
                            <p className="px-6 pb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#BFAD72]">Explore</p>

                            <DropdownMenuItem
                              onClick={() => navigate('/creators')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Compass className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Browse Creators</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate('/agents')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Globe className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Find a Specialist</span>
                            </DropdownMenuItem>
                          </div>

                          <div className="pb-1 pt-1">
                            <p className="px-6 pb-1 pt-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#BFAD72]">My Travel</p>
                            {/* — Traveling — */}
                            <div className="mx-2 px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">Traveling</div>
                            <DropdownMenuItem
                              onClick={() => navigate(primaryBookingsPath)}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Luggage className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">My Bookings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate('/my-trip-requests')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Send className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">My Requests</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate('/following')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Users className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Saved & Following</span>
                            </DropdownMenuItem>
                            {showRequestTrip && (
                              <DropdownMenuItem
                                onClick={() => navigate(postTripPath)}
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                              >
                                <PlaneTakeoff className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                <span className="text-[15px] font-medium text-[#0a2225]">Request a Trip</span>
                              </DropdownMenuItem>
                            )}
                            {!isAgentAccount && !isCreator && (
                              <DropdownMenuItem
                                onClick={() => navigate('/my-purchases')}
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                              >
                                <BookOpen className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                <span className="text-[15px] font-medium text-[#0a2225]">My Guides</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => navigate('/messages')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <div className="relative flex-shrink-0">
                                <MessageCircle className="h-5 w-5 text-[#0a2225]" />
                                {unreadMessageCount > 0 && (
                                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-[#0c4d47] text-[9px] font-bold text-[#fdfaf2] flex items-center justify-center px-1">
                                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                                  </span>
                                )}
                              </div>
                              <span className="text-[15px] font-medium text-[#0a2225]">Messages</span>
                            </DropdownMenuItem>
                          </div>

                          {(isAgentAccount || isCreator || isAdmin || isBrand) && (
                            <div className="mx-2 px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F] border-t border-[#E5DFC6] mt-2">Your work</div>
                          )}
                            {isCreator && (
                              <DropdownMenuItem
                                onClick={() => navigate('/creator-dashboard')}
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                              >
                                <BarChart3 className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                <span className="text-[15px] font-medium text-[#0a2225]">Creator Dashboard</span>
                              </DropdownMenuItem>
                            )}
                            {isAgentAccount && (
                              <DropdownMenuItem
                                onClick={() => navigate('/agent-dashboard')}
                                className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                              >
                                <LayoutDashboard className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                <span className="text-[15px] font-medium text-[#0a2225]">Agent Dashboard</span>
                              </DropdownMenuItem>
                            )}
                          {(isAgentAccount || isCreator || isAdmin || isBrand) && (
                            <Accordion type="multiple" className="w-full">
                              <AccordionItem value="work" className="border-b-0">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/5 [&[data-state=open]]:bg-secondary/5">
                                  <p className="text-xs font-semibold text-[#BFAD72] uppercase tracking-[0.15em]">My Work</p>
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                  <div className="py-1">
                                    <DropdownMenuItem
                                      onClick={() => navigate('/partner-bookings')}
                                      className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                                    >
                                      <Briefcase className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                      <span className="text-[15px] font-medium text-[#0a2225]">Client Bookings</span>
                                    </DropdownMenuItem>
                                    {isCreator && (
                                      <DropdownMenuItem
                                        onClick={() => navigate('/creator-dashboard?tab=requests')}
                                        className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                                      >
                                        <Send className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                        <span className="text-[15px] font-medium text-[#0a2225]">Hire Requests</span>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => navigate('/my-proposals')}
                                      className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                                    >
                                      <FileText className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                      <span className="text-[15px] font-medium text-[#0a2225]">My Proposals</span>
                                    </DropdownMenuItem>
                                    {isAgentAccount && (
                                      <DropdownMenuItem
                                        onClick={() => navigate('/agent-trips')}
                                        className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                                      >
                                        <Briefcase className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                        <span className="text-[15px] font-medium text-[#0a2225]">Available Trips</span>
                                      </DropdownMenuItem>
                                    )}
                                    {(isCreator || isAgentAccount) && (
                                      <DropdownMenuItem
                                        onClick={() => navigate('/trip-builder')}
                                        className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                                      >
                                        <Plus className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                                        <span className="text-[15px] font-medium text-[#0a2225]">Create Trip Package</span>
                                      </DropdownMenuItem>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}

                          <DropdownMenuSeparator className="mx-5 bg-[#0a2225]/10" />

                          {/* Account */}
                          <div className="py-2">
                            <div className="mx-2 px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F] border-t border-[#E5DFC6] mt-2">Account</div>
                            <DropdownMenuItem
                              onClick={() => navigate(getProfilePath())}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <User className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">My Profile</span>
                            </DropdownMenuItem>


                            <DropdownMenuItem
                              onClick={() => navigate(isAgentAccount ? '/agent-settings' : isCreator ? '/creator-settings' : '/travel-settings')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Settings className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Account Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate('/help')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <HelpCircle className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Help Center</span>
                            </DropdownMenuItem>
                          </div>

                          {/* Secondary — hidden for agents (they already are one) */}
                          {!isAgentAccount && (
                            <>
                              <DropdownMenuSeparator className="mx-5 bg-[#0a2225]/10" />
                              <div className="py-2">
                                <DropdownMenuItem
                                  onClick={() => navigate('/apply/agent')}
                                  className="mx-2 cursor-pointer rounded-2xl px-4 py-4 hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                                >
                                  <div className="flex w-full items-center gap-4">
                                    <div className="flex-1">
                                      <p className="text-[15px] font-semibold text-[#0a2225]">Become an Agent</p>
                                      <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">Plug in your expertise and earn on every journey you deliver.</p>
                                    </div>
                                    <GsAgentPromoArt />
                                  </div>
                                </DropdownMenuItem>
                              </div>
                            </>
                          )}

                          <DropdownMenuSeparator className="mx-5 bg-[#0a2225]/10" />

                          {/* Informational */}
                          <div className="py-2">
                            <DropdownMenuItem
                              onClick={() => navigate('/about')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Info className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">About</span>
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
                                        className="mx-2 px-4 py-3 min-h-[44px] cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                                      >
                                        <span className="text-sm font-semibold text-[#0c4d47]">{item.label}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                          
                          
                          
                          
                           <DropdownMenuSeparator className="mx-5 bg-[#0a2225]/10" />
                          
                          <div className="py-2 pb-3">
                            <DropdownMenuItem 
                              onClick={signOut} 
                              className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <span className="text-[15px] font-medium text-[#0a2225]">Sign Out</span>
                            </DropdownMenuItem>
                          </div>
                        </>
                      ) : (
                        /* Logged Out - Discover links + Sign In / Sign Up */
                        <div className="py-2">
                          <DropdownMenuItem
                            onClick={() => navigate('/creators')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                          >
                            <Compass className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                            <span className="text-[15px] font-medium text-[#0a2225]">Browse Creators</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate('/agents')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                          >
                            <Globe className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                            <span className="text-[15px] font-medium text-[#0a2225]">Find a Specialist</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate('/marketplace')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                          >
                            <ShoppingCart className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                            <span className="text-[15px] font-medium text-[#0a2225]">Travel Marketplace</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="mx-5 my-2 bg-[#0a2225]/10" />
                          <DropdownMenuItem 
                            onClick={() => navigate('/auth')} 
                            className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                          >
                            <span className="text-[15px] font-semibold text-[#0a2225]">Sign In</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate('/auth?mode=signup')} 
                            className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-2xl hover:bg-[#f7f3ea] bg-[#f7f3ea]/60 touch-manipulation"
                          >
                            <span className="text-[15px] font-medium text-[#0a2225]">Sign Up</span>
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
              <nav className="hidden lg:flex flex-1 items-end justify-center gap-9" style={{ fontFamily: 'Inter, sans-serif' }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group flex flex-col items-center pt-1 focus:outline-none"
                    >
                      <span className="flex items-center pb-1.5">
                        <span className={`text-[13px] font-medium uppercase tracking-[0.18em] transition-colors ${travelActive ? 'text-[#fdfaf2]' : 'text-[#E5DFC6]/85 group-hover:text-[#fdfaf2]'}`}>Travel</span>
                      </span>
                      <span className={`h-[2.5px] w-full rounded-full transition-colors ${travelActive ? 'bg-[#C7A962]' : 'bg-transparent group-hover:bg-[#fdfaf2]/25 group-data-[state=open]:bg-[#fdfaf2]/40'}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-white border-[#E5DFC6] font-secondary">
                    <DropdownMenuItem onClick={() => navigate('/marketplace')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Marketplace</p>
                        <p className="text-xs text-[#6B7280]">Browse curated trips</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/marketplace?tab=tours')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Tours</p>
                        <p className="text-xs text-[#6B7280]">Bookable tours &amp; experiences</p>
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
                  className="group flex flex-col items-center pt-1 focus:outline-none"
                >
                  <span className="flex items-center pb-1.5">
                    <span className={`text-[13px] font-medium uppercase tracking-[0.18em] transition-colors ${creatorsActive ? 'text-[#fdfaf2]' : 'text-[#E5DFC6]/85 group-hover:text-[#fdfaf2]'}`}>Creators</span>
                  </span>
                  <span className={`h-[2.5px] w-full rounded-full transition-colors ${creatorsActive ? 'bg-[#C7A962]' : 'bg-transparent group-hover:bg-[#fdfaf2]/25'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/agents')}
                  className="group flex flex-col items-center pt-1 focus:outline-none"
                >
                  <span className="flex items-center pb-1.5">
                    <span className={`text-[13px] font-medium uppercase tracking-[0.18em] transition-colors ${specialistsActive ? 'text-[#fdfaf2]' : 'text-[#E5DFC6]/85 group-hover:text-[#fdfaf2]'}`}>Specialists</span>
                  </span>
                  <span className={`h-[2.5px] w-full rounded-full transition-colors ${specialistsActive ? 'bg-[#C7A962]' : 'bg-transparent group-hover:bg-[#fdfaf2]/25'}`} />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group flex flex-col items-center pt-1 focus:outline-none"
                    >
                      <span className="flex items-center pb-1.5">
                        <span className={`text-[13px] font-medium uppercase tracking-[0.18em] transition-colors ${partnerActive ? 'text-[#fdfaf2]' : 'text-[#E5DFC6]/85 group-hover:text-[#fdfaf2]'}`}>Partner</span>
                      </span>
                      <span className={`h-[2.5px] w-full rounded-full transition-colors ${partnerActive ? 'bg-[#C7A962]' : 'bg-transparent group-hover:bg-[#fdfaf2]/25 group-data-[state=open]:bg-[#fdfaf2]/40'}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-white border-[#E5DFC6] font-secondary">
                    <DropdownMenuItem onClick={() => navigate('/apply/agent')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Become an Agent</p>
                        <p className="text-xs text-[#6B7280]">Sell trips and guides on Goldsainte</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/apply/tour-operator')} className="cursor-pointer px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0a2225]">Become a Tour Operator</p>
                        <p className="text-xs text-[#6B7280]">List your tours on Goldsainte</p>
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
                      {user && menuAvatar ? (
                          <img src={menuAvatar} alt="Your profile" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-[#BFAD72] group-hover:text-[#0a2225] group-focus-visible:text-[#0a2225] transition-colors" />
                        )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="!w-[280px] max-h-[80vh] !overflow-y-auto !rounded-2xl !border-0 !bg-white py-1 !shadow-[0_8px_28px_rgba(10,34,37,0.22)] z-[100] animate-in fade-in-0 zoom-in-95 duration-200"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {user ? (
                      <>

                        {/* Core Experience */}
                        <div className="py-2">
                          <DropdownMenuItem
                            onClick={() => navigate('/marketplace')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                          >
                            <ShoppingCart className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                            <span className="text-[15px] font-medium text-[#0a2225]">Travel Marketplace</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate('/following')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                          >
                            <Users className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                            <span className="text-[15px] font-medium text-[#0a2225]">Saved &amp; Following</span>
                          </DropdownMenuItem>
                          <div className="mx-2 px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F]">Traveling</div>
                          <DropdownMenuItem
                            onClick={() => navigate(primaryBookingsPath)}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                          >
                            <Luggage className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                            <span className="text-[15px] font-medium text-[#0a2225]">My Bookings</span>
                          </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate('/my-trip-requests')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Send className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">My Requests</span>
                            </DropdownMenuItem>
                        {(isAgentAccount || isCreator || isAdmin || isBrand) && (
                          <div className="mx-2 px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F] border-t border-[#E5DFC6] mt-2">Your work</div>
                        )}
                          {isCreator && (
                            <DropdownMenuItem
                              onClick={() => navigate('/creator-dashboard')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                            >
                              <BarChart3 className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Creator Dashboard</span>
                            </DropdownMenuItem>
                          )}
                          {isAgentAccount && (
                            <DropdownMenuItem
                              onClick={() => navigate('/agent-dashboard')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                            >
                              <LayoutDashboard className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Agent Dashboard</span>
                            </DropdownMenuItem>
                          )}
                          {(isAgentAccount || isCreator || isAdmin || isBrand) && (
                            <DropdownMenuItem
                              onClick={() => navigate('/partner-bookings')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                            >
                              <Briefcase className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Client Bookings</span>
                            </DropdownMenuItem>
                          )}
                          {isCreator && (
                            <DropdownMenuItem
                              onClick={() => navigate('/creator-dashboard?tab=requests')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                            >
                              <Send className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Hire Requests</span>
                            </DropdownMenuItem>
                          )}
                          {showRequestTrip && (
                            <DropdownMenuItem
                              onClick={() => navigate(postTripPath)}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                            >
                              <PlaneTakeoff className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Request a Trip</span>
                            </DropdownMenuItem>
                          )}
                          {!isAgentAccount && !isCreator && (
                            <DropdownMenuItem
                              onClick={() => navigate('/my-purchases')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                            >
                              <BookOpen className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">My Guides</span>
                            </DropdownMenuItem>
                          )}
                          {isAgentAccount && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/agent-trips')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                            >
                              <Briefcase className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Available Trips</span>
                            </DropdownMenuItem>
                          )}
                          {(isCreator || isAgentAccount) && (
                            <DropdownMenuItem 
                              onClick={() => navigate('/trip-builder')} 
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                            >
                              <Plus className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Create Trip Package</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => navigate('/messages')} 
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                          >
                            <div className="relative flex-shrink-0">
                              <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300" />
                              {unreadMessageCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-[#0c4d47] text-[9px] font-bold text-[#fdfaf2] flex items-center justify-center px-1">
                                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                                </span>
                              )}
                            </div>
                            <span className="text-[15px] font-medium text-[#0a2225]">Messages</span>
                          </DropdownMenuItem>
                        </div>

                        <DropdownMenuSeparator className="mx-5 bg-[#0a2225]/10" />

                        {/* Account */}
                        <div className="py-2">
                          <div className="mx-2 px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8D6B2F] border-t border-[#E5DFC6] mt-2">Account</div>
                          <DropdownMenuItem
                            onClick={() => navigate(getProfilePath())}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                          >
                            <User className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                            <span className="text-[15px] font-medium text-[#0a2225]">My Profile</span>
                          </DropdownMenuItem>


                            <DropdownMenuItem
                              onClick={() => navigate(isAgentAccount ? '/agent-settings' : isCreator ? '/creator-settings' : '/travel-settings')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <Settings className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Account Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate('/help')}
                              className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                            >
                              <HelpCircle className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                              <span className="text-[15px] font-medium text-[#0a2225]">Help Center</span>
                            </DropdownMenuItem>
                        </div>

                        {/* Secondary — hidden for agents (they already are one) */}
                        {!isAgentAccount && (
                          <>
                            <DropdownMenuSeparator className="mx-5 bg-[#0a2225]/10" />
                            <div className="py-2">
                              <DropdownMenuItem
                                onClick={() => navigate('/apply/agent')}
                                className="mx-2 cursor-pointer rounded-2xl px-4 py-4 hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                              >
                                <div className="flex w-full items-center gap-4">
                                  <div className="flex-1">
                                    <p className="text-[15px] font-semibold text-[#0a2225]">Become an Agent</p>
                                    <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">Plug in your expertise and earn on every journey you deliver.</p>
                                  </div>
                                  <GsAgentPromoArt />
                                </div>
                              </DropdownMenuItem>
                            </div>
                          </>
                        )}

                        <DropdownMenuSeparator className="mx-5 bg-[#0a2225]/10" />

                        {/* Informational */}
                        <div className="py-2">
                          <DropdownMenuItem
                            onClick={() => navigate('/about')}
                            className="mx-2 px-4 py-3 min-h-[44px] gap-4 cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] group touch-manipulation"
                          >
                            <Info className="h-5 w-5 text-[#0a2225] flex-shrink-0" />
                            <span className="text-[15px] font-medium text-[#0a2225]">About</span>
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
                                      className="mx-2 px-4 py-3 min-h-[44px] cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                                    >
                                      <span className="text-sm font-semibold text-[#0c4d47]">{item.label}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                        
                        
                        
                         <DropdownMenuSeparator className="mx-5 bg-[#0a2225]/10" />
                        
                        <div className="py-2 pb-3">
                          <DropdownMenuItem 
                            onClick={signOut} 
                            className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-lg transition-all duration-300 hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                          >
                            <span className="text-[15px] font-medium text-[#0a2225]">Sign Out</span>
                          </DropdownMenuItem>
                        </div>
                      </>
                    ) : (
                      /* Logged Out - Simple Sign In / Sign Up */
                      <div className="py-2">
                        <DropdownMenuItem 
                          onClick={() => navigate('/auth')} 
                          className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                        >
                          <span className="text-[15px] font-semibold text-[#0a2225]">Sign In</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate('/auth?mode=signup')} 
                          className="mx-2 px-4 py-4 min-h-[48px] cursor-pointer rounded-2xl hover:bg-[#f7f3ea] focus:bg-[#f7f3ea] touch-manipulation"
                        >
                          <span className="text-[15px] font-medium text-[#0a2225]">Sign Up</span>
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
