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
  factCard?: { text: string; icon?: React.ComponentType<{ className?: string }> };
  extraSection?: React.ReactNode;
}

export function HowItWorksTemplate({ eyebrow, title, subtitle, steps, finalCta, factCard, extraSection }: Props) {
  const { t } = useTranslation();
  return (
    <main className="flex-1 bg-[#FDF9F0] text-[#0a2225]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 md:pt-24 pb-20 md:pb-24">
        {/* HERO */}
        <header className="max-w-3xl mb-16 md:mb-20">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">{eyebrow}</p>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] mb-6">
            {title}
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </header>

        {factCard && (
          <div className="border-l-2 border-[#C7A962] pl-6 py-2 mb-16 max-w-2xl">
            <p className="text-base text-[#0a2225]/80 leading-relaxed">
              {factCard.text}
            </p>
          </div>
        )}

        <AvailabilityNotice />

        {/* STEPS */}
        <ol className="mt-12 max-w-4xl">
          {steps.map((step) => (
            <li key={step.number} className="py-14 md:py-16 border-t border-[#E5DFC6] grid md:grid-cols-12 gap-8 md:gap-14">
              <div className="md:col-span-4">
                <p className="font-secondary text-3xl md:text-4xl text-[#C7A962]">
                  {step.number}
                </p>
              </div>
              <div className="md:col-span-8">
                <h2 className="font-secondary text-2xl md:text-3xl leading-[1.25] text-[#0a2225] mb-4">
                  {step.title}
                </h2>
                <p className="text-base text-[#0a2225]/70 leading-relaxed">{step.description}</p>
                {step.cta && (
                  <Link
                    to={step.cta.to}
                    className="inline-flex items-center gap-2 mt-6 text-[11px] uppercase tracking-[0.22em] text-[#0c4d47] border-b border-[#0c4d47] pb-1 hover:text-[#0a2225] hover:border-[#0a2225] transition-colors"
                  >
                    {step.cta.label}
                    <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        {extraSection && <div className="mt-20">{extraSection}</div>}

        <div className="border-t border-[#E5DFC6] mt-16 pt-10 mb-16">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#0a2225]/40 mb-3">
            {t('howItWorks.preferToWatch', 'Prefer to watch?')}
          </p>
        </div>

        {/* FINAL CTA */}
        <div className="mt-16 md:mt-20 bg-[#0a2225] text-[#FDF9F0] px-8 sm:px-12 py-16 md:py-20 rounded-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C7A962] mb-5">
            Begin
          </p>
          <h2 className="font-secondary text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight mb-6 max-w-2xl">
            {finalCta.heading}
          </h2>
          <p className="text-base text-[#FDF9F0]/70 max-w-2xl mb-10 leading-relaxed">
            {finalCta.description}
          </p>
          <Link
            to={finalCta.to}
            className="group inline-flex items-center gap-3 bg-[#C7A962] text-[#0a2225] px-10 py-4 rounded-sm transition-all hover:bg-[#FDF9F0]"
          >
            <span className="text-[11px] uppercase tracking-[0.22em] font-medium">{finalCta.label}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </main>
  );
}
