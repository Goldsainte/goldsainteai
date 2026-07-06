// Closing band. Replaces the "Be Among the First" waitlist — the platform
// is live, so the page's last word converts instead of collecting emails.
import { Link } from "react-router-dom";

const inter = { fontFamily: "Inter, sans-serif" } as const;

export function FinalCTABand() {
  return (
    <section className="bg-[#073331] py-16 md:py-[84px] text-center text-[#FDF9F0]">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-secondary text-[30px] md:text-[42px] text-[#FDF9F0]">
          Your next journey <em className="text-[#C7A962]">starts here.</em>
        </h2>
        <p className="mx-auto mt-4 mb-8 max-w-[560px] text-[15.5px] md:text-[17.5px] leading-relaxed text-[#FDF9F0]/80">
          Find a trip built by someone who's been there — or start earning from
          everywhere you've been.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/marketplace"
            className="inline-flex items-center justify-center rounded-full bg-[#C7A962] px-7 py-3 text-sm font-semibold text-[#073331] hover:bg-[#b3954f] transition-colors"
            style={inter}
          >
            Explore trips
          </Link>
          <Link
            to="/creators"
            className="inline-flex items-center justify-center rounded-full border border-[#E5DFC6]/55 px-7 py-3 text-sm font-semibold text-[#E5DFC6] hover:bg-[#FDF9F0]/10 transition-colors"
            style={inter}
          >
            Start earning
          </Link>
        </div>
      </div>
    </section>
  );
}
