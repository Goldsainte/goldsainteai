import { Search, Send, MessageCircle, CreditCard, ShieldCheck, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HowItWorksTemplate, type HowItWorksStep } from "./HowItWorksTemplate";

// Approved copy (Jul 25, doc 93/A1 + counsel Part B). Two deliberate changes
// from the old page: (1) the client-agreement gate is named in the booking
// step — travelers review and accept the SPECIALIST'S OWN agreement before
// any deposit (B3); (2) unverifiable volume claims ("most travelers receive
// 3-5 proposals within 48 hours") are removed per B5 — the fact card states
// only what the platform enforces.
const getSteps = (t: (k: string, d?: string) => string): HowItWorksStep[] => [
  { number: "01", icon: Search, title: t("howItWorks.traveler.s1t", "Explore the marketplace"), description: t("howItWorks.traveler.s1d", "Browse handpicked trips from certified specialists, bookable tours hosted by creators, and itinerary guides for planning on your own."), cta: { label: t("howItWorks.traveler.s1c", "Browse the marketplace"), to: "/marketplace" } },
  { number: "02", icon: Send, title: t("howItWorks.traveler.s2t", "Post a trip request"), description: t("howItWorks.traveler.s2d", "Describe your dream trip — dates, budget, style — and get matched with the right specialists for your brief."), cta: { label: t("howItWorks.traveler.s2c", "Post a trip"), to: "/post-trip" } },
  { number: "03", icon: MessageCircle, title: t("howItWorks.traveler.s3t", "Compare real proposals"), description: t("howItWorks.traveler.s3d", "Verified specialists respond with their own itinerary, their price, and their terms. Specialists are based around the world, so response times vary by time zone. Compare side by side and choose who to work with.") },
  { number: "04", icon: CreditCard, title: t("howItWorks.traveler.s4t", "Review, agree, and book"), description: t("howItWorks.traveler.s4d", "Before any deposit, you review and accept your specialist's own client agreement — their terms, presented up front. Then pay a deposit to confirm and the balance closer to departure, all through secure Stripe checkout."), cta: { label: t("howItWorks.traveler.s4c", "How payments work"), to: "/help" } },
  { number: "05", icon: ShieldCheck, title: t("howItWorks.traveler.s5t", "Travel protected"), description: t("howItWorks.traveler.s5d", "Every trip is designed and fulfilled by an independent, verified travel professional — with Goldsainte support behind every booking.") },
  { number: "06", icon: Star, title: t("howItWorks.traveler.s6t", "Leave a review"), description: t("howItWorks.traveler.s6d", "Help future travelers discover great specialists and creators by sharing your experience after your trip.") },
];

export default function HowItWorksTraveler() {
  const { t } = useTranslation();
  return (
    <HowItWorksTemplate
      eyebrow={t('howItWorks.traveler.eyebrow', 'For Travelers')}
      title={t('howItWorks.traveler.title', 'Travel designed around you')}
      subtitle={t('howItWorks.traveler.subtitle', 'Verified specialists and creators who design and run their own trips, tours, and guides. You dream it — they build it, and you book securely through Stripe.')}
      steps={getSteps(t)}
      factCard={{
        text: t("howItWorks.traveler.fact", "Every specialist is verified before their first proposal, you accept their client agreement before any deposit is paid, and every payment runs through Stripe checkout."),
        icon: ShieldCheck,
      }}
      finalCta={{
        heading: t("howItWorks.traveler.ctaH", "Ready to begin?"),
        description: t("howItWorks.traveler.ctaD", "Post your first trip request and start receiving proposals from verified specialists."),
        label: t("howItWorks.traveler.ctaL", "Post a Trip"),
        to: "/post-trip",
      }}
    />
  );
}
