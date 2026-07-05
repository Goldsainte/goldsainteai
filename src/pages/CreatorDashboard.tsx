import { useEffect, useState } from "react";
import { useNavigate, Link, Navigate, useSearchParams } from "react-router-dom";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, ExternalLink, ChevronDown, Settings as SettingsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  // Leaf tabs are the actual content panels — every existing deep link
  // (?tab=portfolio, ?tab=earnings, ?tab=settings, etc.) targets one of these
  // and must keep working unchanged.
  const LEAF_KEYS = [
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
  type LeafKey = (typeof LEAF_KEYS)[number];

  // Top-level groups condense the 11 flat tabs down to 5 visible pills,
  // matching how Airbnb/most mature platforms keep primary nav short and
  // push secondary items (here: Settings) into a "More" menu.
  type GroupKey = "overview" | "pipeline" | "catalog" | "growth" | "earnings";
  const GROUPS: { key: GroupKey; label: string; children: { key: LeafKey; label: string }[] }[] = [
    { key: "overview", label: "Studio", children: [{ key: "overview", label: "Studio" }] },
    {
      key: "pipeline",
      label: "Pipeline",
      children: [
        { key: "proposals", label: "Proposals" },
        { key: "trips", label: "Trips" },
      ],
    },
    {
      key: "catalog",
      label: "Catalog",
      children: [
        { key: "portfolio", label: "Portfolio" },
        { key: "guides", label: "Guides" },
        { key: "services", label: "Services" },
      ],
    },
    {
      key: "growth",
      label: "Growth",
      children: [
        { key: "performance", label: "Performance" },
        { key: "affiliate", label: "Affiliate" },
        { key: "content", label: "Content" },
      ],
    },
    { key: "earnings", label: "Earnings", children: [{ key: "earnings", label: "Earnings" }] },
  ];

  const LEAF_TO_GROUP = GROUPS.reduce((acc, group) => {
    group.children.forEach((child) => { acc[child.key] = group.key; });
    return acc;
  }, {} as Record<Exclude<LeafKey, "settings">, GroupKey>);

  // Stripe Connect returns to /creator-dashboard?stripe=success|refresh with
  // no tab param. Landing on Earnings is what mounts the payout card, whose
  // status check is the only writer of profiles.stripe_charges_enabled — so
  // without this, finishing Stripe never unlocks guide publishing.
  const stripeReturn = searchParams.get("stripe");
  const requestedLeaf =
    (searchParams.get("tab") as LeafKey) || (stripeReturn ? "earnings" : "overview");
  const initialIsSettings = requestedLeaf === "settings";
  const initialLeaf: LeafKey = initialIsSettings
    ? "settings"
    : LEAF_TO_GROUP[requestedLeaf as Exclude<LeafKey, "settings">]
    ? requestedLeaf
    : "overview";

  const [activeGroup, setActiveGroupState] = useState<GroupKey>(
    initialIsSettings ? "overview" : LEAF_TO_GROUP[initialLeaf as Exclude<LeafKey, "settings">] ?? "overview"
  );
  const [activeLeaf, setActiveLeaf] = useState<LeafKey>(initialLeaf);

  const handleGroupChange = (groupKey: string) => {
    const group = GROUPS.find((g) => g.key === groupKey);
    if (!group) return;
    setActiveGroupState(group.key);
    setActiveLeaf(group.children[0].key);
  };

  const renderLeaf = (leaf: LeafKey) => {
    switch (leaf) {
      case "overview":
        return <CreatorOverviewTab stats={stats} loading={loading} />;
      case "proposals":
        return <CreatorProposalsTab />;
      case "trips":
        return <CreatorTripsTab />;
      case "portfolio":
        return <CreatorPortfolioTab />;
      case "guides":
        return <CreatorGuidesTab />;
      case "services":
        return user?.id ? <CreatorServicesSection creatorId={user.id} isOwnProfile={true} creatorTier={profile?.creator_tier} hideLabel /> : null;
      case "performance":
        return (
          <div className="space-y-6">
            <TierBenefitsCard tier={profile?.creator_tier} />
            <CreatorPerformanceTab role="creator" />
          </div>
        );
      case "affiliate":
        return <CreatorAffiliateTab />;
      case "content":
        return <CreatorContentToolsTab />;
      case "earnings":
        return <CreatorEarningsTab />;
      case "settings":
        return <CreatorSettingsTab />;
    }
  };

  const tabTriggerClass =
    "rounded-none h-11 border-b border-transparent data-[state=active]:border-[#0c4d47] data-[state=active]:text-[#0a2225] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[#0a2225]/55 text-[11px] uppercase tracking-[0.28em] font-medium px-5 whitespace-nowrap flex-shrink-0 transition-colors";

  const subPillClass = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] font-medium transition-colors ${
      active
        ? "bg-[#0c4d47] border-[#0c4d47] text-white"
        : "bg-white border-[#E5DFC6] text-[#0a2225]/60 hover:border-[#0c4d47]/40"
    }`;

  return (
    <main className="min-h-screen bg-[#f7f3ea] pb-24 lg:pb-0 text-[#0a2225]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-8 md:pt-16 pb-12">
        {/* Editorial header */}
        <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
              The Atelier
            </p>
            <h1 className="mt-2 md:mt-3 font-secondary text-[28px] leading-tight md:text-4xl text-[#0a2225]">
              {loading ? "Welcome" : `Welcome, ${displayName.split(" ")[0]}`}
            </h1>
            <p className="mt-2 text-base text-[#0a2225]/70 max-w-xl">
              Your studio for shaping trip proposals, packaging journeys, and growing what you earn on-platform.
            </p>
            {profile?.creator_tier && (
              <div className="mt-4">
                <TierBadge tier={profile.creator_tier} size="md" />
              </div>
            )}
          </div>
          {user && (
            <Link
              to={`/creators/${user.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0c4d47]/25 px-5 py-2.5 text-sm font-medium text-[#0a2225] hover:bg-white transition-colors whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              View public profile
            </Link>
          )}
        </header>

        {user && <GettingStartedChecklist userId={user.id} role="creator" />}

        {/* Onboarding Banner */}
        {onboardingIncomplete && (
          <div className="mb-8 rounded-2xl border border-[#0c4d47]/20 bg-white/70 px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <AlertCircle className="w-5 h-5 text-[#0c4d47] flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <p className="font-secondary text-base text-[#0a2225]">Finish setting up your studio</p>
                <p className="text-sm text-[#0a2225]/65">Complete onboarding — including the creator terms — to unlock all features and start earning commissions.</p>
              </div>
            </div>
            <Link
              to="/onboarding/creator"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-5 py-2.5 text-sm font-medium text-[#f7f3ea] hover:bg-[#0a2225] transition-colors whitespace-nowrap w-full sm:w-auto shrink-0"
            >
              Complete Setup
            </Link>
          </div>
        )}


        {/* Tabs */}
        {activeLeaf === "settings" ? (
          <div className="space-y-6 mt-2">
            <button
              onClick={() => { setActiveLeaf("overview"); setActiveGroupState("overview"); }}
              className="text-xs uppercase tracking-[0.2em] font-medium text-[#0a2225]/60 hover:text-[#0c4d47] transition-colors"
            >
              ← Back to Studio
            </button>
            <CreatorSettingsTab />
          </div>
        ) : (
          <Tabs value={activeGroup} onValueChange={handleGroupChange} className="space-y-10 mt-2">
            {isMobile ? (
              <div className="flex items-center gap-2">
                <Select value={activeGroup} onValueChange={handleGroupChange}>
                  <SelectTrigger className="flex-1 bg-transparent border-[#0a2225]/15 rounded-full h-11 px-5 text-sm font-medium text-[#0a2225]">
                    <SelectValue>{GROUPS.find((g) => g.key === activeGroup)?.label ?? "Studio"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#f7f3ea] border-[#0a2225]/15 rounded-xl">
                    {GROUPS.map((group) => (
                      <SelectItem key={group.key} value={group.key} className="py-3">
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-11 w-11 flex items-center justify-center rounded-full border border-[#0a2225]/15 text-[#0a2225]/70 hover:bg-white transition-colors shrink-0">
                      <SettingsIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#f7f3ea] border-[#0a2225]/15">
                    <DropdownMenuItem onClick={() => setActiveLeaf("settings")}>
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="w-full border-b border-[#0a2225]/15 flex items-center justify-between">
                <TabsList className="bg-transparent rounded-none h-11 justify-start gap-0 flex p-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {GROUPS.map((group) => (
                    <TabsTrigger key={group.key} value={group.key} className={tabTriggerClass}>
                      {group.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.28em] font-medium text-[#0a2225]/55 hover:text-[#0a2225] transition-colors px-5 h-11 shrink-0">
                      More <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-[#E5DFC6]">
                    <DropdownMenuItem onClick={() => setActiveLeaf("settings")} className="gap-2">
                      <SettingsIcon className="w-4 h-4" /> Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {GROUPS.map((group) => (
              <TabsContent key={group.key} value={group.key} className="mt-0">
                {group.children.length > 1 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {group.children.map((child) => (
                      <button
                        key={child.key}
                        type="button"
                        onClick={() => setActiveLeaf(child.key)}
                        className={subPillClass(activeLeaf === child.key)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
                {activeGroup === group.key && renderLeaf(activeLeaf)}
              </TabsContent>
            ))}
          </Tabs>
        )}

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
              <p className="mt-2 text-[15px] text-[#0a2225]/70 leading-relaxed">
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
              <p className="mt-2 text-[15px] text-[#0a2225]/70 leading-relaxed">
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
              <p className="mt-2 text-[15px] text-[#0a2225]/70 leading-relaxed">
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
