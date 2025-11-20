import { Helmet } from 'react-helmet-async';

export default function LegalTermsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <Helmet>
        <title>Terms of Service · Goldsainte</title>
      </Helmet>
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Legal</p>
        <h1 className="font-secondary text-3xl text-[#0a2225]">Terms of Service</h1>
        <p className="text-sm text-[#4a4a4a]">
          This page outlines the terms that govern how you use Goldsainte. These
          are placeholder sections that will be replaced with finalized legal
          language before launch.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Using Goldsainte</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Add details about account eligibility, responsible use, and how
          we handle changes to the service.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Content & conduct</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Outline acceptable use, intellectual property, and what happens
          if content is flagged for review.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Payments & bookings</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Describe how bookings, fees, and payouts are handled, including
          Stripe Connect readiness.
        </p>
      </section>
    </div>
  );
}
