import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TravelerOverviewTab } from "./components/TravelerOverviewTab";
import { TravelerProfileTab } from "./components/TravelerProfileTab";
import { TravelerJourneysTab } from "./components/TravelerJourneysTab";
import { TravelerSettingsTab } from "./components/TravelerSettingsTab";
import { useIsMobile } from "@/hooks/use-mobile";
import { GettingStartedChecklist } from "@/components/onboarding/GettingStartedChecklist";

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
      <main className="min-h-screen bg-[#f7f3ea] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border border-[#0c4d47]/30 border-t-[#0c4d47] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#0a2225]/60 font-secondary">Preparing your studio…</p>
        </div>
      </main>
    );
  }

  const displayName = profile?.display_name || profile?.first_name || profile?.full_name || "Traveler";
  const TAB_LABELS: Record<string, string> = {
    overview: "Studio",
    journeys: "Journeys",
    profile: "Profile",
    settings: "Settings",
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] pb-24 lg:pb-0 text-[#0a2225]">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 pt-10 md:pt-16 pb-12">
        {/* Editorial header */}
        <header className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
              Your Studio
            </p>
            <h1 className="mt-3 font-secondary text-3xl md:text-4xl text-[#0a2225]">
              Goldsainte
            </h1>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border border-[#0c4d47]/30 border-t-[#0c4d47] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#0a2225]/55">Loading your studio…</p>
          </div>
        ) : (
          <>
            {user && <GettingStartedChecklist userId={user.id} role="traveler" />}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10 mt-2">
              {isMobile ? (
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full bg-transparent border-[#0a2225]/15 rounded-full h-11 px-5 text-sm font-medium text-[#0a2225]">
                    <SelectValue>{TAB_LABELS[activeTab]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#f7f3ea] border-[#0a2225]/15 rounded-xl">
                    <SelectItem value="overview">Studio</SelectItem>
                    <SelectItem value="journeys">Journeys</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <TabsList className="w-full bg-transparent border-b border-[#0a2225]/15 rounded-none h-11 justify-start gap-0 flex p-0">
                  {(["overview", "journeys", "profile", "settings"] as const).map((key) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="rounded-none h-11 border-b border-transparent data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[#0a2225]/55 text-[11px] uppercase tracking-[0.28em] font-medium px-5 transition-colors"
                    >
                      {TAB_LABELS[key]}
                    </TabsTrigger>
                  ))}
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

              <TabsContent value="journeys" className="mt-0">
                {user && <TravelerJourneysTab userId={user.id} />}
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <TravelerProfileTab />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                {user && <TravelerSettingsTab userId={user.id} />}
              </TabsContent>
            </Tabs>

            {/* Quiet footer link */}
            <div className="mt-16 pt-6 border-t border-[#0a2225]/10 text-center">
              <Link
                to="/how-it-works/traveler"
                className="text-[11px] uppercase tracking-[0.28em] text-[#0a2225]/50 hover:text-[#0a2225] transition-colors"
              >
                How Goldsainte works
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
