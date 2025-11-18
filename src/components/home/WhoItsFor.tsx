// src/components/home/WhoItsFor.tsx
import { HomePhotoStrip } from "./HomePhotoStrip";

export function WhoItsFor() {
  const photoStripImages = [
    {
      src: "/home/austin-distel-riQNJpiaGgE-unsplash.jpeg",
      alt: "Luxury jungle retreat with candles",
    },
    {
      src: "/home/christian-lambert-vmIWr0NnpCQ-unsplash.jpeg",
      alt: "Resort infinity pool with palms",
    },
    {
      src: "/home/redcharlie-Y--zr3CPaPs-unsplash.jpeg",
      alt: "Safari elephants at sunset",
    },
  ];

  return (
    <section className="bg-white border-y border-[#E5DFC6]/30 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12">
          {/* Left: Text content (60%) */}
          <div className="lg:w-[60%]">
            <h2 className="font-display text-3xl leading-snug md:text-4xl lg:text-[42px] text-[#0a2225] mb-12">
              Who Goldsainte is for
            </h2>

            {/* Three roles in columns */}
            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              {/* Travelers */}
              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D] mb-3">
                  TRAVELERS
                </div>
                <div className="space-y-3 text-sm leading-[1.7] text-[#4a4a4a]">
                  <p>Turn TikToks, Reels and screenshots into a real itinerary.</p>
                  <p>Get matched with creators and certified agents who fit your style and budget.</p>
                  <p>Book inside a protected, luxury marketplace with escrow and support.</p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block absolute left-1/3 top-0 bottom-0 w-px bg-[#E5DFC6]/50" />

              {/* Creators */}
              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D] mb-3">
                  CREATORS
                </div>
                <div className="space-y-3 text-sm leading-[1.7] text-[#4a4a4a]">
                  <p>Turn your best travel content into bookable storyboards.</p>
                  <p>Partner with vetted agents who handle rates, contracts and logistics.</p>
                  <p>Earn a share on every trip booked—without becoming a travel agent.</p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block absolute left-2/3 top-0 bottom-0 w-px bg-[#E5DFC6]/50" />

              {/* Travel Agents */}
              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#8D8D8D] mb-3">
                  TRAVEL AGENTS
                </div>
                <div className="space-y-3 text-sm leading-[1.7] text-[#4a4a4a]">
                  <p>Receive high-intent briefs from travelers who already know what they want to feel.</p>
                  <p>Collaborate with creators on storyboards that pre-sell your itineraries.</p>
                  <p>Manage payments and protection through Goldsainte's escrow and identity checks.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Photo strip (40%) */}
          <div className="lg:w-[40%]">
            <HomePhotoStrip images={photoStripImages} layout="mosaic" />
          </div>
        </div>
      </div>
    </section>
  );
}
