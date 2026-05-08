import { Link } from "react-router-dom";
import CreatorAIMagic from "./CreatorAIMagic";

export function CameraRollHighlight() {
  return (
    <section className="bg-[#f7f3ea]">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: copy */}
          <div>
            <span className="inline-block rounded-full border border-[#C7A962] bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#0c4d47] mb-5">
              Camera Roll → Itinerary
            </span>
            <h2 className="font-secondary text-2xl md:text-4xl leading-tight text-[#0a2225]">
              <em>From Inspiration to Itinerary in Minutes.</em>
            </h2>
            <div className="mt-5 w-12 h-px bg-[#C7A962]" />
            <p className="mt-6 text-sm md:text-base leading-relaxed text-[#4a4a4a] max-w-xl">
              Upload photos of places that inspire you, and Goldsainte builds a complete, bookable trip around them — instantly. Share it, sell it, or make it your own.
            </p>
            <div className="mt-8">
              <Link
                to="/auth?mode=signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-7 py-3 text-sm font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#073331] transition-colors"
              >
                Try It Free
              </Link>
            </div>
          </div>

          {/* Right: camera roll mockup */}
          <div className="relative">
            <div className="absolute inset-0 translate-x-3 translate-y-3 md:translate-x-4 md:translate-y-4 rounded-3xl border border-[#E5DFC6]" />
            <div className="relative rounded-3xl bg-white/90 p-3 md:p-4 shadow-[0_18px_40px_rgba(10,34,37,0.18)]">
              <CreatorAIMagic />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}