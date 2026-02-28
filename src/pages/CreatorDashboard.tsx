import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invokeWithAuth } from "@/lib/supabaseHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  Send,
  CheckCircle2,
  BarChart3,
  DollarSign,
  Clock,
  Plus,
  AlertCircle,
  Search,
  TrendingUp,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
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

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CreatorStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingIncomplete, setOnboardingIncomplete] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("has_completed_creator_onboarding")
        .eq("id", user.id)
        .maybeSingle();
      if (data && !data.has_completed_creator_onboarding) {
        setOnboardingIncomplete(true);
      }
    }
    checkOnboarding();
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await invokeWithAuth<CreatorStats>(
          "creator-dashboard-stats",
          { body: {} }
        );

        if (fnError) {
          console.error(fnError);
          if (!isMounted) return;
          setError(fnError || "Unable to load creator stats at the moment.");
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
      } catch (e: any) {
        console.error(e);
        if (!isMounted) return;
        setError("Unexpected error while loading stats.");
        setStats(EMPTY_STATS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();
    return () => { isMounted = false; };
  }, []);

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex-1 bg-[#FDF9F0]">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />

        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#E5DFC6] mb-4">
          <Sparkles className="h-4 w-4 text-[#C7A962]" />
          <span className="text-sm font-medium text-[#6B7280] tracking-wide">
            Creator Studio
          </span>
        </div>

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

        {/* Header */}
        <header className="mb-12">
          <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] tracking-tight">
            Creator Dashboard
          </h1>
          <p className="mt-3 text-[#6B7280] text-base max-w-xl leading-relaxed">
            Track your proposals, earnings, and marketplace activity at a glance.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#0a2225]/90 transition-colors"
            >
              <Search className="w-4 h-4" />
              Browse Trip Requests
            </Link>
            <Link
              to="/trip-builder"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-6 py-3 text-sm font-medium text-[#0a2225] shadow-sm hover:bg-[#F6F0E4] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Trip Package
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-6 py-3 text-sm font-medium text-[#0a2225] shadow-sm hover:bg-[#F6F0E4] transition-colors"
            >
              View Marketplace
            </Link>
          </div>
        </header>

        {/* Stats Grid — 3x2 */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          <LuxuryStatCard
            icon={<Send className="w-5 h-5 text-[#C7A962]" />}
            label="Active Proposals"
            value={loading ? "—" : stats.activeProposals.toString()}
            helper="Pending, sent, or under review"
          />
          <LuxuryStatCard
            icon={<CheckCircle2 className="w-5 h-5 text-[#C7A962]" />}
            label="Accepted"
            value={loading ? "—" : stats.acceptedProposals.toString()}
            helper="Proposals accepted by travelers"
          />
          <LuxuryStatCard
            icon={<BarChart3 className="w-5 h-5 text-[#C7A962]" />}
            label="Total Sent"
            value={loading ? "—" : stats.totalProposalsSent.toString()}
            helper="Lifetime proposals submitted"
          />
          <LuxuryStatCard
            icon={<TrendingUp className="w-5 h-5 text-[#C7A962]" />}
            label="Response Rate"
            value={loading ? "—" : `${stats.responseRate}%`}
            helper="Proposals that got a response"
          />
          <LuxuryStatCard
            icon={<DollarSign className="w-5 h-5 text-[#C7A962]" />}
            label="Total Earnings"
            value={loading ? "—" : fmt(stats.totalEarnings)}
            helper="Completed & paid earnings"
          />
          <LuxuryStatCard
            icon={<Clock className="w-5 h-5 text-[#C7A962]" />}
            label="Pending Earnings"
            value={loading ? "—" : fmt(stats.pendingEarnings)}
            helper="Awaiting payout"
          />
        </section>

        {/* Open Trip Requests banner */}
        {!loading && stats.openTripRequests > 0 && (
          <Link
            to="/marketplace?tab=trip-requests"
            className="mb-8 flex items-center justify-between rounded-2xl border border-[#C7A962]/30 bg-[#C7A962]/5 px-6 py-4 hover:bg-[#C7A962]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#C7A962]" />
              <span className="text-sm font-medium text-[#0a2225]">
                {stats.openTripRequests} open trip request{stats.openTripRequests !== 1 ? "s" : ""} in the marketplace
              </span>
            </div>
            <span className="text-sm text-[#C7A962] font-medium">View all →</span>
          </Link>
        )}

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Recent Proposals */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-secondary text-2xl text-[#0a2225]">
                Recent Proposals
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Your latest bids on trip requests
              </p>
            </div>
            <Link
              to="/my-proposals"
              className="inline-flex items-center gap-2 rounded-full border border-[#C7A962] bg-[#C7A962]/10 px-5 py-2.5 text-sm font-medium text-[#0a2225] hover:bg-[#C7A962]/20 transition-colors"
            >
              View All Proposals
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <LuxuryEmptyState message="Loading your proposals..." />
            ) : stats.recentProposals.length === 0 ? (
              <LuxuryEmptyState
                message="No proposals yet"
                subtext="Browse open trip requests in the marketplace and submit your first bid."
                action={
                  <Link
                    to="/marketplace"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0a2225]/90 transition-colors mt-4"
                  >
                    Browse Trip Requests
                  </Link>
                }
              />
            ) : (
              stats.recentProposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  to={`/marketplace/request/${proposal.tripRequestId}`}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white border border-[#E5DFC6] p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#0a2225] truncate">
                      {proposal.tripTitle}
                    </h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      {proposal.destination} ·{" "}
                      {new Date(proposal.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ProposalStatusBadge status={proposal.status} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

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
      <div className="font-secondary text-3xl text-[#0a2225]">{value}</div>
      <p className="text-sm text-[#6B7280] mt-2">{helper}</p>
    </div>
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
    <div className="rounded-2xl bg-white border border-[#E5DFC6] p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#F6F0E4] flex items-center justify-center mx-auto mb-4">
        <Send className="w-7 h-7 text-[#C7A962]" />
      </div>
      <h3 className="font-secondary text-xl text-[#0a2225]">{message}</h3>
      {subtext && (
        <p className="text-sm text-[#6B7280] mt-2 max-w-sm mx-auto">{subtext}</p>
      )}
      {action}
    </div>
  );
}
