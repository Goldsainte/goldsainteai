import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BadgeCheck,
  Lock,
  AlertTriangle,
  CreditCard,
  Gavel,
  Phone,
  MessageSquare,
  ArrowUpRight,
  Eye,
  UserCheck,
  FileText,
} from "lucide-react";

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const PILLARS = [
  {
    icon: BadgeCheck,
    eyebrow: "01 — Verification",
    title: "Every professional is verified before going live.",
    body: "Travel agents complete Stripe Identity verification — government-issued ID confirmed — before they can publish a listing or receive a single payment. Travel creators connect verified social profiles and pass a quality review. Brand partners provide company registration documents and verified contact details. All professionals display a tiered verification badge on their profile.",
    details: [
      "Government ID checked via Stripe Identity",
      "Social profile verification for creators",
      "Business registration for brand partners",
      "Ongoing account monitoring post-approval",
    ],
  },
  {
    icon: CreditCard,
    eyebrow: "02 — Payments",
    title: "Your money is protected from the moment you pay.",
    body: "Every payment on Goldsainte is processed by Stripe, a PCI Level 1 certified processor. We never see or store your card details. For booked trips, your payment goes directly to your travel professional's own Stripe account — they are your seller of record, with their name on your statement and full accountability for your booking.",
    details: [
      "PCI Level 1 certified payment processing",
      "Payments go direct to your vetted professional",
      "No card details stored by Goldsainte",
      "Refund eligibility per our cancellation policy",
    ],
  },
  {
    icon: Gavel,
    eyebrow: "03 — Disputes",
    title: "If something goes wrong, we step in.",
    body: "File a claim directly from your booking page. Our dispute team administers the platform dispute process: we review evidence from both parties — on-platform messages, documents, and payment records — and aim to resolve platform-level issues within 7 business days, without modifying supplier terms or the seller's obligations under your travel-services agreement. This is why we require all booking communication to stay on-platform: it gives us the record we need to protect you.",
    details: [
      "Claim filed from your booking page",
      "Evidence review within 2 business days",
      "Platform-level resolution within 7 business days",
      "Escalation path to senior review if needed",
    ],
    cta: { label: "Refund policy & dispute process", to: "/cancellation-refund-policy" },
  },
  {
    icon: MessageSquare,
    eyebrow: "04 — Communication",
    title: "Keep it on-platform. It's how we protect you.",
    body: "All trip details, booking changes, and payment requests must stay inside Goldsainte. If a professional asks you to communicate or pay outside the platform — via wire transfer, WhatsApp, personal email, or any external link — do not comply, and report it immediately. Off-platform activity voids your booking protections.",
    details: [
      "No personal phone numbers or emails in chat",
      "No external payment links or bank transfers",
      "All booking approvals documented on-platform",
      "Chat monitoring for fraud indicators",
    ],
  },
  {
    icon: Eye,
    eyebrow: "05 — Moderation",
    title: "Every report is reviewed by a human within 24 hours.",
    body: "Use the flag icon on any listing, message, or profile to report something that doesn't feel right. Our moderation team reviews every report. Content that violates our policies is removed. Accounts engaged in fraud, harassment, or misrepresentation are suspended. Repeat violations result in permanent removal.",
    details: [
      "24-hour human review of all reports",
      "Immediate suspension for high-severity cases",
      "Permanent removal for repeat violations",
      "Reporter confidentiality protected",
    ],
  },
  {
    icon: UserCheck,
    eyebrow: "06 — Accountability",
    title: "Professionals are held to ongoing standards — not just at signup.",
    body: "Verification is not a one-time event. Goldsainte continuously monitors account behavior, booking completion rates, traveler reviews, and response patterns. Professionals who fall below our standards receive warnings, remediation requirements, or removal. Our tiered badge system reflects current standing, not just initial approval.",
    details: [
      "Ongoing booking completion monitoring",
      "Traveler review score tracking",
      "Response time and quality standards",
      "Tier badge reflects current standing",
    ],
  },
];

const EMERGENCY_LINKS = [
  {
    icon: Phone,
    label: "Emergency during a trip",
    desc: "Use the in-app emergency contact feature or call local emergency services first.",
    contact: "emergency contacts feature",
    to: "/emergency-contacts",
  },
  {
    icon: AlertTriangle,
    label: "Urgent safety concern",
    desc: "Email our safety team directly — monitored around the clock.",
    contact: "support@goldsainte.com",
    href: "mailto:support@goldsainte.com",
  },
  {
    icon: FileText,
    label: "Dispute or billing issue",
    desc: "File a claim from your booking page, or contact support.",
    contact: "support@goldsainte.com",
    href: "mailto:support@goldsainte.com",
  },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function PillarCard({ pillar, index }: { pillar: (typeof PILLARS)[number]; index: number }) {
  const Icon = pillar.icon;
  return (
    <section
      id={`pillar-${index + 1}`}
      className="grid md:grid-cols-12 gap-8 md:gap-14 py-16 md:py-20 border-t border-[#E5DFC6]"
    >
      {/* Left: number + icon */}
      <div className="md:col-span-4 flex md:flex-col items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-[#0c4d47]/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#0c4d47]" />
        </div>
        <p className="text-[12px] uppercase tracking-[0.28em] text-[#C7A962] mt-0 md:mt-2">
          {pillar.eyebrow}
        </p>
      </div>

      {/* Right: content */}
      <div className="md:col-span-8">
        <h2 className="font-secondary text-2xl md:text-3xl leading-[1.25] text-[#0a2225] mb-5">
          {pillar.title}
        </h2>
        <p className="text-base text-[#0a2225]/75 leading-relaxed mb-8">{pillar.body}</p>

        {/* Detail pills */}
        <ul className="grid sm:grid-cols-2 gap-3">
          {pillar.details.map((d) => (
            <li
              key={d}
              className="flex items-start gap-2.5 text-sm text-[#0a2225]/70 leading-snug"
            >
              <ShieldCheck className="h-4 w-4 text-[#0c4d47] flex-shrink-0 mt-0.5" />
              {d}
            </li>
          ))}
        </ul>

        {pillar.cta && (
          <Link
            to={pillar.cta.to}
            className="inline-flex items-center gap-1.5 mt-8 text-[12.5px] uppercase tracking-[0.22em] text-[#0c4d47] hover:underline underline-offset-4"
          >
            {pillar.cta.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function TrustSafety() {
  return (
    <>
      <Helmet>
        <title>Trust &amp; Safety · Goldsainte</title>
        <meta
          name="description"
          content="How Goldsainte protects travelers and travel professionals — verification, secure direct payments, dispute resolution, and real-time moderation."
        />
      </Helmet>

      <div className="bg-[#FDF9F0] text-[#0a2225]">

        {/* ── HERO ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-16 md:pb-20">
          <p className="text-[12px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
            Safety &amp; Trust
          </p>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] max-w-3xl mb-6">
            Travel with confidence. We built the protection in.
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 leading-relaxed max-w-2xl mb-10">
            Goldsainte is built on verified professionals, secure direct payments,
            documented communication, and a moderation team that actually responds.
            Here is exactly how every layer works.
          </p>

          {/* Six-pillar stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { stat: "ID verified", label: "Every travel agent" },
              { stat: "Stripe", label: "Every payment, secured" },
              { stat: "24 hrs", label: "Report review SLA" },
              { stat: "7 days", label: "Dispute resolution" },
              { stat: "PCI L1", label: "Payment security" },
              { stat: "On-platform", label: "All communication" },
            ].map((s) => (
              <div
                key={s.stat}
                className="border border-[#E5DFC6] rounded-sm bg-white/60 px-4 py-4"
              >
                <p className="font-secondary text-xl md:text-2xl text-[#0c4d47]">
                  {s.stat}
                </p>
                <p className="text-[12.5px] uppercase tracking-[0.18em] text-[#0a2225]/50 mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PILLARS ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {PILLARS.map((pillar, i) => (
            <PillarCard key={pillar.eyebrow} pillar={pillar} index={i} />
          ))}
        </div>

        {/* ── WHAT WE WILL NEVER DO ── */}
        <section className="border-t border-[#E5DFC6] bg-white/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <p className="text-[12px] uppercase tracking-[0.28em] text-[#C7A962] mb-4">
              Our commitments
            </p>
            <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-10 max-w-xl">
              What Goldsainte will never do.
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Ask you to pay outside the platform",
                "Request your full card number by message or email",
                "Share your personal information without consent",
                "Pressure you to book before reviewing a proposal",
                "Ignore a report or close it without review",
                "Let unvetted sellers take your payment",
                "Allow unverified professionals to accept bookings",
                "Penalize you for filing a legitimate dispute",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 border border-[#E5DFC6] rounded-sm px-5 py-4 bg-[#FDF9F0]"
                >
                  <span className="text-[#C7A962] font-secondary text-xl leading-none mt-0.5">
                    ×
                  </span>
                  <p className="text-sm text-[#0a2225]/80 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EMERGENCY / CONTACT ── */}
        <section className="border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <p className="text-[12px] uppercase tracking-[0.28em] text-[#C7A962] mb-4">
              Need help now?
            </p>
            <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-10">
              We are always reachable.
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              {EMERGENCY_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="border border-[#E5DFC6] rounded-sm bg-white/60 p-6 space-y-3"
                  >
                    <div className="w-9 h-9 rounded-sm bg-[#0c4d47]/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[#0c4d47]" />
                    </div>
                    <p className="text-[12px] uppercase tracking-[0.22em] text-[#0a2225]/50">
                      {item.label}
                    </p>
                    <p className="text-sm text-[#0a2225]/70 leading-relaxed">{item.desc}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-[12.5px] uppercase tracking-[0.2em] text-[#0c4d47] hover:underline underline-offset-4"
                      >
                        {item.contact}
                      </a>
                    ) : (
                      <Link
                        to={item.to!}
                        className="text-[12.5px] uppercase tracking-[0.2em] text-[#0c4d47] hover:underline underline-offset-4"
                      >
                        {item.contact}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final CTA strip */}
            <div className="rounded-sm bg-[#0c4d47] px-6 py-8 md:px-10 md:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h3 className="font-secondary text-xl md:text-2xl text-white mb-2">
                  Questions about your booking or account?
                </h3>
                <p className="text-sm text-white/70">
                  Our support team responds within one business day.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <a
                  href="mailto:support@goldsainte.com"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#0c4d47] text-[12.5px] uppercase tracking-[0.2em] font-medium hover:bg-[#FDF9F0] transition"
                >
                  Contact support
                </a>
                <Link
                  to="/community-guidelines"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/30 text-white text-[12.5px] uppercase tracking-[0.2em] hover:border-white transition"
                >
                  Community guidelines
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
          <p className="text-xs text-[#0a2225]/35">Last updated: May 2026.</p>
        </div>
      </div>
    </>
  );
}
