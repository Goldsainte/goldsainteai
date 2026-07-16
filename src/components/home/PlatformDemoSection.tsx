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
  ["AI guide writer", "Destination guides in your voice, drafted in seconds"],
  ["Your travel map", "Every country you've been lights up gold"],
  ["Guide analytics", "Live view counts and milestone alerts"],
  ["Escrow payouts", "Every booking protected; paid out through Stripe"],
  ["Brand collab hub", "Media kit, formats, and inbound partnerships"],
];

export function PlatformDemoSection() {
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
                    You
                  </span>
                  <div>
                    <p className="font-secondary text-[17px] leading-tight text-[#0a2225]">Your profile</p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#8D6B2F]">Goldsainte Creator</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white px-4 py-2 text-center shadow-sm">
                  <p className="font-secondary text-xl leading-none text-[#0a2225]">{count}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#0a2225]/60">Countries</p>
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
              The platform
            </span>
            <h2 className="mt-4 font-secondary text-[30px] leading-tight text-[#f7f3ea] md:text-[38px]">
              Technology that turns your travels into a business
            </h2>
            <ul className="mt-8 space-y-4">
              {FEATURES.map(([t, d]) => (
                <li key={t} className="border-l-2 border-[#C7A962]/40 pl-4">
                  <p className="text-[15px] font-medium text-[#f7f3ea]">{t}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#f7f3ea]/60">{d}</p>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/auth?mode=signup&role=creator"
                className="rounded-full bg-[#C7A962] px-7 py-3.5 text-[14px] font-medium text-[#0a2225] transition-colors hover:bg-[#E2C57E]">
                Become a creator
              </Link>
              <Link to="/apply/agent"
                className="rounded-full border border-[#f7f3ea]/30 px-7 py-3.5 text-[14px] font-medium text-[#f7f3ea] transition-colors hover:bg-white/10">
                Join as a specialist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PlatformDemoSection;
