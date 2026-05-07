// src/components/home/HomeHero.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import heroMainImg from "@/assets/maximilien-t-scharner-FD0Ga_KJTwM-unsplash.jpeg"; // infinity pool
import heroSecondaryImg from "@/assets/austin-distel-riQNJpiaGgE-unsplash.jpeg"; // treehouse / hammock
import heroTertiaryImg from "@/assets/felix-rostig-UmV2wr-Vbq8-unsplash.jpeg"; // friends hiking

export function HomeHero() {
  const { t } = useTranslation();

  const fallbackTrips = [
    { slug: null, title: "Bali Wellness Retreat", price: 2199, currency: "USD", image: heroMainImg },
    { slug: null, title: "Kyoto Cultural Immersion", price: 3799, currency: "USD", image: heroSecondaryImg },
    { slug: null, title: "Amalfi Coast Weekend", price: 2499, currency: "USD", image: heroTertiaryImg },
  ];

  const { data: featured } = useQuery({
    queryKey: ["hero-popular-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packaged_trips")
        .select("slug, title, cover_image_url, price_per_person, currency")
        .eq("is_featured", true)
        .eq("status", "published")
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  const popularTrips =
    featured && featured.length >= 3
      ? featured.slice(0, 3).map((t) => ({
          slug: t.slug,
          title: t.title,
          price: t.price_per_person,
          currency: t.currency || "USD",
          image: t.cover_image_url,
        }))
      : fallbackTrips;

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <section className="bg-[#f7f3ea] text-[#0a2225] md:min-h-[calc(100vh-56px)] md:max-h-[calc(100vh-56px)]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12 md:h-full">
        {/* Two Column Grid — stretch forces equal height */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch md:h-full">
          {/* LEFT: Copy & CTAs — space-between anchors pill top, CTA bottom */}
          <div className="flex flex-col">
              {/* Pill Badge */}
              <div className="flex justify-center md:justify-start">
                <div className="inline-flex items-center gap-1 md:gap-2 rounded-full border border-[#E5DFC6] bg-[#BFAD72] px-2.5 md:px-3 py-1.5 text-[11px] md:text-sm font-medium uppercase tracking-[0.08em] md:tracking-[0.12em] text-[#073331] whitespace-nowrap">
                  <span>{t('common.travelers')}</span>
                  <span className="h-[1px] w-2 md:w-4 bg-[#073331]/30" />
                  <span>{t('common.creators')}</span>
                  <span className="h-[1px] w-2 md:w-4 bg-[#073331]/30" />
                  <span>{t('common.agents')}</span>
                </div>
              </div>

              {/* Headline — 40px below pill */}
              <h1 className="mt-10 font-display text-3xl leading-tight md:text-4xl lg:text-[38px]">
                <em>Discover, Create, and Book Extraordinary Travel.</em>
              </h1>

              {/* Description — 32px below headline */}
              <p className="mt-8 max-w-xl text-sm md:text-base leading-relaxed text-[#0a2225] font-semibold">
                Curated by creators, crafted by experts, and powered by intelligent design.
              </p>
              <p className="mt-2 max-w-xl text-sm md:text-base leading-relaxed text-[#4a4a4a] italic">
                Explore personalized itineraries, custom travel packages, and AI-generated journeys designed around how you want to experience the world.
              </p>
              <p className="mt-4 max-w-xl text-sm md:text-base leading-relaxed text-[#4a4a4a]">
                Turn travel memories into income—or discover your next journey in minutes.
              </p>

            {/* CTAs — fixed 32px below copy */}
            <div className="flex flex-col gap-3 mt-8 max-w-sm">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-6 py-2.5 text-sm font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#073331] w-full"
              >
                {t('home.hero.postDreamTrip')}
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-[#BFAD72] bg-white px-6 py-2.5 text-sm font-semibold text-[#0a2225] transition-all hover:bg-[#BFAD72] hover:text-white w-full"
              >
                {t('home.hero.seeHowItWorks')}
              </a>
            </div>

            {/* Popular Trips strip */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0a2225]/60">
                  Popular Trips
                </span>
                <span className="h-px flex-1 bg-[#E5DFC6]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {popularTrips.map((trip) => (
                  <Link
                    key={trip.title}
                    to={trip.slug ? `/marketplace/trip/${trip.slug}` : "/marketplace"}
                    className="group block"
                  >
                    <div className="overflow-hidden rounded-xl aspect-square">
                      <img
                        src={trip.image}
                        alt={trip.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 font-secondary text-[12px] md:text-[13px] leading-snug text-[#0a2225] line-clamp-1 transition-colors group-hover:text-[#0c4d47]">
                      {trip.title}
                    </p>
                    <p className="text-[11px] md:text-[12px] text-[#0a2225]/70">
                      From {formatPrice(trip.price, trip.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Luxury visual stack — h-full stretches to match left */}
          <div className="h-full md:max-h-[calc(100vh-56px-96px)]">
            <div className="relative h-full">
              {/* soft frame */}
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[32px] border border-[#E5DFC6]/80" />
              <div className="relative h-full overflow-hidden rounded-[32px] bg-white/90 p-3 shadow-[0_18px_40px_rgba(10,34,37,0.18)] flex flex-col">
                <div className="grid grid-cols-3 gap-2 md:gap-3 flex-1">
                  {/* Main hero image */}
                  <div className="col-span-2 row-span-2 overflow-hidden rounded-3xl">
                    <img
                      src={heroMainImg}
                      alt={t('home.hero.infinityPool')}
                      className="h-full w-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                    />
                  </div>

                  {/* Secondary images */}
                  <div className="overflow-hidden rounded-3xl">
                    <img
                      src={heroSecondaryImg}
                      alt={t('home.hero.treehouseHammock')}
                      className="h-full w-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                    />
                  </div>
                  <div className="overflow-hidden rounded-3xl">
                    <img
                      src={heroTertiaryImg}
                      alt={t('home.hero.friendsHiking')}
                      className="h-full w-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* Caption card */}
                <div className="mt-2 rounded-2xl bg-[#0c4d47] px-4 py-2 text-sm text-[#E5DFC6]">
                  <p className="font-semibold mb-1">
                    {t('home.hero.storyboardCaption')}
                  </p>
                  <p className="text-xs text-[#E5DFC6]/90">
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
