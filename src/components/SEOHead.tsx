import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  author?: string;
  structuredData?: Record<string, any>;
}

export function SEOHead({
  title = "Goldsainte - Luxury Travel with Certified Agents",
  description = "Experience luxury travel with Goldsainte's certified travel agents. Book curated packages, access exclusive perks, and enjoy personalized trip planning.",
  keywords = ["luxury travel", "travel agent", "vacation packages", "trip planning", "travel concierge"],
  image = "/og-image.jpg",
  url,
  type = "website",
  publishedTime,
  author,
  structuredData,
}: SEOHeadProps) {
  const siteUrl = "https://goldsainte.lovable.app";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith("http") ? image : `${siteUrl}${image}`;

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Goldsainte",
    description: description,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      "https://facebook.com/goldsainte",
      "https://instagram.com/goldsainte",
      "https://twitter.com/goldsainte",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["English"],
    },
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Goldsainte" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Goldsainte" />
    </Helmet>
  );
}
