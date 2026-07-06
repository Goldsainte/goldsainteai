// src/components/home/HomeHero.tsx
// Launch hero: category eyebrow → promise headline → search-first CTA,
// with both audiences answered in the "two doors" row beneath the search.
// Popular Trips shows REAL inventory only (featured, else newest published)
// and hides itself below 3 trips — no fabricated fallbacks, ever.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

import heroMainImg from "@/assets/maximilien-t-scharner-FD0Ga_KJTwM-unsplash.webp"; // infinity pool
import heroSecondaryImg from "@/assets/austin-distel-riQNJpiaGgE-unsplash.webp"; // treehouse / hammock
import heroTertiaryImg from "@/assets/felix-rostig-UmV2wr-Vbq8-unsplash.webp"; // friends hiking

const inter = { fontFamily: "Inter, sans-serif" } as const;

export function HomeHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");

  const { data: popularTrips } = useQuery({
    queryKey: ["hero-popular-trips"],
    queryFn: async () => {
      const cols = "slug, title, cover_image_url, price_per_person, currency";
      const { data: featured } = await supabase
        .from("packaged_trips")
        .select(cols)
        .eq("is_featured", true)
        .eq("status", "published")
        .limit(3);
      if (featured && featured.length >= 3) return featured.slice(0, 3);
      const { data: recent } = await supabase
        .from("packaged_trips")
        .select(cols)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);
      return recent && recent.length >= 3 ? recent.slice(0, 3) : [];
    },
  });

  const goToMarketplace = () => {
    const q = destination.trim();
    navigate(q ? `/marketplace?destination=${encodeURIComponent(q)}` : "/marketplace");
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <section className="bg-[#f7f3ea] text-[#0a2225] md:min-h-[calc(100svh-56px)]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12 md:h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-stretch md:h-full">
          {/* LEFT: category → promise → search → two doors */}
          <div className="flex flex-col justify-center">
            {/* Pill badge (unchanged) */}
            <div className="flex justify-center md:justify-start">
              <div className="inline-flex items-center gap-1.5 md:gap-2 rounded-full border border-[#E5DFC6] bg-[#BFAD72] px-3 py-1 md:py-1.5 text-[10px] md:text-sm font-medium uppercase tracking-[0.06em] md:tracking-[0.12em] text-[#073331] whitespace-nowrap">
                <span>{t('common.travelers')}</span>
                <span className="h-[1px] w-1.5 md:w-4 bg-[#073331]/30" />
                <span>{t('common.creators')}</span>
                <span className="h-[1px] w-1.5 md:w-4 bg-[#073331]/30" />
                <span>{t('common.agents')}</span>
              </div>
            </div>

            {/* Category eyebrow */}
            <p
              className="mt-7 text-center md:text-left text-[11px] md:text-[11.5px] font-semibold uppercase tracking-[0.26em] text-[#8a7136]"
              style={inter}
            >
              The Smarter Travel Marketplace
            </p>
            <span aria-hidden="true" className="mx-auto md:mx-0 mt-2.5 block h-px w-11 bg-[#C7A962]" />

            {/* Promise headline */}
            <h1 className="mt-4 text-center md:text-left font-secondary text-[30px] sm:text-[36px] leading-[1.1] md:text-[44px] lg:text-[50px] font-medium">
              Trips built by people
              <br />
              <em className="text-[#0c4d47]">who've been there.</em>
            </h1>

            <p className="mt-4 text-center md:text-left max-w-xl mx-auto md:mx-0 text-[15px] md:text-[17px] leading-relaxed text-[#3f4a4b]">
              Book journeys crafted by certified specialists and real travelers —
              or post your dream trip and let the experts come to you.
            </p>

            {/* Search bar — the primary CTA. Routes into the marketplace. */}
            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); goToMarketplace(); }}
              className="mt-7 flex items-stretch rounded-full border border-[#E5DFC6] bg-white pl-6 pr-2 py-2 shadow-[0_14px_34px_rgba(10,34,37,0.10)] max-w-[640px] mx-auto md:mx-0"
            >
              <div className="flex-[1.4] min-w-0 border-r border-[#E5DFC6] pr-4 py-1">
                <label htmlFor="hero-destination" className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7136]" style={inter}>
                  Where
                </label>
                <input
                  id="hero-destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Search destinations"
                  className="mt-0.5 w-full bg-transparent text-[13.5px] text-[#0a2225] placeholder:text-[#6B7280] focus:outline-none"
                  style={inter}
                />
              </div>
              <button
                type="button"
                onClick={goToMarketplace}
                className="hidden sm:block flex-1 min-w-0 whitespace-nowrap border-r border-[#E5DFC6] px-4 py-1 text-left"
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7136]" style={inter}>When</span>
                <span className="mt-0.5 block text-[13.5px] text-[#6B7280]" style={inter}>Any dates</span>
              </button>
              <button
                type="button"
                onClick={goToMarketplace}
                className="hidden sm:block flex-1 min-w-0 whitespace-nowrap px-4 py-1 text-left"
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7136]" style={inter}>Travelers</span>
                <span className="mt-0.5 block text-[13.5px] text-[#6B7280]" style={inter}>Any group</span>
              </button>
              <button
                type="submit"
                aria-label="Search trips"
                className="ml-2 flex h-11 w-11 flex-none items-center justify-center self-center rounded-full bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] transition-colors"
              >
                <Search className="h-4.5 w-4.5" size={18} />
              </button>
            </form>

            {/* Two doors — plain inline flow so both links share one exact
                baseline (a global 44px touch-target min-height inflates
                anchors that become flex items, so we keep these inline). */}
            <p className="mt-5 text-center md:text-left text-[13.5px] leading-6 text-[#6B7280]" style={inter}>
              <Link to="/post-trip" className="whitespace-nowrap font-semibold text-[#0c4d47] underline decoration-[#C7A962] underline-offset-4 hover:decoration-[#8a7136]">
                Post your dream trip →
              </Link>
              <span aria-hidden="true" className="mx-3 text-[#C7A962]">·</span>
              <span className="whitespace-nowrap">
                Are you a creator?{" "}
                <Link to="/auth?mode=signup&role=creator" className="font-semibold text-[#0c4d47] underline decoration-[#C7A962] underline-offset-4 hover:decoration-[#8a7136]">
                  Earn from your travels →
                </Link>
              </span>
            </p>

            {/* Popular Trips — real inventory only; hides itself below 3 */}
            {popularTrips && popularTrips.length >= 3 && (
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0a2225]/60" style={inter}>
                    Popular Trips
                  </span>
                  <span className="h-px flex-1 bg-[#E5DFC6]" />
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {popularTrips.map((trip: any) => (
                    <Link
                      key={trip.slug || trip.title}
                      to={trip.slug ? `/marketplace/trip/${trip.slug}` : "/marketplace"}
                      className="group block"
                    >
                      <div className="overflow-hidden rounded-xl aspect-[4/3] bg-[#E5DFC6]/50">
                        {trip.cover_image_url && (
                          <img
                            src={trip.cover_image_url}
                            alt={trip.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                      </div>
                      <p className="mt-2 font-secondary text-[12px] md:text-[13px] leading-snug text-[#0a2225] line-clamp-2 md:line-clamp-1 transition-colors group-hover:text-[#0c4d47]">
                        {trip.title}
                      </p>
                      {typeof trip.price_per_person === "number" && (
                        <p className="text-[11px] md:text-[12px] text-[#0a2225]/70" style={inter}>
                          From {formatPrice(trip.price_per_person, trip.currency)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: luxury mosaic — original full-height sizing */}
          <div className="md:h-full md:max-h-[calc(100svh-56px-96px)]">
            <div className="relative h-full aspect-[4/5] md:aspect-auto">
              <div className="absolute inset-0 translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4 rounded-3xl md:rounded-[32px] border border-[#E5DFC6]/80" />
              <div className="relative h-full overflow-hidden rounded-3xl md:rounded-[32px] bg-white/90 p-2 md:p-3 shadow-[0_18px_40px_rgba(10,34,37,0.18)] flex flex-col">
                <div className="grid grid-cols-3 grid-rows-2 gap-2 md:gap-3 flex-1 min-h-0">
                  <div className="col-span-2 row-span-2 overflow-hidden rounded-3xl">
                    <img src={heroMainImg} alt="Infinity pool overlooking the sea" className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
                  </div>
                  <div className="overflow-hidden rounded-3xl">
                    <img src={heroSecondaryImg} alt="Treehouse hammock retreat" className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
                  </div>
                  <div className="overflow-hidden rounded-3xl">
                    <img src={heroTertiaryImg} alt="Friends hiking a coastal trail" className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
                  </div>
                </div>
                <div className="mt-2 rounded-2xl bg-[#0c4d47] px-3 md:px-4 py-2 text-xs md:text-sm text-[#E5DFC6]">
                  <p className="font-semibold mb-1 text-[12px] md:text-sm" style={inter}>
                    {t('home.hero.storyboardCaption')}
                  </p>
                  <p className="text-[11px] md:text-xs text-[#E5DFC6]/90" style={inter}>
                    {t('home.hero.storyboardDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
