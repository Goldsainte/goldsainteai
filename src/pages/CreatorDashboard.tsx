import { useEffect, useState } from "react";
import { useNavigate, Link, Navigate, useSearchParams } from "react-router-dom";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  Search,
  Plus,
  AlertCircle,
  Send,
  FileText,
  Map,
  DollarSign,
  Settings,
  ImageIcon,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/BackButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfilePhotoUploader } from "@/pages/traveler/components/ProfilePhotoUploader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import { CreatorOverviewTab } from "./creator/components/CreatorOverviewTab";
import { CreatorProposalsTab } from "./creator/components/CreatorProposalsTab";
import { CreatorTripsTab } from "./creator/components/CreatorTripsTab";
import { CreatorEarningsTab } from "./creator/components/CreatorEarningsTab";
import { CreatorPortfolioTab } from "./creator/components/CreatorPortfolioTab";
import { CreatorSettingsTab } from "./creator/components/CreatorSettingsTab";
import type { TripProposalStatus } from "@/services/proposalService";

type RecentProposal = {
  id: string;
  tripRequestId: string;
  status: TripProposalStatus;
  createdAt: string;
  destination: string;
  tripTitle: string;
};

type CreatorStats = {
  activeProposals: number;
  acceptedProposals: number;
  totalProposalsSent: number;
  responseRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  recentProposals: RecentProposal[];
  openTripRequests: number;
};

const EMPTY_STATS: CreatorStats = {
  activeProposals: 0,
  acceptedProposals: 0,
  totalProposalsSent: 0,
  responseRate: 0,
  totalEarnings: 0,
  pendingEarnings: 0,
  recentProposals: [],
  openTripRequests: 0,
};

interface Profile {
  display_name: string | null;
  first_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  has_completed_creator_onboarding: boolean | null;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { hasCreatorAccess, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<CreatorStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  const onboardingIncomplete = profile && !profile.has_completed_creator_onboarding;

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, first_name, full_name, avatar_url, has_completed_creator_onboarding")
        .eq("id", user.id)
        .maybeSingle();
      if (data) setProfile(data as Profile);
    }
    loadProfile();
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      setLoading(true);
      
      try {
        const { data, error: fnError } = await invokeWithAuth<CreatorStats>(
          "creator-dashboard-stats",
          { body: {} }
        );
        if (fnError) {
          console.error('Creator dashboard stats error:', fnError);
          if (!isMounted) return;
          setStats(EMPTY_STATS);
          return;
        }
        if (!isMounted) return;
        setStats({
          activeProposals: data?.activeProposals ?? 0,
          acceptedProposals: data?.acceptedProposals ?? 0,
          totalProposalsSent: data?.totalProposalsSent ?? 0,
          responseRate: data?.responseRate ?? 0,
          totalEarnings: data?.totalEarnings ?? 0,
          pendingEarnings: data?.pendingEarnings ?? 0,
          recentProposals: data?.recentProposals ?? [],
          openTripRequests: data?.openTripRequests ?? 0,
        });
      } catch (err) {
        console.error('Creator dashboard stats error:', err);
        if (!isMounted) return;
        setStats(EMPTY_STATS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, []);

  // Redirect non-creators away
  if (!roleLoading && !hasCreatorAccess) {
    return <Navigate to="/traveler" replace />;
  }

  const displayName = profile?.display_name || profile?.first_name || profile?.full_name || "Creator";

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const tabTriggerClass =
    "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-[#0c4d47] data-[state=active]:text-[#bfad72] data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#0a2225] transition-colors";

  return (
    <main className="min-h-screen bg-[#FDF9F0] pb-24 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-12">
        <BackButton className="mb-4" />

        {/* Header */}
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4">
              <ProfilePhotoUploader
                userId={user?.id || ""}
                currentAvatarUrl={profile?.avatar_url}
                displayName={displayName}
                onUploadComplete={(url) =>
                  setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev)
                }
                size="sm"
              />
              <div>
                <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Creator Dashboard
                </p>
                <h1 className="font-secondary text-xl md:text-2xl lg:text-3xl text-[#0a2225]">
                  Welcome back, {displayName.split(" ")[0]}
                </h1>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              <button
                onClick={() => navigate("/marketplace")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2225] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#0a2225]/90 transition-colors"
              >
                <Search className="h-4 w-4" />
                Browse Trip Requests
              </button>
              <button
                onClick={() => navigate("/trip-builder")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#E5DFC6] bg-white text-[#0a2225] px-5 py-2.5 text-sm font-medium hover:bg-[#F6F0E4] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Trip Package
              </button>
            </div>
          </div>
        </header>

        {/* Onboarding Banner */}
        {onboardingIncomplete && (
          <div className="mb-8 rounded-2xl border border-[#C7A962] bg-[#C7A962]/10 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#C7A962] flex-shrink-0" />
              <div>
                <p className="font-medium text-[#0a2225]">Complete Your Creator Profile</p>
                <p className="text-sm text-[#6B7280]">Finish onboarding to unlock all features and start earning commissions.</p>
              </div>
            </div>
            <Link
              to="/onboarding/creator"
              className="inline-flex items-center gap-2 rounded-full bg-[#C7A962] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#B39952] transition-colors whitespace-nowrap"
            >
              Complete Setup
            </Link>
          </div>
        )}


        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {isMobile ? (
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-white border-[#E5DFC6] rounded-full h-12 px-4 text-sm font-medium text-[#0a2225]">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    {activeTab === "overview" && <><Sparkles className="h-4 w-4 text-[#C7A962]" /> Overview</>}
                    {activeTab === "proposals" && <><FileText className="h-4 w-4 text-[#C7A962]" /> Proposals</>}
                    {activeTab === "trips" && <><Map className="h-4 w-4 text-[#C7A962]" /> My Trips</>}
                    {activeTab === "portfolio" && <><ImageIcon className="h-4 w-4 text-[#C7A962]" /> Portfolio</>}
                    {activeTab === "earnings" && <><DollarSign className="h-4 w-4 text-[#C7A962]" /> Earnings</>}
                    {activeTab === "settings" && <><Settings className="h-4 w-4 text-[#C7A962]" /> Settings</>}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                <SelectItem value="overview" className="py-3">
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Overview</span>
                </SelectItem>
                <SelectItem value="proposals" className="py-3">
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Proposals</span>
                </SelectItem>
                <SelectItem value="trips" className="py-3">
                  <span className="flex items-center gap-2"><Map className="h-4 w-4" /> My Trips</span>
                </SelectItem>
                <SelectItem value="portfolio" className="py-3">
                  <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Portfolio</span>
                </SelectItem>
                <SelectItem value="earnings" className="py-3">
                  <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Earnings</span>
                </SelectItem>
                <SelectItem value="settings" className="py-3">
                  <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <TabsList className="bg-white border border-[#E5DFC6] rounded-full p-1.5 h-auto flex flex-nowrap justify-start gap-1">
              <TabsTrigger value="overview" className={tabTriggerClass}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="proposals" className={tabTriggerClass}>
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Proposals
              </TabsTrigger>
              <TabsTrigger value="trips" className={tabTriggerClass}>
                <Map className="h-3.5 w-3.5 mr-1.5" /> My Trips
              </TabsTrigger>
              <TabsTrigger value="portfolio" className={tabTriggerClass}>
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Portfolio
              </TabsTrigger>
              <TabsTrigger value="earnings" className={tabTriggerClass}>
                <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Earnings
              </TabsTrigger>
              <TabsTrigger value="settings" className={tabTriggerClass}>
                <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="overview" className="mt-0">
            <CreatorOverviewTab stats={stats} loading={loading} />
          </TabsContent>

          <TabsContent value="proposals" className="mt-0">
            <CreatorProposalsTab />
          </TabsContent>

          <TabsContent value="trips" className="mt-0">
            <CreatorTripsTab />
          </TabsContent>

          <TabsContent value="portfolio" className="mt-0">
            <CreatorPortfolioTab />
          </TabsContent>

          <TabsContent value="earnings" className="mt-0">
            <CreatorEarningsTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <CreatorSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
