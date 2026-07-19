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

  const earningPaths = [
    {
      n: "01",
      title: "Answer a brief",
      steps: [
        "Travelers post the journeys they want. Pick a brief that fits your taste.",
        "Send a tailored proposal — your itinerary, price, and timeline — right in the chat.",
        "The traveler accepts and pays their deposit without ever leaving the thread.",
      ],
    },
    {
      n: "02",
      title: "Publish your own",
      steps: [
        "Package a trip you know by heart — or a digital guide — in the trip builder.",
        "It lists on the marketplace with your name and your price.",
        "Travelers book it directly — no proposal needed, you wake up to bookings.",
      ],
    },
    {
      n: "03",
      title: "Get hired on-trip",
      steps: [
        "Declare what you can do — content, guiding, hosting — and set your day rate.",
        "Travelers hire you onto their own trip: their dates, your named scope.",
        "You confirm the total; payment is charged straight to your Stripe account.",
      ],
    },
  ];
  const romans = ["i.", "ii.", "iii."];

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
        <p className="text-[12px] md:text-[12.5px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
          Start here
        </p>
        <h2 className="mt-3 md:mt-4 font-secondary text-[28px] md:text-5xl leading-[1.15] text-[#0a2225] max-w-2xl">
          Find a brief, design the trip, get paid.
        </h2>
        <p className="mt-4 md:mt-5 max-w-xl text-[16px] leading-relaxed text-[#0a2225]/65">
          The marketplace is full of travelers waiting for the right specialist. Send a proposal or
          publish a packaged trip ready to book.
        </p>

        <div className="mt-7 md:mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-x-8">
          <Button
            asChild
            className="rounded-full bg-[#0c4d47] hover:bg-[#0a2225] text-[#f7f3ea] px-7 h-12 text-[15px] tracking-wide w-full sm:w-auto"
          >
            <Link to="/marketplace?tab=trip-requests">Browse trip requests</Link>
          </Button>
          <Link
            to="/trip-builder"
            className="group inline-flex items-center justify-center sm:justify-start text-[15px] text-[#0a2225]/70 hover:text-[#0a2225] transition-colors h-11 sm:h-auto"
          >
            Or package a new trip
            <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* How it works — two earning paths, editorial */}
      <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
        <p className="text-[12px] md:text-[12.5px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
          How Goldsainte works for creators
        </p>
        <h2 className="mt-3 font-secondary text-3xl md:text-4xl text-[#0a2225]">
          Three ways to earn
        </h2>

        <div className="mt-7 grid grid-cols-1 gap-y-10 gap-x-12 md:grid-cols-3">
          {earningPaths.map((path) => (
            <div key={path.n}>
              <p className="font-secondary text-2xl text-[#c7a962]">{path.n}</p>
              <h3 className="mt-2 font-secondary text-2xl text-[#0a2225]">
                {path.title}
              </h3>
              <div className="mt-4 space-y-3">
                {path.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-6 shrink-0 font-secondary text-base italic text-[#c7a962]">
                      {romans[i]}
                    </span>
                    <p className="text-[16px] leading-relaxed text-[#0a2225]/65">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* How you get paid */}
        <div className="mt-9 flex flex-col gap-6 border-t border-[#0a2225]/10 pt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div>
            <p className="text-[12px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
              How you get paid
            </p>
            <p className="mt-2.5 max-w-xl text-[16px] leading-relaxed text-[#0a2225]/65">
              You set your price — your costs and your margin are yours to
              build in. Travelers pay a 3.5% service fee on top; a matching
              3.5% platform fee comes out of your payout. That is
              Goldsainte&apos;s entire take: 7% total, flat, on every booking.
              Every payment is charged directly on your own Stripe account
              at booking.
            </p>
          </div>
          <div className="shrink-0 text-center">
            <p className="font-secondary text-3xl md:text-4xl text-[#0a2225]">
              7<span className="text-2xl">%</span>
            </p>
            <p className="mt-1.5 text-[12.5px] uppercase tracking-[0.2em] text-[#0a2225]/55">
              Total · 3.5 + 3.5
            </p>
          </div>
        </div>

        {/* New here — quiet guide signpost */}
        <div className="mt-7 flex flex-col gap-3 border-t border-[#0a2225]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[16px] text-[#0a2225]/60">
            <span className="mr-3.5 text-[12px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
              New here?
            </span>
            The full guide to proposals, payouts, and fees.
          </span>
          <Link
            to="/how-it-works/creator"
            className="shrink-0 text-[15px] text-[#0c4d47] underline underline-offset-4 decoration-[#0c4d47]/30 hover:decoration-[#0c4d47]"
          >
            Read the guide →
          </Link>
        </div>
      </section>

      {/* Open trip requests nudge */}
      {!loading && stats.openTripRequests > 0 && (
        <Link
          to="/marketplace?tab=trip-requests"
          className="flex items-center justify-between rounded-2xl border border-[#0a2225]/10 bg-white/70 px-6 py-4 hover:bg-white transition-colors"
        >
          <span className="text-[15px] text-[#0a2225]">
            <span className="font-secondary text-base">{stats.openTripRequests}</span>{" "}
            open trip request{stats.openTripRequests !== 1 ? "s" : ""} in the marketplace right now
          </span>
          <span className="text-[15px] text-[#0c4d47] font-medium">View all →</span>
        </Link>
      )}

      {/* Quiet stats — only once there's activity */}
      {hasActivity && (
        <section className="border-t border-[#0a2225]/10 pt-8 md:pt-10">
          <p className="text-[12px] uppercase tracking-[0.32em] text-[#0c4d47]/70 mb-5">
            Your studio, at a glance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
            {statItems.map((item) => (
              <div key={item.label}>
                <p className="font-secondary text-2xl md:text-3xl text-[#0a2225]">{item.value}</p>
                <p className="text-[12.5px] uppercase tracking-[0.2em] text-[#0a2225]/55 mt-1.5">
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
              <p className="text-[12px] uppercase tracking-[0.32em] text-[#0c4d47]/70">
                Latest activity
              </p>
              <h2 className="mt-2 font-secondary text-2xl text-[#0a2225]">Recent proposals</h2>
            </div>
            <Link
              to="/my-proposals"
              className="text-[15px] text-[#0c4d47] underline underline-offset-4 decoration-[#0c4d47]/30 hover:decoration-[#0c4d47]"
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
                  <p className="text-[13px] text-[#0a2225]/55 mt-1">
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
