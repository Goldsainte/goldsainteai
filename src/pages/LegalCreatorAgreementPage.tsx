import { Helmet } from 'react-helmet-async';

export default function LegalCreatorAgreementPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <Helmet>
        <title>Creator Partnership Agreement · Goldsainte</title>
      </Helmet>
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Legal</p>
        <h1 className="font-secondary text-3xl text-[#0a2225]">Creator Partnership Agreement</h1>
        <p className="text-sm text-[#4a4a4a]">
          This agreement outlines the terms of your partnership with Goldsainte as a creator.
          These are placeholder sections that will be replaced with finalized legal language before launch.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Commission Structure & Payouts</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Detail the commission rates, payout schedules, and payment processing
          terms for creators on the Goldsainte platform.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Content Guidelines & Brand Representation</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Outline content standards, brand alignment requirements, and guidelines
          for representing Goldsainte and partner brands.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Exclusivity & Non-Compete</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Clarify any exclusivity arrangements, non-compete clauses, and restrictions
          on working with competing platforms.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Traveler Safety & Liability</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Define creator responsibilities regarding traveler safety, liability
          limitations, and insurance requirements.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Performance Expectations</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Describe performance metrics, response time requirements, and quality
          standards expected of Goldsainte creators.
        </p>
      </section>
    </div>
  );
}
