// src/components/home/HomeHero.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroMainImg from "@/assets/maximilien-t-scharner-FD0Ga_KJTwM-unsplash.jpeg"; // infinity pool
import heroSecondaryImg from "@/assets/austin-distel-riQNJpiaGgE-unsplash.jpeg"; // treehouse / hammock
import heroTertiaryImg from "@/assets/felix-rostig-UmV2wr-Vbq8-unsplash.jpeg"; // friends hiking

export function HomeHero() {
  const { t } = useTranslation();

  return (
    <section className="bg-[#f7f3ea] text-[#0a2225]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-8 pt-16 md:flex-row md:items-center md:pt-20 md:pb-12">
        {/* LEFT: Copy & CTAs */}
        <div className="w-full md:w-[52%] space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-[#BFAD72] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#0C4D47]">
            <span>{t('common.travelers')}</span>
            <span className="h-[1px] w-4 bg-[#0C4D47]/30" />
            <span>{t('common.creators')}</span>
            <span className="h-[1px] w-4 bg-[#0C4D47]/30" />
            <span>{t('common.agents')}</span>
          </div>

          <h1 className="font-display text-3xl leading-snug md:text-4xl lg:text-[42px]">
            Where <em>inspiration</em> becomes a <em>storyboard</em> — and the perfect <em>creator + agent</em>{" "}
            team builds the trip.
          </h1>

          <p className="max-w-xl text-sm md:text-base leading-relaxed text-[#4a4a4a]">
            {t('home.hero.mainDescription')}
          </p>

          {/* Primary CTAs - Mobile optimized layout */}
          <div className="flex flex-col gap-3 pt-1 md:flex-row md:flex-wrap md:items-center">
            {/* Primary CTA - Full width on mobile */}
            <Link
              to="/post-trip"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-6 py-3 text-sm font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#073331] w-full md:w-auto"
            >
              {t('home.hero.postDreamTrip')}
            </Link>

            {/* Secondary CTAs - Row of 2 on mobile */}
            <div className="flex gap-2 w-full md:w-auto">
              <Link
                to="/creators"
                className="flex-1 md:flex-none text-center rounded-full border border-[#BFAD72] bg-white px-4 py-2.5 text-sm font-semibold text-[#0a2225] transition-all hover:bg-[#BFAD72] hover:text-white"
              >
                {t('home.hero.browseCreators')}
              </Link>
              <Link
                to="/agents"
                className="flex-1 md:flex-none text-center rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-sm font-semibold text-[#0a2225] transition-all hover:bg-[#BFAD72] hover:text-white"
              >
                {t('home.hero.browseAgents')}
              </Link>
            </div>

            {/* Marketplace - Full width on mobile */}
            <Link
              to="/marketplace"
              className="text-center rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-sm font-semibold text-[#0a2225] transition-all hover:bg-[#BFAD72] hover:text-white w-full md:w-auto"
            >
              {t('home.hero.marketplace')}
            </Link>
          </div>
        </div>

        {/* RIGHT: Luxury visual stack */}
        <div className="w-full md:w-[48%]">
          <div className="relative mx-auto max-w-md">
            {/* soft frame */}
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[32px] border border-[#E5DFC6]/80" />
            <div className="relative overflow-hidden rounded-[32px] bg-white/90 p-3 shadow-[0_18px_40px_rgba(10,34,37,0.18)]">
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {/* Main hero image */}
                <div className="col-span-2 row-span-2 overflow-hidden rounded-3xl">
                  <img
                    src={heroMainImg}
                    alt={t('home.hero.infinityPool')}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Secondary images */}
                <div className="overflow-hidden rounded-3xl">
                  <img
                    src={heroSecondaryImg}
                    alt={t('home.hero.treehouseHammock')}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-3xl">
                  <img
                    src={heroTertiaryImg}
                    alt={t('home.hero.friendsHiking')}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Caption card */}
              <div className="mt-3 rounded-2xl bg-[#0c4d47] px-4 py-3 text-sm text-[#E5DFC6]">
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

      {/* Disclaimer section - BELOW photo collage */}
      <div className="max-w-6xl mx-auto px-4 pb-12 text-center space-y-3">
        <p className="text-[11px] text-[#8D8D8D] max-w-2xl mx-auto">
          {t('home.hero.marketplaceDisclaimer')}
        </p>
        <p className="text-sm text-[#8D8D8D]">
          {t('home.hero.gentleAssist')}{" "}
          <Link
            to="/concierge"
            className="underline underline-offset-2 text-[#0c4d47]"
          >
            {t('home.hero.askAI')}
          </Link>
        </p>
        <p className="text-xs text-[#8D8D8D] max-w-md mx-auto">
          {t('home.hero.trustPromise')}
        </p>
      </div>
    </section>
  );
}
