import { Award } from "lucide-react";

export type CreatorTier = "bronze" | "silver" | "gold" | "platinum";

const TIER_META: Record<CreatorTier, { label: string; bg: string; fg: string; ring: string }> = {
  bronze:   { label: "Bronze",   bg: "bg-[#F4E5D6]", fg: "text-[#7A4A1A]", ring: "ring-[#C28A4A]/30" },
  silver:   { label: "Silver",   bg: "bg-[#ECECEC]", fg: "text-[#4A4A4A]", ring: "ring-[#A0A0A0]/30" },
  gold:     { label: "Gold",     bg: "bg-[#F7EBC4]", fg: "text-[#8A6A1A]", ring: "ring-[#C7A962]/40" },
  platinum: { label: "Platinum", bg: "bg-[#E6F0EE]", fg: "text-[#0c4d47]", ring: "ring-[#0c4d47]/30" },
};

export const TIER_COMMISSION: Record<CreatorTier, number> = {
  bronze: 15,
  silver: 12,
  gold: 10,
  platinum: 8,
};

interface TierBadgeProps {
  tier?: CreatorTier | string | null;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function TierBadge({ tier, size = "sm", showIcon = true, className = "" }: TierBadgeProps) {
  const safeTier = (tier && (tier in TIER_META) ? tier : "bronze") as CreatorTier;
  const meta = TIER_META[safeTier];
  const sizeCls = size === "md" ? "text-[11px] px-2.5 py-1" : "text-[10px] px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium uppercase tracking-wider ring-1 ${meta.bg} ${meta.fg} ${meta.ring} ${sizeCls} ${className}`}
      title={`${meta.label} creator — ${TIER_COMMISSION[safeTier]}% commission`}
    >
      {showIcon && <Award className="h-3 w-3" />}
      {meta.label}
    </span>
  );
}

export function TierBenefitsCard({ tier }: { tier?: CreatorTier | string | null }) {
  const safeTier = (tier && (tier in TIER_META) ? tier : "bronze") as CreatorTier;
  const tiers: CreatorTier[] = ["bronze", "silver", "gold", "platinum"];
  const thresholds: Record<CreatorTier, number> = { bronze: 0, silver: 10, gold: 50, platinum: 200 };
  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-[#FDF9F0] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#7A7151]">Your tier</p>
          <div className="mt-1 flex items-center gap-2">
            <TierBadge tier={safeTier} size="md" />
            <span className="text-sm text-[#0a2225]">{TIER_COMMISSION[safeTier]}% commission</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {tiers.map((t) => (
          <div
            key={t}
            className={`rounded-xl border p-3 ${t === safeTier ? "border-[#0c4d47] bg-white" : "border-[#E5DFC6]/70 bg-white/50"}`}
          >
            <TierBadge tier={t} size="sm" />
            <p className="mt-2 text-[12px] text-[#0a2225]">{TIER_COMMISSION[t]}% commission</p>
            <p className="text-[11px] text-[#7A7151]">{thresholds[t]}+ sales</p>
            {t === "platinum" && (
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[#C7A962]">+ Featured placement</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}