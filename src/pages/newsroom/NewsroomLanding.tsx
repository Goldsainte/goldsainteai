import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import wordmarkGold from "@/assets/wordmark-gold.png";
import { articlePath, fetchPublishedArticles, formatDate, EXTERNAL_PRESS, BASE_URL } from "./lib";

export default function NewsroomLanding() {
  const { data: articles = [] } = useQuery({
    queryKey: ["newsroom", "all"],
    queryFn: () => fetchPublishedArticles({ limit: 20 }),
    staleTime: 1000 * 60 * 5,
  });

  const featured = articles.find((a) => a.type === "press_release") || articles[0];
  const pressReleases = articles.filter((a) => a.type === "press_release").slice(0, 5);
  const news = articles.filter((a) => a.type === "news").slice(0, 5);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from("newsroom_subscribers").insert({ email });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "You're already subscribed." : "Could not subscribe.");
      return;
    }
    setEmail("");
    toast.success("Subscribed. We'll be in touch.");
  }

  return (
    <>
      <Helmet>
        <title>Newsroom | Goldsainte</title>
        <meta name="description" content="Press releases, company updates, and editorial coverage from Goldsainte — the AI-powered travel marketplace." />
        <link rel="canonical" href={`${BASE_URL}/newsroom`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="The Goldsainte Newsroom" />
        <meta property="og:description" content="Press releases, company announcements, and editorial coverage from the team building the future of trip design." />
        <meta property="og:url" content={`${BASE_URL}/newsroom`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Goldsainte Newsroom",
          url: `${BASE_URL}/newsroom`,
          publisher: {
            "@type": "Organization",
            name: "Goldsainte",
            url: BASE_URL,
            logo: { "@type": "ImageObject", url: `${BASE_URL}/brand/goldsainte-logo-512.png` },
          },
        })}</script>
      </Helmet>

      {/* Editorial masthead — newspaper nameplate */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 md:pt-24 pb-10 md:pb-16 text-center">
        <p className="text-[10px] sm:text-[11px] tracking-[0.28em] sm:tracking-[0.35em] uppercase text-[#0c4d47] mb-5 md:mb-6">
          Vol. 1 · The Goldsainte Press
        </p>
        <h1 className="font-secondary text-[44px] sm:text-[56px] md:text-[80px] leading-[0.95] tracking-tight text-[#0a2225]">
          Newsroom
        </h1>
        <div className="mt-6 md:mt-8 mx-auto max-w-3xl border-t-2 border-[#C7A962]" />
        <p className="mt-5 md:mt-6 text-sm md:text-base text-[#0a2225]/70 max-w-2xl mx-auto leading-relaxed">
          Press releases, company announcements, and editorial coverage from the team
          building the future of trip design.
        </p>
        <div className="mt-6 md:mt-7 flex justify-center">
          <a
            href="mailto:press@goldsainte.com"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#0c4d47] text-white text-xs tracking-[0.2em] uppercase hover:bg-[#0a3d39] transition"
          >
            Press inquiries
          </a>
        </div>
      </section>

      {featured && (
        <section className="max-w-7xl mx-auto px-5 sm:px-6 pb-12 md:pb-16">
          <Link to={articlePath(featured)} className="group block">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-xl md:rounded-2xl">
              {featured.hero_image_url ? (
                <img
                  src={featured.hero_image_url}
                  alt={featured.hero_image_alt || featured.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-700"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#0c4d47] to-[#0a2225] flex items-center justify-center">
                  <img src={wordmarkGold} alt="Goldsainte" className="h-10 md:h-14 w-auto opacity-90" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/85 via-[#0a2225]/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-12 max-w-4xl">
                <span className="text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[#C7A962] mb-2 sm:mb-3 block">
                  Featured · {featured.type === "press_release" ? "Press Release" : featured.type}
                </span>
                <h2 className="font-secondary text-white text-2xl sm:text-3xl md:text-5xl leading-[1.05] tracking-tight mb-3 sm:mb-4 group-hover:text-[#FDF9F0] transition">
                  {featured.title}
                </h2>
                <p className="hidden sm:block text-white/80 leading-relaxed text-sm md:text-base max-w-2xl mb-3 line-clamp-2">
                  {featured.excerpt}
                </p>
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                  {formatDate(featured.published_at)}
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Subscribe strip */}
      <section className="border-y border-[#E5DFC6] bg-[#F6F0E4]/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-8 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#C7A962] mb-1.5">Stay informed</p>
            <p className="font-secondary text-lg sm:text-xl md:text-2xl text-[#0a2225] leading-snug">
              Newsroom updates, delivered when news breaks.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex rounded-full border border-[#E5DFC6] bg-white overflow-hidden w-full md:w-auto">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 sm:px-5 py-3 text-sm bg-transparent outline-none flex-1 min-w-0 md:w-72"
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex-shrink-0 px-5 sm:px-6 py-3 text-[11px] tracking-[0.2em] uppercase border-l border-[#E5DFC6] hover:bg-[#f0ead9] disabled:opacity-50"
            >
              {submitting ? "…" : "Subscribe"}
            </button>
          </form>
        </div>
      </section>

      <section className="border-t border-[#E5DFC6]">
        <div className={`max-w-7xl mx-auto px-5 sm:px-6 py-12 md:py-20 grid gap-10 md:gap-12 ${EXTERNAL_PRESS.length > 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <Column title="Recent Press Releases" items={pressReleases} emptyText="No press releases yet." />
          <Column title="Company News" items={news} emptyText="No company news yet." />
          {EXTERNAL_PRESS.length > 0 && (
            <div>
              <h3 className="font-secondary text-xl md:text-2xl mb-6">In the Press</h3>
              <ul className="space-y-5">
                {EXTERNAL_PRESS.map((p, i) => (
                  <li key={i}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="block group">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#C7A962]">{p.outlet}</span>
                      <p className="font-secondary text-base group-hover:text-[#0c4d47] transition mt-1">{p.title}</p>
                      <span className="text-xs text-[#0a2225]/50 mt-1 block">{p.date}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Column({ title, items, emptyText }: { title: string; items: any[]; emptyText: string }) {
  return (
    <div>
      <h3 className="font-secondary text-xl md:text-2xl mb-6">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[#0a2225]/50 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-5">
          {items.map((a) => (
            <li key={a.id}>
              <Link to={articlePath(a)} className="block group">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#C7A962]">
                  {formatDate(a.published_at)}
                </span>
                <p className="font-secondary text-base leading-snug group-hover:text-[#0c4d47] transition mt-1">
                  {a.title}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}