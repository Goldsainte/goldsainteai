import { CreatorProposalsTab } from "@/pages/creator/components/CreatorProposalsTab";

// /my-proposals — header cloned from the traveler journeys page pattern:
// gold eyebrow, display serif headline, right-aligned descriptor.
export default function MyProposalsPage() {
  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#8D6B2F]">
              Your pipeline
            </p>
            <h1 className="mt-2 font-secondary text-[40px] leading-[1.05] text-[#0a2225] md:text-6xl">
              My Proposals
            </h1>
          </div>
          <p className="max-w-xs text-[14px] leading-relaxed text-[#0a2225]/60 md:text-right">
            Every proposal you've sent — and where each one stands.
          </p>
        </div>
        <div className="mt-10">
          <CreatorProposalsTab />
        </div>
      </div>
    </div>
  );
}
