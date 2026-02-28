import { Link } from "react-router-dom";

export function CreatorProposalsTab() {
  return (
    <div className="bg-white border border-[#E5DFC6] rounded-2xl p-8 md:p-12 text-center">
      <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">All Proposals</h2>
      <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-6">
        View and manage every proposal you've submitted to travelers.
      </p>
      <Link
        to="/my-proposals"
        className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] px-6 py-3 text-sm font-medium text-white hover:bg-[#0a2225]/90 transition-colors"
      >
        View My Proposals
      </Link>
    </div>
  );
}
