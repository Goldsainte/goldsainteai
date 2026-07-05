import { Check } from "lucide-react";

/* Integrated search hero: one headline line, subtitle, trust row — the
   search bar (rendered by MarketplaceSearch directly below) is the hero's
   centerpiece and inventory lands above the fold. The marketplace legal
   disclaimer moved to the bottom of the page; the Post-a-Trip CTA lives in
   the Travel menu and the Trip Requests tab. */
export function MarketplaceHeader() {
  const trust = [
    "Every listing reviewed by our team",
    "Stripe-secured checkout",
    "Direct line to your specialist",
  ];
  return (
    <section className="border-b-0 bg-gradient-to-b from-white to-[#FDF9F0]">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-2 md:pt-12 text-center">
        <h1 className="font-secondary text-[26px] md:text-[34px] font-semibold leading-tight text-[#0a2225]">
          Trips, tours &amp; guides — built by people who've been.
        </h1>
        <p className="mt-2 font-primary text-base md:text-lg text-[#6B7280]">
          Curated journeys from vetted creators, agents, and tour operators worldwide.
        </p>
      </div>
      {/* Trust row renders under the search bar via MarketplaceSearch's slot-free
          layout — kept here as a sibling so the hero owns its own claims. */}
      <div className="mx-auto max-w-6xl px-4 pb-1">
        <div
          className="mt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 font-sans text-xs text-[#9CA3AF]"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {trust.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[#0c4d47]" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
