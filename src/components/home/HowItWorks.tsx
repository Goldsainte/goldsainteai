// src/components/home/HowItWorks.tsx
import { Sparkles, Compass, HandCoins } from "lucide-react";

export function HowItWorks() {
  return (
    <section className="bg-[#E5DFC6] px-4 py-10 text-[#0a2225] md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight md:text-lg">
              Here's how Goldsainte works
            </h2>
            <p className="mt-1 max-w-xl text-xs text-[#333333] md:text-sm">
              A three-sided marketplace where creators, agents, and travelers
              collaborate to design trips that feel like they were made just for
              you.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* Travelers */}
          <article className="flex flex-col gap-2 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0c4d47]/10 text-[#0c4d47]">
              <Compass className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold">For Travelers</h3>
            <p className="text-xs text-[#4a4a4a]">
              Search like you do on Expedia, or{" "}
              <span className="font-semibold">post a dream trip</span> to the
              marketplace. Our AI and network match you with the right creator
              or certified agent.
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-[#4a4a4a]">
              <li>• See trips inspired by TikTok and social content.</li>
              <li>• Get custom itineraries built for your dates and budget.</li>
            </ul>
          </article>

          {/* Creators */}
          <article className="flex flex-col gap-2 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#BFAD72]/15 text-[#BFAD72]">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold">For TikTok Creators</h3>
            <p className="text-xs text-[#4a4a4a]">
              Turn your travel content into{" "}
              <span className="font-semibold">bookable itineraries</span>. Use
              Goldsainte storyboards to design trips, then partner with agents
              to fulfill them.
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-[#4a4a4a]">
              <li>• Build Pinterest-style storyboards for each trip.</li>
              <li>• Earn when your audience books your featured stays.</li>
            </ul>
          </article>

          {/* Agents */}
          <article className="flex flex-col gap-2 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0a2225]/10 text-[#0a2225]">
              <HandCoins className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold">For Travel Agents</h3>
            <p className="text-xs text-[#4a4a4a]">
              Find creators whose audience already wants what you sell. Our AI
              suggests matches so you can focus on{" "}
              <span className="font-semibold">crafting and closing trips</span>.
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-[#4a4a4a]">
              <li>• Browse the Creator Marketplace by niche and region.</li>
              <li>• Respond to posted trips and collab requests in one place.</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
