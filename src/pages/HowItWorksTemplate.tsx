import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AvailabilityNotice } from "@/components/onboarding/AvailabilityNotice";

const SERIF = "'Cormorant Garamond', Georgia, serif";

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
    <main className="flex-1 bg-[#f7f3ea] text-[#0a2225] selection:bg-[#c9a84c]/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 md:py-28">
        {/* HERO */}
        <header className="text-center mb-20 md:mb-24">
          <div className="flex justify-center mb-10">
            <div className="w-px h-16 bg-[#0a2225]" />
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#c9a84c] font-bold mb-8">{eyebrow}</p>
          <h1
            className="text-5xl md:text-6xl italic mb-8 tracking-tight leading-[0.95] text-balance"
            style={{ fontFamily: SERIF }}
          >
            {title}
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 font-light max-w-xl mx-auto leading-relaxed text-pretty">
            {subtitle}
          </p>
        </header>

        {factCard && (
          <div className="border-l border-[#c9a84c] pl-6 py-2 mb-16 max-w-2xl mx-auto">
            <p className="text-base italic text-[#0a2225]/80 leading-relaxed" style={{ fontFamily: SERIF }}>
              {factCard.text}
            </p>
          </div>
        )}

        <AvailabilityNotice />

        {/* STEPS */}
        <ol className="space-y-16 md:space-y-20 mx-auto max-w-2xl mt-12">
          {steps.map((step) => (
            <li key={step.number} className="grid grid-cols-[auto_1fr] gap-8 md:gap-12 items-start">
              <span
                className="text-3xl md:text-4xl italic text-[#c9a84c] leading-none pt-2"
                style={{ fontFamily: SERIF }}
              >
                {step.number}
              </span>
              <div className="pt-1 border-t border-[#0a2225]/10 -mt-2 pt-6">
                <h2 className="text-2xl md:text-3xl italic text-[#0a2225] mb-4 tracking-tight" style={{ fontFamily: SERIF }}>
                  {step.title}
                </h2>
                <p className="text-base text-[#0a2225]/75 leading-relaxed font-light">{step.description}</p>
                {step.cta && (
                  <Link
                    to={step.cta.to}
                    className="inline-flex items-center gap-2 mt-5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#0c4d47] border-b border-[#0c4d47] pb-1 hover:text-[#0a2225] hover:border-[#0a2225] transition-colors"
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

        <div className="text-center mt-20 mb-16">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#0a2225]/40 font-bold mb-3">
            {t('howItWorks.preferToWatch', 'Prefer to watch?')}
          </p>
          <Link
            to="/help/video-tour"
            className="inline-flex items-center gap-2 text-[#0c4d47] text-sm border-b border-[#0c4d47] pb-0.5 hover:text-[#0a2225] hover:border-[#0a2225] transition-colors"
          >
            <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t('howItWorks.videoTour', 'Watch a 90-second tour of Goldsainte')}
          </Link>
        </div>

        {/* FINAL CTA */}
        <div className="mt-20 md:mt-28 bg-[#0a2225] text-[#f7f3ea] px-8 sm:px-12 py-16 md:py-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#c9a84c]/15 rounded-full -mr-24 -mt-24 blur-3xl" />
          <p className="relative z-10 text-[9px] uppercase tracking-[0.3em] text-[#c9a84c] font-bold mb-6">
            Begin
          </p>
          <h2
            className="relative z-10 text-4xl md:text-5xl italic mb-6 tracking-tight leading-tight"
            style={{ fontFamily: SERIF }}
          >
            {finalCta.heading}
          </h2>
          <p className="relative z-10 text-base text-[#f7f3ea]/70 max-w-xl mx-auto mb-10 font-light leading-relaxed">
            {finalCta.description}
          </p>
          <Link
            to={finalCta.to}
            className="relative z-10 group inline-flex items-center gap-4 border border-[#f7f3ea] px-12 py-5 transition-all hover:bg-[#f7f3ea] hover:text-[#0a2225]"
          >
            <span className="text-xs uppercase tracking-[0.2em] font-semibold">{finalCta.label}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </main>
  );
}