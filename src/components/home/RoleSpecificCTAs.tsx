// src/components/home/RoleSpecificCTAs.tsx
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import travelerImage from "@/assets/home/hero-overwater-villa.jpg";
import creatorImage from "@/assets/home/hero-amalfi-coast.jpg";
import agentImage from "@/assets/fine-dining-hero.jpg";

type Pathway = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  link: string;
  image: string;
  alt: string;
};

const pathways: Pathway[] = [
  {
    eyebrow: "For Travelers",
    title: "Discover Extraordinary Journeys",
    description:
      "Explore handpicked experiences personalized around your travel style, destinations, and preferences.",
    cta: "Explore Experiences",
    link: "/explore",
    image: travelerImage,
    alt: "Cinematic overwater villa at sunset reflecting a luxury traveler's perspective.",
  },
  {
    eyebrow: "For Travel Creators",
    title: "Turn Your Journey Into Income",
    description:
      "Turn your travel memories, recommendations, and experiences into bookable journeys you can share and sell — powered by AI.",
    cta: "Start Creating",
    link: "/auth?mode=signup&role=creator",
    image: creatorImage,
    alt: "Warm coastal vista along the Amalfi coastline, capturing aspirational travel moments to monetize.",
  },
  {
    eyebrow: "For Travel Experts",
    title: "Design Exceptional Experiences",
    description:
      "Craft personalized luxury itineraries and deliver concierge-level travel planning at scale.",
    cta: "Join as a Travel Expert",
    link: "/apply/agent/signup",
    image: agentImage,
    alt: "Refined fine dining setting representing the bespoke luxury experiences travel experts design.",
  },
];

export function RoleSpecificCTAs() {
  return (
    <section className="bg-[#FDF9F0] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.18em] text-[#D4C07A]">
            The Goldsainte Ecosystem
          </p>
          <span aria-hidden="true" className="mx-auto mt-4 block h-px w-12 bg-[#C7A962]" />
          <h2 className="mt-5 font-secondary text-[28px] leading-[1.1] tracking-tight text-[#0a2225] md:text-[44px]">
            Experience Goldsainte Your Way
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] md:text-base leading-relaxed text-[#5A5A5A]">
            Whether you're planning your next adventure, sharing your travel expertise, or crafting bespoke itineraries for clients — Goldsainte connects every part of modern travel in one place.
          </p>
        </div>

        <div className="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {pathways.map((p) => (
            <Link
              key={p.title}
              to={p.link}
              aria-label={p.title}
              className="group relative block aspect-[3/4] overflow-hidden rounded-[28px] bg-[#0a2225] shadow-[0_24px_60px_rgba(10,34,37,0.12)] transition-all duration-500 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_36px_80px_rgba(10,34,37,0.22)]"
            >
              <img
                src={p.image}
                alt={p.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out motion-safe:group-hover:scale-[1.06]"
              />
              {/* Bottom darkening gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/85 via-[#0a2225]/35 to-transparent" />
              {/* Top gold sheen */}
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#C7A962]/10 to-transparent" />

              {/* Top eyebrow */}
              <div className="absolute left-6 top-6 md:left-7 md:top-7">
                <span className="inline-block rounded-full bg-[#0a2225]/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#E8C977] backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
                  {p.eyebrow}
                </span>
                <span className="mt-2 block h-px w-10 origin-left scale-x-0 bg-[#E8C977] transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </div>

              {/* Bottom content */}
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 text-white">
                <h3 className="font-secondary italic text-[22px] md:text-[26px] leading-[1.15] text-white">
                  {p.title}
                </h3>
                <p className="mt-3 max-w-[34ch] text-[13px] md:text-[14px] leading-relaxed text-white/85">
                  {p.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2 text-[12px] font-medium text-[#E5DFC6]">
                  {p.cta}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center font-secondary italic text-[12px] text-[#0a2225]/55">
          One ecosystem · Three ways to belong
        </p>
      </div>
    </section>
  );
}
