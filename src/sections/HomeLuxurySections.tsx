import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Real images from assets
import heroMain from "@/assets/sections/built-for-every-side-main.jpg";
import heroRightTop from "@/assets/resort-pool-palms.jpg";
import heroRightBottom from "@/assets/elephants-safari.jpg";

// Luxury editorial photography for "How Goldsainte AI works" accordion
import santoriniStepsImg from "@/assets/santorini-steps.jpg";
import veniceGondolaImg from "@/assets/venice-gondola.jpg";
import hotAirBalloonsImg from "@/assets/hot-air-balloons.jpg";
import tropicalAerialImg from "@/assets/tropical-islands-aerial.jpg";
import mountainBridgeImg from "@/assets/mountain-bridge-adventure.jpg";

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
          <div className="space-y-3 text-center md:text-left">
            <p className="inline-flex rounded-full bg-[#0c4d47] px-2 md:px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.06em] md:tracking-[0.12em] text-[#D4C07A] whitespace-nowrap">
              {t('home.builtForEverySide.badge')}
            </p>
            <h2 className="font-secondary text-[26px] leading-tight text-[#0a2225] md:text-4xl md:whitespace-nowrap">
              {t('home.builtForEverySide.title')}
            </h2>
            <p className="max-w-md mx-auto md:mx-0 text-sm text-[#4A4A4A]">
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
  const [activeStep, setActiveStep] = useState("step-1");

  const steps = [
    {
      id: "step-1",
      number: "01",
      label: "Share your inspiration",
      body: t('home.howItWorks.step1.body'),
      image: santoriniStepsImg,
      alt: "Santorini steps overlooking the sea",
    },
    {
      id: "step-2",
      number: "02",
      label: "Madison drafts your storyboard",
      body: t('home.howItWorks.step2.body'),
      image: veniceGondolaImg,
      alt: "Venice gondola on serene canals",
    },
    {
      id: "step-3",
      number: "03",
      label: "Creators and agents collaborate",
      body: t('home.howItWorks.step3.body'),
      image: hotAirBalloonsImg,
      alt: "Hot air balloons over scenic landscape",
    },
    {
      id: "step-4",
      number: "04",
      label: "Review, chat & book",
      body: t('home.howItWorks.step4.body'),
      image: tropicalAerialImg,
      alt: "Tropical islands aerial view",
    },
  ];

  const activeImage = steps.find(s => s.id === activeStep)?.image || mountainBridgeImg;
  const activeAlt = steps.find(s => s.id === activeStep)?.alt || "Mountain bridge adventure";

  return (
    <section className="bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-10 md:mb-14 text-center md:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8B7D5D] mb-3">
            {t('home.howItWorks.sectionTitle')}
          </p>
          <h2 className="font-secondary text-[26px] leading-[1.15] text-[#0a2225] md:text-[40px] md:whitespace-nowrap">
            {t('home.howItWorks.headline')}
          </h2>
        </div>

        {/* Two Column Layout: Image + Accordion */}
        <div className="flex flex-col-reverse gap-8 md:flex-row md:gap-12 lg:gap-16">
          {/* LEFT: Dynamic Image with Crossfade */}
          <div className="w-full md:w-[42%] lg:w-[45%]">
            <div className="relative aspect-[3/4] max-h-[420px] overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(10,34,37,0.12)]">
              {steps.map((step) => (
                <img
                  key={step.id}
                  src={step.image}
                  alt={step.alt}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out",
                    activeStep === step.id ? "opacity-100" : "opacity-0"
                  )}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Accordion */}
          <div className="w-full md:w-[58%] lg:w-[55%]">
            <Accordion
              type="single"
              collapsible
              value={activeStep}
              onValueChange={(value) => value && setActiveStep(value)}
              className="space-y-0"
            >
              {steps.map((step) => (
                <AccordionItem
                  key={step.id}
                  value={step.id}
                  className="border-b border-[#E5DFC6] first:border-t-0 last:border-b-0"
                >
                  <AccordionTrigger className="py-5 hover:no-underline group [&[data-state=open]>svg]:text-[#C7B892]">
                    <div className="flex items-center gap-4 text-left">
                      <span className={cn(
                        "text-xl font-light transition-colors duration-300",
                        activeStep === step.id ? "text-[#0a2225]" : "text-[#C7B892]"
                      )}>
                        {step.number}
                      </span>
                      <span className={cn(
                        "font-secondary text-lg transition-colors duration-300",
                        activeStep === step.id ? "text-[#0a2225]" : "text-[#6B6B6B]"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-10 pr-4">
                    <p className="text-[15px] leading-[1.7] text-[#5A5A5A]">
                      {step.body}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Subtle footer note */}
            <p className="mt-8 text-[13px] leading-relaxed text-[#8B8B8B] max-w-sm">
              {t('home.howItWorks.description')}
            </p>
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
    <section className="bg-[#FDF9F0] px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="space-y-3 text-center md:text-left">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A7151]">
            {t('home.trustSafety.badge')}
          </p>
          <h2 className="font-secondary text-[26px] leading-tight text-[#0a2225] md:text-4xl">
            {t('home.trustSafety.title')}
          </h2>
          <p className="max-w-lg mx-auto md:mx-0 text-sm text-[#4A4A4A]">
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