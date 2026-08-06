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
const getSteps = (t: (k: string, d?: string) => string): HowItWorksStep[] => [
  { number: "01", icon: UserCircle, title: t("howItWorks.creator.s1t", "Complete your creator profile"), description: t("howItWorks.creator.s1d", "Your face, your story, your cities. This is the storefront window — it's what travelers see before they book anything."), cta: { label: t("howItWorks.creator.s1c", "Complete profile"), to: "/onboarding/creator" } },
  { number: "02", icon: Camera, title: t("howItWorks.creator.s2t", "Add photos & video"), description: t("howItWorks.creator.s2d", "Real photos convert. Show the places you actually go — travelers buy the proof, not the promise."), cta: { label: t("howItWorks.creator.s2c", "Add media"), to: "/profile/media" } },
  { number: "03", icon: CreditCard, title: t("howItWorks.creator.s3t", "Connect your payout account"), description: t("howItWorks.creator.s3d", "One Stripe connection powers your storefront. Tour, guide, and tip payments are charged directly on your own Stripe account — you're the seller of record, and Goldsainte's flat 7% comes out automatically."), cta: { label: t("howItWorks.creator.s3c", "Set up payouts"), to: "/creator-dashboard?tab=earnings" } },
  { number: "04", icon: Store, title: t("howItWorks.creator.s4t", "Publish tours & guides"), description: t("howItWorks.creator.s4d", "Host bookable tours — the builder walks you day by day, AI helps you draft, you stay in control. Then write itinerary guides: your knowledge as a product, written once and sold forever."), cta: { label: t("howItWorks.creator.s4c", "Build your first tour"), to: "/trip-builder" } },
  { number: "05", icon: Briefcase, title: t("howItWorks.creator.s5t", "List your services"), description: t("howItWorks.creator.s5d", "Set your rates for custom itineraries, full trip design, add-ons, and on-trip work at your day rate — photography, videography, content, guiding, hosting, transfers, whatever you declare. Hire requests land in your dashboard inbox; answer with a proposal and payment settles through Stripe like everything else. One rule keeps it clean: creators sell trip design services, not travel arrangements \u2014 you deliver the plan, travelers book the travel.") },
  { number: "06", icon: HandCoins, title: t("howItWorks.creator.s6t", "Earn on recommendations & tips"), description: t("howItWorks.creator.s6d", "Share a specialist's trip with your affiliate link and earn 2% of the booking value when your audience books — paid by Goldsainte out of our platform fee. And travelers can tip you straight from your profile and listings; tips land on your Stripe with everything else.") },
  { number: "07", icon: Share2, title: t("howItWorks.creator.s7t", "Share your storefront"), description: t("howItWorks.creator.s7d", "Drop your profile link in your bio — TikTok, Instagram, YouTube, your newsletter, anywhere you have an audience. Every booking, hire, commission, and tip from your audience is yours.") },
];

export default function HowItWorksCreator() {
  const { t } = useTranslation();
  return (
    <HowItWorksTemplate
      eyebrow={t('howItWorks.creator.eyebrow', 'For Creators')}
      title={t('howItWorks.creator.title', 'This is your travel storefront')}
      subtitle={t('howItWorks.creator.subtitle', "Everything you know how to do — sell it here. Creators earn six ways: bookable tours, itinerary guides, services, on-trip work at your day rate, affiliate commissions, and tips.")}
      steps={getSteps(t)}
      factCard={{
        text: t("howItWorks.creator.fact", "Goldsainte's fee is a flat 7% on everything. Tours, guides, and tips carry a single 7% platform fee, charged directly on your own Stripe account — you set the price, you're the seller, and payments settle to your bank on your Stripe schedule."),
        icon: TrendingUp,
      }}
      extraSection={<CurrenciesAndPayouts />}
      finalCta={{
        heading: t("howItWorks.creator.ctaH", "Stock your storefront"),
        description: t("howItWorks.creator.ctaD", "Complete your creator profile, then publish your first tour or guide. Empty storefronts don't sell — listed ones do."),
        label: t("howItWorks.creator.ctaL", "Apply as a Creator"),
        to: "/onboarding/creator",
      }}
    />
  );
}
