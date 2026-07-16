// "Earn on Goldsainte" — one earn-focused section that consolidates the
// old HowGoldsainteWorks role tabs + TwoWaysComparison + RoleSpecificCTAs.
// Travelers get their story in the hero and DreamTripBand; this section
// belongs to the supply side: creators and certified experts.
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import creatorImage from "@/assets/home/hero-amalfi-coast.webp";
import expertImage from "@/assets/fine-dining-hero.webp";

const inter = { fontFamily: "Inter, sans-serif" } as const;

const cards = [
  {
    tag: "For travel creators",
    title: "Turn your influence into booked trips",
    mechanics: "AI-written guides · Your travel map · Brand collabs · Paid group trips",
    body: "Your profile becomes a storefront: publish destination guides with an AI writer trained on your voice, light up your travel map, open brand collaborations, and let followers request spots on your trips — every booking protected by escrow, paid out through Stripe.",
    cta: "Start creating",
    link: "/auth?mode=signup&role=creator",
    image: creatorImage,
    alt: "Warm coastal vista along the Amalfi coastline",
  },
  {
    tag: "For travel specialists",
    title: "Design journeys for clients worldwide",
    mechanics: "Trip requests · Bespoke proposals · Guaranteed milestone payouts",
    body: "Real travelers post dream trips; you answer with bespoke proposals. Get paid in guaranteed milestones — your deposit releases as working capital once reservations are confirmed, the balance on completion. No invoicing, no chasing.",
    cta: "Join as a travel expert",
    link: "/apply/agent",
    image: expertImage,
    alt: "Refined fine dining setting at golden hour",
  },
];

export function EarnSection() {
  return (
    <section className="bg-[#FDF9F0] py-16 md:py-[88px]">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7136]" style={inter}>
          Earn on Goldsainte
        </span>
        <span aria-hidden="true" className="mx-auto mt-3.5 block h-px w-12 bg-[#C7A962]" />
        <h2 className="mt-5 font-secondary text-[30px] md:text-[40px] text-[#0a2225]">
          Your travels are worth something
        </h2>
        <p className="mx-auto mt-3 mb-11 max-w-2xl text-[15px] md:text-[17px] leading-relaxed text-[#4a4a4a]">
          Two ways to turn experience into income — as a creator whose content becomes
          booked trips, or as a certified specialist designing where others go next.
        </p>

        <div className="grid grid-cols-1 gap-7 text-left md:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.tag}
              to={c.link}
              aria-label={c.title}
              className="group relative block aspect-[16/11] md:aspect-[16/10] overflow-hidden rounded-[26px] bg-[#0a2225] shadow-[0_24px_60px_rgba(10,34,37,0.12)] transition-all duration-500 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_36px_80px_rgba(10,34,37,0.22)]"
            >
              <img
                src={c.image}
                alt={c.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out motion-safe:group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/90 via-[#0a2225]/35 to-transparent" />
              <span className="absolute left-6 top-6 inline-block rounded-full bg-[#0a2225]/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#E8C977] backdrop-blur-sm" style={inter}>
                {c.tag}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 text-white">
                <h3 className="font-secondary italic text-[22px] md:text-[26px] leading-[1.15]">{c.title}</h3>
                <p className="mt-1.5 font-secondary text-[15px] md:text-[17px] text-[#E8C977]">{c.mechanics}</p>
                <p className="mt-2 max-w-[440px] text-[13px] md:text-[13.5px] leading-relaxed text-white/85" style={inter}>
                  {c.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#E8C977]" style={inter}>
                  {c.cta} <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
