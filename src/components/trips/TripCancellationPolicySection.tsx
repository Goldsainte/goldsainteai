interface CancellationTier {
  status: string;
  refund: string;
  description: string;
}

interface TripCancellationPolicySectionProps {
  tiers?: CancellationTier[];
}

const DEFAULT_TIERS: CancellationTier[] = [
  {
    status: "Spot Pending",
    refund: "100% refundable",
    description: "Not confirmed yet? No worries. You can cancel at any time for a full refund.",
  },
  {
    status: "91+ Days Before Trip",
    refund: "Partially refundable + credit",
    description: "You'll receive a future trip credit for the amount of your down payment (minus a $100 cancellation fee per Traveler). Additionally, any payments made beyond the original 25% down payment will be refunded.",
  },
  {
    status: "90 or Fewer Days Before Trip",
    refund: "Non-refundable",
    description: "At this point, all payments are non-refundable because your experience is already in motion behind the scenes.",
  },
];

const TIER_COLORS = [
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-red-500",
];

const TIER_TEXT_COLORS = [
  "text-emerald-600",
  "text-amber-600",
  "text-red-600",
];

export function TripCancellationPolicySection({ tiers = DEFAULT_TIERS }: TripCancellationPolicySectionProps) {
  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
        Cancellation Policy
      </h2>
      <p className="mt-1 text-sm text-[#6B7280]">
        We get it—life happens. Here's how cancellations work:
      </p>

      <div className="mt-6 space-y-4">
        {tiers.map((tier, idx) => (
          <div
            key={tier.status}
            className={`rounded-xl border border-[#E5DFC6] border-l-4 ${TIER_COLORS[idx] || TIER_COLORS[2]} p-4`}
          >
            <p className="font-medium text-[#0a2225]">{tier.status}</p>
            <p className={`text-sm font-semibold ${TIER_TEXT_COLORS[idx] || TIER_TEXT_COLORS[2]}`}>
              {tier.refund}
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">{tier.description}</p>
          </div>
        ))}
      </div>

      {/* Insurance Recommendation */}
      <div className="mt-6 rounded-xl border border-[#E5DFC6] bg-[#FDF9F0] p-4">
        <p className="font-medium text-[#0a2225]">
          Highly Recommended: Protect Your Adventure
        </p>
        <p className="mt-1 text-sm text-[#4a4a4a]">
          We strongly encourage purchasing travel insurance with trip cancellation coverage to safeguard your investment. With travel insurance, you're covered in case of unexpected events—from illness to emergencies—that could affect your plans.
        </p>
      </div>

      <a
        href="/cancellation-refund-policy"
        className="mt-4 inline-block text-sm font-medium text-[#0C4D47] hover:underline"
      >
        View full Terms & Conditions →
      </a>
    </section>
  );
}
