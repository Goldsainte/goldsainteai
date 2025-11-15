import { useState } from "react";
import { Mic, X } from "lucide-react";

export function VoiceConciergeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-black/70 border border-[#BFAD72]/60 px-3 py-2 text-[11px] text-[#E5DFC6] hover:bg-black"
      >
        <Mic className="h-3 w-3 text-[#BFAD72]" />
        <span className="hidden md:inline">Voice concierge</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0a2225] border border-[#BFAD72]/50 p-5 text-[#E5DFC6] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Goldsainte Voice Concierge
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-black/50"
              >
                <X className="h-3 w-3 text-[#E5DFC6]" />
              </button>
            </div>
            <p className="text-[11px] text-[#E5DFC6]/80">
              Tell us about the trip in your head — destinations, creators you
              love, dates, budget. We'll turn it into a Goldsainte brief and
              match you with the right TikTok creators and agents.
            </p>

            <div className="flex flex-col items-center gap-3 py-4">
              <button
                type="button"
                className="h-14 w-14 rounded-full bg-[#BFAD72] flex items-center justify-center shadow-lg hover:bg-[#d4c58d]"
                // TODO: wire up actual voice start/stop
              >
                <Mic className="h-6 w-6 text-[#0a2225]" />
              </button>
              <p className="text-[10px] text-[#E5DFC6]/70">
                Tap to start talking. We'll transcribe and create a draft trip
                request you can review before posting.
              </p>
            </div>

            <p className="text-[10px] text-[#E5DFC6]/60">
              Coming soon: live AI concierge that can co-create a TikTok-ready
              itinerary with you in real time.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
