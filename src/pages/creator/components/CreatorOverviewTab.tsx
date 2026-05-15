import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface CreatorOverviewTabProps {
  stats: {
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
  loading: boolean;
}

export function CreatorOverviewTab({ stats, loading }: CreatorOverviewTabProps) {
  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const steps = [
    {
      n: "01",
      title: "Browse trip requests",
      body:
        "Travelers post the journeys they want. Pick a brief that fits your taste and expertise.",
    },
    {
      n: "02",
      title: "Send a tailored proposal",
      body:
        "Build a thoughtful itinerary with your price, inclusions, and timeline. We handle escrow.",
    },
    {
      n: "03",
      title: "Get booked & paid on-platform",
      body:
        "Travelers confirm, payments are held in escrow, funds release as milestones complete.",
    },
  ];

  const statItems = [
    { label: "Active proposals", value: loading ? "—" : stats.activeProposals.toString() },
    { label: "Accepted", value: loading ? "—" : stats.acceptedProposals.toString() },
    { label: "Response rate", value: loading ? "—" : `${stats.responseRate}%` },
    { label: "Total earnings", value: loading ? "—" : fmt(stats.totalEarnings) },
  ];

  const hasActivity =
    !loading &&
    (stats.totalProposalsSent > 0 ||
      stats.totalEarnings > 0 ||
      stats.guideSales > 0);

  return (
    <div className="space-y-12">
      {/* Editorial hero */}
      <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
          Start here
        </p>
        <h2 className="mt-3 md:mt-4 font-secondary text-[28px] md:text-5xl leading-[1.15] text-[#0a2225] max-w-2xl">
          Find a brief, design the trip, get paid.
        </h2>
        <p className="mt-4 md:mt-5 max-w-xl text-[15px] leading-relaxed text-[#0a2225]/65">
          The marketplace is full of travelers waiting for the right specialist. Send a proposal or
          publish a packaged trip ready to book.
        </p>

        <div className="mt-7 md:mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-x-8">
          <Button
            asChild
            className="rounded-full bg-[#0c4d47] hover:bg-[#0a2225] text-[#f7f3ea] px-7 h-12 text-sm tracking-wide w-full sm:w-auto"
          >
            <Link to="/marketplace?tab=trip-requests">Browse trip requests</Link>
          </Button>
          <Link
            to="/trip-builder"
            className="group inline-flex items-center justify-center sm:justify-start text-sm text-[#0a2225]/70 hover:text-[#0a2225] transition-colors h-11 sm:h-auto"
          >
            Or package a new trip
            <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* How it works — editorial three-step */}
      <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#0c4d47]/70 mb-6 md:mb-8">
          How Goldsainte works for creators
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
          {steps.map((s) => (
            <div key={s.n} className="space-y-3">
              <p className="font-secondary text-2xl text-[#c7a962]">{s.n}</p>
              <h3 className="font-secondary text-xl text-[#0a2225]">{s.title}</h3>
              <p className="text-sm leading-relaxed text-[#0a2225]/65">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open trip requests nudge */}
      {!loading && stats.openTripRequests > 0 && (
        <Link
          to="/marketplace?tab=trip-requests"
          className="flex items-center justify-between rounded-2xl border border-[#0a2225]/10 bg-white/70 px-6 py-4 hover:bg-white transition-colors"
        >
          <span className="text-sm text-[#0a2225]">
            <span className="font-secondary text-base">{stats.openTripRequests}</span>{" "}
            open trip request{stats.openTripRequests !== 1 ? "s" : ""} in the marketplace right now
          </span>
          <span className="text-sm text-[#0c4d47] font-medium">View all →</span>
        </Link>
      )}

      {/* Quiet stats — only once there's activity */}
      {hasActivity && (
        <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#0c4d47]/70 mb-5">
            Your studio, at a glance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
            {statItems.map((item) => (
              <div key={item.label}>
                <p className="font-secondary text-2xl md:text-3xl text-[#0a2225]">{item.value}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#0a2225]/55 mt-1.5">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Proposals */}
      {stats.recentProposals.length > 0 && (
        <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
                Latest activity
              </p>
              <h2 className="mt-2 font-secondary text-2xl text-[#0a2225]">Recent proposals</h2>
            </div>
            <Link
              to="/my-proposals"
              className="text-sm text-[#0c4d47] underline underline-offset-4 decoration-[#0c4d47]/30 hover:decoration-[#0c4d47]"
            >
              View all →
            </Link>
          </div>

          <div className="divide-y divide-[#0a2225]/10 border-y border-[#0a2225]/10">
            {stats.recentProposals.map((proposal) => (
              <Link
                key={proposal.id}
                to={`/marketplace/request/${proposal.tripRequestId}`}
                className="flex items-center justify-between gap-4 py-4 hover:bg-white/40 transition-colors group px-1"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-secondary text-base text-[#0a2225] truncate">
                    {proposal.tripTitle}
                  </h3>
                  <p className="text-xs text-[#0a2225]/55 mt-1">
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
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
