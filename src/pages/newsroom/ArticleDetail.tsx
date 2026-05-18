import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BASE_URL,
  articlePath,
  fetchArticleBySlug,
  fetchRelatedArticles,
  formatDate,
} from "./lib";
import Markdown from "./Markdown";

export default function ArticleDetail({ expectedType }: { expectedType: "press_release" | "news" }) {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useQuery({
    queryKey: ["newsroom", "article", slug],
    queryFn: () => fetchArticleBySlug(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["newsroom", "related", article?.id, article?.category],
    queryFn: () =>
      fetchRelatedArticles({ category: article!.category, excludeId: article!.id, limit: 3 }),
    enabled: !!article,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <div className="max-w-3xl mx-auto px-6 py-32 text-center text-[#0a2225]/50">Loading…</div>;
  }
  if (!article) return <Navigate to="/newsroom" replace />;

  // Cross-link: redirect press_release viewed under /news/* (and vice versa) to correct path
  if (article.type !== expectedType && (article.type === "press_release" || article.type === "news")) {
    return <Navigate to={articlePath(article)} replace />;
  }

  const canonical = article.canonical_url || `${BASE_URL}${articlePath(article)}`;
  const ogImg = article.og_image_url || article.hero_image_url || undefined;
  const typeLabel =
    article.type === "press_release" ? "Press Release" : article.type === "announcement" ? "Announcement" : "News";

  return (
    <>
      <Helmet>
        <title>{article.meta_title || article.title} | Goldsainte Newsroom</title>
        <meta name="description" content={article.meta_description || article.excerpt} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:url" content={canonical} />
        {ogImg && <meta property="og:image" content={ogImg} />}
        {article.published_at && (
          <meta property="article:published_time" content={article.published_at} />
        )}
        <meta property="article:modified_time" content={article.updated_at} />
        {article.author?.full_name && (
          <meta property="article:author" content={article.author.full_name} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt} />
        {ogImg && <meta name="twitter:image" content={ogImg} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: article.title,
          description: article.excerpt,
          image: [article.hero_image_url, article.og_image_url].filter(Boolean),
          datePublished: article.published_at,
          dateModified: article.updated_at,
          author: article.author
            ? {
                "@type": "Person",
                name: article.author.full_name,
                url: `${BASE_URL}/newsroom/leadership#${article.author.slug}`,
                jobTitle: article.author.title,
              }
            : undefined,
          publisher: {
            "@type": "Organization",
            name: "Goldsainte",
            logo: {
              "@type": "ImageObject",
              url: `${BASE_URL}/brand/goldsainte-logo-512.png`,
              width: 512,
              height: 512,
            },
            url: BASE_URL,
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          articleSection: article.category || undefined,
          keywords: article.tags?.join(", "),
        })}</script>
      </Helmet>

      <article className="max-w-[680px] mx-auto px-6 pt-12 md:pt-20 pb-8 animate-fade-in">
        <Link
          to="/newsroom"
          className="text-[11px] tracking-[0.25em] uppercase text-[#0c4d47] hover:underline"
        >
          ← Back to Newsroom
        </Link>

        <h1
          className="font-secondary mt-10 text-[34px] md:text-[52px] leading-[1.08] text-[#0a2225]"
          style={{ letterSpacing: "-0.01em" }}
        >
          {article.title}
        </h1>

        <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#0a2225]/70">
          <span>By {article.author?.full_name || "Goldsainte"}</span>
          <span className="text-[#0a2225]/30">·</span>
          <span>{formatDate(article.published_at)}</span>
          <span className="text-[#0a2225]/30">·</span>
          <span className="text-[#0c4d47]">{article.category || typeLabel}</span>
        </div>

        {article.subtitle && (
          <div className="mt-10 border-l-2 border-[#C7A962] pl-5 py-1">
            <p className="text-[15px] italic text-[#0a2225]/75 leading-relaxed">
              <span className="font-semibold not-italic text-[#0a2225]">Editor's Note:</span>{" "}
              {article.subtitle}
            </p>
          </div>
        )}
      </article>

      {/* Optional inline image — only for non-press-release articles */}
      {article.type !== "press_release" && article.hero_image_url && (
        <figure className="max-w-[680px] mx-auto px-6 mt-12 animate-fade-in">
          <img
            src={article.hero_image_url}
            alt={article.hero_image_alt || article.title}
            className="w-full aspect-[16/9] object-cover rounded-sm"
          />
          {article.hero_image_credit && (
            <figcaption className="text-[11px] text-[#0a2225]/50 mt-3 italic">
              {article.hero_image_credit}
            </figcaption>
          )}
        </figure>
      )}

      <div className="max-w-[680px] mx-auto px-6 pt-12 pb-16">
        <Markdown source={article.body} variant="editorial" />

        {article.author?.signature_image_url && (
          <div className="mt-16 mb-4">
            <img
              src={article.author.signature_image_url}
              alt={`${article.author.full_name} signature`}
              className="h-20 w-auto opacity-90"
            />
          </div>
        )}

        {article.type === "press_release" && (
          <>
            <hr className="my-16 border-t border-[#E5DFC6]" />
            <h3 className="font-secondary text-2xl text-[#0a2225] mb-4">About Goldsainte</h3>
            <p className="text-[15px] text-[#0a2225]/80 leading-[1.7] mb-8">
              Goldsainte is an AI-powered travel marketplace headquartered in Charlotte,
              North Carolina. Founded in 2026, Goldsainte connects travelers with vetted
              travel creators and certified travel agents through a platform that combines
              AI trip planning, escrow-protected payments via Stripe Connect, and verified
              professional expertise across 47 countries. For more information, visit{" "}
              <a href="https://goldsainte.ai" className="text-[#0c4d47] underline underline-offset-2">
                goldsainte.ai
              </a>
              .
            </p>
            <Link
              to="/newsroom/media-kit"
              className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.25em] text-[#0c4d47] hover:text-[#0a3d39]"
            >
              Download brand assets <span aria-hidden>→</span>
            </Link>

            <hr className="my-16 border-t border-[#E5DFC6]" />
            <h3 className="font-secondary text-2xl text-[#0a2225] mb-4">Press Contact</h3>
            <p className="text-[15px] text-[#0a2225]/80 leading-[1.7]">
              {article.press_contact_name || "Goldsainte Press Team"}
              <br />
              <a
                href={`mailto:${article.press_contact_email || "press@goldsainte.com"}`}
                className="text-[#0c4d47] underline underline-offset-2"
              >
                {article.press_contact_email || "press@goldsainte.com"}
              </a>
            </p>
          </>
        )}

        <ShareRow title={article.title} url={canonical} />
      </div>

      {related.length > 0 && (
        <section className="bg-[#FDF9F0] border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <h3 className="font-secondary text-2xl md:text-3xl text-[#0a2225] mb-10">
              Related stories
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link key={r.id} to={articlePath(r)} className="group block">
                  {r.hero_image_url ? (
                    <div className="aspect-[4/3] overflow-hidden rounded-sm mb-5">
                      <img
                        src={r.hero_image_url}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-700"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] rounded-sm mb-5 bg-gradient-to-br from-[#0c4d47] to-[#0a2225] flex items-center justify-center">
                      <span className="text-[10px] tracking-[0.3em] uppercase text-[#C7A962]">
                        {r.type === "press_release" ? "Press Release" : "News"}
                      </span>
                    </div>
                  )}
                  <p className="font-secondary text-lg md:text-xl leading-snug text-[#0a2225] group-hover:text-[#0c4d47] transition">
                    {r.title}
                  </p>
                  <p className="mt-2 text-[12px] tracking-wide text-[#0a2225]/55">
                    {formatDate(r.published_at)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function ShareRow({ title, url }: { title: string; url: string }) {
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  const twitter = `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
  const email = `mailto:?subject=${t}&body=${u}`;
  const cls =
    "inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#E5DFC6] text-xs uppercase tracking-wider text-[#0a2225]/70 hover:text-[#0c4d47] hover:border-[#0c4d47] transition";
  return (
    <div className="mt-12 flex items-center gap-3 flex-wrap">
      <span className="text-[10px] tracking-[0.25em] uppercase text-[#0a2225]/50 mr-1">Share</span>
      <a href={twitter} target="_blank" rel="noopener noreferrer" className={cls}>Twitter</a>
      <a href={linkedin} target="_blank" rel="noopener noreferrer" className={cls}>LinkedIn</a>
      <a href={email} className={cls}>Email</a>
    </div>
  );
}

