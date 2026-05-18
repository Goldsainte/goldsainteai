import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { articlePath, fetchPublishedArticles, formatDate, BASE_URL } from "./lib";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "press_release", label: "Press Releases" },
  { key: "news", label: "News" },
  { key: "announcement", label: "Announcements" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const TYPE_LABELS: Record<string, string> = {
  press_release: "Press Release",
  news: "News",
  announcement: "Announcement",
};

export default function Archive() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["newsroom", "archive"],
    queryFn: () => fetchPublishedArticles({ limit: 500 }),
    staleTime: 1000 * 60 * 5,
  });

  const [filter, setFilter] = useState<FilterKey>("all");
  const [visibleCount, setVisibleCount] = useState(20);

  const filtered =
    filter === "all" ? articles : articles.filter((a) => a.type === filter);
  const visible = filtered.slice(0, visibleCount);

  const grouped = visible.reduce<Record<string, typeof visible>>((acc, a) => {
    const year = a.published_at
      ? new Date(a.published_at).getFullYear().toString()
      : "Undated";
    if (!acc[year]) acc[year] = [];
    acc[year].push(a);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <>
      <Helmet>
        <title>Archive | Goldsainte Newsroom</title>
        <meta
          name="description"
          content="Full archive of Goldsainte press releases, news, and announcements."
        />
        <link rel="canonical" href={`${BASE_URL}/newsroom/archive`} />
      </Helmet>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <header className="mb-12 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#0a2225]/50 mb-4">
            Goldsainte Newsroom · Archive
          </p>
          <h1 className="font-primary text-4xl md:text-5xl text-[#0a2225] mb-4">
            All Coverage
          </h1>
          <p className="text-[#0a2225]/60 max-w-xl mx-auto">
            Every press release, company announcement, and editorial piece — in one place.
          </p>
        </header>

        {/* Filters */}
        <div className="mb-14 -mx-6 px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2 snap-x justify-center min-w-min">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setVisibleCount(20);
                }}
                className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                  filter === key
                    ? "bg-[#0c4d47] text-white"
                    : "border border-[#E5DFC6] text-[#0a2225]/70 hover:border-[#0c4d47] hover:text-[#0c4d47]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid md:grid-cols-[140px_1fr] gap-6 py-6 animate-pulse">
                <div className="h-3 bg-[#E5DFC6]/60 rounded w-24" />
                <div className="space-y-3">
                  <div className="h-5 bg-[#E5DFC6]/60 rounded w-3/4" />
                  <div className="h-3 bg-[#E5DFC6]/40 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-[#0a2225]/50 italic">
            No articles yet.
          </p>
        )}

        {!isLoading &&
          years.map((year) => (
            <section key={year} className="mb-16">
              <h2
                id={`year-${year}`}
                className="font-primary text-2xl text-[#0a2225]/80 mb-6 pb-3 border-b border-[#E5DFC6]"
              >
                {year}
              </h2>

              <ul className="divide-y divide-[#E5DFC6]">
                {grouped[year].map((a) => (
                  <li key={a.id}>
                    <Link
                      to={articlePath(a)}
                      className="grid md:grid-cols-[140px_1fr] gap-3 md:gap-6 py-6 group"
                    >
                      <span className="hidden md:block text-xs text-[#0a2225]/50 uppercase tracking-wider pt-1">
                        {formatDate(a.published_at)}
                      </span>
                      <div>
                        <div className="md:hidden mb-2">
                          <span className="text-[11px] text-[#0a2225]/50 uppercase tracking-wider">
                            {formatDate(a.published_at)}
                          </span>
                        </div>
                        <div className="flex items-start gap-3 flex-wrap">
                          <p className="font-primary text-xl text-[#0a2225] group-hover:text-[#0c4d47] transition flex-1 min-w-0">
                            {a.title}
                          </p>
                          <span className="flex-shrink-0 inline-block px-2.5 py-1 rounded-full bg-[#0c4d47]/10 text-[#0c4d47] text-[10px] uppercase tracking-[0.18em]">
                            {TYPE_LABELS[a.type] ?? a.type}
                          </span>
                        </div>
                        {a.excerpt && (
                          <p className="text-sm text-[#0a2225]/60 mt-2 leading-relaxed">
                            {a.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

        {/* Load more */}
        {!isLoading && visibleCount < filtered.length && (
          <div className="text-center mt-12">
            <button
              onClick={() => setVisibleCount((n) => n + 20)}
              className="px-8 py-3 rounded-full border border-[#E5DFC6] text-[11px] uppercase tracking-[0.22em] text-[#0a2225]/70 hover:border-[#0c4d47] hover:text-[#0c4d47] transition"
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </>
  );
}
