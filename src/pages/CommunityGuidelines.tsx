import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Star,
  CreditCard,
  MessageSquare,
  ImageOff,
  UserX,
  AlertTriangle,
  ArrowUpRight,
  Flag,
  Scale,
} from "lucide-react";

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const SECTIONS = [
  {
    icon: Star,
    eyebrow: "01 — Authenticity",
    title: "Be who you say you are.",
    intro:
      "Goldsainte is built on the value of real expertise, real experience, and real people. Misrepresentation — of identity, credentials, or experience — undermines the trust every member of this community depends on.",
    allowed: [
      "Accurate representation of your credentials, certifications, and destinations you genuinely know",
      "Sharing your honest perspective on places you have personally experienced",
      "Disclosing any commercial or affiliate relationships in content you publish",
    ],
    prohibited: [
      "Claiming certifications, accreditations, or travel industry memberships you do not hold",
      "Fabricating reviews, testimonials, or trip experience you have not personally had",
      "Creating fake accounts, impersonating other professionals, or misrepresenting your identity",
      "Using AI-generated imagery or fake testimonials without disclosure",
    ],
  },
  {
    icon: CreditCard,
    eyebrow: "02 — Payments",
    title: "All payments stay on Goldsainte. No exceptions.",
    intro:
      "Every booking made through Goldsainte is protected by our escrow payment system. Taking payments — or requesting payments — outside the platform eliminates all protections for both parties. This is one of our most enforced policies.",
    allowed: [
      "Quoting, negotiating, and invoicing through the Goldsainte booking flow",
      "Referencing payment timelines and milestones within the platform chat",
      "Asking travelers to confirm receipt of the booking confirmation",
    ],
    prohibited: [
      "Requesting or sending payment via wire transfer, Venmo, Cash App, PayPal, or any external method",
      "Sharing personal bank details, payment links, or invoices from outside systems",
      "Offering discounts to travelers who pay off-platform",
      "Splitting a booking across platform and off-platform to reduce fees",
    ],
  },
  {
    icon: MessageSquare,
    eyebrow: "03 — Communication",
    title: "Keep booking conversations on-platform.",
    intro:
      "On-platform communication gives us the record we need to protect both travelers and professionals in the event of a dispute, cancellation, or safety concern. Moving conversations off-platform — even with good intentions — removes our ability to help either party.",
    allowed: [
      "General travel questions and destination recommendations in public channels",
      "Sharing your public social media handles for discovery purposes",
      "Using Goldsainte's messaging system for all booking-related communication",
    ],
    prohibited: [
      "Sharing personal phone numbers, WhatsApp handles, or personal email addresses for booking purposes",
      "Asking travelers to continue booking discussions via external platforms",
      "Sending external links to forms, invoices, or surveys that collect booking data",
      "Using the Goldsainte platform to solicit travelers for off-platform bookings",
    ],
  },
  {
    icon: Star,
    eyebrow: "04 — Reviews & Reputation",
    title: "Honest reviews protect everyone.",
    intro:
      "The review system is the foundation of trust on Goldsainte. Every review must reflect a genuine experience. Attempting to game, manipulate, or suppress the review system is taken seriously and investigated.",
    allowed: [
      "Leaving an honest review based on your actual experience with a professional or traveler",
      "Responding professionally to reviews you have received",
      "Flagging reviews you believe are fraudulent or in violation of these guidelines",
    ],
    prohibited: [
      "Offering incentives — discounts, upgrades, refunds — in exchange for positive reviews",
      "Requesting that travelers remove or alter a negative review",
      "Coordinating with associates to post fake positive reviews on your own profile",
      "Retaliating against a traveler with a negative review for filing a legitimate complaint",
    ],
  },
  {
    icon: ImageOff,
    eyebrow: "05 — Content Standards",
    title: "Accurate. Honest. Yours.",
    intro:
      "Every listing, portfolio image, itinerary, and piece of content published on Goldsainte must represent the actual experience being offered. Misleading imagery or descriptions damage traveler trust and the reputation of the entire professional community.",
    allowed: [
      "Original photography and video you personally captured",
      "Licensed stock imagery clearly identified as representational",
      "AI-assisted writing clearly disclosed as such",
      "Destination descriptions that reflect current, accurate conditions",
    ],
    prohibited: [
      "Using others' photography without license or attribution",
      "Uploading imagery that materially misrepresents the accommodations, destinations, or experiences offered",
      "Publishing fabricated itineraries or routes as actual offerings",
      "Keyword stuffing, spam listings, or duplicate content across multiple profiles",
    ],
  },
  {
    icon: UserX,
    eyebrow: "06 — Respect & Conduct",
    title: "Every person on this platform deserves respect.",
    intro:
      "Goldsainte serves travelers and professionals across more than 50 countries. Harassment, discrimination, and abusive behavior have no place here — regardless of who initiates it or where it occurs.",
    allowed: [
      "Raising concerns about a booking or service professionally and constructively",
      "Declining a booking request for legitimate business reasons",
      "Setting clear service scope, communication expectations, and professional boundaries",
    ],
    prohibited: [
      "Harassment, threatening language, or intimidation directed at any platform member",
      "Discrimination based on race, nationality, gender, religion, disability, or sexual orientation",
      "Sharing another user's private information without their explicit consent",
      "Retaliatory behavior following a dispute, review, or report",
    ],
  },
  {
    icon: Scale,
    eyebrow: "07 — Compliance",
    title: "Follow the law — everywhere your trips go.",
    intro:
      "Travel professionals operating on Goldsainte are responsible for compliance with applicable laws in their jurisdiction and in every destination they serve. Goldsainte does not provide legal advice, but we do require that professionals operate lawfully.",
    allowed: [
      "Operating under a valid travel agent license or equivalent in your jurisdiction",
      "Disclosing applicable taxes and fees within your proposals",
      "Complying with destination-specific entry requirements and travel advisories",
    ],
    prohibited: [
      "Operating as a travel agent without required licensing in jurisdictions that mandate it",
      "Facilitating travel to destinations under active government travel bans without required authorization",
      "Misrepresenting tax obligations or fee structures to travelers",
      "Any activity that constitutes fraud, money laundering, or violation of international sanctions",
    ],
  },
];

const ENFORCEMENT_TIERS = [
  {
    level: "Warning",
    color: "#C7A962",
    desc: "Issued for first-time minor violations. A formal record is created. No immediate access restriction.",
  },
  {
    level: "Restriction",
    color: "#ba7517",
    desc: "Applied for repeated minor violations or a first serious violation. Specific capabilities (publishing, messaging, booking) may be temporarily suspended.",
  },
  {
    level: "Suspension",
    color: "#993c1d",
    desc: "Full account suspension pending investigation. Applied immediately for fraud, harassment, off-platform payment solicitation, or other high-severity violations.",
  },
  {
    level: "Permanent removal",
    color: "#a32d2d",
    desc: "Permanent ban from Goldsainte for confirmed repeat violations, fraud, identity misrepresentation, or conduct that endangered a traveler.",
  },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function GuidelineSection({
  section,
}: {
  section: (typeof SECTIONS)[number];
}) {
  const Icon = section.icon;
  return (
    <section className="py-14 md:py-18 border-t border-[#E5DFC6]">
      <div className="grid md:grid-cols-12 gap-8 md:gap-14">
        {/* Left label */}
        <div className="md:col-span-4 flex md:flex-col items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-[#0c4d47]/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-[#0c4d47]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mt-0 md:mt-2">
            {section.eyebrow}
          </p>
        </div>

        {/* Right content */}
        <div className="md:col-span-8">
          <h2 className="font-secondary text-2xl md:text-3xl leading-[1.25] text-[#0a2225] mb-4">
            {section.title}
          </h2>
          <p className="text-base text-[#0a2225]/70 leading-relaxed mb-8">
            {section.intro}
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Allowed */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#0c4d47] mb-3 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Allowed
              </p>
              <ul className="space-y-2.5">
                {section.allowed.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-[#0a2225]/70 leading-snug"
                  >
                    <span className="text-[#0c4d47] mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Prohibited */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#993c1d] mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Prohibited
              </p>
              <ul className="space-y-2.5">
                {section.prohibited.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-[#0a2225]/70 leading-snug"
                  >
                    <span className="text-[#993c1d] mt-0.5 flex-shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CommunityGuidelines() {
  return (
    <>
      <Helmet>
        <title>Community Guidelines · Goldsainte</title>
        <meta
          name="description"
          content="The standards every traveler, travel agent, creator, and brand partner agrees to when joining Goldsainte."
        />
      </Helmet>

      <div className="bg-[#FDF9F0] text-[#0a2225]">

        {/* ── HERO ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-14 md:pb-20">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
            Community Guidelines
          </p>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] max-w-3xl mb-6">
            The standards that make this community worth being part of.
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 leading-relaxed max-w-2xl mb-8">
            These guidelines apply to every traveler, travel agent, creator, and brand
            partner on Goldsainte — from your first listing to your thousandth booking.
            They exist to protect the quality and integrity of every experience on the
            platform.
          </p>
          <p className="text-sm text-[#0a2225]/50">
            By joining Goldsainte, you agree to these guidelines as part of our{" "}
            <Link
              to="/terms"
              className="text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225]"
            >
              Terms of Service
            </Link>
            . Violations may result in warnings, suspension, or permanent removal.
          </p>
        </section>

        {/* ── QUICK SUMMARY STRIP ── */}
        <div className="border-y border-[#E5DFC6] bg-white/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#0a2225]/40 mb-4">
              The short version
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "Be who you say you are",
                "Keep all payments on-platform",
                "Keep booking conversations on-platform",
                "Represent your services honestly",
                "Treat every person with respect",
                "Follow the law in every destination",
                "Leave honest reviews",
                "Report what doesn't look right",
              ].map((rule) => (
                <div
                  key={rule}
                  className="flex items-start gap-2 text-sm text-[#0a2225]/75 leading-snug"
                >
                  <ShieldCheck className="h-4 w-4 text-[#0c4d47] flex-shrink-0 mt-0.5" />
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── GUIDELINE SECTIONS ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {SECTIONS.map((section) => (
            <GuidelineSection key={section.eyebrow} section={section} />
          ))}
        </div>

        {/* ── ENFORCEMENT ── */}
        <section className="border-t border-[#E5DFC6] bg-white/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-4">
              Enforcement
            </p>
            <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-4 max-w-xl">
              What happens when guidelines are violated.
            </h2>
            <p className="text-base text-[#0a2225]/65 leading-relaxed max-w-2xl mb-10">
              Our moderation team reviews every report within 24 hours. Enforcement is
              tiered based on severity, history, and the type of violation.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {ENFORCEMENT_TIERS.map((tier) => (
                <div
                  key={tier.level}
                  className="border border-[#E5DFC6] rounded-sm bg-[#FDF9F0] p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: tier.color }}
                    />
                    <p
                      className="text-[11px] uppercase tracking-[0.2em] font-medium"
                      style={{ color: tier.color }}
                    >
                      {tier.level}
                    </p>
                  </div>
                  <p className="text-sm text-[#0a2225]/70 leading-relaxed">{tier.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#0a2225]/40 mt-6">
              Goldsainte reserves the right to accelerate enforcement — including immediate
              permanent removal — for violations that create safety risks or material harm
              to travelers or other platform members.
            </p>
          </div>
        </section>

        {/* ── APPEALS ── */}
        <section className="border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="grid md:grid-cols-12 gap-10">
              <div className="md:col-span-7 space-y-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962]">
                  Appeals &amp; reporting
                </p>
                <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225]">
                  Disagree with an enforcement decision? Appeal it.
                </h2>
                <p className="text-base text-[#0a2225]/70 leading-relaxed">
                  If you believe an enforcement action was applied in error, you may
                  submit an appeal within 30 days of notification. Appeals are reviewed
                  by a member of our senior moderation team who was not involved in the
                  original decision.
                </p>
                <p className="text-base text-[#0a2225]/70 leading-relaxed">
                  To report a violation, use the flag icon on any listing, profile, or
                  message — or contact us directly. All reports are confidential.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="mailto:support@goldsainte.com"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0c4d47] text-white text-[11px] uppercase tracking-[0.2em] hover:bg-[#0a3d39] transition"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Submit an appeal
                  </a>
                  <Link
                    to="/trust-safety"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#E5DFC6] text-[#0a2225] text-[11px] uppercase tracking-[0.2em] hover:border-[#0c4d47] hover:text-[#0c4d47] transition"
                  >
                    Trust &amp; Safety
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 md:pl-10 md:border-l border-[#E5DFC6] space-y-6 text-sm text-[#0a2225]/65 leading-relaxed">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C7A962] mb-2">
                    Appeals
                  </p>
                  <a
                    href="mailto:support@goldsainte.com"
                    className="text-[#0c4d47] underline underline-offset-2 hover:text-[#0a2225]"
                  >
                    support@goldsainte.com
                  </a>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C7A962] mb-2">
                    Urgent safety reports
                  </p>
                  <a
                    href="mailto:support@goldsainte.com"
                    className="text-[#0c4d47] underline underline-offset-2 hover:text-[#0a2225]"
                  >
                    support@goldsainte.com
                  </a>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C7A962] mb-2">
                    General support
                  </p>
                  <a
                    href="mailto:support@goldsainte.com"
                    className="text-[#0c4d47] underline underline-offset-2 hover:text-[#0a2225]"
                  >
                    support@goldsainte.com
                  </a>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C7A962] mb-2">
                    Last updated
                  </p>
                  <p>May 2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
