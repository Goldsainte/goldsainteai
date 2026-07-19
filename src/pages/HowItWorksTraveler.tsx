import { Search, Send, MessageCircle, CreditCard, ShieldCheck, Star, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HowItWorksTemplate, type HowItWorksStep } from "./HowItWorksTemplate";

const STEPS: HowItWorksStep[] = [
  { number: "01", icon: Search, title: "Browse the marketplace", description: "Explore curated trip packages from certified travel agents and creators across every region and style.", cta: { label: "Browse trips", to: "/marketplace" } },
  { number: "02", icon: Send, title: "Post a trip request", description: "Describe your dream trip — dates, budget, style — and our AI matches you with the right specialists in minutes.", cta: { label: "Post a trip", to: "/post-trip" } },
  { number: "03", icon: MessageCircle, title: "Get matched proposals", description: "Verified specialists send custom plans tailored to your brief. Most proposals arrive within 24-48 hours — specialists are based around the world, so response times vary by time zone. Compare itineraries, pricing and reviews side by side." },
  { number: "04", icon: CreditCard, title: "Review and book", description: "Pay a deposit to confirm and the balance closer to departure. All payments stay on-platform for your protection.", cta: { label: "How payments work", to: "/help" } },
  { number: "05", icon: ShieldCheck, title: "Travel protected", description: "You pay your vetted specialist directly through secure Stripe checkout — with Goldsainte support behind every booking." },
  { number: "06", icon: Star, title: "Leave a review", description: "Help future travelers discover great specialists by sharing your experience after your trip." },
];

export default function HowItWorksTraveler() {
  const { t } = useTranslation();
  return (
    <HowItWorksTemplate
      eyebrow={t('howItWorks.traveler.eyebrow', 'For Travelers')}
      title={t('howItWorks.traveler.title', 'How Goldsainte works')}
      subtitle={t('howItWorks.traveler.subtitle', 'Your private studio for designing extraordinary travel — from inspiration to confirmation.')}
      steps={STEPS}
      factCard={{
        text: "Most travelers receive 3-5 proposals within 48 hours of posting a trip request.",
        icon: Clock,
      }}
      finalCta={{
        heading: "Ready to begin?",
        description: "Post your first trip request and start receiving proposals from verified specialists.",
        label: "Post a Trip",
        to: "/post-trip",
      }}
    />
  );
}
