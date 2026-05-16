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
          A plain-language summary of what we collect, how we use it, and the
          controls you have over your data.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Information we collect</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          When you create an account, we collect your name, email, optional
          phone number, and role (traveler, creator, or agent). When you publish
          a trip or itinerary, we collect details you provide including title,
          destination, pricing, photos, and descriptions. When you message
          another user, we store messages to enable the conversation and for
          safety review if needed. When you make a payment, we collect
          transaction metadata (amount, currency, payment status) — we never see
          or store your card details, which are handled directly by Stripe.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">How we use your information</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          We use your information to operate the platform: match you with
          relevant trips or trip requests, process payments via Stripe Connect,
          deliver email and SMS notifications you opt into, prevent fraud
          through automated and manual review, and improve the product through
          aggregated, anonymized analytics. We never sell your personal
          information to third parties.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Your privacy controls</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          You can update your profile information anytime in Settings. You can
          opt out of marketing emails through the unsubscribe link in any
          email, or in Settings. You can request a copy of your data or request
          account deletion by emailing{' '}
          <a href="mailto:privacy@goldsainte.com" className="text-[#0c4d47] underline">
            privacy@goldsainte.com
          </a>{' '}
          — we process these requests within 30 days as required by GDPR and
          CCPA. After deletion, transactional records (bookings, payouts) are
          retained per legal and tax requirements for the minimum period
          required by law.
        </p>
      </section>

      <p className="text-xs text-[#7A7151]">Last updated: May 2026.</p>
    </div>
  );
}
