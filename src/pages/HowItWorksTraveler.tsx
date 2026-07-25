import { Search, Send, MessageCircle, CreditCard, ShieldCheck, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HowItWorksTemplate, type HowItWorksStep } from "./HowItWorksTemplate";

// Approved copy (Jul 25, doc 93/A1 + counsel Part B). Two deliberate changes
// from the old page: (1) the client-agreement gate is named in the booking
// step — travelers review and accept the SPECIALIST'S OWN agreement before
// any deposit (B3); (2) unverifiable volume claims ("most travelers receive
// 3-5 proposals within 48 hours") are removed per B5 — the fact card states
// only what the platform enforces.
const STEPS: HowItWorksStep[] = [
  { number: "01", icon: Search, title: "Explore the marketplace", description: "Browse handpicked trips from certified specialists, bookable tours hosted by creators, and itinerary guides for planning on your own.", cta: { label: "Browse the marketplace", to: "/marketplace" } },
  { number: "02", icon: Send, title: "Post a trip request", description: "Describe your dream trip — dates, budget, style — and get matched with the right specialists for your brief.", cta: { label: "Post a trip", to: "/post-trip" } },
  { number: "03", icon: MessageCircle, title: "Compare real proposals", description: "Verified specialists respond with their own itinerary, their price, and their terms. Specialists are based around the world, so response times vary by time zone. Compare side by side and choose who to work with." },
  { number: "04", icon: CreditCard, title: "Review, agree, and book", description: "Before any deposit, you review and accept your specialist's own client agreement — their terms, presented up front. Then pay a deposit to confirm and the balance closer to departure, all through secure Stripe checkout.", cta: { label: "How payments work", to: "/help" } },
  { number: "05", icon: ShieldCheck, title: "Travel protected", description: "Every trip is designed and fulfilled by an independent, verified travel professional — with Goldsainte support behind every booking." },
  { number: "06", icon: Star, title: "Leave a review", description: "Help future travelers discover great specialists and creators by sharing your experience after your trip." },
];

export default function HowItWorksTraveler() {
  const { t } = useTranslation();
  return (
    <HowItWorksTemplate
      eyebrow={t('howItWorks.traveler.eyebrow', 'For Travelers')}
      title={t('howItWorks.traveler.title', 'Travel designed around you')}
      subtitle={t('howItWorks.traveler.subtitle', 'Verified specialists and creators who design and run their own trips, tours, and guides. You dream it — they build it, and you book securely through Stripe.')}
      steps={STEPS}
      factCard={{
        text: "Every specialist is verified before their first proposal, you accept their client agreement before any deposit is paid, and every payment runs through Stripe checkout.",
        icon: ShieldCheck,
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
