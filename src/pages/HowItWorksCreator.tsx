import { UserCircle, Camera, CreditCard, Store, Briefcase, HandCoins, Share2, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HowItWorksTemplate, type HowItWorksStep } from "./HowItWorksTemplate";
import { CurrenciesAndPayouts } from "@/components/onboarding/CurrenciesAndPayouts";

// STOREFRONT COPY (approved Jul 25, doc 93/A2 + counsel Part B) — creators earn
// six ways: tours, itinerary guides, services, on-trip day rate, affiliate
// links, and tips. Product law: creators sell TOURS (never "trips" for their
// own hosted product). Services have no direct checkout — hire requests land
// in the dashboard and settle through the proposal → Stripe flow, so the copy
// says exactly that.
const STEPS: HowItWorksStep[] = [
  { number: "01", icon: UserCircle, title: "Complete your creator profile", description: "Your face, your story, your cities. This is the storefront window — it's what travelers see before they book anything.", cta: { label: "Complete profile", to: "/onboarding/creator" } },
  { number: "02", icon: Camera, title: "Add photos & video", description: "Real photos convert. Show the places you actually go — travelers buy the proof, not the promise.", cta: { label: "Add media", to: "/profile/media" } },
  { number: "03", icon: CreditCard, title: "Connect your payout account", description: "One Stripe connection powers your storefront. Tour, guide, and tip payments are charged directly on your own Stripe account — you're the seller of record, and Goldsainte's flat 7% comes out automatically.", cta: { label: "Set up payouts", to: "/creator-dashboard?tab=earnings" } },
  { number: "04", icon: Store, title: "Publish tours & guides", description: "Host bookable tours — the builder walks you day by day, AI helps you draft, you stay in control. Then write itinerary guides: your knowledge as a product, written once and sold forever.", cta: { label: "Build your first tour", to: "/trip-builder" } },
  { number: "05", icon: Briefcase, title: "List your services", description: "Set your rates for custom itineraries, full trip design, add-ons, and on-trip work at your day rate — photography, videography, content, guiding, hosting, transfers, whatever you declare. Hire requests land in your dashboard inbox; answer with a proposal and payment settles through Stripe like everything else." },
  { number: "06", icon: HandCoins, title: "Earn on recommendations & tips", description: "Share a specialist's trip with your affiliate link and earn commission when your audience books — 10% standard, set per link. And travelers can tip you straight from your profile and listings; tips land on your Stripe with everything else." },
  { number: "07", icon: Share2, title: "Share your storefront", description: "Drop your profile link in your bio — TikTok, Instagram, YouTube, your newsletter, anywhere you have an audience. Every booking, hire, commission, and tip from your audience is yours." },
];

export default function HowItWorksCreator() {
  const { t } = useTranslation();
  return (
    <HowItWorksTemplate
      eyebrow={t('howItWorks.creator.eyebrow', 'For Creators')}
      title={t('howItWorks.creator.title', 'This is your travel storefront')}
      subtitle={t('howItWorks.creator.subtitle', "Everything you know how to do — sell it here. Creators earn six ways: bookable tours, itinerary guides, services, on-trip work at your day rate, affiliate commissions, and tips.")}
      steps={STEPS}
      factCard={{
        text: "Goldsainte's fee is a flat 7% on everything. Tours, guides, and tips carry a single 7% platform fee, charged directly on your own Stripe account — you set the price, you're the seller, and payments settle to your bank on your Stripe schedule.",
        icon: TrendingUp,
      }}
      extraSection={<CurrenciesAndPayouts />}
      finalCta={{
        heading: "Stock your storefront",
        description: "Complete your creator profile, then publish your first tour or guide. Empty storefronts don't sell — listed ones do.",
        label: "Apply as a Creator",
        to: "/onboarding/creator",
      }}
    />
  );
}
