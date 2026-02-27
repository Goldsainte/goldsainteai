import { useWelcomeModal } from "@/hooks/useWelcomeModal";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import welcomeHeroImage from "@/assets/luxury-infinity-pool.jpg";

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
    title = "Welcome to the creator side of Goldsainte";
    bullets = [
      "Browse traveler briefs and raise your hand for trips that match your audience.",
      "Use Goldsainte Creator Lab & storyboards to design the journey like a shot list.",
      "Partner with agents to make trips actually bookable — and track your earnings.",
      "All bookings stay on-platform so your commissions are protected and your work is credited.",
    ];
    primaryCta = { label: "Open your Partner Console", href: "/partner" };
  } else if (accountType === "agent") {
    title = "Welcome to the agent desk at Goldsainte";
    bullets = [
      "Review briefs from travelers who actually want curated experiences.",
      "Partner with creators to bring your itineraries to life on TikTok.",
      "Manage bookings, payouts, and disputes from a single partner console.",
      "Keep payments and messaging on-platform to protect your earnings and traveler safety.",
    ];
    primaryCta = { label: "Open your Partner Console", href: "/partner" };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 sm:px-4 py-4">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#FDF9F0] border border-[#E5DFC6] overflow-y-auto shadow-[0_24px_60px_rgba(10,34,37,0.25)] text-[#0a2225]">
        <div className="flex flex-col md:flex-row">
          {/* Left: Hero Image */}
          <div className="md:w-[40%] relative">
            <img
              src={welcomeHeroImage}
              alt="Luxury travel destination"
              className="w-full h-32 sm:h-48 md:h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r" />
          </div>

          {/* Right: Content */}
          <div className="md:w-[60%] p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#7A7151] bg-[#C7B892]/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium">
                <Sparkles className="h-3 w-3" />
                Goldsainte
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-[#7A7151] hover:text-[#0a2225] underline-offset-2 hover:underline transition-colors"
              >
                Skip for now
              </button>
            </div>

            {/* Title & Greeting */}
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="font-secondary text-lg sm:text-xl md:text-2xl font-semibold text-[#0a2225] leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-[#7A7151]">{subtitle}</p>
              )}
            </div>

            {/* Bullet Cards */}
            <ul className="space-y-1.5 sm:space-y-2">
              {bullets.map((b, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 sm:gap-3 rounded-xl border border-[#E5DFC6] bg-white/80 px-2.5 sm:px-3 py-2"
                >
                  <span className="mt-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#C7A962] flex-shrink-0" />
                  <span className="text-[11px] sm:text-[12px] text-[#3F3A33] leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>

            {/* Footer CTA */}
            <div className="flex flex-col gap-2 sm:gap-3 pt-1">
              <Link
                to={primaryCta.href}
                onClick={dismiss}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] text-[#FDF9F0] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-[#0c4d47]/90 transition-colors whitespace-nowrap"
              >
                {primaryCta.label}
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
              <p className="text-[10px] sm:text-[11px] text-[#7A7151] leading-relaxed">
                Your studio remains here whenever you return.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
