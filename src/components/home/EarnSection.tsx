// "Earn on Goldsainte" — the supply-side conversion cards (redesigned Jul 16
// eve to the house editorial language: cream cards, hairline borders, serif
// titles, photo as a restrained top band — matching the rest of the site
// instead of dark-billboard advertising grammar).
import { Link } from "react-router-dom";
import creatorImage from "@/assets/home/hero-amalfi-coast.webp";
import expertImage from "@/assets/fine-dining-hero.webp";

const inter = { fontFamily: "Inter, sans-serif" };

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
    cta: "Join as a specialist",
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
              className="group block overflow-hidden rounded-[26px] border border-[#E5DFC6] bg-white/70 transition-all duration-500 ease-out motion-safe:hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(10,34,37,0.12)]"
            >
              <div className="h-44 overflow-hidden md:h-52">
                <img
                  src={c.image}
                  alt={c.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-7 md:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a7136]" style={inter}>
                  {c.tag}
                </p>
                <h3 className="mt-3 font-secondary text-[24px] leading-snug text-[#0a2225] md:text-[26px]">
                  {c.title}
                </h3>
                <p className="mt-2 text-[13px] text-[#8D6B2F]" style={inter}>
                  {c.mechanics}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-[#0a2225]/75">
                  {c.body}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0c4d47]">
                  {c.cta}
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
