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

function FeatureCard({
  title,
  subtitle,
  features,
  linkTo,
  linkLabel,
  number,
}: {
  title: string;
  subtitle?: string;
  features: string[];
  linkTo?: string;
  linkLabel?: string;
  number: string;
}) {
  return (
    <div className="relative rounded-2xl bg-[#FDF9F0] text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden group">
      {/* Gold accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#C7A962] via-[#E5D9A8] to-[#C7A962]" />

      <div className="p-6 md:p-8">
        {/* Numbered badge + title */}
        <div className="flex items-start gap-4 mb-1">
          <span className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-[#C7A962] flex items-center justify-center font-secondary text-sm text-[#C7A962] tracking-wide">
            {number}
          </span>
          <div>
            <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">{title}</h3>
          </div>
        </div>

        <div className="ml-[52px]">
          <div className="w-10 h-px bg-[#C7A962] mb-3" />
          {subtitle && (
            <p className="text-sm text-[#4a4a4a] italic mb-5">{subtitle}</p>
          )}
        </div>

        <div className="space-y-0">
          {features.map((text, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${
                i % 2 === 1
                  ? "bg-white border-l-2 border-[#C7A962]"
                  : ""
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
              className="relative inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-7 py-3 text-sm font-medium text-[#E5DFC6] tracking-wide hover:bg-[#0a3d39] transition-all duration-300 overflow-hidden group/btn"
            >
              {/* Shimmer overlay */}
              <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <ArrowRight className="w-4 h-4 relative z-10" />
              <span className="relative z-10 group-hover/btn:underline underline-offset-2">{linkLabel}</span>
            </Link>
          </div>
        )}
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
          Two Distinct Ways to Design Your Journey
        </h2>
        <p className="text-sm md:text-base text-[#4a4a4a] max-w-2xl mx-auto mb-10 leading-relaxed">
          Whether you want expert-crafted precision or prefer to shape your vision first, Goldsainte gives you a seamless path forward.
        </p>

        {/* Cards with "or" divider */}
        <div className="relative grid md:grid-cols-2 gap-6 md:gap-10">
          {/* Vertical "or" divider — desktop only */}
          <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 flex-col items-center justify-center z-10 pointer-events-none">
            <div className="w-px flex-1 bg-[#E5DFC6]" />
            <span className="my-2 flex items-center justify-center w-8 h-8 rounded-full border border-[#C7A962] bg-white text-xs font-secondary text-[#C7A962] tracking-wide">
              or
            </span>
            <div className="w-px flex-1 bg-[#E5DFC6]" />
          </div>

          <FeatureCard
            number="01"
            title="Travel Marketplace"
            subtitle="For travelers who want experts to design the experience."
            features={marketplaceFeatures}
            linkTo="/marketplace"
            linkLabel="Explore Expert-Designed Trips"
          />
          <FeatureCard
            number="02"
            title="Storyboarding"
            subtitle="For travelers who want to define the vibe before committing."
            features={storyboardingFeatures}
            linkTo="/storyboards"
            linkLabel="Start Your Storyboard"
          />
        </div>

        {/* Cross-sell tagline */}
        <p className="mt-10 text-sm text-[#6B7280] italic max-w-lg mx-auto leading-relaxed">
          Not sure which path is right? Start with a storyboard — you can always post to the marketplace later.
        </p>
      </div>
    </section>
  );
}
