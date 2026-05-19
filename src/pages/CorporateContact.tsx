import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Users,
  Briefcase,
  MessageSquare,
  Info,
  TrendingUp,
  ShieldCheck,
  Mail,
  Copy,
  Check,
  ArrowUpRight,
  Clock,
  ChevronDown,
} from "lucide-react";

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const CONTACTS = [
  {
    icon: Users,
    eyebrow: "01",
    title: "Customer Support",
    desc: "Help with bookings, payments, account issues, and trip management.",
    email: "support@goldsainte.com",
    response: "1 business day",
    handles: [
      "Booking inquiries and modifications",
      "Payment and refund questions",
      "Account management and verification",
      "Technical support and platform issues",
    ],
  },
  {
    icon: Briefcase,
    eyebrow: "02",
    title: "Travel Agent Support",
    desc: "Dedicated support for travel agents and their partnerships on Goldsainte.",
    email: "agent@goldsainte.com",
    response: "12 hours",
    handles: [
      "Agent application and onboarding",
      "Commission and payout questions",
      "Platform tools and features",
      "Partnership and co-curated opportunities",
    ],
  },
  {
    icon: MessageSquare,
    eyebrow: "03",
    title: "Creator Support",
    desc: "Support for content creators building their travel brand on Goldsainte.",
    email: "creator@goldsainte.com",
    response: "1 business day",
    handles: [
      "Creator application and onboarding",
      "Monetization and earnings questions",
      "Content and portfolio tools",
      "Collaboration opportunities",
    ],
  },
  {
    icon: ShieldCheck,
    eyebrow: "04",
    title: "Trust & Safety",
    desc: "Report safety concerns, fraud, harassment, or policy violations.",
    email: "safety@goldsainte.com",
    response: "24 hours",
    handles: [
      "Reporting fraud or scam attempts",
      "Harassment and conduct violations",
      "Off-platform payment requests",
      "Urgent safety concerns during a trip",
    ],
  },
  {
    icon: Info,
    eyebrow: "05",
    title: "Press & Media",
    desc: "Journalists, broadcasters, and editorial partners — our newsroom team.",
    email: "press@goldsainte.com",
    response: "1 business day",
    handles: [
      "Interview and commentary requests",
      "Media kit and brand assets",
      "Founder speaking opportunities",
      "Corporate and product information",
    ],
  },
  {
    icon: TrendingUp,
    eyebrow: "06",
    title: "Investor Relations",
    desc: "For investors, financial analysts, and shareholder inquiries.",
    email: "investors@goldsainte.com",
    response: "2–3 business days",
    handles: [
      "Investment and funding inquiries",
      "Corporate governance questions",
      "Financial information requests",
      "Shareholder communications",
    ],
  },
];

const QUICK_LINKS = [
  { label: "Help Center", to: "/help", desc: "Browse FAQs and guides" },
  { label: "Community Guidelines", to: "/community-guidelines", desc: "Platform standards" },
  { label: "Trust & Safety", to: "/trust-safety", desc: "How we protect you" },
  { label: "Newsroom", to: "/newsroom", desc: "Press releases and news" },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function ContactCard({ contact }: { contact: (typeof CONTACTS)[number] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = contact.icon;

  function copyEmail() {
    navigator.clipboard.writeText(contact.email).then(() => {
      setCopied(true);
      toast.success("Email address copied");
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div className="border border-[#E5DFC6] rounded-sm bg-white/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-5 px-6 py-6 text-left group"
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-[#0c4d47]/10 flex items-center justify-center mt-0.5">
          <Icon className="h-4 w-4 text-[#0c4d47]" />
        </div>

        {/* Labels */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#C7A962] mb-1">
            {contact.eyebrow}
          </p>
          <p className="font-secondary text-lg md:text-xl text-[#0a2225] group-hover:text-[#0c4d47] transition leading-tight">
            {contact.title}
          </p>
          <p className="text-sm text-[#0a2225]/55 mt-1 leading-snug">{contact.desc}</p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`flex-shrink-0 h-4 w-4 text-[#0a2225]/30 mt-2 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-8 border-t border-[#E5DFC6] pt-6 space-y-6">
          {/* Email + response time */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/40 mb-2">
                Email
              </p>
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-[#0c4d47] underline underline-offset-4 hover:text-[#0a2225] transition"
              >
                {contact.email}
              </a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/40 mb-2">
                Response time
              </p>
              <div className="flex items-center gap-1.5 text-sm text-[#0a2225]/70">
                <Clock className="h-3.5 w-3.5 text-[#C7A962]" />
                Within {contact.response}
              </div>
            </div>
          </div>

          {/* Handles */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/40 mb-3">
              We can help with
            </p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {contact.handles.map((h) => (
                <li
                  key={h}
                  className="flex items-start gap-2 text-sm text-[#0a2225]/70 leading-snug"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0c4d47] flex-shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c4d47] text-white text-[11px] uppercase tracking-[0.2em] hover:bg-[#0a3d39] transition"
            >
              <Mail className="h-3.5 w-3.5" />
              Send email
            </a>
            <button
              onClick={copyEmail}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E5DFC6] text-[#0a2225] text-[11px] uppercase tracking-[0.2em] hover:border-[#0c4d47] hover:text-[#0c4d47] transition"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy address"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function CorporateContact() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered =
    searchQuery.trim() === ""
      ? CONTACTS
      : CONTACTS.filter(
          (c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.handles.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
        );

  return (
    <>
      <div className="bg-[#FDF9F0] text-[#0a2225]">

        {/* ── HERO ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-14 md:pb-20">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
            Contact
          </p>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] max-w-3xl mb-6">
            Get in touch with the right team.
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 leading-relaxed max-w-xl mb-10">
            Six dedicated departments — each with a direct email and a committed response
            time. Choose the team that matches your inquiry for the fastest reply.
          </p>

          {/* Business hours notice */}
          <div className="flex items-start gap-3 border border-[#E5DFC6] rounded-sm bg-white/60 px-5 py-4 max-w-lg">
            <Clock className="h-4 w-4 text-[#C7A962] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#0a2225]/70 leading-relaxed">
              Support teams operate Monday–Friday, 9:00 AM – 6:00 PM EST. For urgent
              matters outside business hours, mark your subject line <strong>Urgent</strong>.
            </p>
          </div>
        </section>

        {/* ── SEARCH + CONTACTS ── */}
        <section className="border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-18">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-6">
              Departments
            </p>

            {/* Search */}
            <div className="relative max-w-md mb-8">
              <input
                type="text"
                placeholder="Search departments…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-sm border border-[#E5DFC6] bg-white text-sm text-[#0a2225] placeholder:text-[#0a2225]/35 focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/25 focus:border-[#0c4d47] transition"
              />
            </div>

            {/* Contact cards */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#0a2225]/50 italic">
                  No departments match "{searchQuery}".
                </p>
              ) : (
                filtered.map((contact) => (
                  <ContactCard key={contact.email} contact={contact} />
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── QUICK LINKS ── */}
        <section className="border-t border-[#E5DFC6] bg-white/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-18">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-4">
              Helpful resources
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group block border border-[#E5DFC6] rounded-sm px-5 py-5 hover:border-[#0c4d47] transition"
                >
                  <p className="font-secondary text-base text-[#0a2225] group-hover:text-[#0c4d47] transition mb-1">
                    {link.label}
                  </p>
                  <p className="text-xs text-[#0a2225]/50 mb-3">{link.desc}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#0c4d47]">
                    Visit <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── DARK CTA ── */}
        <section className="border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="rounded-sm bg-[#0c4d47] px-6 py-8 md:px-10 md:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h3 className="font-secondary text-xl md:text-2xl text-white mb-2">
                  Need an instant answer?
                </h3>
                <p className="text-sm text-white/70">
                  The Help Center has FAQs, guides, and an AI assistant ready now.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to="/help"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0c4d47] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#FDF9F0] transition"
                >
                  Visit Help Center
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
