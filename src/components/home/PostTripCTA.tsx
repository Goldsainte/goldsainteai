// src/components/home/PostTripCTA.tsx
import { useNavigate } from "react-router-dom";
import { Sparkles, Mic, ArrowRightCircle } from "lucide-react";

export function PostTripCTA() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#0a2225] px-4 py-10 text-[#E5DFC6] md:py-14">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[#BFAD72]/40 bg-gradient-to-r from-[#0a2225] via-[#0c4d47] to-[#0a2225] px-5 py-7 shadow-xl md:px-7 md:py-8">
        <div className="grid gap-5 md:grid-cols-[2fr,1.2fr] md:items-center">
          {/* Left: copy */}
          <div className="space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-[#E5DFC6] ring-1 ring-[#BFAD72]/50">
              <Sparkles className="h-3 w-3 text-[#BFAD72]" />
              <span>Post a Trip · AI matching included</span>
            </div>

            <h2 className="text-balance text-lg font-semibold tracking-tight md:text-xl">
              Have a dream trip in mind?
              <span className="block text-[#BFAD72]">
                Post it once. Let certified specialists compete to design it.
              </span>
            </h2>

            <p className="max-w-xl text-xs leading-relaxed text-[#E5DFC6]/90 md:text-sm">
              Tell us where you'd like to go, your dates, and your budget.
              Goldsainte AI matches your request to TikTok creators and
              certified travel agents whose style and expertise fit your brief.
            </p>

            <ul className="space-y-1.5 text-[11px] text-[#E5DFC6]/85">
              <li>• Describe your ideal trip in a few lines.</li>
              <li>
                • AI suggests the best creators & agents for your style and
                budget.
              </li>
              <li>• Review proposals, pick your favorite, and let them book.</li>
            </ul>

            <div className="flex flex-col gap-2 pt-2 md:flex-row md:items-center">
              <button
                type="button"
                onClick={() => navigate("/post-trip")}
                className="inline-flex items-center justify-center rounded-full bg-[#BFAD72] px-5 py-2 text-xs font-semibold text-[#0a2225] shadow-sm hover:bg-[#d4c58d]"
              >
                <ArrowRightCircle className="mr-2 h-4 w-4" />
                Post a trip to the marketplace
              </button>

              <div className="inline-flex items-center gap-2 text-[11px] text-[#E5DFC6]/80">
                <Mic className="h-3 w-3" />
                <span>
                  Prefer to talk it out? Tap the AI Voice Concierge and just
                  describe your trip.
                </span>
              </div>
            </div>
          </div>

          {/* Right: mini "trip brief" card */}
          <div className="rounded-2xl bg-black/35 p-4 text-[11px] text-[#E5DFC6] shadow-inner ring-1 ring-[#BFAD72]/35">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#BFAD72]">
              Example trip brief
            </p>
            <p className="mt-2 text-xs leading-relaxed">
              "We're a couple looking for a 6–7 night trip in late September.
              Ideally somewhere in Europe with a mix of design hotels, wine,
              and one or two 'wow' experiences. Budget around $4k per person."
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-xl bg-[#0a2225]/60 p-2 ring-1 ring-white/10">
                <div className="text-[#8D8D8D]">AI suggests</div>
                <div className="mt-1 text-[#E5DFC6]">
                  3 creators & 2 agents
                </div>
              </div>
              <div className="rounded-xl bg-[#0a2225]/60 p-2 ring-1 ring-white/10">
                <div className="text-[#8D8D8D]">You choose</div>
                <div className="mt-1 text-[#E5DFC6]">
                  Best match to design & book
                </div>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-[#8D8D8D]">
              This is where your AI matching and marketplace logic runs behind
              the scenes—no extra effort required from travelers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
