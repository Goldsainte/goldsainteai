// src/components/home/WhoItsFor.tsx
export function WhoItsFor() {
  return (
    <section className="bg-white border-y border-[#E5DFC6]/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12">
          {/* Left: Text content (52%) */}
          <div className="lg:w-[52%]">
            {/* Pill badge - responsive with dots on mobile */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-[#E5DFC6] bg-[#BFAD72] px-3 py-1.5 text-xs uppercase tracking-[0.14em] md:tracking-[0.18em] text-[#0C4D47] mb-5">
              <span>Travelers</span>
              <span className="md:hidden">•</span>
              <span className="hidden md:inline h-[1px] w-4 bg-[#0C4D47]/30" />
              <span>Creators</span>
              <span className="md:hidden">•</span>
              <span className="hidden md:inline h-[1px] w-4 bg-[#0C4D47]/30" />
              <span>Agents</span>
              <span className="md:hidden">•</span>
              <span className="hidden md:inline h-[1px] w-4 bg-[#0C4D47]/30" />
              <span>Brands</span>
            </div>

            <h2 className="text-left font-display text-2xl leading-snug md:text-4xl lg:text-[42px] text-[#0a2225] mb-6 md:mb-12">
              Built for every side of luxury travel
            </h2>

            {/* Intro text */}
            <p className="text-sm md:text-base text-[#4a4a4a] mb-6 md:mb-8 max-w-lg">
              Each role brings something essential — travelers bring the vision, 
              creators bring the aesthetic, agents refine the details.
            </p>

            {/* Four roles in columns - tighter spacing on mobile */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:gap-8">
              {/* Travelers */}
              <div className="relative border border-[#BFAD72] rounded-2xl p-4 md:p-6 bg-white/50 transition-all duration-300 hover:shadow-sm">
                <div className="inline-flex items-center rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#BFAD72] mb-3 md:mb-4">
                  TRAVELERS
                </div>
                <ul className="space-y-2 md:space-y-3 text-sm leading-[1.6] md:leading-[1.7] text-[#4a4a4a]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Turn TikToks, Reels and screenshots into a real itinerary.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Get matched with creators and certified agents who fit your style.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Book inside a vetted marketplace with secure Stripe payments and support.</span>
                  </li>
                </ul>
              </div>

              {/* Creators */}
              <div className="relative border border-[#BFAD72] rounded-2xl p-4 md:p-6 bg-white/50 transition-all duration-300 hover:shadow-sm">
                <div className="inline-flex items-center rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#BFAD72] mb-3 md:mb-4">
                  CREATORS
                </div>
                <ul className="space-y-2 md:space-y-3 text-sm leading-[1.6] md:leading-[1.7] text-[#4a4a4a]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Turn your best travel content into bookable storyboards.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Partner with vetted agents who handle contracts and logistics.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Earn a share on every trip booked—without becoming an agent.</span>
                  </li>
                </ul>
              </div>

              {/* Travel Agents */}
              <div className="relative border border-[#BFAD72] rounded-2xl p-4 md:p-6 bg-white/50 transition-all duration-300 hover:shadow-sm">
                <div className="inline-flex items-center rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#BFAD72] mb-3 md:mb-4">
                  TRAVEL AGENTS
                </div>
                <ul className="space-y-2 md:space-y-3 text-sm leading-[1.6] md:leading-[1.7] text-[#4a4a4a]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Receive high-intent briefs from travelers who know what they want.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Collaborate with creators on storyboards that pre-sell itineraries.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Take payments in your own Stripe account, with identity checks on every member.</span>
                  </li>
                </ul>
              </div>

              {/* Brands */}
              <div className="relative border border-[#BFAD72] rounded-2xl p-4 md:p-6 bg-white/50 transition-all duration-300 hover:shadow-sm">
                <div className="inline-flex items-center rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#BFAD72] mb-3 md:mb-4">
                  BRANDS
                </div>
                <ul className="space-y-2 md:space-y-3 text-sm leading-[1.6] md:leading-[1.7] text-[#4a4a4a]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Reach affluent travelers at the moment of trip inspiration.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Get AI-matched to travelers whose aesthetic aligns with your brand.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#BFAD72]"></span>
                    <span>Collaborate with vetted creators for authentic partnerships.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right: Luxury visual stack (48%) - shows FIRST on mobile */}
          <div className="lg:w-[48%] order-first lg:order-last mb-6 lg:mb-0">
            <div className="relative mx-auto max-w-md">
              {/* soft frame */}
              <div className="absolute inset-0 translate-x-3 md:translate-x-4 translate-y-3 md:translate-y-4 rounded-[24px] md:rounded-[32px] border border-[#E5DFC6]/80" />
              <div className="relative overflow-hidden rounded-[24px] md:rounded-[32px] bg-white/90 p-2 md:p-3 shadow-[0_18px_40px_rgba(10,34,37,0.18)]">
                <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                  {/* Main image */}
                  <div className="col-span-2 row-span-2 overflow-hidden rounded-2xl md:rounded-3xl">
                    <img
                      src="/home/austin-distel-riQNJpiaGgE-unsplash.jpeg"
                      alt="Luxury jungle retreat with candles"
                      className="h-full w-full object-cover aspect-square"
                      loading="lazy"
                    />
                  </div>
                  {/* Secondary image */}
                  <div className="overflow-hidden rounded-xl md:rounded-2xl">
                    <img
                      src="/home/christian-lambert-vmIWr0NnpCQ-unsplash.jpeg"
                      alt="Resort infinity pool with palms"
                      className="h-full w-full object-cover aspect-square"
                      loading="lazy"
                    />
                  </div>
                  {/* Tertiary image */}
                  <div className="overflow-hidden rounded-xl md:rounded-2xl">
                    <img
                      src="/home/redcharlie-Y--zr3CPaPs-unsplash.jpeg"
                      alt="Safari elephants at sunset"
                      className="h-full w-full object-cover aspect-square"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Caption card */}
                <div className="mt-2 md:mt-3 rounded-xl md:rounded-2xl bg-[#f7f3ea] p-3 md:p-4">
                  <p className="text-xs leading-relaxed text-[#4a4a4a]">
                    Travelers shape the vision, creators refine the aesthetic, agents engineer the experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
