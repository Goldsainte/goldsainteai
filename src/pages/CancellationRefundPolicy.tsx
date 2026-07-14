import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Info,
  Clock,
  AlertTriangle,
  CheckCircle,
  Scale,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const SECTIONS = [
  {
    icon: Info,
    eyebrow: "01 — Our role",
    title: "Goldsainte is a marketplace, not a travel provider.",
    body: "Goldsainte connects travelers with independent travel professionals — agents and creators. We are not the airline, hotel, tour operator, or ground supplier. Your legal contract for travel services is with the travel professional and/or their suppliers, not with Goldsainte.",
    points: [
      "Goldsainte does not operate flights, hotels, tours, or transfers",
      "Goldsainte is not a party to the travel contract between you and the professional",
      "The travel professional is responsible for honoring their published cancellation and refund terms",
      "Goldsainte may assist with coordination as a neutral marketplace",
    ],
  },
  {
    icon: Scale,
    eyebrow: "02 — Three layers",
    title: "Three layers of policy apply to every booking.",
    body: "When you cancel a trip booked on Goldsainte, refund eligibility is determined by the most restrictive applicable policy across three layers. Understanding which layer governs your situation is the key to understanding your options.",
    layers: [
      {
        num: "01",
        title: "Supplier policies",
        desc: "Airlines, hotels, tour operators, and ground transport providers each have their own rules. Some fares and rates are non-refundable from the moment of booking regardless of when you cancel.",
      },
      {
        num: "02",
        title: "Travel professional's policies",
        desc: "The agent or creator you book with sets their own cancellation, deposit, and refund terms in the proposal. These are agreed to when you confirm the booking.",
      },
      {
        num: "03",
        title: "Goldsainte marketplace policies",
        desc: "Governs how disputes are reviewed, how platform fees are treated, and how escrow funds are released or returned.",
      },
    ],
  },
  {
    icon: CreditCard,
    eyebrow: "03 — Deposits & fees",
    title: "Deposits and platform fees are typically non-refundable.",
    body: "Many trips require a non-refundable deposit at the time of booking. Supplier-imposed non-refundable amounts — certain airfare classes, prepaid hotel rates, special event tickets — may not be recoverable regardless of when you cancel. Goldsainte marketplace and processing fees are non-refundable once a booking is confirmed, except where required by applicable law.",
    points: [
      "Deposit terms are stated clearly in the proposal before you confirm",
      "Prepaid supplier rates (certain airfares, hotels) may be fully non-refundable from booking",
      "Platform fees are non-refundable after booking confirmation",
      "Your booking documents are the binding record of all deposit terms",
    ],
  },
  {
    icon: Clock,
    eyebrow: "04 — Timing guide",
    title: "The closer to departure, the fewer options remain.",
    body: "Exact terms for your booking are defined in the proposal and the underlying supplier rules. The following is a simplified guide only — the binding terms are always those in your confirmed booking documents.",
    tiers: [
      {
        window: "60+ days before departure",
        label: "Far in advance",
        color: "#0c4d47",
        desc: "The most generous window. Many professionals offer their highest refund percentages here, subject to supplier rules. This is the best time to make changes.",
      },
      {
        window: "30–59 days before departure",
        label: "Approaching",
        color: "#C7A962",
        desc: "Partial refunds may still be available on some components. Non-refundable elements begin to take effect. Review your specific booking terms.",
      },
      {
        window: "14–29 days before departure",
        label: "Close in",
        color: "#ba7517",
        desc: "Refund percentages typically drop significantly. Supplier rules become more restrictive. Travel insurance becomes especially valuable here.",
      },
      {
        window: "Under 14 days before departure",
        label: "Final window",
        color: "#993c1d",
        desc: "Trips are commonly fully non-refundable this close to departure, per the professional's stated tiers and supplier rules.",
      },
      {
        window: "After departure",
        label: "In-trip or post-departure",
        color: "#7a2f18",
        desc: "Most services are fully non-refundable. No-shows are typically treated as full forfeiture per supplier rules.",
      },
    ],
  },
  {
    icon: AlertTriangle,
    eyebrow: "05 — Changes & no-shows",
    title: "Changes, no-shows, and force majeure each have their own rules.",
    body: "Not all cancellations are the same. Voluntary changes, no-shows, and events outside anyone's control are handled differently.",
    points: [
      "Voluntary date or destination changes may incur change fees and fare differences",
      "No-shows are typically fully non-refundable per supplier rules",
      "Force majeure events (weather, natural disasters, strikes) are handled per supplier policy — Goldsainte does not guarantee refunds in these situations",
      "Supplier-initiated cancellations may entitle you to a full refund or rebooking — contact your travel professional immediately",
    ],
  },
  {
    icon: Scale,
    eyebrow: "06 — Disputes",
    title: "If something goes wrong, file a claim from your booking page.",
    body: "Goldsainte is not responsible for the acts, errors, or omissions of independent travel professionals or suppliers. However, if you have a dispute, our team reviews evidence from both parties and aims to issue a binding decision within 7 business days.",
    points: [
      "File a claim directly from your booking page",
      "Our team reviews on-platform messages, documents, and payment records",
      "We aim to issue a binding decision within 7 business days",
      "Escalation path to senior review available if needed",
    ],
    cta: { label: "View full dispute process", to: "/trust-safety" },
  },
  {
    icon: CheckCircle,
    eyebrow: "07 — Your responsibilities",
    title: "Review everything before you confirm.",
    body: "The best protection is knowing what you agreed to. We strongly recommend reviewing all cancellation and deposit terms in the proposal before confirming a booking, and purchasing comprehensive travel insurance for any trip where the cost of cancellation would be significant.",
    points: [
      "Read the travel professional's cancellation and deposit terms in the proposal",
      "Review supplier fare rules and rate conditions where applicable",
      "Purchase comprehensive travel insurance appropriate for your destination and risk tolerance",
      "Keep all booking communication on-platform to preserve your dispute record",
    ],
  },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CancellationRefundPolicy() {
  return (
    <>
      <Helmet>
        <title>Cancellation &amp; Refund Policy · Goldsainte</title>
        <meta
          name="description"
          content="How cancellations, refunds, deposits, and disputes work on the Goldsainte travel marketplace."
        />
      </Helmet>

      <div className="bg-[#FDF9F0] text-[#0a2225]">

        {/* ── HERO ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-14 md:pb-20">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
            Policy
          </p>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] max-w-3xl mb-6">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 leading-relaxed max-w-2xl mb-6">
            Understanding what happens when plans change — who is responsible, what is
            refundable, and how to protect yourself before you book.
          </p>

          {/* Key notice */}
          <div className="flex items-start gap-3 border border-[#C7A962]/40 rounded-sm bg-[#C7A962]/8 px-5 py-4 max-w-2xl">
            <ShieldCheck className="h-4 w-4 text-[#C7A962] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#0a2225]/80 leading-relaxed">
              Goldsainte is a marketplace. We connect you with independent travel
              professionals but are not the travel provider. Your contract for travel
              services is with the professional and their suppliers.
            </p>
          </div>

          <p className="text-xs text-[#0a2225]/35 mt-6">
            Last updated: May 2026
          </p>
        </section>

        {/* ── SECTIONS ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            return (
              <section
                key={section.eyebrow}
                className="grid md:grid-cols-12 gap-8 md:gap-14 py-14 md:py-20 border-t border-[#E5DFC6]"
              >
                {/* Left */}
                <div className="md:col-span-4 flex md:flex-col items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-[#0c4d47]/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#0c4d47]" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mt-0 md:mt-2">
                    {section.eyebrow}
                  </p>
                </div>

                {/* Right */}
                <div className="md:col-span-8">
                  <h2 className="font-secondary text-2xl md:text-3xl leading-[1.25] text-[#0a2225] mb-5">
                    {section.title}
                  </h2>
                  <p className="text-base text-[#0a2225]/70 leading-relaxed mb-8">
                    {section.body}
                  </p>

                  {/* Bullet points */}
                  {"points" in section && section.points && (
                    <ul className="space-y-3">
                      {section.points.map((p) => (
                        <li key={p} className="flex items-start gap-3 text-sm text-[#0a2225]/70 leading-snug">
                          <ShieldCheck className="h-4 w-4 text-[#0c4d47] flex-shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Three layers */}
                  {"layers" in section && section.layers && (
                    <div className="space-y-4">
                      {section.layers.map((layer) => (
                        <div
                          key={layer.num}
                          className="flex gap-5 border border-[#E5DFC6] rounded-sm bg-white/60 px-5 py-5"
                        >
                          <span className="font-mono text-[11px] tracking-[0.22em] text-[#C7A962] flex-shrink-0 mt-0.5">
                            {layer.num}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-[#0a2225] mb-1">{layer.title}</p>
                            <p className="text-sm text-[#0a2225]/65 leading-relaxed">{layer.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timing tiers */}
                  {"tiers" in section && section.tiers && (
                    <div className="space-y-3">
                      {section.tiers.map((tier) => (
                        <div
                          key={tier.window}
                          className="border border-[#E5DFC6] rounded-sm bg-white/60 px-5 py-5"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: tier.color }}
                            />
                            <p className="text-[11px] uppercase tracking-[0.2em] font-medium" style={{ color: tier.color }}>
                              {tier.label}
                            </p>
                            <span className="text-[11px] text-[#0a2225]/40 ml-auto hidden sm:inline">
                              {tier.window}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#0a2225]/40 sm:hidden mb-2">{tier.window}</p>
                          <p className="text-sm text-[#0a2225]/70 leading-relaxed">{tier.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {"cta" in section && section.cta && (
                    <Link
                      to={section.cta.to}
                      className="inline-flex items-center gap-1.5 mt-8 text-[11px] uppercase tracking-[0.22em] text-[#0c4d47] hover:underline underline-offset-4"
                    >
                      {section.cta.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── CTA FOOTER ── */}
        <section className="border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="rounded-sm bg-[#0c4d47] px-6 py-8 md:px-10 md:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h3 className="font-secondary text-xl md:text-2xl text-white mb-2">
                  Questions about a specific booking?
                </h3>
                <p className="text-sm text-white/70">
                  Contact your travel professional via the messaging tools in your account,
                  or reach our support team directly.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <a
                  href="mailto:support@goldsainte.com"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#0c4d47] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#FDF9F0] transition"
                >
                  Contact support
                </a>
                <Link
                  to="/help"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/30 text-white text-[11px] uppercase tracking-[0.2em] hover:border-white transition"
                >
                  Help center
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
