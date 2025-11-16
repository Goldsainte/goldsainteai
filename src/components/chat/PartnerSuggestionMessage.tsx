// src/components/chat/PartnerSuggestionMessage.tsx
import { ArrowRight, Sparkles } from "lucide-react";

type PartnerSuggestionProps = {
  creatorCount: number;
  agentCount: number;
  onInvite: () => void;
};

export function PartnerSuggestionMessage({
  creatorCount,
  agentCount,
  onInvite,
}: PartnerSuggestionProps) {
  return (
    <div className="max-w-sm rounded-3xl bg-[#f7f3ea] border border-[#E5DFC6] px-3 py-3 text-[11px] space-y-2">
      <div className="flex items-center gap-2">
        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0c4d47]">
          <Sparkles className="h-3 w-3 text-[#E5DFC6]" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
          Goldsainte suggestion
        </p>
      </div>
      <p className="text-[11px] text-[#4a4a4a]">
        Based on what you've shared, I can invite{" "}
        <span className="font-semibold">{creatorCount}</span> creators and{" "}
        <span className="font-semibold">{agentCount}</span> travel agents who
        fit this trip to send proposals.
      </p>
      <button
        type="button"
        onClick={onInvite}
        className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3 py-1.5 text-[10px] font-semibold hover:bg-[#073331]"
      >
        Yes, invite them
        <ArrowRight className="h-3 w-3" />
      </button>
      <p className="text-[9px] text-[#8D8D8D]">
        We only invite partners who match your destination, budget and style.
        They&apos;ll reply here with proposals — no off-platform DMs.
      </p>
    </div>
  );
}
