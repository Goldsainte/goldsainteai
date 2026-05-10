import { Link } from "react-router-dom";
import { Search, BookOpen, Plus } from "lucide-react";
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

  const statItems = [
    { label: "Active Proposals", value: loading ? "—" : stats.activeProposals.toString() },
    { label: "Accepted", value: loading ? "—" : stats.acceptedProposals.toString() },
    { label: "Total Sent", value: loading ? "—" : stats.totalProposalsSent.toString() },
    { label: "Response Rate", value: loading ? "—" : `${stats.responseRate}%` },
    { label: "Total Earnings", value: loading ? "—" : fmt(stats.totalEarnings) },
    { label: "Pending", value: loading ? "—" : fmt(stats.pendingEarnings) },
    { label: "Guide Sales", value: loading ? "—" : stats.guideSales.toString() },
    { label: "Guide Revenue", value: loading ? "—" : fmt(stats.guideRevenue) },
  ];

  return (
    <div className="space-y-10">
      {/* Editorial Stat Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 bg-white border border-[#E5DFC6] rounded-2xl overflow-hidden">
        {statItems.map((item, i) => (
          <div
            key={item.label}
            className={`p-5 md:p-6 text-center ${
              i < statItems.length - 1 ? "border-b md:border-b-0 md:border-r border-[#E5DFC6]" : ""
            } ${i % 2 !== 0 && i < statItems.length - 1 ? "border-r-0 md:border-r" : ""}`}
          >
            <p className="font-secondary text-2xl md:text-3xl text-[#0a2225]">{item.value}</p>
            <p className="text-xs uppercase tracking-[0.15em] text-[#6B7280] mt-2 font-medium">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* Storyboard Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/storyboards/new"
          className="group flex items-center gap-4 rounded-2xl border border-[#E5DFC6] bg-white px-6 py-5 hover:border-[#C7A962]/50 hover:shadow-sm transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c4d47]/10 text-[#0c4d47] group-hover:bg-[#0c4d47] group-hover:text-white transition-colors">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#0a2225]">Create Storyboard</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Build an itinerary to showcase or share</p>
          </div>
        </Link>
        <Link
          to="/storyboards"
          className="group flex items-center gap-4 rounded-2xl border border-[#E5DFC6] bg-white px-6 py-5 hover:border-[#C7A962]/50 hover:shadow-sm transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C7A962]/10 text-[#C7A962] group-hover:bg-[#C7A962] group-hover:text-white transition-colors">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#0a2225]">My Storyboards</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Manage and publish your trip boards</p>
          </div>
        </Link>
      </div>

      {/* Open Trip Requests Banner */}
      {!loading && stats.openTripRequests > 0 && (
        <Link
          to="/marketplace?tab=trip-requests"
          className="flex items-center justify-between rounded-2xl border border-[#C7A962]/30 bg-[#C7A962]/5 px-6 py-4 hover:bg-[#C7A962]/10 transition-colors"
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

      {/* Recent Proposals */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-secondary text-2xl text-[#0a2225]">Recent Proposals</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Your latest bids on trip requests</p>
          </div>
          <Link
            to="/my-proposals"
            className="text-sm font-medium text-[#C7A962] hover:text-[#B39952] transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="bg-white border border-[#E5DFC6] rounded-2xl overflow-hidden divide-y divide-[#E5DFC6]">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#6B7280]">Loading your proposals...</p>
            </div>
          ) : stats.recentProposals.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="font-secondary text-xl text-[#0a2225]">Your creator journey starts here</h3>
              <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
                Post your first trip package or create a digital itinerary guide to start earning.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-5">
                <Link
                  to="/trip-builder"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#0a3d39] transition-colors"
                >
                  <Plus className="h-4 w-4" /> Create a Trip
                </Link>
                <Link
                  to="/itinerary-builder"
                  className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white text-[#0a2225] px-5 py-2.5 text-sm font-medium hover:bg-[#FDF9F0] transition-colors"
                >
                  <BookOpen className="h-4 w-4" /> Sell a Guide
                </Link>
                {stats.openTripRequests > 0 && (
                  <Link
                    to="/marketplace"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0a2225]/90 transition-colors"
                  >
                    <Search className="h-4 w-4" /> Browse Trip Requests
                  </Link>
                )}
              </div>
            </div>
          ) : (
            stats.recentProposals.map((proposal) => (
              <Link
                key={proposal.id}
                to={`/marketplace/request/${proposal.tripRequestId}`}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-[#FDF9F0] transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-0.5 h-8 rounded-full bg-[#C7A962] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#0a2225] truncate">{proposal.tripTitle}</h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      {proposal.destination} ·{" "}
                      {new Date(proposal.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <ProposalStatusBadge status={proposal.status} />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
