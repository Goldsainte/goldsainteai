import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AvailabilityNotice } from "@/components/onboarding/AvailabilityNotice";

export interface HowItWorksStep {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; to: string };
}

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: HowItWorksStep[];
  finalCta: { heading: string; description: string; label: string; to: string };
  plainSummary?: string;
  extraSection?: React.ReactNode;
}

export function HowItWorksTemplate({ eyebrow, title, subtitle, steps, finalCta, plainSummary, extraSection }: Props) {
  const { t } = useTranslation();
  return (
    <main className="flex-1 bg-[#FDF9F0]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-20">
        <header className="text-center mb-14 md:mb-20">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C7A962] font-medium mb-4">{eyebrow}</p>
          <h1 className="font-secondary text-3xl md:text-5xl text-[#0a2225] mb-4 text-balance">{title}</h1>
          <p className="text-base md:text-lg text-[#6B7280] max-w-2xl mx-auto text-pretty">{subtitle}</p>
          {plainSummary && (
            <p className="text-base text-[#4a4a4a] mt-6 italic max-w-2xl mx-auto">
              {t('howItWorks.inOneSentence', 'In one sentence:')} {plainSummary}
            </p>
          )}
        </header>

        <AvailabilityNotice />

        <ol className="space-y-10 md:space-y-14 mx-auto max-w-2xl">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="grid grid-cols-[auto_1fr] gap-5 md:gap-8 items-start">
                <div className="flex flex-col items-center gap-2">
                  <span className="font-secondary text-2xl md:text-3xl text-[#C7A962]">{step.number}</span>
                  <div className="h-10 w-10 rounded-full bg-white border border-[#E5DFC6] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#0c4d47]" />
                  </div>
                </div>
                <div className="pt-1">
                  <h2 className="font-secondary text-xl md:text-2xl text-[#0a2225] mb-2">{step.title}</h2>
                  <p className="text-sm md:text-base text-[#4A4A4A] leading-relaxed">{step.description}</p>
                  {step.cta && (
                    <Link
                      to={step.cta.to}
                      className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#0c4d47] hover:underline"
                    >
                      {step.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {extraSection}

        <div className="text-center mt-12 mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9A9384] mb-2">
            {t('howItWorks.preferToWatch', 'Prefer to watch?')}
          </p>
          <Link to="/help/video-tour" className="inline-flex items-center gap-2 text-[#0c4d47] underline text-sm">
            <Play className="h-4 w-4" />
            {t('howItWorks.videoTour', 'Watch a 90-second tour of Goldsainte')}
          </Link>
        </div>

        <div className="mt-16 md:mt-24 rounded-2xl bg-[#0a2225] text-white px-6 sm:px-10 py-10 md:py-14 text-center">
          <h2 className="font-secondary text-2xl md:text-3xl mb-3">{finalCta.heading}</h2>
          <p className="text-sm md:text-base text-white/70 max-w-xl mx-auto mb-6">{finalCta.description}</p>
          <Link
            to={finalCta.to}
            className="inline-flex items-center gap-2 rounded-full bg-[#C7A962] hover:bg-[#b89852] text-[#0a2225] font-medium px-6 py-3 text-sm transition-colors"
          >
            {finalCta.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}