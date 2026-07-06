// One "how it works" arc for the whole page: three steps that carry both
// doors (browse OR post). Replaces the tabbed HowGoldsainteWorksSection +
// TwoWaysComparison pair on the homepage.
const inter = { fontFamily: "Inter, sans-serif" } as const;

const steps = [
  {
    n: "1",
    title: "Browse — or post",
    body: "Explore trips, tours & guides from specialists and travelers who've been there. Nothing fits? Post your dream trip instead.",
    fork: "Both doors, one marketplace",
  },
  {
    n: "2",
    title: "Book — or compare proposals",
    body: "Book instantly with transparent pricing, or receive tailored proposals from certified specialists and pick the one you love.",
    fork: "Stripe-secured checkout",
  },
  {
    n: "3",
    title: "Travel with backup",
    body: "Your itinerary, documents, and a direct line to your specialist — all in one place, before and during the trip.",
    fork: "Message anytime",
  },
];

export function HowItWorksSteps() {
  return (
    <section id="how-it-works" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7136]" style={inter}>
          How Goldsainte works
        </span>
        <span aria-hidden="true" className="mx-auto mt-3.5 block h-px w-12 bg-[#C7A962]" />
        <h2 className="mt-5 font-secondary text-[28px] md:text-[38px] text-[#0a2225]">
          Three steps to your next journey
        </h2>
        <p className="mx-auto mt-3 mb-11 max-w-2xl text-[15px] md:text-[17px] leading-relaxed text-[#4a4a4a]">
          One flow, two doors: find a trip that already exists — or describe the one that doesn't yet.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 text-left">
          {steps.map((s) => (
            <div key={s.n} className="rounded-[20px] border border-[#E5DFC6] bg-[#FDF9F0] p-6 md:p-7">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#C7A962] font-secondary text-[15px] text-[#8a7136]">
                {s.n}
              </div>
              <h3 className="font-secondary text-[20px] text-[#0a2225] mb-2">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#4a4a4a]">{s.body}</p>
              <p className="mt-4 text-[12px] text-[#8a7136]" style={inter}>{s.fork}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
