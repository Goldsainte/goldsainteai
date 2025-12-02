import { AlertCircle, Check, X, Shield } from "lucide-react";

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
            className="rounded-xl border border-[#E5DFC6] p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                idx === 0 ? "bg-emerald-100" : idx === 1 ? "bg-amber-100" : "bg-red-100"
              }`}>
                {idx === 0 ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : idx === 1 ? (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-[#0a2225]">{tier.status}</p>
                <p className={`text-sm font-semibold ${
                  idx === 0 ? "text-emerald-600" : idx === 1 ? "text-amber-600" : "text-red-600"
                }`}>
                  {tier.refund}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#6B7280]">{tier.description}</p>
          </div>
        ))}
      </div>

      {/* Insurance Recommendation */}
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#0C4D47]/10 p-4">
        <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0C4D47]" />
        <div>
          <p className="font-medium text-[#0a2225]">
            Highly Recommended: Protect Your Adventure
          </p>
          <p className="mt-1 text-sm text-[#4a4a4a]">
            We strongly encourage purchasing travel insurance with trip cancellation coverage to safeguard your investment. With travel insurance, you're covered in case of unexpected events—from illness to emergencies—that could affect your plans.
          </p>
        </div>
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
