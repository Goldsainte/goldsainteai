import { Helmet } from "react-helmet-async";

interface ArticleSEOProps {
  title: string;
  dek: string;
  heroImageUrl: string;
  publishDate: string;
  authorName: string;
  slug: string;
  categories?: string[];
  readTime?: number;
}

export function ArticleSEO({
  title,
  dek,
  heroImageUrl,
  publishDate,
  authorName,
  slug,
  categories = [],
  readTime = 5,
}: ArticleSEOProps) {
  const fullUrl = `https://goldsainte.ai/journal/${slug}`;
  const canonicalUrl = fullUrl;

  // JSON-LD structured data for Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: dek,
    image: heroImageUrl,
    datePublished: publishDate,
    dateModified: publishDate,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Goldsainte",
      logo: {
        "@type": "ImageObject",
        url: "https://goldsainte.ai/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": fullUrl,
    },
    articleSection: categories.join(", "),
    timeRequired: `PT${readTime}M`,
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title} | Goldsainte Journal</title>
      <meta name="description" content={dek} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph Tags */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={dek} />
      <meta property="og:image" content={heroImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Goldsainte Journal" />
      <meta property="article:published_time" content={publishDate} />
      <meta property="article:author" content={authorName} />
      {categories.map((category) => (
        <meta key={category} property="article:tag" content={category} />
      ))}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={dek} />
      <meta name="twitter:image" content={heroImageUrl} />
      <meta name="twitter:site" content="@goldsainte" />
      <meta name="twitter:creator" content="@goldsainte" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>
    </Helmet>
  );
}
