import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function MarketplaceHeader() {
  return (
    <section className="border-b border-[#E5DFC6]/30 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="flex flex-col gap-6">
          <div className="max-w-3xl space-y-3">
            <h1 className="font-display text-3xl text-[#0a2225] md:text-4xl">
              Where your dream trip meets the perfect team.
            </h1>
            <p className="text-sm leading-relaxed text-[#4a4a4a] md:text-base">
              Post a trip request, compare tailored proposals, and build your journey with 
              world-class creators and travel agents — all within the Goldsainte marketplace.
            </p>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary CTA */}
            <Link
              to="/post-trip"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0C4D47] px-6 py-2.5 text-sm font-semibold text-[#E5DFC6] shadow-sm transition hover:bg-[#073331]"
            >
              <Sparkles className="h-4 w-4" />
              Post a Trip Request
            </Link>

            {/* Secondary CTAs */}
            <Link
              to="/marketplace?tab=creators"
              className="rounded-full border border-[#BFAD72] bg-white px-4 py-2 text-sm font-medium text-[#0a2225] transition hover:bg-[#BFAD72] hover:text-white"
            >
              Browse Creators
            </Link>

            <Link
              to="/marketplace?tab=agents"
              className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-sm font-medium text-[#0a2225] transition hover:bg-[#BFAD72] hover:text-white"
            >
              Browse Agents
            </Link>

            <Link
              to="/marketplace?tab=brands"
              className="rounded-full border border-[#E5DFC6]/60 bg-white px-4 py-2 text-sm font-medium text-[#0a2225] transition hover:bg-[#BFAD72] hover:text-white"
            >
              Browse Brands
            </Link>

            {/* Marketplace Pill */}
            <div className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-sm font-semibold text-[#0a2225]">
              Marketplace
            </div>
          </div>

          {/* Marketplace Legal Disclaimer */}
          <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-[#818181]">
            Goldsainte is a curated travel marketplace. All trips are designed and fulfilled 
            by independent creators, travel agents, and suppliers. Trip Request proposals 
            reflect their own cancellation, refund, and deposit terms.
          </p>
        </div>
      </div>
    </section>
  );
}
