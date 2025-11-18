// src/components/home/TikTokLabHighlight.tsx
import { Link } from "react-router-dom";
import { Sparkles, Film, PenSquare } from "lucide-react";

export function TikTokLabHighlight() {
  return (
    <section className="bg-[#E5DFC6] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-[1.3fr,1fr] md:items-center">
        <div className="space-y-3 md:space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-[#0a2225] ring-1 ring-[#BFAD72]/60">
            <Sparkles className="h-4 w-4 text-[#BFAD72]" />
            <span>Goldsainte Creator Lab · For creators & agents</span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-[#0a2225] md:text-2xl">
            Build trips like a storyboard. Publish them like a TikTok.
          </h2>

          <p className="text-base text-[#4a4a4a] md:text-lg leading-relaxed">
            The Goldsainte Creator Lab is your creative workspace inside Goldsainte.
            Draft hooks and captions, pin imagery to a storyboard, and connect
            each idea to a real, bookable itinerary in the marketplace.
          </p>

          <ul className="space-y-2 text-base text-[#4a4a4a]">
            <li>• Start from a TikTok or Reel that's already resonating.</li>
            <li>• Use Goldsainte's image library to build a visual storyboard.</li>
            <li>• Link each story to a real trip that agents can price and book.</li>
          </ul>

          <div className="pt-2">
            <Link
              to="/tiktok-lab"
              className="inline-flex items-center justify-center rounded-full bg-[#0c4d47] px-6 py-3 text-base font-semibold text-[#E5DFC6] shadow-sm hover:bg-[#0b3e3a]"
            >
              <PenSquare className="mr-2 h-5 w-5" />
              Open Goldsainte Creator Lab
            </Link>
          </div>
        </div>

        {/* Visual card */}
        <div className="relative h-56 rounded-3xl bg-[#0a2225] p-4 text-sm text-[#E5DFC6] shadow-xl ring-1 ring-[#BFAD72]/40 md:h-64">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#BFAD72]/90 text-[#0a2225]">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#BFAD72]">
                Storyboard view
              </p>
              <p className="text-sm text-[#E5DFC6]/95">
                Santorini cave-suite honeymoon · Creator draft
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="h-24 rounded-2xl bg-[url('https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg')] bg-cover bg-center" />
            <div className="h-24 rounded-2xl bg-[url('https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg')] bg-cover bg-center" />
            <div className="h-24 rounded-2xl bg-[url('https://images.pexels.com/photos/2581547/pexels-photo-2581547.jpeg')] bg-cover bg-center" />
          </div>

          <div className="mt-3 rounded-2xl bg-black/35 p-3">
            <p className="text-xs font-medium text-[#E5DFC6]/80">
              Hook
            </p>
            <p className="text-sm text-[#E5DFC6]">
              "The Santorini honeymoon where every room is a sunset shot."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
