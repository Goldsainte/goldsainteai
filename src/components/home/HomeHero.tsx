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
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 md:pt-16 lg:pt-20 md:pb-12">
        {/* Centered Pill Badge */}
        <div className="flex justify-center md:justify-start mb-8 md:mb-10">
          <div className="inline-flex items-center gap-1 md:gap-2 rounded-full border border-[#E5DFC6] bg-[#BFAD72] px-2.5 md:px-3 py-1.5 text-[11px] md:text-sm font-medium uppercase tracking-[0.08em] md:tracking-[0.12em] text-[#073331] whitespace-nowrap">
            <span>{t('common.travelers')}</span>
            <span className="h-[1px] w-2 md:w-4 bg-[#073331]/30" />
            <span>{t('common.creators')}</span>
            <span className="h-[1px] w-2 md:w-4 bg-[#073331]/30" />
            <span>{t('common.agents')}</span>
            <span className="h-[1px] w-2 md:w-4 bg-[#073331]/30" />
            <span>{t('common.brands')}</span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start">
          {/* LEFT: Copy & CTAs */}
          <div className="w-full md:w-[52%] space-y-5">
            <h1 className="font-display text-3xl leading-snug md:text-4xl lg:text-[42px]">
            Turn Your Travel Vision Into a <em>Storyboard</em> — Then Let{" "}
            <em>Creators & Agents</em> Compete to Bring It to Life.
           </h1>

          <p className="max-w-xl text-sm md:text-base leading-relaxed text-[#4a4a4a] whitespace-pre-line">
            {t('home.hero.mainDescription')}
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col gap-3 pt-1 max-w-sm">
            <Link
              to="/post-trip"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-6 py-3 text-sm font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#073331] w-full"
            >
              {t('home.hero.postDreamTrip')}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-[#BFAD72] bg-white px-6 py-3 text-sm font-semibold text-[#0a2225] transition-all hover:bg-[#BFAD72] hover:text-white w-full"
            >
              {t('home.hero.seeHowItWorks')}
            </a>
          </div>
        </div>

        {/* RIGHT: Luxury visual stack */}
        <div className="w-full md:w-[48%] md:-mt-1">
          <div className="relative max-w-md">
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
      </div>

    </section>
  );
}
