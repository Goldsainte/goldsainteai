import React from "react";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useTranslation } from "react-i18next";

// Real images from assets
import heroMain from "@/assets/sections/built-for-every-side-main.jpg";
import heroRightTop from "@/assets/resort-pool-palms.jpg";
import heroRightBottom from "@/assets/elephants-safari.jpg";

import aiStep1 from "@/assets/tokyo-street.jpg";
import aiStep2 from "@/assets/luxury-hotels.jpg";
import aiStep3 from "@/assets/creator-road-trip.jpg";
import aiStep4 from "@/assets/photographer-plane.jpg";

import trustBg from "@/assets/luxury-destinations.jpg";

/* -------------------------------------------------------------------------- */
/*  Built for every side of luxury travel                                     */
/* -------------------------------------------------------------------------- */

export const BuiltForEverySideSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-center">
        {/* LEFT SIDE: COPY + PERSONAS */}
        <div className="space-y-8 md:w-3/5">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-[#C7B892]/30 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#7A7151]">
              {t('home.builtForEverySide.badge')}
            </p>
            <h2 className="font-secondary text-3xl leading-tight text-[#0a2225] md:text-4xl">
              {t('home.builtForEverySide.title')}
            </h2>
            <p className="max-w-md text-sm text-[#4A4A4A]">
              {t('home.builtForEverySide.description')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PersonaCard
              label={t('home.builtForEverySide.travelers.label')}
              items={[
                t('home.builtForEverySide.travelers.item1'),
                t('home.builtForEverySide.travelers.item2'),
                t('home.builtForEverySide.travelers.item3'),
              ]}
            />
            <PersonaCard
              label={t('home.builtForEverySide.creators.label')}
              items={[
                t('home.builtForEverySide.creators.item1'),
                t('home.builtForEverySide.creators.item2'),
                t('home.builtForEverySide.creators.item3'),
              ]}
            />
            <PersonaCard
              label={t('home.builtForEverySide.agents.label')}
              items={[
                t('home.builtForEverySide.agents.item1'),
                t('home.builtForEverySide.agents.item2'),
                t('home.builtForEverySide.agents.item3'),
              ]}
            />
            <PersonaCard
              label={t('home.builtForEverySide.brands.label')}
              items={[
                t('home.builtForEverySide.brands.item1'),
                t('home.builtForEverySide.brands.item2'),
                t('home.builtForEverySide.brands.item3'),
              ]}
            />
          </div>
        </div>

        {/* RIGHT SIDE: COLLAGE (VERTICALLY CENTERED) */}
        <div className="md:w-2/5 flex items-center justify-center">
          <div className="relative w-full max-w-md md:max-w-lg rounded-[32px] bg-white p-3 shadow-[0_24px_60px_rgba(10,34,37,0.18)]">
            {/* subtle stacked card in the back */}
            <div className="pointer-events-none absolute inset-3 translate-x-3 translate-y-4 rounded-[28px] border border-[#E5DFC6] bg-[#FDF9F0]" />

            <div className="relative space-y-3 rounded-[28px] bg-white p-3">
              {/* TOP HERO IMAGE — NOW THE ALPINE TREE PHOTO */}
              <div className="overflow-hidden rounded-[24px]">
                <img
                  src={heroMain}
                  alt="Alpine tree in snow at golden hour, with two travelers"
                  className="h-64 w-full object-cover md:h-80"
                />
              </div>

              {/* BOTTOM TWO IMAGES */}
              <div className="grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-[20px]">
                  <img
                    src={heroRightTop}
                    alt="Poolside scene at a modern resort"
                    className="h-32 w-full object-cover md:h-36"
                  />
                </div>
                <div className="overflow-hidden rounded-[20px]">
                  <img
                    src={heroRightBottom}
                    alt="Elephants walking across a golden savannah"
                    className="h-32 w-full object-cover md:h-36"
                  />
                </div>
              </div>

              <p className="rounded-[18px] bg-[#F5EFE1] px-4 py-3 text-[11px] leading-relaxed text-[#6E6650]">
                {t('home.builtForEverySide.collageCaption')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

type PersonaCardProps = {
  label: string;
  items: string[];
};

const PersonaCard: React.FC<PersonaCardProps> = ({ label, items }) => {
  return (
    <div className="flex h-full flex-col rounded-[24px] border border-[#E5DFC6] bg-white/80 px-5 py-5">
      <span className="mb-3 inline-flex w-fit rounded-full bg-[#0a2225] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#E5DFC6]">
        {label}
      </span>
      <ul className="space-y-2 text-[13px] text-[#3F3A33]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[7px] h-[3px] w-[3px] flex-shrink-0 rounded-full bg-[#C7B892]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  How Goldsainte AI works                                                   */
/* -------------------------------------------------------------------------- */

export const HowGoldsainteWorksSection: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      id: "1",
      title: t('home.howItWorks.step1.title'),
      body: t('home.howItWorks.step1.body'),
      image: aiStep1,
      alt: "City street with warm cinematic tones",
    },
    {
      id: "2",
      title: t('home.howItWorks.step2.title'),
      body: t('home.howItWorks.step2.body'),
      image: aiStep2,
      alt: "Architectural city scene in soft light",
    },
    {
      id: "3",
      title: t('home.howItWorks.step3.title'),
      body: t('home.howItWorks.step3.body'),
      image: aiStep3,
      alt: "Friends on a rooftop vehicle in open landscape",
    },
    {
      id: "4",
      title: t('home.howItWorks.step4.title'),
      body: t('home.howItWorks.step4.body'),
      image: aiStep4,
      alt: "Traveler with camera capturing the moment",
    },
  ];

  return (
    <section className="bg-[#F6F0E4] px-5 py-12 md:px-4 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:gap-10 md:flex-row md:items-start">
        {/* Header - Compact on mobile */}
        <div className="md:w-2/5 space-y-2 md:space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[#7A7151]">
            {t('home.howItWorks.sectionTitle')}
          </p>
          <h2 className="font-secondary text-2xl leading-tight text-[#0a2225] md:text-4xl">
            {t('home.howItWorks.headline')}
          </h2>
          <p className="max-w-sm text-sm text-[#4A4A4A] hidden md:block">
            {t('home.howItWorks.description')}
          </p>
        </div>

        {/* Steps */}
        <div className="md:w-3/5 space-y-4 md:space-y-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex gap-3 md:gap-6 md:items-center rounded-2xl bg-white/60 p-3 md:p-0 md:bg-transparent md:rounded-none",
                "md:flex-col",
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              )}
            >
              {/* Image - Small on mobile, side by side */}
              <div className="w-[35%] flex-shrink-0 md:w-1/2">
                <div className="overflow-hidden rounded-xl md:rounded-[26px] bg-[#D8CFBD]/40 shadow-[0_8px_20px_rgba(10,34,37,0.12)] md:shadow-[0_18px_40px_rgba(10,34,37,0.18)]">
                  <OptimizedImage
                    src={step.image}
                    alt={step.alt}
                    className="h-24 w-full object-cover md:h-64"
                    priority={index === 0}
                    sizes="(max-width: 768px) 35vw, 50vw"
                  />
                </div>
              </div>

              {/* Text - Compact on mobile */}
              <div className="flex-1 md:w-1/2 space-y-1 md:space-y-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full border border-[#C7B892] text-[10px] md:text-[11px] font-semibold text-[#7A7151]">
                    {step.id}
                  </div>
                  <span className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] md:tracking-[0.22em] text-[#A4987C]">
                    {t('common.step')} {step.id}
                  </span>
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-[#0a2225] leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs md:text-sm leading-relaxed text-[#4A4A4A]">
                  {step.body}
                </p>
              </div>
            </div>
          ))}

          {/* Progress dots - Mobile only */}
          <div className="flex justify-center gap-2 pt-2 md:hidden">
            {steps.map((step) => (
              <div
                key={step.id}
                className="h-1.5 w-1.5 rounded-full bg-[#C7B892]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Trust, safety & payments                                                  */
/* -------------------------------------------------------------------------- */

export const TrustSafetyPaymentsSection: React.FC = () => {
  const { t } = useTranslation();

  const items = [
    {
      title: t('home.trustSafety.item1.title'),
      body: t('home.trustSafety.item1.body'),
    },
    {
      title: t('home.trustSafety.item2.title'),
      body: t('home.trustSafety.item2.body'),
    },
    {
      title: t('home.trustSafety.item3.title'),
      body: t('home.trustSafety.item3.body'),
    },
    {
      title: t('home.trustSafety.item4.title'),
      body: t('home.trustSafety.item4.body'),
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0a2225] px-4 py-16 md:py-24">
      {/* Subtle background image overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <img
          src={trustBg}
          alt="Soft-focus luxury hotel lobby"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2225] via-[#0a2225]/95 to-[#0a2225]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#C9B786]">
            {t('home.trustSafety.badge')}
          </p>
          <h2 className="font-secondary text-3xl leading-tight text-[#FDFBF5] md:text-4xl">
            {t('home.trustSafety.title')}
          </h2>
          <p className="max-w-lg text-sm text-[#D9D1C0]">
            {t('home.trustSafety.description')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#344240] bg-[#111C1D]/95 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
            >
              <h3 className="text-sm font-semibold text-[#F5EEE0]">
                {item.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#C8C0B0]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};