import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

      <section className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#0c4d47] mb-5">Goldsainte Newsroom</p>
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-10 items-end">
          <div>
            <h1 className="font-secondary text-2xl md:text-4xl leading-[1.05] tracking-tight mb-5">
              The Goldsainte Newsroom
            </h1>
            <p className="text-sm md:text-base text-[#0a2225]/70 max-w-xl leading-relaxed">
              Press releases, company announcements, and editorial coverage from the team
              building the future of trip design.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <a
              href="mailto:press@goldsainte.com"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#0c4d47] text-white text-sm tracking-wide hover:bg-[#0a3d39] transition"
            >
              Press inquiries
            </a>
            <form onSubmit={subscribe} className="flex rounded-full border border-[#E5DFC6] bg-white overflow-hidden">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 text-sm bg-transparent outline-none w-56"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-3 text-xs tracking-wide uppercase border-l border-[#E5DFC6] hover:bg-[#f0ead9] disabled:opacity-50"
              >
                {submitting ? "…" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {featured && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <Link
            to={articlePath(featured)}
            className="grid md:grid-cols-2 gap-10 group items-stretch"
          >
            <div className="aspect-[4/3] bg-[#F6F0E4] overflow-hidden rounded-2xl">
              {featured.hero_image_url && (
                <img
                  src={featured.hero_image_url}
                  alt={featured.hero_image_alt || featured.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-700"
                />
              )}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#C7A962] mb-4">
                Featured · {featured.type === "press_release" ? "Press Release" : featured.type}
              </span>
              <h2 className="font-secondary text-2xl md:text-4xl leading-tight mb-5 group-hover:text-[#0c4d47] transition">
                {featured.title}
              </h2>
              <p className="text-[#0a2225]/70 leading-relaxed mb-6 text-lg">{featured.excerpt}</p>
              <span className="text-xs uppercase tracking-wider text-[#0a2225]/50">
                {formatDate(featured.published_at)}
              </span>
            </div>
          </Link>
        </section>
      )}

      <section className="border-t border-[#E5DFC6]">
        <div className={`max-w-7xl mx-auto px-6 py-20 grid gap-12 ${EXTERNAL_PRESS.length > 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
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
                      <p className="font-secondary text-lg group-hover:text-[#0c4d47] transition mt-1">{p.title}</p>
                      <span className="text-xs text-[#0a2225]/50 mt-1 block">{p.date}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[#E5DFC6] bg-[#F6F0E4]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-8 text-sm">
          {[
            { to: "/newsroom/media-kit", label: "Media Kit", desc: "Logos, brand assets, headshots." },
            { to: "/newsroom/company-facts", label: "Company Facts", desc: "Goldsainte at a glance." },
            { to: "/newsroom/leadership", label: "Leadership", desc: "Founders and executives." },
            { to: "/newsroom/editorial-policy", label: "Editorial Policy", desc: "Our standards." },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="group">
              <p className="font-secondary text-xl mb-2 group-hover:text-[#0c4d47] transition">{item.label}</p>
              <p className="text-[#0a2225]/60">{item.desc}</p>
            </Link>
          ))}
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
                <p className="font-secondary text-lg leading-snug group-hover:text-[#0c4d47] transition mt-1">
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