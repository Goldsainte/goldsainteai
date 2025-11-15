import { useWelcomeModal } from "@/hooks/useWelcomeModal";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

  if (accountType === "traveler") {
    title = "Welcome to your Goldsainte travel studio";
    bullets = [
      "Post a trip brief and get matched with creators + agents who fit your vibe.",
      "Review proposals and storyboards before you commit to anything.",
      "Book through Goldsainte so payments, changes, and disputes stay protected.",
    ];
    primaryCta = { label: "Post your first trip", href: "/post-trip" };
  } else if (accountType === "creator") {
    title = "Welcome to the creator side of Goldsainte";
    bullets = [
      "Browse traveler briefs and raise your hand for trips that match your audience.",
      "Use TikTok Lab & storyboards to design the journey like a shot list.",
      "Partner with agents to make trips actually bookable — and track your earnings.",
    ];
    primaryCta = { label: "Open your Partner Console", href: "/partner" };
  } else if (accountType === "agent") {
    title = "Welcome to the agent desk at Goldsainte";
    bullets = [
      "Review briefs from travelers who actually want curated experiences.",
      "Partner with creators to bring your itineraries to life on TikTok.",
      "Manage bookings, payouts, and disputes from a single partner console.",
    ];
    primaryCta = { label: "Open your Partner Console", href: "/partner" };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#0a2225] border border-[#BFAD72]/50 p-5 space-y-4 shadow-2xl text-[#E5DFC6]">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-[11px] text-[#BFAD72] font-semibold">
            <Sparkles className="h-3 w-3" />
            Goldsainte
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-[10px] text-[#E5DFC6]/70 hover:text-[#E5DFC6]"
          >
            Skip for now
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-[#E5DFC6]/80">
            Hi {name}, welcome in.
          </p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        <ul className="space-y-1 text-[11px] text-[#E5DFC6]/80">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#BFAD72]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px]">
          <Link
            to={primaryCta.href}
            onClick={dismiss}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-[#BFAD72] text-[#0a2225] px-3 py-1.5 font-semibold hover:bg-[#d4c58d]"
          >
            {primaryCta.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
          <p className="text-[10px] text-[#E5DFC6]/70 max-w-xs">
            You can always find this view again from your dashboard — we just
            wanted your first step to feel clear, not chaotic.
          </p>
        </div>
      </div>
    </div>
  );
}
