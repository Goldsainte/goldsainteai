import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function MarketplaceHeader() {
  return (
    <section className="border-b border-[#E5DFC6]/30 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-12">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Hero content */}
          <div className="space-y-2 md:space-y-3">
            <h1 className="font-secondary text-2xl text-[#0a2225] md:text-4xl leading-tight">
              Where your dream trip meets the perfect team.
            </h1>
            <p className="text-sm leading-relaxed text-[#4a4a4a] md:text-base max-w-2xl">
              Post a trip request, compare tailored proposals, and build your journey with 
              world-class travel specialists and agents.
            </p>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Primary CTA - Full width on mobile */}
            <Link
              to="/post-trip"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0C4D47] px-6 py-3 text-sm font-semibold text-[#E5DFC6] shadow-sm transition hover:bg-[#073331] w-full sm:w-auto"
            >
              Post a Trip Request
            </Link>

          </div>

          {/* Marketplace Legal Disclaimer - Condensed on mobile */}
          <p className="hidden md:block mt-1 max-w-2xl text-[11px] leading-relaxed text-[#818181]">
            Goldsainte is a travel marketplace. All trips are designed and fulfilled 
            by independent travel specialists, agents, and suppliers. Trip Request proposals 
            reflect their own cancellation, refund, and deposit terms.
          </p>
          
          {/* Mobile: Link to learn more */}
          <Link
            to="/cancellation-refund-policy"
            className="md:hidden inline-flex items-center gap-1 text-[11px] text-[#8D8D8D] hover:text-[#0a2225]"
          >
            <span>Curated marketplace</span>
            <ChevronRight className="h-3 w-3" />
            <span className="underline">Learn more</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
