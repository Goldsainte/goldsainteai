import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, ChevronRight } from "lucide-react";

export function MarketplaceHeader() {
  return (
    <section className="border-b border-[#E5DFC6]/30 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-12">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Back link - hidden on mobile for cleaner look */}
          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#8D8D8D] transition hover:text-[#0a2225] -mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>

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
              <Sparkles className="h-4 w-4" />
              Post a Trip Request
            </Link>

            {/* Secondary CTAs - 50/50 split on mobile (matching homepage) */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                to="/creators"
                className="flex-1 sm:flex-none text-center rounded-full border border-[#BFAD72] bg-white px-4 py-2.5 text-sm font-medium text-[#0a2225] transition hover:bg-[#BFAD72] hover:text-white"
              >
                Browse Travel Creators
              </Link>

              <Link
                to="/agents"
                className="flex-1 sm:flex-none text-center rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-sm font-medium text-[#0a2225] transition hover:bg-[#BFAD72] hover:text-white"
              >
                Browse Agents
              </Link>
            </div>

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
