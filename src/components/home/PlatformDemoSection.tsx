import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TravelMap from "@/components/partner/TravelMap";

// ============================================================================
// PlatformDemoSection (Jul 16 eve) — the inline product demo, Goldsainte
// edition. Fora animates a hotel list; we run the REAL TravelMap component —
// a creator profile igniting gold, country by country, when scrolled into
// view, with the Countries counter ticking in sync.
// ============================================================================

const DEMO_COUNTRIES = [
  "Japan", "Italy", "Portugal", "Morocco", "Mexico", "Iceland",
  "Greece", "Thailand", "South Africa", "Peru", "France", "Indonesia",
];

const FEATURES = [
  ["home.platformDemo.f1t", "AI guide writer", "home.platformDemo.f1d", "Destination guides in your voice, drafted in seconds"],
  ["home.platformDemo.f2t", "Your travel map", "home.platformDemo.f2d", "Every country you've been lights up gold"],
  ["home.platformDemo.f3t", "Guide analytics", "home.platformDemo.f3d", "Live view counts and milestone alerts"],
  ["home.platformDemo.f4t", "Direct payouts", "home.platformDemo.f4d", "Every booking paid straight to your Stripe account"],
  ["home.platformDemo.f5t", "Brand collab hub", "home.platformDemo.f5d", "Media kit, formats, and inbound partnerships"],
];

export function PlatformDemoSection() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    // Tick the counter in sync with the map's staggered light-up (300ms + 140ms/country)
    DEMO_COUNTRIES.forEach((_, i) => {
      setTimeout(() => setCount(i + 1), 300 + i * 140 + 350);
    });
  }, [inView]);

  return (
    <section className="bg-[#0a2225] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          {/* The live product, in a browser frame */}
          <div ref={ref} className="overflow-hidden rounded-[22px] bg-[#FDF9F0] shadow-[0_40px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2 border-b border-[#E5DFC6] bg-white px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5DFC6]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5DFC6]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5DFC6]" />
              <span className="ml-3 rounded-full bg-[#F5F0E8] px-3 py-1 text-[11px] text-[#6B7280]">
                goldsainte.ai/creators/you
              </span>
            </div>
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c4d47] font-secondary text-[15px] text-[#E5DFC6]">
                    {t("home.platformDemo.you", "You")}
                  </span>
                  <div>
                    <p className="font-secondary text-[17px] leading-tight text-[#0a2225]">{t("home.platformDemo.yourProfile", "Your profile")}</p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#8D6B2F]">{t("home.platformDemo.creatorBadge", "Goldsainte Creator")}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white px-4 py-2 text-center shadow-sm">
                  <p className="font-secondary text-xl leading-none text-[#0a2225]">{count}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#0a2225]/60">{t("home.platformDemo.countries", "Countries")}</p>
                </div>
              </div>
              <div className="mt-4">
                {inView ? (
                  <TravelMap visited={DEMO_COUNTRIES} />
                ) : (
                  <div className="aspect-[980/500] w-full rounded-2xl bg-[#F5F0E8]" />
                )}
              </div>
            </div>
          </div>

          {/* The pitch + feature rail */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#C7A962]">
              {t("home.platformDemo.eyebrow", "The platform")}
            </span>
            <h2 className="mt-4 font-secondary text-[30px] leading-tight text-[#f7f3ea] md:text-[38px]">
              {t("home.platformDemo.h2", "Your travel business, in one storefront")}
            </h2>
            <ul className="mt-8 space-y-4">
              {FEATURES.map(([ftk, ft, fdk, fd]) => (
                <li key={ftk} className="border-l-2 border-[#C7A962]/40 pl-4">
                  <p className="text-[15px] font-medium text-[#f7f3ea]">{t(ftk, ft)}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#f7f3ea]/60">{t(fdk, fd)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/apply/agent"
                className="rounded-full border border-[#f7f3ea]/30 px-7 py-3.5 text-[14px] font-medium text-[#f7f3ea] transition-colors hover:bg-white/10">
                {t("home.platformDemo.cta", "Join as a specialist")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PlatformDemoSection;
