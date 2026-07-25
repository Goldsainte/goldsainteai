import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, ChevronDown } from "lucide-react";
import { helpCenterFAQs, type FAQ } from "@/data/helpCenterFAQs";

// ============================================================================
// HelpCenter — the /help page (rebuilt Jul 25). The previous file at this path
// was FAQ DATA with no default export — the lazy route resolved `undefined`
// and every visit crashed with React #306 ("Something went wrong"). The data
// itself lives (and stays) in src/data/helpCenterFAQs.ts; this file is the
// page component the route expects.
// ============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  navigation: "Getting around",
  bookings: "Bookings",
  payments: "Payments & fees",
  cancellations: "Cancellations & refunds",
  account: "Your account",
  "ai-features": "AI features",
  creator: "For creators",
  agent: "For specialists",
};

export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(helpCenterFAQs.map((f) => f.category))],
    []
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return helpCenterFAQs.filter((f: FAQ) => {
      const matchesQuery =
        !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || f.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      <Helmet>
        <title>Help Center · Goldsainte</title>
        <meta name="description" content="Answers about bookings, payments, cancellations, and how Goldsainte works for travelers, creators, and specialists." />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 pt-12 md:pt-16">
        <h1 className="font-secondary text-3xl text-[#0a2225] md:text-5xl">How can we help?</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#0a2225]/70 md:text-[17px]">
          Answers about bookings, payments, cancellations, and how Goldsainte works — for travelers, creators, and specialists.
        </p>

        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-full border border-[#E5DFC6] bg-white py-3.5 pl-11 pr-4 text-[15px] text-[#0a2225] outline-none placeholder:text-[#9CA3AF] focus:border-[#C7A962]"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition-colors ${
              activeCategory === null
                ? "border-[#0c4d47] bg-[#0c4d47] text-[#E5DFC6]"
                : "border-[#E5DFC6] bg-white text-[#0a2225]/70 hover:text-[#0a2225]"
            }`}
          >
            All topics
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition-colors ${
                activeCategory === c
                  ? "border-[#0c4d47] bg-[#0c4d47] text-[#E5DFC6]"
                  : "border-[#E5DFC6] bg-white text-[#0a2225]/70 hover:text-[#0a2225]"
              }`}
            >
              {CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E5DFC6] bg-white/60 p-10 text-center">
              <p className="font-secondary text-lg text-[#0a2225]">No answers match that search</p>
              <p className="mt-1 text-sm text-[#6B7280]">
                Try different words, or reach us through your booking's message thread.
              </p>
            </div>
          )}
          {visible.map((f) => {
            const open = openId === f.id;
            return (
              <div key={f.id} className="rounded-2xl border border-[#E5DFC6] bg-white">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : f.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-medium text-[#0a2225]">{f.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#C7A962] transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-[#5c5c52]">{f.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
