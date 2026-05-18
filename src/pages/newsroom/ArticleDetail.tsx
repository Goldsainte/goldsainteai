import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BASE_URL,
  COMPANY_BOILERPLATE_LONG,
  articlePath,
  fetchArticleBySlug,
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

      <article className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <Link
          to="/newsroom"
          className="text-xs tracking-[0.2em] uppercase text-[#0c4d47] hover:underline"
        >
          ← Newsroom
        </Link>

        <p className="mt-10 text-[10px] tracking-[0.3em] uppercase text-[#C7A962]">{typeLabel}</p>
        <h1 className="font-secondary text-4xl md:text-6xl leading-[1.05] mt-4">{article.title}</h1>
        {article.subtitle && (
          <p className="font-secondary text-xl md:text-2xl text-[#0a2225]/70 mt-5 leading-snug">
            {article.subtitle}
          </p>
        )}

        <p className="mt-8 text-sm text-[#0a2225]/60 uppercase tracking-wider">
          {article.dateline_location && <span className="font-semibold">{article.dateline_location} — </span>}
          {formatDate(article.published_at)}
        </p>
      </article>

      {article.hero_image_url && (
        <figure className="max-w-5xl mx-auto px-6">
          <img
            src={article.hero_image_url}
            alt={article.hero_image_alt || article.title}
            className="w-full aspect-[16/9] object-cover"
          />
          {article.hero_image_credit && (
            <figcaption className="text-xs text-[#0a2225]/50 mt-3 italic">
              {article.hero_image_credit}
            </figcaption>
          )}
        </figure>
      )}

      <div className="max-w-3xl mx-auto px-6 py-16">
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

        <hr className="my-16 border-[#0a2225]/15" />

        <h3 className="font-secondary text-xl mb-4">About Goldsainte</h3>
        <p className="text-sm text-[#0a2225]/70 leading-relaxed mb-10">{COMPANY_BOILERPLATE_LONG}</p>

        <h3 className="font-secondary text-xl mb-4">Press Contact</h3>
        <p className="text-sm text-[#0a2225]/80">
          {article.press_contact_name || "Press Office"}
          <br />
          <a
            href={`mailto:${article.press_contact_email || "press@goldsainte.com"}`}
            className="text-[#0c4d47] underline underline-offset-4"
          >
            {article.press_contact_email || "press@goldsainte.com"}
          </a>
        </p>
      </div>
    </>
  );
}