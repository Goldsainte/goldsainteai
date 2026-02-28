import { PartnerEarningsView } from "@/components/earnings/PartnerEarningsView";

export function CreatorEarningsTab() {
  return (
    <PartnerEarningsView
      role="creator"
      title="Your Earnings"
      intro="Track commissions from bookings, packages, and affiliate revenue."
      backLink="/creator-dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
