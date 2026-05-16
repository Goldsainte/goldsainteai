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
          A plain-language summary of the terms that govern your use of
          Goldsainte. The full Terms of Service are available at{' '}
          <a href="/terms" className="text-[#0c4d47] underline">/terms</a>.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Account eligibility</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          To create an account on Goldsainte, you must be at least 18 years old
          and have the legal capacity to enter contracts. Travel agents and
          brand partners must additionally provide proof of business
          registration and meet our professional standards. By signing up, you
          confirm the information you provide is accurate. Misrepresenting your
          identity or qualifications is grounds for immediate account
          termination.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Acceptable use</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          Goldsainte is a marketplace for legitimate travel services. Prohibited
          uses include: posting false or misleading listings, attempting to
          circumvent platform fees, harassing other users, posting illegal
          content, scraping platform data, or using the service for any
          commercial purpose other than the published travel services. We may
          suspend or remove accounts that violate these terms without notice.
        </p>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          Intellectual property posted by you (photos, descriptions,
          itineraries) remains yours, but you grant Goldsainte a license to
          display this content on the platform and in promotional materials
          related to your listings.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Account changes and termination</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          You can update your profile or close your account at any time from
          Settings. If you close your account, your listings will be removed
          within 24 hours, but transactional records will be retained as
          required by law. We may terminate accounts for violations of these
          terms, fraud, or if required by law. Our full Terms of Service
          include additional details on liability, indemnification, and dispute
          resolution — please review them at{' '}
          <a href="/terms" className="text-[#0c4d47] underline">/terms</a>{' '}
          before using the service.
        </p>
      </section>

      <p className="text-xs text-[#7A7151]">Last updated: May 2026.</p>
    </div>
  );
}
