import { Helmet } from 'react-helmet-async';

export default function TrustSafetyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <Helmet>
        <title>Trust &amp; Safety · Goldsainte</title>
      </Helmet>
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Safety</p>
        <h1 className="font-secondary text-3xl text-[#0a2225]">Trust &amp; Safety</h1>
        <p className="text-sm text-[#4a4a4a]">
          How we keep travelers, creators, agents, and brands safe. These
          sections outline the policies, verification, and reporting flows in
          place.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Verification</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Describe brand verification, creator/agent verification, and how
          badges appear across the product.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Reporting</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Explain how to report collections, trips, users, or messages, and
          how moderation decisions are handled.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Payments & protection</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Outline escrow, dispute resolution, refunds, and payout safety
          through Stripe Connect.
        </p>
      </section>
    </div>
  );
}
