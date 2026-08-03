import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

/* Integrated search hero: one headline line, subtitle, trust row — the
   search bar (rendered by MarketplaceSearch directly below) is the hero's
   centerpiece and inventory lands above the fold. The marketplace legal
   disclaimer moved to the bottom of the page; the Post-a-Trip CTA lives in
   the Travel menu and the Trip Requests tab. */
export function MarketplaceHeader() {
  const { t } = useTranslation();
  const trust = [
    t("mp.header.trust1", "Every listing reviewed by our team"),
    t("mp.header.trust2", "Stripe-secured checkout"),
    t("mp.header.trust3", "Direct line to your specialist"),
  ];
  return (
    <section className="border-b-0 bg-gradient-to-b from-white to-[#FDF9F0]">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-2 md:pt-12 text-center">
        <h1 className="font-secondary text-[26px] md:text-[34px] font-semibold leading-tight text-[#0a2225]">
          {t("mp.header.h1", "Trips, tours & guides — built by people who've been.")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl font-primary text-base md:text-lg leading-relaxed text-[#0a2225]/70">
          {t("mp.header.sub", "Real trips you can actually book — directly from the verified locals and advisors who designed them.")}
        </p>
      </div>
      {/* Trust row renders under the search bar via MarketplaceSearch's slot-free
          layout — kept here as a sibling so the hero owns its own claims. */}
      <div className="mx-auto max-w-6xl px-4 pb-1">
        <div
          className="mt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 font-sans text-xs text-[#6B7280]"
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
