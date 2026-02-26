import { Check } from "lucide-react";

const marketplaceFeatures = [
  "Receive multiple custom trip designs",
  "Work with vetted creators & certified agents",
  "Competitive bidding for better value",
  "Personalized itineraries (not templates)",
  "Transparent pricing proposals",
  "Secure booking workflow",
  "Built-in messaging & collaboration",
  "Compare proposals side-by-side",
  "Human expertise powered by AI",
  "One platform from idea to execution",
];

const storyboardingFeatures = [
  "Pinterest-style visual planning",
  "Save hotels, experiences & travel inspiration",
  "Turn inspiration into a structured trip brief",
  "Clarify your vibe before you book",
  "Avoid generic itineraries",
  "Guide agents with visual direction",
  "Organize ideas in one place",
  "Flexible, creative, and collaborative",
  "Edit anytime before posting",
  "Designed specifically for travel (not generic boards)",
];

function FeatureCard({ title, features }: { title: string; features: string[] }) {
  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-[#FDF9F0] p-6 md:p-8">
      <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225] mb-1">{title}</h3>
      <div className="w-10 h-px bg-[#C7A962] mb-5" />
      <div className="space-y-0">
        {features.map((text, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${
              i % 2 === 1 ? "bg-white" : ""
            }`}
          >
            <Check className="w-4 h-4 text-[#C7A962] mt-0.5 shrink-0" strokeWidth={3} />
            <span className="text-sm text-[#4a4a4a] leading-relaxed">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TwoWaysComparison() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="inline-block rounded-full border border-[#0c4d47] bg-[#0c4d47] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#bfad72] mb-4">
          Why Goldsainte
        </span>
        <div className="mx-auto w-14 h-px bg-[#C7A962] mb-5" />
        <h2 className="font-secondary text-2xl md:text-4xl text-[#0a2225] mb-3">
          Two Powerful Ways to Plan Your Trip
        </h2>
        <p className="text-sm md:text-base text-[#4a4a4a] max-w-2xl mx-auto mb-10 leading-relaxed">
          Whether you want experts to design your trip or prefer to curate your own vision first — Goldsainte has you covered.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard title="Travel Marketplace" features={marketplaceFeatures} />
          <FeatureCard title="Storyboarding" features={storyboardingFeatures} />
        </div>
      </div>
    </section>
  );
}
