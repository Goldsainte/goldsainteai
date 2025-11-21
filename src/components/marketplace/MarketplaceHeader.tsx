import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function MarketplaceHeader() {
  return (
    <section className="border-b border-[#E5DFC6]/30 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="font-display text-3xl text-[#0a2225] md:text-4xl">
              Discover your perfect trip
            </h1>
            <p className="text-sm text-[#4a4a4a] md:text-base">
              Browse curated trips from creators & agents, or post your dream journey and let verified experts bid to build it.
            </p>
          </div>

          <Link
            to="/post-trip"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#0c4d47] px-6 py-3 text-sm font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#073331]"
          >
            <Sparkles className="h-4 w-4" />
            Post your dream trip
          </Link>
        </div>
      </div>
    </section>
  );
}
