import { Helmet } from 'react-helmet-async';
import { BackButton } from '@/components/ui/BackButton';

export default function LegalTermsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <Helmet>
        <title>Terms of Service · Goldsainte</title>
      </Helmet>
      <BackButton className="mb-4" />
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
          You must be at least 18 years old and able to enter into a binding
          contract to use Goldsainte. You agree to provide accurate
          information, keep your account credentials secure, and use the
          platform only for lawful purposes. Goldsainte is a curated
          marketplace that connects travelers with independent travel agents,
          creators, and third-party suppliers. We are not the airline, hotel,
          tour operator, or supplier for any trip booked through the
          platform. We may update these terms from time to time; material
          changes will be communicated by email or in-product notice at least
          14 days before they take effect.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Content &amp; conduct</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          You retain ownership of the content you post (storyboards, photos,
          messages) and grant Goldsainte a worldwide, non-exclusive licence
          to host, display, and distribute it on the platform. You must not
          post content that is unlawful, infringing, fraudulent, harassing,
          or that solicits off-platform payment or contact. All communication
          and payment relating to a trip must stay on Goldsainte; sharing
          phone numbers, personal email, bank details, or external payment
          links is grounds for suspension and forfeits buyer/seller
          protection. We may remove content, suspend accounts, or terminate
          access at our discretion for violations of these terms or our
          Community Guidelines.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Payments &amp; bookings</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          All payments are processed by Stripe. Goldsainte charges a 7%
          platform fee on each transaction (3.5% deducted from the
          professional's payout and 3.5% added to the traveler's total).
          Funds are held in escrow and released to the travel professional
          per the milestones agreed in the booking. Refund and cancellation
          eligibility is governed by supplier rules and the travel
          professional's terms — see our{' '}
          <a href="/cancellation-refund-policy" className="underline">
            Cancellation &amp; Refund Policy
          </a>{' '}
          for full detail. Chargebacks initiated outside our dispute process
          may result in account suspension. Travel professionals receive
          payouts via Stripe Connect and are responsible for their own tax
          obligations.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Liability &amp; disputes</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          Goldsainte's liability is limited to the platform fee paid for the
          relevant booking. We are not liable for the acts, omissions, or
          performance of independent travel professionals or third-party
          suppliers, nor for events outside our reasonable control
          (including travel disruptions, weather, or government action).
          Disputes should first be raised through our in-platform resolution
          centre. These terms are governed by the laws of England and Wales,
          and any unresolved dispute will be subject to the exclusive
          jurisdiction of its courts.
        </p>
      </section>

      <p className="text-xs text-[#7A7151]">
        Last updated: May 2026. Contact:{' '}
        <a href="mailto:legal@goldsainte.ai" className="underline">
          legal@goldsainte.ai
        </a>
      </p>
    </div>
  );
}
