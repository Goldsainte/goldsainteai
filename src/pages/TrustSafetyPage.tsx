import { Helmet } from 'react-helmet-async';
import { BackButton } from '@/components/ui/BackButton';

export default function TrustSafetyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <Helmet>
        <title>Trust &amp; Safety · Goldsainte</title>
      </Helmet>
      <BackButton className="mb-4" />
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
          Every travel agent and creator on Goldsainte completes mandatory
          identity verification through Stripe Identity before they can
          accept a booking. This includes government-issued ID, a live
          selfie match, and address confirmation. Agents must additionally
          provide proof of professional credentials (IATA, ASTA, or
          equivalent licensing where applicable) and are reviewed by our
          team before approval. Verified professionals carry a visible
          badge across their profile, storyboards, and proposals so you
          always know who you're working with.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Reporting</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          You can report a storyboard, trip, message, or user from the menu
          on any profile or content card. Reports go directly to our trust
          &amp; safety team and are typically reviewed within 24 hours. Our
          automated systems also flag attempts to share off-platform
          contact details (phone numbers, personal email, bank details) or
          payment links in chat, and warn both parties in real time. For
          urgent safety concerns or suspected fraud, email{' '}
          <a href="mailto:safety@goldsainte.ai" className="underline">
            safety@goldsainte.ai
          </a>
          . Confirmed violations result in warnings, suspension, or
          permanent removal depending on severity.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Payments &amp; protection</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          All payments are processed by Stripe and held in escrow.
          Travelers pay Goldsainte, not the agent directly; funds are
          released to the travel professional in milestones tied to the
          trip (typically deposit on confirmation, balance closer to
          departure, and a portion held until trip completion). This means
          if a professional fails to deliver, we can pause payouts and
          process a refund per our{' '}
          <a href="/cancellation-refund-policy" className="underline">
            Cancellation &amp; Refund Policy
          </a>
          . Payouts to professionals run via Stripe Connect with full KYC
          and anti-money-laundering checks. Buyer and seller protection
          only applies to transactions completed on-platform — trips paid
          outside Goldsainte are not protected.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">On-platform only</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          For your protection, all communication, document sharing, and
          payment must remain inside Goldsainte. We cannot mediate
          disputes, refund payments, or enforce supplier terms for any
          activity that moves to WhatsApp, personal email, bank transfer,
          or external payment links. If a professional asks you to move
          off-platform, please report it.
        </p>
      </section>

      <p className="text-xs text-[#7A7151]">
        Last updated: May 2026. Contact:{' '}
        <a href="mailto:safety@goldsainte.ai" className="underline">
          safety@goldsainte.ai
        </a>
      </p>
    </div>
  );
}
