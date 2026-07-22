// "As Featured In" — press credibility strip. Real placements from Goldsainte's
// investor materials. Grayscale logos on cream, subtle color-on-hover, responsive
// wrap. Native section (not the flat deck banner) so it's accessible + sharp on
// every viewport. Logos live in src/assets/press/ (uploaded via GitHub).
import forbes from "@/assets/press/forbes.png";
import yahooFinance from "@/assets/press/yahoo-finance.png";
import axios from "@/assets/press/axios.png";
import marketwatch from "@/assets/press/marketwatch.png";
import morningstar from "@/assets/press/morningstar.png";
import afrotech from "@/assets/press/afrotech.png";
import franchiseTimes from "@/assets/press/franchise-times.png";
import charlotteObserver from "@/assets/press/charlotte-observer.png";

const inter = { fontFamily: "Inter, sans-serif" } as const;

// Ordered strongest-name-first for immediate credibility. h = display height (px),
// tuned per-logo so wordmarks optically match. Rendered as MAX-height with
// object-contain so narrow grid cells scale logos proportionally — never
// squishing a wide wordmark to fit (fixed height + max-width distorts).
const OUTLETS: { src: string; alt: string; h: number }[] = [
  { src: forbes, alt: "Forbes", h: 32 },
  { src: yahooFinance, alt: "Yahoo Finance", h: 29 },
  { src: axios, alt: "Axios", h: 29 },
  { src: marketwatch, alt: "MarketWatch", h: 26 },
  { src: morningstar, alt: "Morningstar", h: 25 },
  { src: afrotech, alt: "AfroTech", h: 29 },
  { src: franchiseTimes, alt: "Franchise Times", h: 29 },
  { src: charlotteObserver, alt: "The Charlotte Observer", h: 26 },
];

export function AsFeaturedIn() {
  return (
    <section className="border-t border-[#E5DFC6] bg-[#f7f3ea] py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
        <span
          className="text-[12px] font-medium uppercase tracking-[0.24em] text-[#8a7136]"
          style={inter}
        >
          As featured in
        </span>
        <span aria-hidden="true" className="mx-auto mt-3.5 block h-px w-12 bg-[#C7A962]" />

        {/* Stacked grid: 2 cols on mobile, 4 on desktop — 8 logos sit in two
            clean rows with room to breathe, at full editorial size. Never a
            single cramped row. */}
        <div className="mx-auto mt-9 grid max-w-4xl grid-cols-2 items-center gap-x-8 gap-y-10 md:grid-cols-4 md:gap-x-14 md:gap-y-12">
          {OUTLETS.map((o) => (
            <div key={o.alt} className="flex items-center justify-center">
              <img
                src={o.src}
                alt={o.alt}
                loading="lazy"
                decoding="async"
                style={{ maxHeight: o.h }}
                className="h-auto w-auto max-w-full object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 md:opacity-60"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AsFeaturedIn;
