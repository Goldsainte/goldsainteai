// src/components/home/HomeHero.tsx
import { Link } from "react-router-dom";
import heroMainImg from "@/assets/maximilien-t-scharner-FD0Ga_KJTwM-unsplash.jpeg"; // infinity pool
import heroSecondaryImg from "@/assets/austin-distel-riQNJpiaGgE-unsplash.jpeg"; // treehouse / hammock
import heroTertiaryImg from "@/assets/felix-rostig-UmV2wr-Vbq8-unsplash.jpeg"; // friends hiking

export function HomeHero() {
  return (
    <section className="bg-[#f7f3ea] text-[#0a2225]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-12 pt-16 md:flex-row md:items-center md:pt-20">
        {/* LEFT: Copy & CTAs */}
        <div className="w-full md:w-[52%] space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D]">
            <span>Travelers</span>
            <span className="h-[1px] w-4 bg-[#E5DFC6]" />
            <span>Creators</span>
            <span className="h-[1px] w-4 bg-[#E5DFC6]" />
            <span>Agents</span>
          </div>

          <h1 className="font-display text-[28px] leading-snug md:text-[34px]">
            Where <em>inspiration</em> becomes a <em>storyboard</em> — and the perfect <em>creator + agent</em>{" "}
            team builds the trip.
          </h1>

          <p className="max-w-xl text-[12px] leading-relaxed text-[#4a4a4a]">
            Goldsainte turns inspiration into itinerary. Post your dream trip, match
            instantly with creators and certified agents whose style fits yours,
            co-design the journey through a shared storyboard, and book the entire
            experience inside a trusted luxury marketplace.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/post-trip"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-6 py-2.5 text-[11px] font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#073331]"
            >
              Post a dream trip
            </Link>

            <div className="inline-flex flex-wrap gap-2 text-[11px]">
              <Link
                to="/creators"
                className="rounded-full border border-[#BFAD72] bg-white px-4 py-2 font-semibold text-[#0a2225] hover:bg-[#f7f3ea]"
              >
                Browse creators
              </Link>
              <Link
                to="/agents"
                className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2 font-semibold text-[#0a2225] hover:bg-[#f7f3ea]"
              >
                Browse agents
              </Link>
            </div>
          </div>

          {/* AI concierge mention (not a second widget, just an entry point link) */}
          <p className="pt-2 text-[11px] text-[#8D8D8D]">
            Prefer a gentle assist?{" "}
            <Link
              to="/concierge"
              className="underline underline-offset-2 text-[#0c4d47]"
            >
              Ask Goldsainte AI to shape your brief.
            </Link>
          </p>

          {/* Trust / promise line */}
          <p className="pt-1 text-[10px] text-[#8D8D8D] max-w-sm">
            All messaging and payments stay on-platform. No phone numbers, no side
            deals — just beautifully organized, protected bookings.
          </p>
        </div>

        {/* RIGHT: Luxury visual stack */}
        <div className="w-full md:w-[48%]">
          <div className="relative mx-auto max-w-md">
            {/* soft frame */}
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[32px] border border-[#E5DFC6]/80" />
            <div className="relative overflow-hidden rounded-[32px] bg-white/90 p-3 shadow-[0_18px_40px_rgba(10,34,37,0.18)]">
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {/* Main hero image */}
                <div className="col-span-2 row-span-2 overflow-hidden rounded-3xl">
                  <img
                    src={heroMainImg}
                    alt="Infinity pool and skyline"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Secondary images */}
                <div className="overflow-hidden rounded-3xl">
                  <img
                    src={heroSecondaryImg}
                    alt="Treehouse hammock"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-3xl">
                  <img
                    src={heroTertiaryImg}
                    alt="Friends hiking"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Caption card */}
              <div className="mt-3 rounded-2xl bg-[#0c4d47] px-4 py-3 text-[11px] text-[#E5DFC6]">
                <p className="font-semibold mb-1">
                  Every trip begins with a storyboard.
                </p>
                <p className="text-[10px] text-[#E5DFC6]/90">
                  Drop in TikToks, Reels, YouTube videos, Unsplash photos and Viator
                  experiences. Creators refine the mood; agents engineer the itinerary.
                  You see the journey before you ever click "Book".
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
