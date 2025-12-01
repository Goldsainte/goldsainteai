// src/pages/tiktok/TikTokLabDashboardPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Film, Wallet, Layout } from "lucide-react";

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

  // Simple fetch of "for you" matches – v1, you can make this smarter later
  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoadingMatches(true);
      try {
        // 1) get current user profile to know role & preferences
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

        // 2) load a small set of open trip requests
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

        // For creators, only show trips that want creators or both
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

        // Our existing matching util expects a trip + a creator profile.
        // Here we cheat: we treat *you* as the creator and pick the best few trips.
        const creatorProfile: CreatorProfile = {
          id: profile.id,
          display_name: profile.display_name ?? "You",
          tiktok_handle: profile.tiktok_handle,
          creator_niches: profile.creator_niches || [],
          creator_budget_levels: profile.creator_budget_levels || [],
        };

        const allMatches = relevantTrips.map((trip: any) => {
          const match = computeCreatorMatchScore(trip, creatorProfile);
          // Attach trip id for linking
          return {
            ...match,
            creator: {
              ...match.creator,
              id: trip.id, // Pack trip id here
            },
          };
        });

        // Filter and sort by score
        const sorted = allMatches
          .filter((m) => m.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        if (!cancelled) setMatches(sorted);
      } finally {
        if (!cancelled) setLoadingMatches(false);
      }
    }

    loadMatches();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] border border-[#E5DFC6]">
              <Sparkles className="h-3 w-3 text-[#BFAD72]" />
              <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
                Goldsainte Creator Lab
              </span>
            </div>
            <h1 className="font-display text-[24px] md:text-[28px] leading-tight">
              Your travel content, now bookable.
            </h1>
            <p className="text-[11px] md:text-[12px] text-[#4a4a4a] max-w-xl">
              This is your control room for storyboards, trip briefs and
              earnings. Goldsainte matches you with travelers who are actively
              looking to book the trips you already create content about.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <Link
              to="/tiktok-lab/storyboards/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-2 font-semibold hover:bg-[#073331]"
            >
              <Film className="h-3 w-3" />
              Create a storyboard
            </Link>
            <Link
              to="/post-trip"
              className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E5DFC6] text-[#0a2225] px-4 py-2 font-semibold"
            >
              <Layout className="h-3 w-3" />
              View traveler briefs
            </Link>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Left column */}
          <div className="space-y-5">
            <MatchesPanel
              matches={matches}
              loading={loadingMatches}
              role={role}
            />
            <StoryboardsPanel />
            <InspirationPanel />
          </div>

          {/* Right column - only show for creators/agents */}
          {(role === "creator" || role === "agent") && (
            <div className="space-y-5">
              <EarningsSnapshot />
              <AccountHealthCard role={role === "agent" ? "agent" : "creator"} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// ---- Sections ----

type MatchesProps = {
  matches: CreatorMatch[];
  loading: boolean;
  role: Role;
};

function MatchesPanel({ matches, loading }: MatchesProps) {
  return (
    <section className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
            For you
          </p>
          <p className="text-[12px] font-semibold">
            Trip briefs we think you&apos;ll love
          </p>
        </div>
        <Link
          to="/my-trip-requests"
          className="inline-flex items-center gap-1 text-[10px] text-[#0c4d47]"
        >
          View all briefs
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <p className="text-[10px] text-[#4a4a4a]">
        Based on your niches and budget level, these travelers are a strong fit
        for your world. Send a proposal or save them for later.
      </p>

      {loading ? (
        <p className="text-[10px] text-[#8D8D8D] pt-2">Loading matches…</p>
      ) : matches.length === 0 ? (
        <p className="text-[10px] text-[#8D8D8D] pt-2">
          We don&apos;t have personalised matches yet. As you complete your
          profile and travelers post more briefs, we&apos;ll surface the best
          ones here.
        </p>
      ) : (
        <div className="flex flex-col gap-2 pt-2">
          {matches.map((m) => (
            <Link
              key={m.creator.id}
              to={`/trip-requests/${m.creator.id}`}
              className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 hover:border-[#BFAD72]"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-semibold">
                  Trip brief match
                </p>
                {m.reasons.length > 0 && (
                  <p className="text-[10px] text-[#4a4a4a]">
                    {m.reasons[0]}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#8D8D8D]">
                <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5">
                  Match score: {m.score}
                </span>
                <span className="inline-flex items-center rounded-full bg-[#0c4d47] text-[#E5DFC6] px-2 py-0.5">
                  View brief
                  <ArrowRight className="h-3 w-3 ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function StoryboardsPanel() {
  return (
    <section className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
            Your library
          </p>
          <p className="text-[12px] font-semibold">Storyboards</p>
        </div>
        <Link
          to="/tiktok-lab/storyboards"
          className="inline-flex items-center gap-1 text-[10px] text-[#0c4d47]"
        >
          Manage all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <p className="text-[10px] text-[#4a4a4a]">
        Storyboards are the bookable version of your content. Turn your most
        loved trips into beautiful boards so agents can plug in pricing and
        travelers can request them.
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          to="/tiktok-lab/storyboards/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0c4d47] text-[#E5DFC6] px-3 py-1.5 text-[10px] font-semibold hover:bg-[#073331]"
        >
          Create a storyboard
        </Link>
        <Link
          to="/tiktok-lab/storyboards"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#f7f3ea] border border-[#E5DFC6] text-[10px] px-3 py-1.5"
        >
          See public wall
        </Link>
      </div>
    </section>
  );
}

function InspirationPanel() {
  return (
    <section className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
            Quick save
          </p>
          <p className="text-[12px] font-semibold">Browse & save inspiration</p>
        </div>
        <Link
          to="/tiktok-lab/storyboards"
          className="inline-flex items-center gap-1 text-[10px] text-[#0c4d47]"
        >
          See more
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <p className="text-[10px] text-[#4a4a4a]">
        Hover over any image to save it directly to your storyboards for trip planning.
      </p>

      <div className="pt-2">
        <TravelStoryboard
          title=""
          subtitle=""
          maxItems={8}
          showSaveButtons={true}
        />
      </div>
    </section>
  );
}

function EarningsSnapshot() {
  return (
    <section className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
            Earnings
          </p>
          <p className="text-[12px] font-semibold">This month at a glance</p>
        </div>
        <Link
          to="/tiktok-lab/earnings"
          className="inline-flex items-center gap-1 text-[10px] text-[#0c4d47]"
        >
          View details
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-2xl bg-[#f7f3ea] p-2">
          <p className="text-[#8D8D8D] mb-1">Estimated earnings</p>
          <p className="text-[15px] font-semibold">$0</p>
          <p className="text-[#8D8D8D]">from confirmed trips</p>
        </div>
        <div className="rounded-2xl bg-[#f7f3ea] p-2">
          <p className="text-[#8D8D8D] mb-1">In discussion</p>
          <p className="text-[15px] font-semibold">$0</p>
          <p className="text-[#8D8D8D]">from active briefs</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[#E5DFC6] text-[10px] text-[#4a4a4a]">
        <Wallet className="h-3 w-3 text-[#0c4d47]" />
        <p>
          As trips are accepted and confirmed, you&apos;ll see estimated
          earnings here. Goldsainte handles secure payments and payouts.
        </p>
      </div>
    </section>
  );
}
