// src/components/trips/TripPoliciesPanel.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface ProposalPolicyDetails {
  cancellationPolicyName?: string | null;
  customCancellationTerms?: string | null;
  depositPercentage?: number | null;
  depositDueDays?: number | null;
}

interface TripPoliciesPanelProps {
  bookingStatus: string;
  proposalPolicies?: ProposalPolicyDetails | null;
}

export function TripPoliciesPanel({
  bookingStatus,
  proposalPolicies,
}: TripPoliciesPanelProps) {
  const {
    cancellationPolicyName,
    customCancellationTerms,
    depositPercentage,
    depositDueDays,
  } = proposalPolicies || {};

  const statusLabel = bookingStatus || "Unknown";

  return (
    <Card className="border border-[#E5DFC6]">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" />
          Policies
        </CardTitle>
        <p className="text-[11px] text-[#8D8D8D]">
          A snapshot of how cancellation, refunds, and deposit terms apply to this booking.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-xs text-[#4a4a4a]">
        {/* Goldsainte marketplace role */}
        <div className="space-y-1.5">
          <p className="font-medium text-[#0a2225] text-[11px]">
            Goldsainte as a marketplace
          </p>
          <p>
            Goldsainte connects you with independent travel professionals and suppliers.
            Your contract for travel services is with them, not with Goldsainte. We are
            not the airline, hotel, or tour operator for this trip.
          </p>
          <p>
            For the full marketplace, cancellation, and refund framework, see our{" "}
            <Link
              to="/cancellation-refund-policy"
              target="_blank"
              className="underline underline-offset-2"
            >
              Cancellation &amp; Refund Policy
            </Link>
            .
          </p>
        </div>

        {/* Booking status contextual note */}
        <div className="space-y-1.5">
          <p className="font-medium text-[#0a2225] text-[11px]">
            Booking status
          </p>
          <p>Current status: <span className="font-semibold">{statusLabel}</span>.</p>
          <p>
            Cancellation and refund options depend on supplier rules and the travel
            professional&apos;s policy at the time you request any changes.
          </p>
        </div>

        {/* Per-proposal terms if present */}
        {(cancellationPolicyName ||
          customCancellationTerms ||
          depositPercentage != null ||
          depositDueDays != null) && (
          <div className="space-y-2 rounded-lg border border-dashed border-[#E5DFC6] bg-[#f7f3ea]/40 px-3 py-3">
            <p className="flex items-center gap-1 text-[11px] font-semibold text-[#0a2225]">
              <Info className="h-3 w-3" />
              Trip-specific terms from your travel professional
            </p>

            {cancellationPolicyName && (
              <div className="space-y-0.5">
                <p className="font-medium text-[11px] text-[#0a2225]">
                  Cancellation policy
                </p>
                <p>{cancellationPolicyName}</p>
              </div>
            )}

            {depositPercentage != null && (
              <div className="space-y-0.5">
                <p className="font-medium text-[11px] text-[#0a2225]">
                  Deposit
                </p>
                <p>
                  {depositPercentage}% of the total trip cost is due as a deposit
                  {depositDueDays != null
                    ? ` within ${depositDueDays} day(s) of acceptance.`
                    : "."}
                </p>
              </div>
            )}

            {customCancellationTerms && (
              <div className="space-y-0.5">
                <p className="font-medium text-[11px] text-[#0a2225]">
                  Additional terms
                </p>
                <p className="whitespace-pre-line">
                  {customCancellationTerms}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Fallback if we don't yet have per-proposal data */}
        {!cancellationPolicyName &&
          !customCancellationTerms &&
          depositPercentage == null &&
          depositDueDays == null && (
            <p className="text-[11px] text-[#8D8D8D]">
              This booking may rely on supplier and travel professional policies that aren&apos;t
              fully surfaced here yet. If you have questions, please message your travel
              professional directly from this page.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
