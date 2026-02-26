import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const marketplaceFeatures = [
  "Receive custom trip concepts tailored to your style",
  "Collaborate with vetted creators & certified travel advisors",
  "Compare personalized proposals side-by-side",
  "Transparent pricing and secure booking",
  "Built-in messaging for effortless collaboration",
  "From vision to confirmed booking — all in one place",
];

const storyboardingFeatures = [
  "Save hotels, experiences, and inspiration in one place",
  "Shape your aesthetic with visual planning",
  "Turn ideas into a structured travel brief",
  "Guide creators and agents with clear direction",
  "Refine and edit before sharing",
  "Designed specifically for travel — not generic boards",
];

function FeatureCard({ title, subtitle, features, linkTo, linkLabel }: { title: string; subtitle?: string; features: string[]; linkTo?: string; linkLabel?: string }) {
  return (
    <div className="rounded-2xl border border-[#0c4d47] bg-[#FDF9F0] p-6 md:p-8 text-left">
      <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225] mb-1">{title}</h3>
      <div className="w-10 h-px bg-[#C7A962] mb-3" />
      {subtitle && (
        <p className="text-sm text-[#4a4a4a] italic mb-5">{subtitle}</p>
      )}
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
      {linkTo && linkLabel && (
        <div className="mt-6 text-center">
          <Link
            to={linkTo}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm font-medium text-[#E5DFC6] tracking-wide hover:bg-[#0a3d39] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            {linkLabel}
          </Link>
        </div>
      )}
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
          Two Distinct Ways to Design Your Journey
        </h2>
        <p className="text-sm md:text-base text-[#4a4a4a] max-w-2xl mx-auto mb-10 leading-relaxed">
          Whether you want expert-crafted precision or prefer to shape your vision first, Goldsainte gives you a seamless path forward.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard
            title="Travel Marketplace"
            subtitle="For travelers who want experts to design the experience."
            features={marketplaceFeatures}
            linkTo="/marketplace"
            linkLabel="Explore Expert-Designed Trips"
          />
          <FeatureCard
            title="Storyboarding"
            subtitle="For travelers who want to define the vibe before committing."
            features={storyboardingFeatures}
            linkTo="/storyboards"
            linkLabel="Start Your Storyboard"
          />
        </div>
      </div>
    </section>
  );
}
