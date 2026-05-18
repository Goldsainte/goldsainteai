import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BASE_URL,
  COMPANY_BOILERPLATE_LONG,
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

      <article className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-10 animate-fade-in">
        <Link
          to="/newsroom"
          className="text-[10px] tracking-[0.3em] uppercase text-[#0c4d47] hover:underline"
        >
          ← Newsroom
        </Link>

        <p className="mt-12 text-[10px] tracking-[0.3em] uppercase text-[#C7A962]">{typeLabel}</p>
        <h1 className="font-secondary text-3xl md:text-5xl leading-[1.1] mt-4 tracking-tight">{article.title}</h1>
        {article.subtitle && (
          <p className="font-secondary text-lg md:text-2xl text-[#0a2225]/70 mt-6 leading-snug max-w-2xl">
            {article.subtitle}
          </p>
        )}

        {/* Author identity block */}
        <div className="mt-10 flex items-center gap-4 pt-6 border-t border-[#E5DFC6]">
          {article.author?.avatar_url ? (
            <img
              src={article.author.avatar_url}
              alt={article.author.full_name}
              className="w-12 h-12 rounded-full object-cover border border-[#E5DFC6]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#F6F0E4] border border-[#E5DFC6]" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-secondary text-base text-[#0a2225] leading-tight">
              {article.author?.full_name || "Goldsainte Editorial"}
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#0a2225]/55 mt-1">
              {article.author?.title || "Newsroom"}
            </p>
          </div>
          <div className="text-right text-[11px] uppercase tracking-[0.2em] text-[#0a2225]/55 leading-tight">
            <div>{formatDate(article.published_at)}</div>
            <div className="mt-1">{readingTime(article.body)} min read</div>
          </div>
        </div>
      </article>

      {article.hero_image_url && (
        <figure className="w-full overflow-hidden animate-fade-in">
          <img
            src={article.hero_image_url}
            alt={article.hero_image_alt || article.title}
            className="w-full aspect-[16/9] md:aspect-[21/9] object-cover"
          />
          {article.hero_image_credit && (
            <figcaption className="max-w-3xl mx-auto px-6 text-[11px] text-[#0a2225]/50 mt-3 italic">
              {article.hero_image_credit}
            </figcaption>
          )}
        </figure>
      )}

      <div className="max-w-3xl mx-auto px-6 pt-16 pb-16 overflow-hidden">
        <Markdown source={article.body} />

        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <span key={t} className="text-[10px] uppercase tracking-wider px-3 py-1 border border-[#E5DFC6] text-[#0a2225]/70">
                {t}
              </span>
            ))}
          </div>
        )}

        <ShareRow title={article.title} url={canonical} />

        {article.type === "press_release" && (
          <>
            <hr className="my-16 border-[#E5DFC6]" />
            <h3 className="font-secondary text-xl mb-4">About Goldsainte</h3>
            <p className="text-sm text-[#0a2225]/70 leading-relaxed mb-10">{COMPANY_BOILERPLATE_LONG}</p>

            <h3 className="font-secondary text-xl mb-4">Press Contact</h3>
            <p className="text-sm text-[#0a2225]/80">
              {article.press_contact_name || "Goldsainte Press Team"}
              <br />
              <a
                href={`mailto:${article.press_contact_email || "press@goldsainte.ai"}`}
                className="text-[#0c4d47] underline underline-offset-4"
              >
                {article.press_contact_email || "press@goldsainte.ai"}
              </a>
            </p>
          </>
        )}
      </div>

      {related.length > 0 && (
        <section className="border-t border-[#E5DFC6]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <h3 className="font-secondary text-xl md:text-2xl mb-8">Related Articles</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link key={r.id} to={articlePath(r)} className="group block">
                  <div className="aspect-[4/3] bg-[#F6F0E4] overflow-hidden rounded-2xl mb-4">
                    {r.hero_image_url && (
                      <img
                        src={r.hero_image_url}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-700"
                      />
                    )}
                  </div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[#C7A962]">
                    {formatDate(r.published_at)}
                  </span>
                  <p className="font-secondary text-base leading-snug mt-1 group-hover:text-[#0c4d47] transition">
                    {r.title}
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