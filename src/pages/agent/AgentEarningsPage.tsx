import { PartnerEarningsView } from "@/components/earnings/PartnerEarningsView";

export default function AgentEarningsPage() {
  return (
    <PartnerEarningsView
      role="agent"
      title="Agent earnings overview"
      intro="Track how your itinerary work converts into payouts. Goldsainte holds funds in escrow until each release milestone clears."
      backLink="/agent-dashboard"
      backLabel="Back to agent tools"
    />
  );
}
