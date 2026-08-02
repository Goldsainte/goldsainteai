// Homepage differentiator section — the things big-tech travel doesn't do:
// negotiated-to-booked in chat, the contract gate, escrow-on-milestones,
// and on-platform protection. Traveler-framed, editorial style.
import { useTranslation } from "react-i18next";

const POINTS = [
  {
    n: "01",
    titleKey: "home.oneConv.p1Title",
    title: "Discover with confidence.",
    bodyKey: "home.oneConv.p1Body",
    body:
      "Browse journeys designed from real destination experience — by specialists and travelers who've actually been there.",
  },
  {
    n: "02",
    titleKey: "home.oneConv.p2Title",
    title: "Choose what fits.",
    bodyKey: "home.oneConv.p2Body",
    body:
      "Book instantly with transparent pricing, or compare tailored proposals built around your vision and pick the one you love.",
  },
  {
    n: "03",
    titleKey: "home.oneConv.p3Title",
    title: "Plan in one place.",
    bodyKey: "home.oneConv.p3Body",
    body:
      "Keep your messages, itinerary, documents, and updates together — from first idea to the day you land.",
  },
  {
    n: "04",
    titleKey: "home.oneConv.p4Title",
    title: "Travel with support.",
    bodyKey: "home.oneConv.p4Body",
    body:
      "Stay connected to your specialist before, during, and after your journey — a message away the whole way.",
  },
];

export function OneConversationSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-[#f7f3ea] border-t border-[#E5DFC6] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-[#8D6B2F]">
          {t("home.oneConv.eyebrow", "Why Goldsainte")}
        </p>
        <h2 className="mt-3 max-w-xl font-secondary text-3xl leading-[1.08] text-[#0a2225] md:text-4xl">
          {t("home.oneConv.h2", "One thread. The whole trip.")}
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#0a2225]/60">
          {t("home.oneConv.sub", "Ask, negotiate, sign, and pay — without ever leaving your messages.")}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-9 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div key={p.n}>
              <p className="font-secondary text-2xl text-[#c7a962]">{p.n}</p>
              <h3 className="mt-2 font-secondary text-xl text-[#0a2225]">
                {t(p.titleKey, p.title)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0a2225]/65 md:text-[15px]">
                {t(p.bodyKey, p.body)}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t border-[#0a2225]/10 pt-6 text-[15px] font-medium text-[#0a2225]">
          {t(
            "home.oneConv.closer",
            "No other travel platform takes you from first message to fully booked — without leaving the chat."
          )}
        </p>
      </div>
    </section>
  );
}
