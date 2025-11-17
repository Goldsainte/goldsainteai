import { useEffect, useState } from "react";
import { MessageCircle, X, Mic, MicOff, Music2 } from "lucide-react";
import { MADISON_NAME, MADISON_VOICE_INTRO } from "@/lib/madisonPersona";

type VoiceConciergeWidgetProps = {
  onEscalateToPlanner?: () => void;
};

export function VoiceConciergeWidget({ onEscalateToPlanner }: VoiceConciergeWidgetProps) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [introPlayed, setIntroPlayed] = useState(false);

  function startListening() {
    setListening(true);
    // TODO: wire to existing voice engine
  }

  function stopListening() {
    setListening(false);
  }

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setListening(false);
  }

  useEffect(() => {
    if (open && !introPlayed) {
      console.log(MADISON_VOICE_INTRO);
      setIntroPlayed(true);
    }
  }, [open, introPlayed]);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2 text-[11px] font-semibold text-[#E5DFC6] shadow-lg hover:bg-[#073331]"
      >
        <MessageCircle className="h-4 w-4" />
        Hey Goldsainte
      </button>

      {/* Jazz background */}
      {musicOn && open && (
        <audio loop autoPlay className="hidden">
          <source src="/audio/jazz-lounge.mp3" type="audio/mpeg" />
        </audio>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-80 max-w-[90vw] rounded-3xl border border-[#E5DFC6] bg-[#0a2225] text-[#E5DFC6] shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#BFAD72]">
                Goldsainte Concierge
              </span>
              <span className="text-[12px] font-semibold">
                {MADISON_NAME}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMusicOn((m) => !m)}
                className="rounded-full bg-white/10 p-1 hover:bg-white/20"
                aria-label="Toggle music"
              >
                <Music2 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full bg-white/10 p-1 hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="px-3 pb-3 text-[11px]">
            <p className="mb-2 text-[#E5DFC6]/90">
              Hi, I'm {MADISON_NAME} — your Goldsainte travel concierge. Think of me
              as your friendly, well-connected travel insider.
            </p>
            <p className="mb-2 text-[#E5DFC6]/80">
              Say something like:
              <br />
              <span className="italic">
                "Find me a flight to Miami next weekend"
              </span>
              {" "}or{" "}
              <span className="italic">
                "Show me boutique hotels in Paris."
              </span>
            </p>
            <p className="text-[10px] text-[#E5DFC6]/70">
              When you're ready to go deeper, I can open your full trip planner and
              start a storyboard.
            </p>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                  listening
                    ? "bg-[#BFAD72] text-[#0a2225]"
                    : "bg-[#E5DFC6] text-[#0a2225]"
                }`}
              >
                {listening ? (
                  <>
                    <MicOff className="h-3 w-3" /> Stop listening
                  </>
                ) : (
                  <>
                    <Mic className="h-3 w-3" /> Start talking
                  </>
                )}
              </button>

              {onEscalateToPlanner && (
                <button
                  type="button"
                  onClick={onEscalateToPlanner}
                  className="text-[10px] underline underline-offset-2 text-[#BFAD72] hover:text-[#d4c491]"
                >
                  Open trip planner
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
