import { FileText, ShieldCheck, CreditCard, Plane, Inbox, Briefcase, DollarSign, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HowItWorksTemplate, type HowItWorksStep } from "./HowItWorksTemplate";
import { CurrenciesAndPayouts } from "@/components/onboarding/CurrenciesAndPayouts";

const STEPS: HowItWorksStep[] = [
  { number: "01", icon: FileText, title: "Complete your application", description: "Submit your agency information, credentials and supporting documents for review.", cta: { label: "Apply now", to: "/auth?mode=signup&role=agent" } },
  { number: "02", icon: ShieldCheck, title: "Verify your identity", description: "Stripe Identity verification keeps the marketplace trusted and unlocks publishing." },
  { number: "03", icon: CreditCard, title: "Connect Stripe Connect", description: "Activate your own Stripe account — traveler payments settle directly to your bank.", cta: { label: "Set up payouts", to: "/agent-dashboard?tab=payouts" } },
  { number: "04", icon: Plane, title: "Publish your first trip", description: "Build a complete listing — itinerary, pricing, inclusions and cancellation terms — and submit for review.", cta: { label: "Open Trip Builder", to: "/trip-builder" } },
  { number: "05", icon: Inbox, title: "Browse trip requests", description: "Pick up live travel briefs from real travelers and submit a tailored proposal.", cta: { label: "View requests", to: "/marketplace?tab=trip-requests" } },
  { number: "06", icon: Briefcase, title: "Manage bookings", description: "Accept, decline and track every booking, message and milestone from your dashboard." },
  { number: "07", icon: DollarSign, title: "Get paid at booking", description: "Payments land in your own Stripe account the moment your client pays — deposits and balances alike." },
];

export default function HowItWorksAgent() {
  const { t } = useTranslation();
  return (
    <HowItWorksTemplate
      eyebrow={t('howItWorks.agent.eyebrow', 'For Travel Agents')}
      title={t('howItWorks.agent.title', 'A modern marketplace for specialists')}
      subtitle={t('howItWorks.agent.subtitle', 'Win new clients, run trips end-to-end and get paid securely — all in one platform.')}
      steps={STEPS}
      factCard={{
        text: "Traveler payments settle straight to your own Stripe account at booking. Disputes are mediated by Goldsainte support within 7 business days.",
        icon: Shield,
      }}
      extraSection={<CurrenciesAndPayouts />}
      finalCta={{
        heading: "Apply to join Goldsainte",
        description: "Verified specialists earn from curated trips and live trip requests.",
        label: "Start your application",
        to: "/auth?mode=signup&role=agent",
      }}
    />
  );
}
