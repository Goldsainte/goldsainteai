// src/components/bookings/PayoutStatusCard.tsx
type PayoutStatus = "not_eligible" | "pending" | "partial" | "paid" | "on_hold";

type Props = {
  payoutStatus: PayoutStatus;
  nextPayoutDate?: string | null;
};

export function PayoutStatusCard({ payoutStatus, nextPayoutDate }: Props) {
  const { label, description } = mapPayoutStatus(payoutStatus, nextPayoutDate);

  return (
    <div className="rounded-2xl bg-white/95 border border-[#E5DFC6] p-3 text-[11px] space-y-1.5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
        Payout status
      </p>
      <p className="text-[12px] font-semibold text-[#0a2225]">{label}</p>
      <p className="text-[10px] text-[#4a4a4a]">{description}</p>
    </div>
  );
}

function mapPayoutStatus(status: PayoutStatus, nextPayoutDate?: string | null) {
  switch (status) {
    case "not_eligible":
      return {
        label: "Not yet eligible",
        description:
          "Once the traveler's payment is received and your trip passes the protected window, this booking becomes eligible for payout.",
      };
    case "pending":
      return {
        label: "Scheduled for payout",
        description: nextPayoutDate
          ? `This booking is queued. Payout is expected around ${new Date(
              nextPayoutDate
            ).toLocaleDateString()} depending on your bank and payout settings.`
          : "This booking is queued for your next payout cycle based on our standard schedule.",
      };
    case "partial":
      return {
        label: "Partially paid",
        description:
          "Some of this booking has been paid out (for example, deposit or first stage). Remaining amounts will follow once conditions are met.",
      };
    case "paid":
      return {
        label: "Paid",
        description:
          "Funds for this booking have been released. Check your payout history for exact dates and amounts.",
      };
    case "on_hold":
      return {
        label: "On hold",
        description:
          "We're temporarily holding payout while we review a question or dispute related to this booking. We'll share updates by email and in your account.",
      };
    default:
      return {
        label: status,
        description: "",
      };
  }
}
