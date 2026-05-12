import { Search, Send, MessageCircle, CreditCard, ShieldCheck, Star, Plane } from "lucide-react";
import { HowItWorksTemplate, type HowItWorksStep } from "./HowItWorksTemplate";

const STEPS: HowItWorksStep[] = [
  { number: "01", icon: Search, title: "Browse the marketplace", description: "Explore curated trip packages from certified travel agents and creators across every region and style.", cta: { label: "Browse trips", to: "/marketplace" } },
  { number: "02", icon: Send, title: "Post a trip request", description: "Describe your dream trip — dates, budget, style — and our AI matches you with the right specialists in minutes.", cta: { label: "Post a trip", to: "/post-trip" } },
  { number: "03", icon: MessageCircle, title: "Get matched proposals", description: "Verified specialists send custom plans tailored to your brief. Compare itineraries, pricing and reviews side by side." },
  { number: "04", icon: CreditCard, title: "Review and book", description: "Pay a deposit to confirm and the balance closer to departure. All payments stay on-platform for your protection.", cta: { label: "How payments work", to: "/help" } },
  { number: "05", icon: ShieldCheck, title: "Travel protected", description: "Your funds are held in escrow and only released to your specialist after each milestone is delivered." },
  { number: "06", icon: Star, title: "Leave a review", description: "Help future travelers discover great specialists by sharing your experience after your trip." },
];

export default function HowItWorksTraveler() {
  return (
    <HowItWorksTemplate
      eyebrow="For Travelers"
      title="How Goldsainte works"
      subtitle="Your private studio for designing extraordinary travel — from inspiration to confirmation."
      steps={STEPS}
      finalCta={{
        heading: "Ready to begin?",
        description: "Post your first trip request and start receiving proposals from verified specialists.",
        label: "Post a Trip",
        to: "/post-trip",
      }}
    />
  );
}