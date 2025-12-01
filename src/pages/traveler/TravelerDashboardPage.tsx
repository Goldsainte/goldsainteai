import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, User, Plane, Calendar, Bookmark, Settings, Plus, MessageCircle } from "lucide-react";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TravelerOverviewTab } from "./components/TravelerOverviewTab";
import { TravelerProfileTab } from "./components/TravelerProfileTab";
import { TravelerTripsTab } from "./components/TravelerTripsTab";
import { TravelerBookingsTab } from "./components/TravelerBookingsTab";
import { TravelerStoryboardsTab } from "./components/TravelerStoryboardsTab";
import { TravelerSettingsTab } from "./components/TravelerSettingsTab";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Profile {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface DashboardStats {
  tripRequests: number;
  bookings: number;
  storyboards: number;
}

export default function TravelerDashboardPage() {
  const { checking, allowed } = useRequireOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ tripRequests: 0, bookings: 0, storyboards: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        sessionStorage.setItem('returnTo', '/traveler');
        navigate("/auth?returnTo=/traveler", { replace: true });
        return;
      }

      try {
        // Fetch profile and stats in parallel
        const [profileResult, tripsResult, bookingsResult, storyboardsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, display_name, full_name, avatar_url, created_at")
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
          supabase
            .from("storyboards")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", authUser.id),
        ]);

        if (profileResult.data) {
          setProfile(profileResult.data);
        }

        setStats({
          tripRequests: tripsResult.count ?? 0,
          bookings: bookingsResult.count ?? 0,
          storyboards: storyboardsResult.count ?? 0,
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

  const displayName = profile?.display_name || profile?.full_name || "Traveler";

  return (
    <main className="min-h-screen bg-[#FDF9F0] pb-24 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-12">
        {/* Sticky Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Profile Summary */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-[#E5DFC6]">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-[#F6F0E4] text-[#0a2225] text-lg font-secondary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Traveler Hub
                </p>
                <h1 className="font-secondary text-2xl md:text-3xl text-[#0a2225]">
                  Welcome back, {displayName.split(" ")[0]}
                </h1>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/post-trip")}
                className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#0a2225]/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Post Trip
              </button>
              <button
                onClick={() => navigate("/concierge")}
                className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white text-[#0a2225] px-5 py-2.5 text-sm font-medium hover:bg-[#F6F0E4] transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-[#C7A962]" />
                Ask Madison
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
          /* Tabbed Navigation */
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-white border border-[#E5DFC6] rounded-full p-1.5 h-auto overflow-x-auto scrollbar-hide flex flex-nowrap justify-start gap-1 max-w-full">
              <TabsTrigger 
                value="overview" 
                className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium whitespace-nowrap data-[state=active]:bg-[#0c4d47] data-[state=active]:text-[#bfad72] data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#0a2225] transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium whitespace-nowrap data-[state=active]:bg-[#0c4d47] data-[state=active]:text-[#bfad72] data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#0a2225] transition-colors"
              >
                <User className="h-3.5 w-3.5 mr-1.5" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="trips"
                className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium whitespace-nowrap data-[state=active]:bg-[#0c4d47] data-[state=active]:text-[#bfad72] data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#0a2225] transition-colors"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Trips
              </TabsTrigger>
              <TabsTrigger 
                value="bookings"
                className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium whitespace-nowrap data-[state=active]:bg-[#0c4d47] data-[state=active]:text-[#bfad72] data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#0a2225] transition-colors"
              >
                <Plane className="h-3.5 w-3.5 mr-1.5" />
                Bookings
              </TabsTrigger>
              <TabsTrigger 
                value="storyboards"
                className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium whitespace-nowrap data-[state=active]:bg-[#0c4d47] data-[state=active]:text-[#bfad72] data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#0a2225] transition-colors"
              >
                <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                Storyboards
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium whitespace-nowrap data-[state=active]:bg-[#0c4d47] data-[state=active]:text-[#bfad72] data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#0a2225] transition-colors"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              {profile && (
                <TravelerOverviewTab 
                  profile={{
                    id: profile.id,
                    display_name: profile.display_name,
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

            <TabsContent value="storyboards" className="mt-0">
              {user && <TravelerStoryboardsTab userId={user.id} />}
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              {user && <TravelerSettingsTab userId={user.id} />}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
