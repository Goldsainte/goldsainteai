import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { articlePath, fetchPublishedArticles, formatDate, BASE_URL } from "./lib";

export default function Archive() {
  const { data: articles = [] } = useQuery({
    queryKey: ["newsroom", "archive"],
    queryFn: () => fetchPublishedArticles({ limit: 500 }),
    staleTime: 1000 * 60 * 5,
  });
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? articles : articles.filter((a) => a.type === filter);

  return (
    <>
      <Helmet>
        <title>Archive | Goldsainte Newsroom</title>
        <meta name="description" content="Full archive of Goldsainte press releases, news, and announcements." />
        <link rel="canonical" href={`${BASE_URL}/newsroom/archive`} />
      </Helmet>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="font-serif text-5xl mb-6">Archive</h1>
        <div className="flex gap-3 mb-12 text-xs uppercase tracking-wider">
          {[
            ["all", "All"],
            ["press_release", "Press Releases"],
            ["news", "News"],
            ["announcement", "Announcements"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-4 py-2 border ${
                filter === k ? "bg-[#0c4d47] text-white border-[#0c4d47]" : "border-[#0a2225]/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="divide-y divide-[#0a2225]/10">
          {filtered.map((a) => (
            <li key={a.id}>
              <Link to={articlePath(a)} className="grid md:grid-cols-[140px_1fr] gap-6 py-6 group">
                <span className="text-xs text-[#0a2225]/50 uppercase tracking-wider pt-1">
                  {formatDate(a.published_at)}
                </span>
                <div>
                  <p className="font-serif text-xl group-hover:text-[#0c4d47] transition">{a.title}</p>
                  <p className="text-sm text-[#0a2225]/60 mt-1">{a.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-10 text-center text-sm text-[#0a2225]/50 italic">No articles yet.</li>
          )}
        </ul>
      </div>
    </>
  );
}