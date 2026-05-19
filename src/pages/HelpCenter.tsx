import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  BookOpen,
  CreditCard,
  XCircle,
  UserCircle,
  Sparkles,
  Users,
  Briefcase,
  MapPin,
  ArrowUpRight,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { HelpCenterChat } from "@/components/HelpCenterChat";
import { helpCenterFAQs, searchFAQs, getFAQsByCategory } from "@/data/helpCenterFAQs";
import { siteRoutes, searchRoutes } from "@/data/siteRoutes";

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const CATEGORIES = [
  { id: "bookings", label: "Bookings", icon: BookOpen },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "cancellations", label: "Cancellations", icon: XCircle },
  { id: "account", label: "Account", icon: UserCircle },
  { id: "ai-features", label: "AI Features", icon: Sparkles },
  { id: "creator", label: "Creator Program", icon: Users },
  { id: "agent", label: "Agent Marketplace", icon: Briefcase },
  { id: "navigation", label: "Navigation", icon: MapPin },
];

const GUIDED_TOURS = [
  { to: "/how-it-works/traveler", label: "For Travelers", desc: "Plan and book trips with verified specialists across 50+ countries." },
  { to: "/how-it-works/creator", label: "For Creators", desc: "Monetise your audience with trips, guides, and curated experiences." },
  { to: "/how-it-works/agent", label: "For Agents", desc: "Win clients, manage trips, and grow your practice end-to-end." },
];

const POPULAR_LINKS = [
  { path: "/my-trips", label: "My Trips", icon: BookOpen },
  { path: "/marketplace", label: "Marketplace", icon: Sparkles },
  { path: "/apply/agent", label: "Become an Agent", icon: Users },
  { path: "/creator-dashboard", label: "Creator Dashboard", icon: Users },
  { path: "/corporate-contact", label: "Contact Us", icon: MessageSquare },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function FAQItem({ faq }: { faq: { id: string; question: string; answer: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E5DFC6]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className="font-secondary text-base md:text-lg text-[#0a2225] leading-snug group-hover:text-[#0c4d47] transition">
          {faq.question}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#0a2225]/40 flex-shrink-0 mt-1 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-6 text-sm md:text-base text-[#0a2225]/70 leading-relaxed pr-8">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFAQs = searchQuery
    ? searchFAQs(searchQuery)
    : selectedCategory
    ? getFAQsByCategory(selectedCategory)
    : helpCenterFAQs;

  const filteredRoutes = searchQuery ? searchRoutes(searchQuery) : [];

  const activeCategoryLabel = CATEGORIES.find((c) => c.id === selectedCategory)?.label;

  return (
    <>
      <div className="bg-[#FDF9F0] text-[#0a2225]">

        {/* ── HERO ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-12 md:pb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#0c4d47] mb-5">
            Help Center
          </p>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] max-w-3xl mb-6">
            How can we help?
          </h1>
          <p className="text-base md:text-lg text-[#0a2225]/70 leading-relaxed max-w-xl mb-10">
            Browse frequently asked questions, explore our guides, or ask the AI assistant
            for an instant answer.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0a2225]/35 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for help articles, pages, or a question…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory(null);
              }}
              className="w-full pl-11 pr-4 py-3.5 rounded-sm border border-[#E5DFC6] bg-white text-sm text-[#0a2225] placeholder:text-[#0a2225]/35 focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/25 focus:border-[#0c4d47] transition"
            />
          </div>
        </section>

        {/* ── SEARCH RESULTS: ROUTES ── */}
        {searchQuery && filteredRoutes.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
            <div className="border border-[#E5DFC6] rounded-sm bg-white/60 px-6 py-6">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-4">
                Pages matching "{searchQuery}"
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredRoutes.slice(0, 6).map((route) => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className="flex items-start gap-3 p-4 rounded-sm border border-[#E5DFC6] hover:border-[#0c4d47] bg-[#FDF9F0] group transition"
                  >
                    <ArrowUpRight className="h-4 w-4 text-[#0c4d47] flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <div>
                      <p className="text-sm font-medium text-[#0a2225] group-hover:text-[#0c4d47] transition">
                        {route.label}
                      </p>
                      <p className="text-xs text-[#0a2225]/50 mt-0.5">{route.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── GUIDED TOURS (no search) ── */}
        {!searchQuery && (
          <section className="border-t border-[#E5DFC6]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-18">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-4">
                Guided tours
              </p>
              <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-8">
                Where do you want to start?
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {GUIDED_TOURS.map((tour) => (
                  <Link
                    key={tour.to}
                    to={tour.to}
                    className="group block border border-[#E5DFC6] rounded-sm bg-white/60 px-6 py-6 hover:border-[#0c4d47] transition"
                  >
                    <p className="font-secondary text-xl text-[#0a2225] group-hover:text-[#0c4d47] transition mb-2">
                      {tour.label}
                    </p>
                    <p className="text-sm text-[#0a2225]/60 leading-relaxed mb-4">{tour.desc}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-[#0c4d47]">
                      View guide <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── POPULAR PAGES (no search) ── */}
        {!searchQuery && (
          <section className="border-t border-[#E5DFC6] bg-white/60">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-18">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-4">
                Popular pages
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {POPULAR_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="flex items-center gap-3 border border-[#E5DFC6] rounded-sm px-5 py-4 hover:border-[#0c4d47] hover:text-[#0c4d47] group transition"
                    >
                      <Icon className="h-4 w-4 text-[#0c4d47] flex-shrink-0" />
                      <span className="text-sm text-[#0a2225] group-hover:text-[#0c4d47] transition">
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── CATEGORY FILTERS ── */}
        <section className="border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-18">
            {!searchQuery && (
              <>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-4">
                  Browse by category
                </p>
                {/* Scroll on mobile */}
                <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-10">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                        selectedCategory === null
                          ? "bg-[#0c4d47] text-white"
                          : "border border-[#E5DFC6] text-[#0a2225]/70 hover:border-[#0c4d47] hover:text-[#0c4d47]"
                      }`}
                    >
                      All
                    </button>
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                            selectedCategory === cat.id
                              ? "bg-[#0c4d47] text-white"
                              : "border border-[#E5DFC6] text-[#0a2225]/70 hover:border-[#0c4d47] hover:text-[#0c4d47]"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* FAQ heading */}
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-3">
              {searchQuery
                ? `${filteredFAQs.length} result${filteredFAQs.length !== 1 ? "s" : ""} for "${searchQuery}"`
                : selectedCategory
                ? `${activeCategoryLabel}`
                : "Frequently asked questions"}
            </p>
            <h2 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-8">
              {searchQuery ? "Search results" : selectedCategory ? activeCategoryLabel : "Common questions"}
            </h2>

            {filteredFAQs.length === 0 ? (
              <div className="py-16 text-center border border-[#E5DFC6] rounded-sm bg-white/60">
                <p className="text-sm text-[#0a2225]/50 mb-2">No results found.</p>
                <p className="text-sm text-[#0a2225]/40">Try the AI assistant below for an instant answer.</p>
              </div>
            ) : (
              <div className="border-t border-[#E5DFC6]">
                {filteredFAQs.map((faq) => (
                  <FAQItem key={faq.id} faq={faq} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── STILL NEED HELP ── */}
        <section className="border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="rounded-sm bg-[#0c4d47] px-6 py-8 md:px-10 md:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h3 className="font-secondary text-xl md:text-2xl text-white mb-2">
                  Still need help?
                </h3>
                <p className="text-sm text-white/70">
                  Our support team responds within one business day.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link
                  to="/corporate-contact"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#0c4d47] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#FDF9F0] transition"
                >
                  Contact support
                </Link>
                <Link
                  to="/messages"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/30 text-white text-[11px] uppercase tracking-[0.2em] hover:border-white transition"
                >
                  Message us
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* AI Chat Widget — unchanged */}
      <HelpCenterChat />
    </>
  );
}
