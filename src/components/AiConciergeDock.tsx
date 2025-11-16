import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, X, ArrowRight } from "lucide-react";

/**
 * AiConciergeDock
 *
 * A small, calm entry point that lives on all pages.
 * NOT a noisy tech widget — just a quiet invitation to ask for help.
 */

export function AiConciergeDock() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on auth/onboarding pages and the concierge page itself to keep them clean
  const hiddenPaths = ["/auth", "/onboarding", "/concierge"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3 py-1.5 text-[11px] shadow-lg hover:bg-[#073331] transition-colors"
        aria-label="Open Concierge"
      >
        <Sparkles className="h-3 w-3" />
        <span>Concierge</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs w-[260px] rounded-2xl bg-[#0a2225] text-[#E5DFC6] shadow-2xl border border-[#BFAD72]/50">
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold">
          <Sparkles className="h-3 w-3 text-[#BFAD72]" />
          <span>Goldsainte Concierge</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] text-[#E5DFC6]/70 hover:text-[#E5DFC6]"
          aria-label="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="px-3 pb-3 pt-1 space-y-2 text-[11px]">
        <p className="text-[#E5DFC6]/80">
          A calm assistant for planning, refining briefs, and matching you with
          the right creators and agents.
        </p>
        <div className="space-y-1 text-[10px] text-[#E5DFC6]/70">
          <p>Try asking:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>"Design a 3–night reset in Mexico for two."</li>
            <li>"Match me with a TikTok creator in Paris."</li>
            <li>"Turn this hotel list into a simple itinerary."</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            navigate("/concierge");
          }}
          className="w-full inline-flex items-center justify-center gap-1 rounded-full bg-[#BFAD72] text-[#0a2225] px-3 py-1.5 text-[11px] font-semibold hover:bg-[#d4c58d] transition-colors"
        >
          Open Concierge
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
