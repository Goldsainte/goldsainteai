import { useWelcomeModal } from "@/hooks/useWelcomeModal";
import { ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import welcomeHeroImage from "@/assets/luxury-infinity-pool.webp";

export function OnboardingWelcomeModal() {
  const { open, dismiss, accountType, displayName, loading } = useWelcomeModal();

  if (loading || !open || !accountType) return null;

  const name = displayName || "there";

  let title = "";
  let bullets: string[] = [];
  let primaryCta: { label: string; href: string } = {
    label: "Get started",
    href: "/",
  };

  let subtitle = "";
  let footerLine = "Your studio remains here whenever you return.";

  if (accountType === "traveler") {
    title = "Welcome to your private Goldsainte studio.";
    subtitle = "This is where your next journey is thoughtfully designed.";
    bullets = [
      "Share your vision.",
      "Review curated proposals from trusted experts.",
      "Confirm your trip with discretion and protection.",
    ];
    primaryCta = { label: "Begin Your Journey", href: "/traveler" };
  } else if (accountType === "creator") {
    title = "Welcome to the creator side of Goldsainte.";
    subtitle = "Goldsainte is where vision becomes a bookable experience.";
    bullets = [
      "Curate and design journeys that reflect your aesthetic and audience.",
      "Transform inspiration into structured, sellable travel experiences.",
      "Collaborate seamlessly to bring elevated trips to life.",
      "Earn from your taste, your influence, and your creative direction.",
    ];
    primaryCta = { label: "Open your creator dashboard", href: "/creator-dashboard" };
    footerLine = "A space reserved for your next idea.";
  } else if (accountType === "agent") {
    title = "Welcome to the agent desk at Goldsainte";
    bullets = [
      "Review briefs from travelers who actually want curated experiences.",
      "Partner with creators to bring your itineraries to life on TikTok.",
      "Manage bookings, payouts, and disputes from a single partner console.",
      "Keep payments and messaging on-platform to protect your earnings and traveler safety.",
    ];
    primaryCta = { label: "Open your partner console", href: "/partner" };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a2225]/70 backdrop-blur-sm px-4 py-6">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-[28px] bg-[#f7f3ea] shadow-[0_30px_80px_-20px_rgba(10,34,37,0.45)] text-[#0a2225]">
        {/* Close */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f3ea]/80 text-[#0a2225]/70 hover:text-[#0a2225] hover:bg-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero strip */}
        <div className="relative h-40 overflow-hidden rounded-t-[28px]">
          <img
            src={welcomeHeroImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f7f3ea]" />
        </div>

        {/* Content */}
        <div className="px-7 pb-7 -mt-6 space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#0c4d47]/70 font-medium">
              Goldsainte
            </p>
            <h2 className="font-secondary text-[26px] sm:text-[28px] leading-[1.15] text-[#0a2225]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#0a2225]/60 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <ul className="space-y-3 border-t border-[#0a2225]/10 pt-5">
            {bullets.map((b, idx) => (
              <li key={idx} className="flex gap-3 text-[13.5px] leading-relaxed text-[#0a2225]/80">
                <span className="mt-[7px] h-1 w-1 rounded-full bg-[#c7a962] flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3 pt-1">
            <Link
              to={primaryCta.href}
              onClick={dismiss}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0c4d47] text-[#f7f3ea] px-5 py-3.5 text-sm font-medium hover:bg-[#0a2225] transition-colors"
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="block w-full text-center text-[12px] text-[#0a2225]/50 hover:text-[#0a2225] transition-colors"
            >
              Skip for now
            </button>
            <p className="pt-2 text-center text-[11px] italic text-[#0a2225]/40 font-secondary">
              {footerLine}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
