import { Link } from "react-router-dom";

// ============================================================================
// StorefrontsBand — elevated to the homepage's premium band language:
// deep-green immersive panel + radial gold glow (DreamTripBand family),
// frosted cream-on-green cards, dark gold scene chips, gold CTAs, and a
// miniature storefront vignette inside each card (the mock-UI device the
// showcase sections use). Copy and money claims unchanged: professionals are
// the seller of record, paid directly to their own Stripe.
// ============================================================================

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 inline-flex w-fit items-center rounded-full bg-[#061a18]/85 px-3.5 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[#C7A962] backdrop-blur-sm">
      {children}
    </span>
  );
}

/* A tiny abstract storefront: avatar, name bars, offerings, tip pill. */
function CreatorVignette() {
  return (
    <div className="rounded-2xl bg-[#fdfaf2] p-5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#C7A962] to-[#8D6B2F]" />
        <span className="flex-1 leading-tight">
          <span className="block text-[14px] font-semibold text-[#0a2225]">Maya R.</span>
          <span className="mt-0.5 block text-[12px] text-[#0a2225]/50">Lisbon · Photographer & guide</span>
        </span>
        <span className="rounded-full bg-[#C7A962] px-3.5 py-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-[#073331]">
          Tip
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {[
          ["Lisbon in 3 days — city guide", "$19"],
          ["Golden-hour photo session", "$350"],
          ["Private day guiding", "$450/day"],
        ].map(([t, price]) => (
          <div
            key={t}
            className="flex items-center justify-between rounded-lg border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2"
          >
            <span className="text-[12.5px] text-[#4a4433]">{t}</span>
            <span className="text-[12.5px] font-semibold text-[#0c4d47]">{price}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-[#0c4d47] px-4 py-3">
        <span className="text-[12px] uppercase tracking-[0.1em] text-[#E5DFC6]">
          Hired on location
        </span>
        <span className="text-[12px] font-medium text-[#C7A962]">Oct 12 · Booked</span>
      </div>
    </div>
  );
}

/* A tiny request → proposal exchange with the money landing direct. */
function AgentVignette() {
  return (
    <div className="rounded-2xl bg-[#fdfaf2] p-5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] uppercase tracking-[0.12em] text-[#7A7151]">
          New trip request
        </span>
        <span className="text-[12px] text-[#0a2225]/40">2m ago</span>
      </div>
      <div className="mt-2">
        <span className="block text-[14px] font-semibold text-[#0a2225]">Maldives · 7 nights · 2 travelers</span>
        <span className="mt-0.5 block text-[12.5px] text-[#0a2225]/50">Overwater villa · spa · budget $12,000</span>
      </div>
      <div className="mt-4 rounded-xl border border-[#E5DFC6] bg-[#f7f3ea] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-[0.12em] text-[#0c4d47]">
            Your proposal
          </span>
          <span className="rounded-full bg-[#0c4d47] px-3 py-1 text-[12px] uppercase tracking-[0.08em] text-[#E5DFC6]">
            Accepted
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#0a2225]">$11,400 itinerary</span>
          <span className="rounded-full bg-[#C7A962]/20 px-3 py-1 text-[12px] font-medium text-[#8D6B2F]">
            Paid direct to you
          </span>
        </div>
      </div>
    </div>
  );
}

const STOREFRONTS = [
  {
    chip: "Your storefront",
    eyebrow: "For travel creators",
    title: "Your own travel storefront",
    body: "Your profile is a storefront under your name — publish your guides, get hired for photography, guiding, and on-trip services, and take tips from travelers you inspire. Payments land directly in your own Stripe account.",
    cta: "Open your storefront",
    to: "/auth?mode=signup&role=creator",
    vignette: <CreatorVignette />,
  },
  {
    chip: "Your proposals",
    eyebrow: "For travel agents",
    title: "Your agency's storefront",
    body: "Showcase your expertise, receive trip requests matched to you, and win clients with custom proposals. You are the seller of record — travelers pay you directly, on your own Stripe account.",
    cta: "Open your storefront",
    to: "/auth?mode=signup&role=agent",
    vignette: <AgentVignette />,
  },
];

export function StorefrontsBand() {
  return (
    <section id="storefronts" className="relative scroll-mt-24 overflow-hidden bg-[#0c4d47] px-4 py-16 text-[#FDF9F0] sm:px-6 md:py-[84px]">
      {/* Radial gold glows — the band-family signature */}
      <div
        className="pointer-events-none absolute -right-24 -top-36 h-[460px] w-[460px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(199,169,98,0.16), transparent 65%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-32 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(199,169,98,0.10), transparent 65%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-[12px] uppercase tracking-[0.24em] text-[#C7A962]">
            Build your business here
          </p>
          <h2 className="mt-3.5 font-secondary text-[28px] leading-[1.1] text-[#FDF9F0] md:text-4xl">
            Two storefronts. One marketplace.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-[#FDF9F0]/70">
            Goldsainte is where travelers book — and where travel professionals
            build. Creators and travel agents each get a storefront of their
            own, under their own name, paid directly.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {STOREFRONTS.map((s) => (
            <div
              key={s.eyebrow}
              className="flex flex-col rounded-[20px] border border-[#E5DFC6]/22 bg-[#FDF9F0]/[0.06] p-7 md:p-9"
            >
              <Chip>{s.chip}</Chip>
              {s.vignette}
              <p className="mt-7 text-[12px] uppercase tracking-[0.22em] text-[#C7A962]">
                {s.eyebrow}
              </p>
              <h3 className="mt-2.5 font-secondary text-[24px] leading-snug text-[#FDF9F0] md:text-[27px]">
                {s.title}
              </h3>
              <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-[#FDF9F0]/70">
                {s.body}
              </p>
              <div className="mt-7">
                <Link
                  to={s.to}
                  className="inline-flex items-center justify-center rounded-full bg-[#C7A962] px-8 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#073331] transition-colors hover:bg-[#b3954f]"
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
