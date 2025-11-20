import { Helmet } from 'react-helmet-async';

export default function LegalPrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <Helmet>
        <title>Privacy Policy · Goldsainte</title>
      </Helmet>
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
          TODO: Describe profile information, trip details, messaging data, and
          analytics events captured to improve the experience.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">How we use your data</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Explain personalization (matching, collection recs), safety
          checks, and operations like payments and support.
        </p>
      </section>

      <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6 space-y-3 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0a2225]">Your choices</h2>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          TODO: Add controls for email preferences, data export, deletion
          requests, and cookie settings.
        </p>
      </section>
    </div>
  );
}
