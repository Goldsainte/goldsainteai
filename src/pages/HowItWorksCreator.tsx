import { UserCircle, ShieldCheck, CreditCard, Camera, Share2, DollarSign, Star } from "lucide-react";
import { HowItWorksTemplate, type HowItWorksStep } from "./HowItWorksTemplate";

const STEPS: HowItWorksStep[] = [
  { number: "01", icon: UserCircle, title: "Complete your profile", description: "Add your photo, bio and niches so travelers can find you and trust your expertise.", cta: { label: "Complete profile", to: "/onboarding/creator" } },
  { number: "02", icon: ShieldCheck, title: "Verify your identity", description: "Quick Stripe Identity verification builds trust and unlocks payouts." },
  { number: "03", icon: CreditCard, title: "Connect Stripe Connect", description: "Link your bank to receive commissions on bookings and guide sales automatically.", cta: { label: "Set up payouts", to: "/creator-dashboard?tab=payouts" } },
  { number: "04", icon: Camera, title: "Publish a trip or sell a guide", description: "Choose your monetisation: build a packaged trip travelers can book, or sell a polished itinerary guide." },
  { number: "05", icon: Share2, title: "Share your profile", description: "Your public creator profile is your storefront. Drive traffic from TikTok, Instagram and your own audience." },
  { number: "06", icon: DollarSign, title: "Get paid on every booking", description: "Earn up to 80% commission on bookings driven through your profile and content. Funds settle on a clear schedule." },
  { number: "07", icon: Star, title: "Build your reputation", description: "Great reviews unlock featured placement across the marketplace, accelerating future bookings." },
];

export default function HowItWorksCreator() {
  return (
    <HowItWorksTemplate
      eyebrow="For Creators"
      title="Turn your audience into bookings"
      subtitle="A complete commerce layer for travel creators — sell trips, sell guides, get paid."
      steps={STEPS}
      finalCta={{
        heading: "Start earning with your audience",
        description: "Complete your creator profile and publish your first trip or guide.",
        label: "Apply as a Creator",
        to: "/onboarding/creator",
      }}
    />
  );
}