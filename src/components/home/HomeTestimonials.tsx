const testimonials = [
  {
    quote: "Goldsainte planned a Kyoto trip from a single Pinterest board. It felt designed just for me.",
    name: "Amelia R.",
    country: "United Kingdom",
  },
  {
    quote: "My specialist handled everything — I just showed up and lived it.",
    name: "Daniel K.",
    country: "United States",
  },
  {
    quote: "I uploaded my camera roll and had a bookable itinerary in minutes.",
    name: "Sofia M.",
    country: "Spain",
  },
  {
    quote: "We planned our entire honeymoon in under an hour. Our specialist suggested destinations we hadn't even considered — and they were perfect.",
    name: "Priya S.",
    country: "India",
  },
  {
    quote: "The itinerary didn't feel assembled from a template. Every detail reflected exactly what I asked for, down to the pace of each day.",
    name: "Luca B.",
    country: "Italy",
  },
  {
    quote: "I submitted my vision and received three detailed proposals the same day. The level of care was unlike any travel service I've used.",
    name: "Fatima A.",
    country: "United Arab Emirates",
  },
  {
    quote: "I've used every major travel platform. Goldsainte is the first one that actually felt like it understood my travel style.",
    name: "Yuki T.",
    country: "Japan",
  },
  {
    quote: "I uploaded photos from a trip I loved and used them to build my next one. Nothing else I've tried comes close to this.",
    name: "Marcus W.",
    country: "Australia",
  },
];

export function HomeTestimonials() {
  return (
    <section className="bg-[#f7f3ea]">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <span className="inline-block rounded-full border border-[#0c4d47] bg-[#0c4d47] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#bfad72] mb-4">
            Traveler Stories
          </span>
          <div className="mx-auto w-14 h-px bg-[#C7A962] mb-5" />
          <h2 className="font-secondary text-2xl md:text-4xl text-[#0c4d47]">
            <em>What Travelers Are Saying</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="relative rounded-2xl bg-white/80 border border-[#E5DFC6] p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <span
                aria-hidden
                className="absolute -top-3 left-6 font-display text-6xl leading-none text-[#C7A962] select-none"
              >
                &ldquo;
              </span>
              <blockquote className="mt-4 font-secondary text-sm md:text-base leading-relaxed text-[#0c4d47] italic">
                {t.quote}
              </blockquote>
              <div className="mt-6 w-8 h-px bg-[#C7A962]" />
              <figcaption className="mt-4">
                <p className="font-secondary text-sm text-[#0a2225] font-semibold">{t.name}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[#0a2225]/60 mt-0.5">
                  {t.country}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}