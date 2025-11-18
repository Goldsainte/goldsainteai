// src/components/home/WhoItsFor.tsx
export function WhoItsFor() {
  return (
    <section className="bg-white border-y border-[#E5DFC6]/30 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-[28px] leading-snug text-[#0a2225] md:text-[34px] mb-12">
          Who Goldsainte is for
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Travelers */}
          <div className="rounded-3xl border border-[#E5DFC6] bg-[#f7f3ea]/50 p-6 md:p-8">
            <h3 className="font-display text-xl text-[#0a2225] mb-4">
              Travelers
            </h3>
            <div className="space-y-3 text-sm leading-relaxed text-[#4a4a4a]">
              <p>Turn TikToks, Reels and screenshots into a real itinerary.</p>
              <p>Get matched with creators and certified agents who fit your style and budget.</p>
              <p>Book inside a protected, luxury marketplace with escrow and support.</p>
            </div>
          </div>

          {/* Creators */}
          <div className="rounded-3xl border border-[#E5DFC6] bg-[#f7f3ea]/50 p-6 md:p-8">
            <h3 className="font-display text-xl text-[#0a2225] mb-4">
              Creators
            </h3>
            <div className="space-y-3 text-sm leading-relaxed text-[#4a4a4a]">
              <p>Turn your best travel content into bookable storyboards.</p>
              <p>Partner with vetted agents who handle rates, contracts and logistics.</p>
              <p>Earn a share on every trip booked—without becoming a travel agent.</p>
            </div>
          </div>

          {/* Travel Agents */}
          <div className="rounded-3xl border border-[#E5DFC6] bg-[#f7f3ea]/50 p-6 md:p-8">
            <h3 className="font-display text-xl text-[#0a2225] mb-4">
              Travel Agents
            </h3>
            <div className="space-y-3 text-sm leading-relaxed text-[#4a4a4a]">
              <p>Receive high-intent briefs from travelers who already know what they want to feel.</p>
              <p>Collaborate with creators on storyboards that pre-sell your itineraries.</p>
              <p>Manage payments and protection through Goldsainte's escrow and identity checks.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
