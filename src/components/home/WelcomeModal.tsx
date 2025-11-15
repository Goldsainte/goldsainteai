// src/components/home/WelcomeModal.tsx
import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("goldsainte_welcome_seen");
    if (!seen) {
      setOpen(true);
      sessionStorage.setItem("goldsainte_welcome_seen", "true");
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-[#BFAD72]/40 bg-[#0a2225] px-5 py-6 text-sm text-slate-50 shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-slate-200 hover:bg-black/60"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-3 py-1 text-[11px] font-medium text-[#E5DFC6]">
          <Sparkles className="h-3 w-3 text-[#BFAD72]" />
          <span>Welcome to Goldsainte AI</span>
        </div>

        <h2 className="mt-3 text-lg font-semibold tracking-tight text-[#E5DFC6]">
          Luxury travel, powered by TikTok & AI.
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-200/80">
          Goldsainte connects TikTok travel creators, certified travel agents,
          and travelers. Discover trips inspired by the content you love, or
          post a dream trip and let our network bring it to life.
        </p>

        <ul className="mt-3 space-y-1.5 text-[11px] text-slate-200/80">
          <li>• Browse a luxury marketplace of creator-curated trips.</li>
          <li>• Post a trip idea and get matched with agents or creators.</li>
          <li>
            • Tap the AI Voice Concierge button to talk through your travel
            plans.
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#BFAD72] px-4 py-2 text-xs font-semibold text-[#0a2225] shadow-sm hover:bg-[#d4c58d]"
        >
          Start exploring Goldsainte
        </button>
      </div>
    </div>
  );
}
