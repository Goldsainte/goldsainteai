// "Post your dream trip" — the traveler-supply section. Upgraded Jul 18 2026
// from a flat three-bullet band to a full three-step journey with imagery,
// matching the creator showcase's caliber. This is the MOST important CTA on
// the page (no posted trip = no marketplace), so it now leads the value
// sections, ahead of the creator showcase. Sub-headline + differentiator strip
// approved from the HTML preview.
import { Link } from "react-router-dom";
import maldives from "@/assets/home/storyboard-maldives.webp";
import bali from "@/assets/home/storyboard-bali.webp";
import overwater from "@/assets/home/hero-overwater-villa.webp";

const inter = { fontFamily: "Inter, sans-serif" } as const;

const STEPS = [
  {
    n: "1",
    img: maldives,
    title: "You describe it",
    body: "Tell us the trip you wish existed — in your own words.",
    kind: "mock" as const,
  },
  {
    n: "2",
    img: bali,
    title: "Proposals come to you",
    body: "Certified experts design it and reply — you don't chase anyone.",
    kind: "proposals" as const,
  },
  {
    n: "3",
    img: overwater,
    title: "Book with confidence",
    body: "Choose the one you love. Pay your specialist directly, secured by Stripe.",
    kind: "escrow" as const,
  },
];

const WHY = [
  ["Designed", "not generated"],
  ["Personal", "not packaged"],
  ["Protected", "not prepaid"],
];

const PROPOSALS = [
  ["Jordan W.", "$7,850"],
  ["Ana R.", "$8,200"],
  ["Kenji T.", "$7,400"],
];

export function DreamTripBand() {
  return (
    <section className="relative overflow-hidden bg-[#0c4d47] py-16 text-[#FDF9F0] md:py-[84px]">
      <style>{`
        @keyframes gsDtIn { from { transform: translateX(-16px); opacity: 0; } to { transform: none; opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .gs-dt-anim { animation: none !important; opacity: 1 !important; transform: none !important; } }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-36 h-[460px] w-[460px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(199,169,98,0.16), transparent 65%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#C7A962]" style={inter}>
          For travelers
        </span>
        <h2 className="mt-4 font-secondary text-[30px] leading-[1.12] text-[#FDF9F0] md:text-[42px]">
          Have a trip in mind that
          <br />
          doesn't exist yet? <em className="italic text-[#C7A962]">Post it.</em>
        </h2>
        <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-[#FDF9F0]/85 md:text-[17.5px]">
          Stop scrolling through the same packages everyone else books. Describe
          the trip you actually want, and real travel creators and certified
          specialists design it for you — start to finish.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            to="/post-trip"
            className="inline-flex items-center justify-center rounded-full bg-[#C7A962] px-8 py-3.5 text-[14px] font-semibold text-[#073331] transition-colors hover:bg-[#b3954f]"
            style={inter}
          >
            Post your dream trip
          </Link>
          <span className="text-[13px] text-[#FDF9F0]/70" style={inter}>
            Free to post · No obligation to book
          </span>
        </div>

        {/* Differentiator strip — the "why us vs. algorithms/agents" answer */}
        <div className="mt-7 flex flex-wrap gap-x-9 gap-y-4 border-t border-[#E5DFC6]/20 pt-6">
          {WHY.map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="font-secondary text-[18px] text-[#FDF9F0]">{k}</span>
              <span className="mt-0.5 text-[12.5px] uppercase tracking-[0.06em] text-[#C7A962]/90" style={inter}>
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* Three-step journey with imagery */}
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="flex flex-col overflow-hidden rounded-[20px] border border-[#E5DFC6]/22 bg-[#FDF9F0]/[0.06]"
            >
              <div
                className="relative h-[150px] bg-cover bg-center"
                style={{ backgroundImage: `url(${step.img})` }}
              >
                <span className="absolute left-3.5 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#061a18] font-secondary text-[16px] text-[#C7A962]">
                  {step.n}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-[#061a18]/55 to-transparent" />
              </div>
              <div className="px-5 pb-6 pt-[18px]">
                <p className="font-secondary text-[18px] text-[#FDF9F0]">{step.title}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#FDF9F0]/72" style={inter}>
                  {step.body}
                </p>

                {step.kind === "mock" && (
                  <div className="mt-3.5 rounded-xl bg-[#fdfaf2] px-3.5 py-3 text-[#0a2225]">
                    <p className="text-[13px] leading-relaxed" style={inter}>
                      "Two weeks in Japan in October — food-focused, mid-luxury, off the tourist trail."
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Japan", "Oct", "Culinary", "$8k"].map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-[#F0EADA] px-2.5 py-[3px] text-[12.5px] text-[#8D6B2F]"
                          style={inter}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {step.kind === "proposals" && (
                  <div className="mt-3">
                    {PROPOSALS.map(([who, amt], i) => (
                      <div
                        key={who}
                        className="gs-dt-anim mt-2.5 flex items-center justify-between rounded-[10px] bg-[#fdfaf2] px-3.5 py-2.5 text-[#0a2225] first:mt-0"
                        style={{ animation: `gsDtIn .5s ${i * 0.3}s both` }}
                      >
                        <span className="text-[12.5px] font-medium" style={inter}>{who}</span>
                        <span className="font-secondary text-[16px]">{amt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {step.kind === "escrow" && (
                  <div className="mt-3">
                    {["Secure Stripe checkout, direct to your specialist", "Support from booking to boarding"].map((line) => (
                      <div key={line} className="flex items-center gap-2.5 py-[5px] text-[13px] text-[#FDF9F0]/85" style={inter}>
                        <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-[#C7A962] text-[12.5px] text-[#0a2225]">
                          ✓
                        </span>
                        {line}
                      </div>
                    ))}
                    <div className="mt-2.5 h-[7px] overflow-hidden rounded-full bg-[#E5DFC6]/15">
                      <span className="block h-full w-full rounded-full bg-[#C7A962]" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DreamTripBand;
