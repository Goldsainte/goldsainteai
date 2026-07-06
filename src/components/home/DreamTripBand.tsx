// "Post your dream trip" — the traveler-supply story that existed in code
// (PostTripCTA) but was never rendered on the homepage. Forest full-bleed
// band: statement left, three-beat mechanics card right.
import { Link } from "react-router-dom";

const inter = { fontFamily: "Inter, sans-serif" } as const;

const beats = [
  { title: "You describe it", body: '"Two weeks in Japan in October, food-focused, mid-luxury."' },
  { title: "Specialists respond", body: "Tailored proposals arrive from certified travel experts." },
  { title: "You choose & book", body: "Compare side-by-side. Book the one you love, secured by Stripe." },
];

export function DreamTripBand() {
  return (
    <section className="relative overflow-hidden bg-[#0c4d47] py-16 md:py-[88px] text-[#FDF9F0]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(199,169,98,0.16), transparent 65%)" }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 md:grid-cols-[1.2fr_0.8fr] md:gap-14">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#C7A962]" style={inter}>
            For travelers
          </span>
          <h2 className="mt-4 font-secondary text-[30px] leading-[1.12] md:text-[42px] text-[#FDF9F0]">
            Have a trip in mind
            <br />
            that doesn't exist yet? <em className="text-[#C7A962]">Post it.</em>
          </h2>
          <p className="mt-4 max-w-[520px] text-[15.5px] md:text-[17.5px] leading-relaxed text-[#FDF9F0]/85">
            Describe where you dream of going — destination, dates, budget, the feeling
            you're after. Certified specialists send you tailored proposals. You compare,
            choose, and book.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              to="/post-trip"
              className="inline-flex items-center justify-center rounded-full bg-[#C7A962] px-7 py-3 text-sm font-semibold text-[#073331] hover:bg-[#b3954f] transition-colors"
              style={inter}
            >
              Post your dream trip
            </Link>
            <span className="text-[12.5px] text-[#FDF9F0]/70" style={inter}>
              Free to post · No obligation to book
            </span>
          </div>
        </div>

        <div className="rounded-[22px] border border-[#E5DFC6]/25 bg-[#FDF9F0]/[0.06] p-6 md:p-7">
          {beats.map((b, i) => (
            <div
              key={b.title}
              className={`flex items-start gap-3 py-3 ${i < beats.length - 1 ? "border-b border-[#E5DFC6]/15" : ""}`}
            >
              <span className="mt-2 h-[7px] w-[7px] flex-none rounded-full bg-[#C7A962]" />
              <div>
                <p className="text-[13.5px] font-semibold text-[#FDF9F0]" style={inter}>{b.title}</p>
                <p className="text-[12.5px] text-[#FDF9F0]/70" style={inter}>{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
