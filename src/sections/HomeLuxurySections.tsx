import React from "react";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useTranslation } from "react-i18next";

// Real images from assets
import heroMain from "@/assets/sections/built-for-every-side-main.jpg";
import heroRightTop from "@/assets/resort-pool-palms.jpg";
import heroRightBottom from "@/assets/elephants-safari.jpg";

// Luxury editorial photography for "How Goldsainte AI works"
import aiStep1 from "@/assets/luxury-infinity-pool.jpg";
import aiStep2 from "@/assets/luxury-venice-sunset.jpg";
import aiStep3 from "@/assets/creator-beach-selfie.jpg";
import aiStep4 from "@/assets/luxury-tropical-hideaway.jpg";

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
            <p className="inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[#D4C07A]">
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
      <span className="mb-3 inline-flex w-fit rounded-full bg-[#0c4d47] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[#D4C07A]">
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
/*  How Goldsainte AI works - Luxury Editorial Layout                         */
/* -------------------------------------------------------------------------- */

export const HowGoldsainteWorksSection: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      id: "1",
      label: "Share your inspiration",
      title: t('home.howItWorks.step1.title'),
      body: t('home.howItWorks.step1.body'),
      image: aiStep1,
      alt: "Infinity pool overlooking tropical paradise",
    },
    {
      id: "2",
      label: "Madison drafts your storyboard",
      title: t('home.howItWorks.step2.title'),
      body: t('home.howItWorks.step2.body'),
      image: aiStep2,
      alt: "Romantic sunset over Venice canals",
    },
    {
      id: "3",
      label: "Creators and agents collaborate",
      title: t('home.howItWorks.step3.title'),
      body: t('home.howItWorks.step3.body'),
      image: aiStep3,
      alt: "Creator capturing beach moment",
    },
    {
      id: "4",
      label: "Review, chat & book",
      title: t('home.howItWorks.step4.title'),
      body: t('home.howItWorks.step4.body'),
      image: aiStep4,
      alt: "Secluded tropical hideaway retreat",
    },
  ];

  return (
    <section className="bg-[#FDF9F0] px-4 py-20 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section Header - Editorial Style */}
        <div className="mb-16 md:mb-24 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8B7D5D] mb-4">
            {t('home.howItWorks.sectionTitle')}
          </p>
          <h2 className="font-secondary text-3xl leading-[1.15] text-[#0a2225] md:text-[44px] mb-5">
            {t('home.howItWorks.headline')}
          </h2>
          <p className="text-[15px] leading-relaxed text-[#5A5A5A] max-w-lg">
            {t('home.howItWorks.description')}
          </p>
        </div>

        {/* Steps - Staggered Editorial Layout */}
        <div className="space-y-16 md:space-y-28">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col gap-8 md:gap-16 md:items-center",
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                {/* Large Editorial Image */}
                <div className="w-full md:w-[55%]">
                  <div className="overflow-hidden rounded-3xl border border-[#E8E0D0] shadow-[0_20px_50px_rgba(10,34,37,0.12)]">
                    <OptimizedImage
                      src={step.image}
                      alt={step.alt}
                      className="aspect-[4/3] w-full object-cover"
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, 55vw"
                    />
                  </div>
                </div>

                {/* Text Content */}
                <div className={cn(
                  "w-full md:w-[45%] space-y-4",
                  isEven ? "md:pl-4" : "md:pr-4"
                )}>
                  {/* Elegant Step Indicator */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-light text-[#C7B892]">{step.id}</span>
                    <span className="text-[#C7B892]">·</span>
                    <span className="text-[11px] uppercase tracking-[0.15em] text-[#8B7D5D]">
                      Step {step.id.toLowerCase()}
                    </span>
                  </div>
                  
                  <h3 className="font-secondary text-2xl leading-snug text-[#0a2225] md:text-[28px]">
                    {step.title}
                  </h3>
                  
                  <p className="text-[15px] leading-[1.7] text-[#5A5A5A]">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
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
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A7151]">
            {t('home.trustSafety.badge')}
          </p>
          <h2 className="font-secondary text-3xl leading-tight text-[#0a2225] md:text-4xl">
            {t('home.trustSafety.title')}
          </h2>
          <p className="max-w-lg text-sm text-[#4A4A4A]">
            {t('home.trustSafety.description')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#E5DFC6] bg-white p-5 shadow-[0_8px_20px_rgba(10,34,37,0.08)]"
            >
              <h3 className="text-sm font-semibold text-[#0a2225]">
                {item.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#4A4A4A]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};