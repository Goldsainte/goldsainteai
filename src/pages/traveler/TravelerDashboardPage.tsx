import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, User, Plane, Calendar, Bookmark, Settings, Plus, MessageCircle } from "lucide-react";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TravelerOverviewTab } from "./components/TravelerOverviewTab";
import { TravelerProfileTab } from "./components/TravelerProfileTab";
import { TravelerTripsTab } from "./components/TravelerTripsTab";
import { TravelerBookingsTab } from "./components/TravelerBookingsTab";
import { TravelerSettingsTab } from "./components/TravelerSettingsTab";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/BackButton";
import { GettingStartedChecklist } from "@/components/onboarding/GettingStartedChecklist";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Profile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  email?: string | null;
}

interface DashboardStats {
  tripRequests: number;
  bookings: number;
}

export default function TravelerDashboardPage() {
  const { checking, allowed } = useRequireOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ tripRequests: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        sessionStorage.setItem('returnTo', '/traveler');
        navigate("/auth?redirect=%2Ftraveler", { replace: true });
        return;
      }

      try {
        // Fetch profile and stats in parallel
        const [profileResult, tripsResult, bookingsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, display_name, first_name, full_name, avatar_url, created_at, email")
            .eq("id", authUser.id)
            .single(),
          supabase
            .from("trip_requests")
            .select("id", { count: "exact", head: true })
            .eq("user_id", authUser.id),
          supabase
            .from("trip_bookings")
            .select("id", { count: "exact", head: true })
            .eq("traveler_id", authUser.id),
        ]);

        if (profileResult.data) {
          setProfile(profileResult.data);
        }

        setStats({
          tripRequests: tripsResult.count ?? 0,
          bookings: bookingsResult.count ?? 0,
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [navigate]);

  const handleAvatarUpdate = (newUrl: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: newUrl });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (checking || !allowed) {
    return (
      <main className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#C7A962] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#6B7280] font-secondary">Preparing your journey hub...</p>
        </div>
      </main>
    );
  }

  const displayName = profile?.display_name || profile?.first_name || profile?.full_name || "Traveler";

  return (
    <main className="min-h-screen bg-[#FDF9F0] pb-24 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-12">
        <BackButton className="mb-4" />
        {/* Sticky Header */}
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            {/* Profile Summary */}
            <div className="flex items-center gap-3 md:gap-4">
              <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-[#E5DFC6]">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-[#F6F0E4] text-[#0a2225] text-base md:text-lg font-secondary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Traveler Hub
                </p>
                <h1 className="font-secondary text-xl md:text-2xl lg:text-3xl text-[#0a2225]">
                  Welcome back, {displayName.split(" ")[0]}
                </h1>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              <button
                onClick={() => navigate("/post-trip")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2225] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#0a2225]/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Post Trip
              </button>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#C7A962] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#6B7280]">Loading your dashboard...</p>
          </div>
        ) : (
          <>
          {user && <GettingStartedChecklist userId={user.id} role="traveler" />}
          <div className="mb-4 text-right">
            <Link to="/how-it-works/traveler" className="text-xs text-[#0c4d47] hover:underline">
              How it works →
            </Link>
          </div>
          {/* AI Trip Planner CTA */}
          <div className="mb-6 flex items-start gap-4 rounded-2xl border border-[#C7A962]/30 bg-[#FDF9F0] p-5 md:items-center md:flex-row flex-col">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-[#C7A962]" />
                <span className="text-xs uppercase tracking-wider text-[#C7A962] font-medium">AI Trip Planner</span>
              </div>
              <h3 className="font-secondary text-xl text-[#0a2225]">Plan a trip with AI</h3>
              <p className="text-sm text-[#6B7280] mt-1">Tell us where you want to go and we'll build a day-by-day itinerary in seconds.</p>
            </div>
            <button
              onClick={() => navigate('/post-trip')}
              className="flex-shrink-0 rounded-full bg-[#C7A962] hover:bg-[#b89852] text-white text-sm px-5 py-2.5"
            >
              Start Planning
            </button>
          </div>
          {/* My Purchases quick link */}
          <div className="mb-6 flex items-start gap-4 rounded-2xl border border-[#E5DFC6] bg-white p-5 md:items-center md:flex-row flex-col">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider text-[#0c4d47] font-medium">Your Library</span>
              </div>
              <h3 className="font-secondary text-xl text-[#0a2225]">My Purchases</h3>
              <p className="text-sm text-[#6B7280] mt-1">Access the itinerary guides you've purchased anytime.</p>
            </div>
            <button
              onClick={() => navigate('/my-purchases')}
              className="flex-shrink-0 rounded-full bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white text-sm px-5 py-2.5"
            >
              View Purchases
            </button>
          </div>
          {/* Tabbed Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            {/* Mobile: Dropdown Select */}
            {isMobile ? (
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full bg-white border-[#E5DFC6] rounded-full h-12 px-4 text-sm font-medium text-[#0a2225]">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      {activeTab === "overview" && <><Sparkles className="h-4 w-4 text-[#C7A962]" /> Overview</>}
                      {activeTab === "profile" && <><User className="h-4 w-4 text-[#C7A962]" /> Profile</>}
                      {activeTab === "trips" && <><Calendar className="h-4 w-4 text-[#C7A962]" /> Trips</>}
                      {activeTab === "bookings" && <><Plane className="h-4 w-4 text-[#C7A962]" /> Bookings</>}
                      {activeTab === "settings" && <><Settings className="h-4 w-4 text-[#C7A962]" /> Settings</>}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                  <SelectItem value="overview" className="py-3">
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Overview</span>
                  </SelectItem>
                  <SelectItem value="profile" className="py-3">
                    <span className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</span>
                  </SelectItem>
                  <SelectItem value="trips" className="py-3">
                    <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Trips</span>
                  </SelectItem>
                  <SelectItem value="bookings" className="py-3">
                    <span className="flex items-center gap-2"><Plane className="h-4 w-4" /> Bookings</span>
                  </SelectItem>
                  <SelectItem value="settings" className="py-3">
                    <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              /* Desktop: Horizontal TabsList */
              <TabsList className="w-full overflow-x-auto scrollbar-hide bg-transparent border-b border-[#E5DFC6] rounded-none h-11 justify-start gap-0 flex">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none h-11 border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="profile"
                  className="rounded-none h-11 border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="trips"
                  className="rounded-none h-11 border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Trips
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings"
                  className="rounded-none h-11 border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  <Plane className="h-3.5 w-3.5 mr-1.5" />
                  Bookings
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="rounded-none h-11 border-b-2 data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] border-transparent text-[#6B7280] text-sm font-medium px-4 whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Settings
                </TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="overview" className="mt-0">
              {profile && (
                <TravelerOverviewTab 
                  profile={{
                    id: profile.id,
                    display_name: profile.display_name,
                    first_name: profile.first_name,
                    avatar_url: profile.avatar_url,
                    created_at: profile.created_at,
                  }}
                  stats={stats}
                  onAvatarUpdate={handleAvatarUpdate}
                />
              )}
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <TravelerProfileTab />
            </TabsContent>

            <TabsContent value="trips" className="mt-0">
              {user && <TravelerTripsTab userId={user.id} />}
            </TabsContent>

            <TabsContent value="bookings" className="mt-0">
              {user && <TravelerBookingsTab userId={user.id} />}
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              {user && <TravelerSettingsTab userId={user.id} />}
            </TabsContent>
          </Tabs>
          </>
        )}
      </div>
    </main>
  );
}
