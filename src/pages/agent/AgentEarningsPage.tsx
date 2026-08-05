import { useTranslation } from "react-i18next";
import { PartnerEarningsView } from "@/components/earnings/PartnerEarningsView";

export default function AgentEarningsPage() {
  const { t } = useTranslation();
  return (
    <PartnerEarningsView
      role="agent"
      title={t("dash.a.earningsTitle", "Agent earnings overview")}
      intro={t("dash.a.earningsIntro", "Track how your itinerary work converts into revenue. Payments are charged directly on your own Stripe account at booking.")}
      backLink="/agent-dashboard"
      backLabel={t("dash.a.backToAgentTools", "Back to agent tools")}
    />
  );
}
