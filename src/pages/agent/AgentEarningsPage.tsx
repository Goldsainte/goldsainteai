import { PartnerEarningsView } from "@/components/earnings/PartnerEarningsView";

export default function AgentEarningsPage() {
  return (
    <PartnerEarningsView
      role="agent"
      title="Agent earnings overview"
      intro="Track how your itinerary work converts into revenue. Payments are charged directly on your own Stripe account at booking."
      backLink="/agent-dashboard"
      backLabel="Back to agent tools"
    />
  );
}
