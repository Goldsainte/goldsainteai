import { Helmet } from 'react-helmet-async';
import { Shield, Flag, CreditCard } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';

export default function TrustSafetyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <Helmet>
        <title>Trust &amp; Safety · Goldsainte</title>
      </Helmet>
      <BackButton className="mb-4" />
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">Safety &amp; Trust</p>
        <h1 className="font-secondary text-3xl text-[#0a2225]">Travel with confidence</h1>
        <p className="text-sm text-[#4a4a4a]">
          Goldsainte is built on a foundation of verified professionals,
          transparent transactions, and accountable communication. Here&apos;s
          how we keep your travel experience safe.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#0c4d47]" />
          <h2 className="text-lg font-semibold text-[#0a2225]">Verification</h2>
        </div>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          Every travel agent on Goldsainte completes Stripe Identity verification,
          providing government-issued ID confirmation before they can publish or
          receive payments. Travel creators must connect verified social profiles
          and pass a quality review. Brand partners undergo business verification
          including company registration and verified contact details.
        </p>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          Verified accounts display a tier badge on their profile and listings.
          Look for the cream-and-green badge before booking — it confirms the
          professional has passed our checks.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-[#0c4d47]" />
          <h2 className="text-lg font-semibold text-[#0a2225]">Reporting and moderation</h2>
        </div>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          If you encounter a listing, message, or behavior that violates our
          community guidelines, report it directly from the page using the menu
          icon. Our moderation team reviews every report within 24 hours.
        </p>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          We remove content and suspend accounts that violate our policies on
          fraud, harassment, misleading information, or unauthorized commercial
          activity. Repeated violations result in permanent removal from the
          platform.
        </p>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          For urgent safety concerns during a trip, contact us immediately at{' '}
          <a href="mailto:safety@goldsainte.com" className="text-[#0c4d47] underline">
            safety@goldsainte.com
          </a>{' '}
          or use the in-app emergency contact feature.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#0c4d47]" />
          <h2 className="text-lg font-semibold text-[#0a2225]">Payments and protection</h2>
        </div>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          All payments on Goldsainte are processed through Stripe, a PCI Level 1
          certified payment processor. We never see or store your card details.
        </p>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          For booked trips, your payment is held in escrow through Stripe Connect
          until the trip begins. This ensures the travel professional only
          receives payment for trips that are confirmed and ongoing. If your
          trip is cancelled per our cancellation policy, you&apos;re eligible for
          a refund.
        </p>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          If you have a dispute with a travel professional, file a claim through
          your booking page. Our dispute resolution team reviews evidence from
          both parties and issues a binding decision within 7 business days. See
          our{' '}
          <a href="/cancellation-refund-policy" className="text-[#0c4d47] underline">
            refund policy and dispute process
          </a>{' '}
          for full details.
        </p>
      </section>

      <section className="rounded-2xl bg-[#0c4d47] p-6 text-center space-y-3">
        <h2 className="font-secondary text-xl text-white">Questions or concerns?</h2>
        <p className="text-sm text-white/80">Our team is here to help.</p>
        <a
          href="mailto:support@goldsainte.com"
          className="inline-block rounded-full bg-white text-[#0c4d47] px-6 py-2 text-sm font-medium hover:bg-[#FDF9F0]"
        >
          Contact Support
        </a>
      </section>

      <p className="text-xs text-[#7A7151]">Last updated: May 2026.</p>
    </div>
  );
}
