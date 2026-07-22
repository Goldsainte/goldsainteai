import { Link } from "react-router-dom";

// ============================================================================
// StorefrontsBand — the "this platform is FOR YOU" moment for creators and
// travel agents, placed high on the homepage so professionals landing on the
// site immediately understand: you build your own storefront here.
//
// The deeper stories (CreatorShowcaseSection, EarnSection) stay further down
// the page; this band is the instant signal + on-ramp. Money claims here are
// deliberately exact and consistent with the platform's direct-charge model:
// professionals are the seller of record, paid directly to their own Stripe,
// and keep 96.5%.
// ============================================================================

const STOREFRONTS = [
  {
    eyebrow: "For travel creators",
    title: "Your own travel storefront",
    body: "Your profile is a storefront under your name — publish your guides, get hired for photography, guiding, and on-trip services, and take tips from travelers you inspire. Payments land directly in your own Stripe account. You keep 96.5%.",
    cta: "Open your storefront",
    to: "/auth?mode=signup&role=creator",
    accent: "#C7A962",
  },
  {
    eyebrow: "For travel agents",
    title: "Your agency's storefront",
    body: "Showcase your expertise, receive trip requests matched to you, and win clients with custom proposals. You are the seller of record — travelers pay you directly, on your own Stripe account. You keep 96.5%.",
    cta: "Open your storefront",
    to: "/auth?mode=signup&role=agent",
    accent: "#0c4d47",
  },
];

export function StorefrontsBand() {
  return (
    <section className="bg-[#f7f3ea] px-4 py-14 sm:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-[12px] uppercase tracking-[0.24em] text-[#8D6B2F]">
            Build your business here
          </p>
          <h2 className="mt-3.5 font-secondary text-[28px] leading-[1.1] text-[#0a2225] md:text-4xl">
            Two storefronts. One marketplace.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-[#0a2225]/60">
            Goldsainte is where travelers book — and where travel professionals
            build. Creators and travel agents each get a storefront of their
            own, under their own name, paid directly.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {STOREFRONTS.map((s) => (
            <div
              key={s.eyebrow}
              className="flex flex-col rounded-2xl border border-[#C7A962]/25 bg-white p-8 shadow-[0_24px_64px_-48px_rgba(10,34,37,0.35)] md:p-10"
            >
              <p
                className="text-[12px] uppercase tracking-[0.22em]"
                style={{ color: s.accent === "#0c4d47" ? "#0c4d47" : "#8D6B2F" }}
              >
                {s.eyebrow}
              </p>
              <h3 className="mt-3 font-secondary text-[24px] leading-snug text-[#0a2225] md:text-[28px]">
                {s.title}
              </h3>
              <p className="mt-3.5 flex-1 text-[15px] leading-relaxed text-[#0a2225]/65">
                {s.body}
              </p>
              <div className="mt-7">
                <Link
                  to={s.to}
                  className="inline-block rounded-full px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#0c4d47" }}
                >
                  {s.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StorefrontsBand;
