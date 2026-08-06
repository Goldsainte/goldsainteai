import { FileText, ShieldCheck, CreditCard, FileSignature, Plane, Inbox, HandCoins, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HowItWorksTemplate, type HowItWorksStep } from "./HowItWorksTemplate";
import { CurrenciesAndPayouts } from "@/components/onboarding/CurrenciesAndPayouts";

// Approved copy (Jul 25, doc 93/A3 + counsel Part B). Adds the client-agreement
// step (B3: agents upload their OWN agreement; travelers must open, acknowledge,
// and sign it before the deposit unlocks — Goldsainte authors nothing and links
// out to industry bodies like ASTA for templates). Adds tipping. Removes the
// unsubstantiated "disputes mediated within 7 business days" SLA per B5 — the
// fact card states only what the platform enforces.
const getSteps = (t: (k: string, d?: string) => string): HowItWorksStep[] => [
  { number: "01", icon: FileText, title: t("howItWorks.agent.s1t", "Complete your application"), description: t("howItWorks.agent.s1d", "Submit your agency information, credentials and supporting documents for review."), cta: { label: t("howItWorks.agent.s1c", "Apply now"), to: "/auth?mode=signup&role=agent" } },
  { number: "02", icon: ShieldCheck, title: t("howItWorks.agent.s2t", "Verify your identity"), description: t("howItWorks.agent.s2d", "Every specialist is verified before their first proposal — travelers see the badge, and verification unlocks publishing.") },
  { number: "03", icon: CreditCard, title: t("howItWorks.agent.s3t", "Connect Stripe Connect"), description: t("howItWorks.agent.s3d", "Activate your own Stripe account. Deposits and balances split automatically: traveler pays, Stripe routes your share to you and the flat 7% platform fee to Goldsainte."), cta: { label: t("howItWorks.agent.s3c", "Set up payouts"), to: "/agent-dashboard?tab=payouts" } },
  { number: "04", icon: FileSignature, title: t("howItWorks.agent.s4t", "Upload your client agreement"), description: t("howItWorks.agent.s4d", "Travelers must open, acknowledge, and sign your agreement before the deposit button unlocks — your terms, presented and enforced at checkout. Need a template? Industry bodies like ASTA publish them; we link out, we don't supply legal documents."), cta: { label: t("howItWorks.agent.s4c", "Upload agreement"), to: "/agent-settings" } },
  { number: "05", icon: Plane, title: t("howItWorks.agent.s5t", "Publish your first trip"), description: t("howItWorks.agent.s5d", "Build a complete listing — itinerary, pricing, inclusions, and your own cancellation and refund terms — and submit for review."), cta: { label: t("howItWorks.agent.s5c", "Open Trip Builder"), to: "/trip-builder" } },
  { number: "06", icon: Inbox, title: t("howItWorks.agent.s6t", "Work live trip requests"), description: t("howItWorks.agent.s6d", "Pick up real travel briefs and respond with tailored proposals — most specialists run marketplace listings and requests side by side, all managed from your dashboard."), cta: { label: t("howItWorks.agent.s6c", "View requests"), to: "/marketplace?tab=trip-requests" } },
  { number: "07", icon: HandCoins, title: t("howItWorks.agent.s7t", "Get paid — and tipped"), description: t("howItWorks.agent.s7d", "Payments land in your own Stripe account the moment your client pays — deposits and balances alike. And clients can tip you directly from your profile and their bookings; great service gets rewarded.") },
];

export default function HowItWorksAgent() {
  const { t } = useTranslation();
  return (
    <HowItWorksTemplate
      eyebrow={t('howItWorks.agent.eyebrow', 'For Travel Agents')}
      title={t('howItWorks.agent.title', 'Your agency, amplified')}
      subtitle={t('howItWorks.agent.subtitle', 'Bring your expertise — Goldsainte brings the demand, the tooling, and secure Stripe checkout. Your brand, your agreement, your terms, for a flat 7%.')}
      steps={getSteps(t)}
      factCard={{
        text: t("howItWorks.agent.fact", "The platform fee is a flat 7% — 3.5% traveler-side plus 3.5% from your payout, verified to the cent. Travelers accept your own client agreement before any deposit, and payments settle straight to your own Stripe account at booking."),
        icon: Shield,
      }}
      extraSection={<CurrenciesAndPayouts />}
      finalCta={{
        heading: t("howItWorks.agent.ctaH", "Apply to join Goldsainte"),
        description: t("howItWorks.agent.ctaD", "Verified specialists earn from curated trips, live trip requests, and tips."),
        label: t("howItWorks.agent.ctaL", "Start your application"),
        to: "/auth?mode=signup&role=agent",
      }}
    />
  );
}
