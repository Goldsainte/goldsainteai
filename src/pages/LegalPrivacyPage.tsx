import { Helmet } from 'react-helmet-async';
import { BackButton } from '@/components/ui/BackButton';

export default function LegalPrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <Helmet>
        <title>Privacy Policy · Goldsainte</title>
      </Helmet>
      <BackButton className="mb-4" />
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Legal</p>
        <h1 className="font-secondary text-3xl text-[#0a2225]">Privacy Policy</h1>
        <p className="text-sm text-[#4a4a4a]">
          Learn how Goldsainte collects, uses, and protects your data. The
          sections below are placeholders until final policy text is published.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Data we collect</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          We collect information you provide directly — including your name,
          email address, phone number, profile photo, travel preferences, and
          trip details — when you create an account, request a trip, or
          communicate with travel professionals on Goldsainte. For verified
          professionals, we also collect identity verification data via Stripe
          Identity (government ID, selfie, and address). When you make a
          booking, payment information is processed and stored by Stripe; we
          retain only transaction metadata (amount, currency, status, last 4
          digits of card). We automatically collect device, browser, IP
          address, referral source, and usage analytics (page views, clicks,
          searches) to operate and improve the platform.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">How we use your data</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          We use your information to (1) operate the marketplace — matching
          travelers with agents and creators, processing bookings, and
          enabling on-platform messaging; (2) verify identity and prevent
          fraud, including running KYC checks and monitoring for off-platform
          activity that violates our terms; (3) process payments and payouts
          through Stripe; (4) personalize recommendations, search results,
          and storyboards; (5) send transactional emails (booking
          confirmations, trip updates, security alerts) and, with your
          consent, marketing communications; (6) respond to support requests
          and resolve disputes; and (7) comply with legal obligations
          including tax, anti-money-laundering, and travel regulations.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Your choices</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          You can review and update your profile at any time from your
          account settings. You may unsubscribe from marketing emails via the
          link in any message; transactional emails relating to active
          bookings cannot be disabled. You can request a copy of your data or
          deletion of your account by emailing{' '}
          <a href="mailto:privacy@goldsainte.ai" className="underline">
            privacy@goldsainte.ai
          </a>
          . We will respond within 30 days. Note that we may retain certain
          records (bookings, payments, tax documents) for as long as required
          by law, typically up to 7 years. Cookies can be managed through
          your browser settings; disabling them may affect site functionality.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Sharing &amp; third parties</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          We share data with travel professionals you transact with (so they
          can fulfil your trip), with service providers acting on our behalf
          (Stripe for payments and identity, Resend for email, Supabase for
          hosting, analytics providers), and when legally required (subpoenas,
          regulators, fraud investigations). We do not sell your personal
          data. International transfers are protected by Standard Contractual
          Clauses where applicable.
        </p>
      </section>

      <p className="text-xs text-[#7A7151]">
        Last updated: May 2026. Contact:{' '}
        <a href="mailto:privacy@goldsainte.ai" className="underline">
          privacy@goldsainte.ai
        </a>
      </p>
    </div>
  );
}
