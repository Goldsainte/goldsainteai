// "Earn on Goldsainte" — the supply-side conversion cards (redesigned Jul 16
// eve to the house editorial language: cream cards, hairline borders, serif
// titles, photo as a restrained top band — matching the rest of the site
// instead of dark-billboard advertising grammar).
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import creatorImage from "@/assets/home/hero-amalfi-coast.webp";
import expertImage from "@/assets/fine-dining-hero.webp";

const inter = { fontFamily: "Inter, sans-serif" };

const cards = [
  {
    tagKey: "home.earn.c1Tag",
    tag: "For travel creators",
    titleKey: "home.earn.c1Title",
    title: "Turn your influence into booked trips",
    mechKey: "home.earn.c1Mech",
    mechanics: "AI-written guides · Your travel map · Brand collabs · Paid group trips",
    bodyKey: "home.earn.c1Body",
    body: "Your profile becomes a storefront: publish destination guides with an AI writer trained on your voice, light up your travel map, open brand collaborations, and share marketplace trips with your own affiliate link — earning a commission on every booking you inspire.",
    ctaKey: "home.earn.c1Cta",
    cta: "Start creating",
    link: "/auth?mode=signup&role=creator",
    image: creatorImage,
    altKey: "home.earn.c1Alt",
    alt: "Warm coastal vista along the Amalfi coastline",
  },
  {
    tagKey: "home.earn.c2Tag",
    tag: "For travel specialists",
    titleKey: "home.earn.c2Title",
    title: "Design journeys for clients worldwide",
    mechKey: "home.earn.c2Mech",
    mechanics: "Trip requests · Bespoke proposals · Paid at booking",
    bodyKey: "home.earn.c2Body",
    body: "Real travelers post dream trips from around the world; you answer with bespoke proposals — wherever you're based. Get paid at booking — deposits and balances land in your own Stripe account the moment your client pays. No invoicing, no chasing.",
    ctaKey: "home.earn.c2Cta",
    cta: "Join as a specialist",
    link: "/apply/agent",
    image: expertImage,
    altKey: "home.earn.c2Alt",
    alt: "Refined fine dining setting at golden hour",
  },
];

export function EarnSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-[#FDF9F0] py-16 md:py-[88px]">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7136]" style={inter}>
          {t("home.earn.eyebrow", "Earn on Goldsainte")}
        </span>
        <span aria-hidden="true" className="mx-auto mt-3.5 block h-px w-12 bg-[#C7A962]" />
        <h2 className="mt-5 font-secondary text-[30px] md:text-[40px] text-[#0a2225]">
          {t("home.earn.h2", "Your travels are worth something")}
        </h2>
        <p className="mx-auto mt-3 mb-11 max-w-2xl text-[15px] md:text-[17px] leading-relaxed text-[#4a4a4a]">
          {t(
            "home.earn.sub",
            "Two ways to turn experience into income — as a creator whose content becomes booked trips, or as a certified specialist designing where others go next."
          )}
        </p>

        <div className="grid grid-cols-1 gap-7 text-left md:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.tag}
              to={c.link}
              aria-label={t(c.titleKey, c.title)}
              className="group block overflow-hidden rounded-[26px] border border-[#E5DFC6] bg-white/70 transition-all duration-500 ease-out motion-safe:hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(10,34,37,0.12)]"
            >
              <div className="h-44 overflow-hidden md:h-52">
                <img
                  src={c.image}
                  alt={t(c.altKey, c.alt)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-7 md:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a7136]" style={inter}>
                  {t(c.tagKey, c.tag)}
                </p>
                <h3 className="mt-3 font-secondary text-[24px] leading-snug text-[#0a2225] md:text-[26px]">
                  {t(c.titleKey, c.title)}
                </h3>
                <p className="mt-2 text-[13px] text-[#8D6B2F]" style={inter}>
                  {t(c.mechKey, c.mechanics)}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-[#0a2225]/75">
                  {t(c.bodyKey, c.body)}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0c4d47]">
                  {t(c.ctaKey, c.cta)}
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
