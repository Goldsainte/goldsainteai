import { useEffect, useState } from "react";
import { useNavigate, Link, Navigate, useSearchParams } from "react-router-dom";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { GettingStartedChecklist } from "@/components/onboarding/GettingStartedChecklist";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import { CreatorOverviewTab } from "./creator/components/CreatorOverviewTab";
import { CreatorProposalsTab } from "./creator/components/CreatorProposalsTab";
import { CreatorTripsTab } from "./creator/components/CreatorTripsTab";
import { CreatorEarningsTab } from "./creator/components/CreatorEarningsTab";
import { CreatorPortfolioTab } from "./creator/components/CreatorPortfolioTab";
import { CreatorSettingsTab } from "./creator/components/CreatorSettingsTab";
import { CreatorGuidesTab } from "./creator/components/CreatorGuidesTab";
import { CreatorPerformanceTab } from "./creator/components/CreatorPerformanceTab";
import { CreatorServicesSection } from "@/components/creator/CreatorServicesSection";
import { CreatorAffiliateTab } from "./creator/components/CreatorAffiliateTab";
import { CreatorContentToolsTab } from "./creator/components/CreatorContentToolsTab";
import { TierBadge, TierBenefitsCard } from "@/components/creator/TierBadge";
import { useCreatorTierWatcher } from "@/hooks/useCreatorTierWatcher";
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
  guideSales: number;
  guideRevenue: number;
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
  guideSales: 0,
  guideRevenue: 0,
};

interface Profile {
  display_name: string | null;
  first_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  has_completed_creator_onboarding: boolean | null;
  creator_tier?: string | null;
  lifetime_sales_count?: number | null;
  email?: string | null;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { hasCreatorAccess, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<CreatorStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useCreatorTierWatcher();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  const onboardingIncomplete = profile && !profile.has_completed_creator_onboarding;

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, first_name, full_name, avatar_url, has_completed_creator_onboarding, creator_tier, lifetime_sales_count, email")
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
        let guideSales = 0;
        let guideRevenue = 0;
        try {
          if (!user?.id) throw new Error("no user");
          const { data: guideIds } = await supabase
            .from('itinerary_products')
            .select('id')
            .eq('creator_id', user.id)
            .eq('status', 'published');
          if (guideIds && guideIds.length > 0) {
            const ids = guideIds.map((g: any) => g.id);
            const { count } = await supabase
              .from('itinerary_purchases')
              .select('id', { count: 'exact', head: true })
              .in('product_id', ids);
            guideSales = count || 0;
            const { data: revenueRows } = await supabase
              .from('itinerary_purchases')
              .select('amount_paid')
              .in('product_id', ids);
            guideRevenue = (revenueRows || []).reduce((s: number, r: any) => s + (r.amount_paid || 0), 0);
          }
        } catch (gErr) {
          console.error('Guide stats error:', gErr);
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
          guideSales,
          guideRevenue,
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
  }, [user?.id]);

  // Redirect non-creators away
  if (!roleLoading && !hasCreatorAccess) {
    return <Navigate to="/traveler" replace />;
  }

  const displayName = profile?.display_name || profile?.first_name || profile?.full_name || "Creator";

  const TAB_KEYS = [
    "overview",
    "proposals",
    "trips",
    "portfolio",
    "guides",
    "services",
    "performance",
    "affiliate",
    "content",
    "earnings",
    "settings",
  ] as const;
  type TabKey = (typeof TAB_KEYS)[number];

  const TAB_LABELS: Record<TabKey, string> = {
    overview: "Studio",
    proposals: "Proposals",
    trips: "Trips",
    portfolio: "Portfolio",
    guides: "Guides",
    services: "Services",
    performance: "Performance",
    affiliate: "Affiliate",
    content: "Content",
    earnings: "Earnings",
    settings: "Settings",
  };

  const tabTriggerClass =
    "rounded-none h-11 border-b border-transparent data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[#0a2225]/55 text-[11px] uppercase tracking-[0.28em] font-medium px-5 whitespace-nowrap flex-shrink-0 transition-colors";

  return (
    <main className="min-h-screen bg-[#f7f3ea] pb-24 lg:pb-0 text-[#0a2225]">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 pt-8 md:pt-16 pb-12">
        {/* Editorial header */}
        <header className="mb-8 md:mb-10">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
            The Atelier
          </p>
          <h1 className="mt-2 md:mt-3 font-secondary text-[28px] leading-tight md:text-4xl text-[#0a2225]">
            {loading ? "Welcome" : `Welcome, ${displayName.split(" ")[0]}`}
          </h1>
          <p className="mt-2 text-sm text-[#0a2225]/60 max-w-md">
            Your studio for shaping trip proposals, packaging journeys, and growing what you earn on-platform.
          </p>
          {profile?.creator_tier && (
            <div className="mt-4">
              <TierBadge tier={profile.creator_tier} size="md" />
            </div>
          )}
        </header>

        {user && <GettingStartedChecklist userId={user.id} role="creator" />}

        {/* Onboarding Banner */}
        {onboardingIncomplete && (
          <div className="mb-8 rounded-2xl border border-[#0c4d47]/20 bg-white/70 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#0c4d47] flex-shrink-0" />
              <div>
                <p className="font-secondary text-base text-[#0a2225]">Complete your creator profile</p>
                <p className="text-sm text-[#0a2225]/65">Finish onboarding to unlock all features and start earning commissions.</p>
              </div>
            </div>
            <Link
              to="/onboarding/creator"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-5 py-2.5 text-sm font-medium text-[#f7f3ea] hover:bg-[#0a2225] transition-colors whitespace-nowrap"
            >
              Complete Setup
            </Link>
          </div>
        )}


        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10 mt-2">
          {isMobile ? (
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-transparent border-[#0a2225]/15 rounded-full h-11 px-5 text-sm font-medium text-[#0a2225]">
                <SelectValue>{TAB_LABELS[(activeTab as TabKey) ?? "overview"] ?? "Studio"}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#f7f3ea] border-[#0a2225]/15 rounded-xl">
                {TAB_KEYS.map((key) => (
                  <SelectItem key={key} value={key} className="py-3">
                    {TAB_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <TabsList className="w-full bg-transparent border-b border-[#0a2225]/15 rounded-none h-11 justify-start gap-0 flex p-0 overflow-x-auto">
              {TAB_KEYS.map((key) => (
                <TabsTrigger key={key} value={key} className={tabTriggerClass}>
                  {TAB_LABELS[key]}
                </TabsTrigger>
              ))}
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

          <TabsContent value="guides" className="mt-0">
            <CreatorGuidesTab />
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            {user?.id && <CreatorServicesSection creatorId={user.id} isOwnProfile={true} />}
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <div className="space-y-6">
              <TierBenefitsCard tier={profile?.creator_tier} />
              <CreatorPerformanceTab role="creator" />
            </div>
          </TabsContent>

          <TabsContent value="affiliate" className="mt-0">
            <CreatorAffiliateTab />
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <CreatorContentToolsTab />
          </TabsContent>

          <TabsContent value="earnings" className="mt-0">
            <CreatorEarningsTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <CreatorSettingsTab />
          </TabsContent>
        </Tabs>

        {/* Editorial footer */}
        <footer className="mt-16 pt-10 border-t border-[#0a2225]/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
                Find work
              </p>
              <h3 className="mt-3 font-secondary text-xl text-[#0a2225]">
                Browse open trip requests
              </h3>
              <p className="mt-2 text-sm text-[#0a2225]/65 leading-relaxed">
                See what travelers are dreaming up and send a tailored proposal to win the brief.
              </p>
              <Link
                to="/marketplace?tab=trip-requests"
                className="mt-3 inline-block text-sm text-[#0c4d47] underline underline-offset-4 decoration-[#0c4d47]/30 hover:decoration-[#0c4d47]"
              >
                Open the marketplace →
              </Link>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
                Package a trip
              </p>
              <h3 className="mt-3 font-secondary text-xl text-[#0a2225]">
                Build something to sell
              </h3>
              <p className="mt-2 text-sm text-[#0a2225]/65 leading-relaxed">
                Turn your taste into bookable trips and digital guides — published in minutes, sold on-platform.
              </p>
              <Link
                to="/trip-builder"
                className="mt-3 inline-block text-sm text-[#0c4d47] underline underline-offset-4 decoration-[#0c4d47]/30 hover:decoration-[#0c4d47]"
              >
                Open the trip builder →
              </Link>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
                New here?
              </p>
              <h3 className="mt-3 font-secondary text-xl text-[#0a2225]">
                How creators earn on Goldsainte
              </h3>
              <p className="mt-2 text-sm text-[#0a2225]/65 leading-relaxed">
                A short guide to proposals, payouts, fees and how the marketplace splits work.
              </p>
              <Link
                to="/how-it-works/creator"
                className="mt-3 inline-block text-sm text-[#0c4d47] underline underline-offset-4 decoration-[#0c4d47]/30 hover:decoration-[#0c4d47]"
              >
                Read the guide →
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
