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
// tuned per-logo so wordmarks optically match despite different aspect ratios.
const OUTLETS: { src: string; alt: string; h: number }[] = [
  { src: forbes, alt: "Forbes", h: 22 },
  { src: yahooFinance, alt: "Yahoo Finance", h: 20 },
  { src: axios, alt: "Axios", h: 20 },
  { src: marketwatch, alt: "MarketWatch", h: 18 },
  { src: morningstar, alt: "Morningstar", h: 17 },
  { src: afrotech, alt: "AfroTech", h: 20 },
  { src: franchiseTimes, alt: "Franchise Times", h: 20 },
  { src: charlotteObserver, alt: "The Charlotte Observer", h: 18 },
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

        {/* Fixed grid, not flex-wrap: 2 cols on mobile, 4 on md, 8 on lg —
            every logo gets an equal centered cell, so 8 logos stack in clean
            symmetric rows instead of ragged wrapping. */}
        <div className="mx-auto mt-9 grid max-w-4xl grid-cols-2 items-center gap-x-6 gap-y-9 sm:grid-cols-4 md:gap-x-10 md:gap-y-10 lg:grid-cols-8 lg:gap-x-8">
          {OUTLETS.map((o) => (
            <div key={o.alt} className="flex items-center justify-center">
              <img
                src={o.src}
                alt={o.alt}
                loading="lazy"
                decoding="async"
                style={{ height: o.h }}
                className="w-auto max-w-full opacity-70 grayscale transition-all duration-300 hover:opacity-100 md:opacity-60"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AsFeaturedIn;
