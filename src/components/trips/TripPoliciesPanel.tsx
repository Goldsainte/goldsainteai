// src/components/trips/TripPoliciesPanel.tsx
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

function humanStatus(status: string) {
  switch (status) {
    case "payment_pending":
      return "awaiting payment";
    case "confirmed":
      return "confirmed";
    case "paid_in_full":
      return "paid in full";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return status.replace(/_/g, " ");
  }
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

  const hasProposalTerms =
    cancellationPolicyName ||
    customCancellationTerms ||
    depositPercentage != null ||
    depositDueDays != null;

  return (
    <div className="space-y-6 text-sm text-[#0a2225]/80 leading-relaxed">
      <p>
        Your travel professional builds and delivers this trip. Goldsainte holds
        the booking, the payment, and the record — so we can step in if
        something doesn&apos;t go to plan. We are not the airline, hotel, or
        tour operator.
      </p>

      <p>
        This booking is currently{" "}
        <span className="font-medium text-[#0a2225]">
          {humanStatus(bookingStatus)}
        </span>
        . Cancellation and refund options follow your travel professional&apos;s
        policy — message them directly from this page with any questions.
      </p>

      {hasProposalTerms && (
        <div className="space-y-4 border-t border-[#E5DFC6] pt-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8D6B2F]">
            Trip-specific terms
          </p>

          {cancellationPolicyName && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#0a2225]/60">
                Cancellation policy
              </p>
              <p>{cancellationPolicyName}</p>
            </div>
          )}

          {depositPercentage != null && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#0a2225]/60">
                Deposit
              </p>
              <p>
                {depositPercentage}% of the trip total is due as a deposit
                {depositDueDays != null
                  ? ` within ${depositDueDays} day(s) of acceptance.`
                  : "."}
              </p>
            </div>
          )}

          {customCancellationTerms && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#0a2225]/60">
                Additional terms
              </p>
              <p className="whitespace-pre-line">{customCancellationTerms}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#E5DFC6] pt-6 text-[12px]">
        <Link
          to="/community-guidelines"
          target="_blank"
          className="underline underline-offset-4 text-[#0a2225] hover:text-[#8D6B2F] transition-colors"
        >
          Community guidelines
        </Link>
        <Link
          to="/cancellation-refund-policy"
          target="_blank"
          className="underline underline-offset-4 text-[#0a2225] hover:text-[#8D6B2F] transition-colors"
        >
          Cancellation &amp; refund policy
        </Link>
      </div>
    </div>
  );
}
