// src/pages/tiktok/TikTokLabDashboardPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  ArrowRight, 
  Film, 
  Wallet, 
  Users, 
  TrendingUp,
  Plus,
  BookOpen
} from "lucide-react";

import { AccountHealthCard } from "@/components/account/AccountHealthCard";
import { TravelStoryboard } from "@/components/storyboards/TravelStoryboard";
import {
  computeCreatorMatchScore,
  type TripRequest,
  type CreatorProfile,
  type CreatorMatch,
} from "@/services/matchingService";
import { supabase } from "@/integrations/supabase/client";

type Role = "creator" | "agent" | "traveler";

export default function TikTokLabDashboardPage() {
  const [role, setRole] = useState<Role>("traveler");
  const [matches, setMatches] = useState<CreatorMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [storyboardCount, setStoryboardCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoadingMatches(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "id, account_type, creator_niches, creator_budget_levels, display_name, tiktok_handle"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || cancelled) return;

        const acctType = profile.account_type as string | null;
        if (acctType === "agent") setRole("agent");
        else if (acctType === "creator") setRole("creator");
        else setRole("traveler");

        // Load storyboard count
        const { count } = await supabase
          .from("storyboards")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id);
        
        if (!cancelled) setStoryboardCount(count || 0);

        // Load trip requests for matching
        const { data: trips } = await supabase
          .from("trip_requests")
          .select(
            "id, destination, budget_level, travel_styles, occasion, wants_role"
          )
          .eq("status", "open")
          .limit(20);

        if (!trips || trips.length === 0 || cancelled) {
          setMatches([]);
          return;
        }

        const relevantTrips: TripRequest[] = (
          acctType === "creator"
            ? trips.filter(
                (t: any) =>
                  !t.wants_role ||
                  t.wants_role === "creator" ||
                  t.wants_role === "both"
              )
            : trips
        ).map((t: any) => ({
          id: t.id,
          destination: t.destination,
          budget_level: t.budget_level,
          travel_styles: t.travel_styles,
          occasion: t.occasion,
          wants_role: t.wants_role as "creator" | "agent" | "both" | null,
        }));

        const creatorProfile: CreatorProfile = {
          id: profile.id,
          display_name: profile.display_name ?? "You",
          tiktok_handle: profile.tiktok_handle,
          creator_niches: profile.creator_niches || [],
          creator_budget_levels: profile.creator_budget_levels || [],
        };

        const allMatches = relevantTrips.map((trip: any) => {
          const match = computeCreatorMatchScore(trip, creatorProfile);
          return {
            ...match,
            creator: {
              ...match.creator,
              id: trip.id,
            },
          };
        });

        const sorted = allMatches
          .filter((m) => m.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        if (!cancelled) setMatches(sorted);
      } finally {
        if (!cancelled) setLoadingMatches(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex-1 bg-[#FDF9F0]">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Gold accent line */}
        <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />

        {/* Header */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#E5DFC6] mb-4">
            <Sparkles className="h-4 w-4 text-[#C7A962]" />
            <span className="text-sm font-medium text-[#6B7280] tracking-wide">
              Creator Studio
            </span>
          </div>
          
          <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] tracking-tight">
            Creator Studio by <em>Goldsainte AI</em>
          </h1>
          <p className="mt-3 text-[#6B7280] text-base max-w-xl leading-relaxed">
            Share your journeys. Earn commissions. Inspire travelers globally. 
            This is your control room for storyboards, trip briefs, and earnings.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/storyboards/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#0a2225]/90 transition-colors"
            >
              <Film className="w-4 h-4" />
              Create a Storyboard
            </Link>
            <Link
              to="/marketplace?tab=trip-requests"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-6 py-3 text-sm font-medium text-[#0a2225] shadow-sm hover:bg-[#F6F0E4] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Browse Trip Requests
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-6 md:grid-cols-3 mb-12">
          <LuxuryStatCard
            icon={<Film className="w-5 h-5 text-[#C7A962]" />}
            label="Storyboards"
            value={loadingMatches ? "—" : storyboardCount.toString()}
            helper="Your travel stories"
          />
          <LuxuryStatCard
            icon={<Users className="w-5 h-5 text-[#C7A962]" />}
            label="Trip Matches"
            value={loadingMatches ? "—" : matches.length.toString()}
            helper="Travelers looking for you"
          />
          <LuxuryStatCard
            icon={<Wallet className="w-5 h-5 text-[#C7A962]" />}
            label="Estimated Earnings"
            value="$0"
            helper="Based on confirmed trips"
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Trip Requests Section */}
            <MatchesPanel
              matches={matches}
              loading={loadingMatches}
            />

            {/* Storyboards Section */}
            <StoryboardsPanel storyboardCount={storyboardCount} />

            {/* Inspiration Section */}
            <InspirationPanel />
          </div>

          {/* Right Column - Only for creators/agents */}
          {(role === "creator" || role === "agent") && (
            <div className="space-y-6">
              <EarningsSnapshot />
              <AccountHealthCard role={role === "agent" ? "agent" : "creator"} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ---- Reusable Components ----

function LuxuryStatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#E5DFC6] p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#F6F0E4] flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="font-secondary text-3xl text-[#0a2225]">
        {value}
      </div>
      <p className="text-sm text-[#6B7280] mt-2">{helper}</p>
    </div>
  );
}

// ---- Section Panels ----

type MatchesProps = {
  matches: CreatorMatch[];
  loading: boolean;
};

function MatchesPanel({ matches, loading }: MatchesProps) {
  return (
    <section className="rounded-2xl bg-white border border-[#E5DFC6] p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-secondary text-xl md:text-2xl text-[#0a2225]">
            Trip Requests for You
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Based on your niches and style, these travelers are a great fit
          </p>
        </div>
        <Link
          to="/marketplace?tab=trip-requests"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#C7A962] hover:text-[#B39952] transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <LuxuryEmptyState message="Finding your perfect matches..." />
      ) : matches.length === 0 ? (
        <LuxuryEmptyState
          message="No matches yet"
          subtext="Complete your profile and check back as travelers post more briefs. We'll surface the best opportunities here."
          action={
            <Link
              to="/marketplace?tab=trip-requests"
              className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0a2225]/90 transition-colors mt-4"
            >
              Browse All Requests
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <Link
              key={m.creator.id}
              to={`/marketplace/request/${m.creator.id}`}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[#E5DFC6] bg-[#F6F0E4] p-5 hover:border-[#C7A962] hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-medium text-[#0a2225]">
                    <TrendingUp className="w-3 h-3 text-[#C7A962]" />
                    Match Score: {m.score}
                  </span>
                </div>
                <h3 className="font-medium text-[#0a2225]">
                  Trip Brief Match
                </h3>
                {m.reasons.length > 0 && (
                  <p className="text-sm text-[#6B7280] mt-1">
                    {m.reasons[0]}
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] text-white px-4 py-2 text-sm font-medium">
                View Brief
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function StoryboardsPanel({ storyboardCount }: { storyboardCount: number }) {
  return (
    <section className="rounded-2xl bg-white border border-[#E5DFC6] p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-secondary text-xl md:text-2xl text-[#0a2225]">
            Your Storyboards
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Transform your best content into bookable travel experiences
          </p>
        </div>
        <Link
          to="/storyboards"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#C7A962] hover:text-[#B39952] transition-colors"
        >
          Manage all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {storyboardCount === 0 ? (
        <LuxuryEmptyState
          message="No storyboards yet"
          subtext="Storyboards are the bookable version of your travel content. Create your first one to start earning from your journeys."
          action={
            <Link
              to="/storyboards/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0a2225]/90 transition-colors mt-4"
            >
              <Plus className="w-4 h-4" />
              Create Your First Storyboard
            </Link>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link
            to="/storyboards/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0a2225]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Storyboard
          </Link>
          <Link
            to="/storyboards"
            className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-[#F6F0E4] px-5 py-2.5 text-sm font-medium text-[#0a2225] hover:bg-[#E5DFC6] transition-colors"
          >
            View All ({storyboardCount})
          </Link>
        </div>
      )}
    </section>
  );
}

function InspirationPanel() {
  return (
    <section className="rounded-2xl bg-white border border-[#E5DFC6] p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-secondary text-xl md:text-2xl text-[#0a2225]">
            Browse & Save Inspiration
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Discover stunning destinations and save them to your storyboards
          </p>
        </div>
        <Link
          to="/storyboards"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#C7A962] hover:text-[#B39952] transition-colors"
        >
          See more
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <TravelStoryboard
        title=""
        subtitle=""
        maxItems={8}
        showSaveButtons={true}
      />
    </section>
  );
}

function EarningsSnapshot() {
  return (
    <section className="rounded-2xl bg-white border border-[#E5DFC6] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-secondary text-xl text-[#0a2225]">
          Earnings
        </h2>
        <Link
          to="/tiktok-lab/earnings"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#C7A962] hover:text-[#B39952] transition-colors"
        >
          Details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-[#F6F0E4] p-4">
          <p className="text-sm text-[#6B7280] mb-1">Estimated earnings</p>
          <p className="font-secondary text-2xl text-[#0a2225]">$0</p>
          <p className="text-sm text-[#6B7280]">from confirmed trips</p>
        </div>
        <div className="rounded-xl bg-[#F6F0E4] p-4">
          <p className="text-sm text-[#6B7280] mb-1">In discussion</p>
          <p className="font-secondary text-2xl text-[#0a2225]">$0</p>
          <p className="text-sm text-[#6B7280]">from active briefs</p>
        </div>
      </div>

      <div className="flex items-start gap-3 pt-4 mt-4 border-t border-[#E5DFC6]">
        <Wallet className="h-5 w-5 text-[#C7A962] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#6B7280] leading-relaxed">
          As trips are accepted and confirmed, you'll see estimated earnings here. 
          Goldsainte handles secure payments and payouts.
        </p>
      </div>
    </section>
  );
}

function LuxuryEmptyState({
  message,
  subtext,
  action,
}: {
  message: string;
  subtext?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#F6F0E4] p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Film className="w-6 h-6 text-[#C7A962]" />
      </div>
      <h3 className="font-secondary text-lg text-[#0a2225]">{message}</h3>
      {subtext && (
        <p className="text-sm text-[#6B7280] mt-2 max-w-sm mx-auto leading-relaxed">
          {subtext}
        </p>
      )}
      {action}
    </div>
  );
}
