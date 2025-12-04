import { PartnerEarningsView } from "@/components/earnings/PartnerEarningsView";

export default function TikTokEarningsPage() {
  return (
    <PartnerEarningsView
      role="creator"
      title="Creator earnings overview"
      intro="See how your storyboards and trip briefs convert into payouts. We keep traveler funds in escrow until their milestone releases."
      backLink="/tiktok-lab"
      backLabel="Back to Creator Studio"
    />
  );
}
