import { useState } from "react";
import { Star, ShieldCheck, MapPin, BadgeCheck } from "lucide-react";

const testimonials = [
  {
    quote: "Goldsainte planned a Kyoto trip from a single Pinterest board. It felt designed just for me.",
    name: "Amelia R.",
    country: "United Kingdom",
    stars: 5,
    initials: "AR",
    avatarColor: "#0c4d47",
    trip: "Kyoto Cultural Immersion",
    date: "March 2026",
  },
  {
    quote: "My specialist handled everything — I just showed up and lived it.",
    name: "Daniel K.",
    country: "United States",
    stars: 5,
    initials: "DK",
    avatarColor: "#C7A962",
    trip: "Amalfi Coast Weekend",
    date: "February 2026",
  },
  {
    quote: "I uploaded my camera roll and had a bookable itinerary in minutes.",
    name: "Sofia M.",
    country: "Spain",
    stars: 5,
    initials: "SM",
    avatarColor: "#384e4b",
    trip: "Santorini Sunset Escape",
    date: "April 2026",
  },
  {
    quote: "We planned our entire honeymoon in under an hour. Our specialist suggested destinations we hadn't even considered — and they were perfect.",
    name: "Priya S.",
    country: "India",
    stars: 5,
    initials: "PS",
    avatarColor: "#8a6a2e",
    trip: "Maldives Honeymoon",
    date: "January 2026",
  },
  {
    quote: "The itinerary didn't feel assembled from a template. Every detail reflected exactly what I asked for, down to the pace of each day.",
    name: "Luca B.",
    country: "Italy",
    stars: 5,
    initials: "LB",
    avatarColor: "#0c4d47",
    trip: "Patagonia Adventure",
    date: "March 2026",
  },
  {
    quote: "I submitted my vision and received three detailed proposals the same day. The level of care was unlike any travel service I've used.",
    name: "Fatima A.",
    country: "United Arab Emirates",
    stars: 4,
    initials: "FA",
    avatarColor: "#b85c3a",
    trip: "Cape Town & Winelands",
    date: "February 2026",
  },
  {
    quote: "I've used every major travel platform. Goldsainte is the first one that actually felt like it understood my travel style.",
    name: "Yuki T.",
    country: "Japan",
    stars: 5,
    initials: "YT",
    avatarColor: "#384e4b",
    trip: "Bali Wellness Retreat",
    date: "April 2026",
  },
  {
    quote: "I uploaded photos from a trip I loved and used them to build my next one. Nothing else I've tried comes close to this.",
    name: "Marcus W.",
    country: "Australia",
    stars: 5,
    initials: "MW",
    avatarColor: "#8a6a2e",
    trip: "Tokyo Cultural Journey",
    date: "January 2026",
  },
];

export function HomeTestimonials() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? testimonials : testimonials.slice(0, 6);

  return (
    <section className="bg-[#f7f3ea]">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center mb-10">
          <span className="inline-block rounded-full border border-[#0c4d47] bg-[#0c4d47] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#bfad72] mb-4">
            Verified Reviews
          </span>
          <div className="mx-auto w-14 h-px bg-[#C7A962] mb-5" />
          <h2 className="font-secondary text-2xl md:text-4xl text-[#0c4d47]">
            <em>Trusted by Travelers Worldwide</em>
          </h2>
        </div>

        {/* Aggregate rating block */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <div className="flex items-center gap-3">
            <span className="font-secondary text-5xl md:text-6xl text-[#0c4d47]">4.9</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-[#C7A962] text-[#C7A962]" />
              ))}
            </div>
          </div>
          <p className="text-xs text-[#0a2225]/60">
            Based on 243 verified traveler reviews
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#C7A962]">
            <BadgeCheck className="w-3 h-3" />
            Goldsainte Verified Reviews
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl bg-white border border-[#E5DFC6] p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Top row */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: t.avatarColor }}
                >
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-secondary font-semibold text-sm text-[#0a2225] truncate">{t.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/60">
                    {t.country}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#C7A962]">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Verified
                </span>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < t.stars
                        ? "w-3.5 h-3.5 fill-[#C7A962] text-[#C7A962]"
                        : "w-3.5 h-3.5 fill-[#C7A962]/30 text-[#C7A962]/30"
                    }
                  />
                ))}
              </div>

              {/* Trip tag */}
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f3ea] border border-[#E5DFC6] font-secondary italic text-[10px] text-[#0a2225] px-2 py-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {t.trip}
                </span>
              </div>

              {/* Quote */}
              <blockquote className="mt-3 font-secondary italic text-sm leading-relaxed text-[#0a2225] flex-1">
                {t.quote}
              </blockquote>

              {/* Date */}
              <div className="mt-3 text-right font-secondary italic text-[11px] text-[#0a2225]/45">
                {t.date}
              </div>
            </figure>
          ))}
        </div>

        {testimonials.length > 6 && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="text-sm font-medium text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225] transition-colors"
            >
              {showAll ? "Show fewer reviews" : "Show all reviews"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
