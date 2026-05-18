// Returns fully-prerendered HTML with per-article OG/Twitter/JSON-LD meta
// tags for newsroom press releases and news articles. Designed for social
// preview crawlers (Twitter, Facebook, LinkedIn, Slack, opengraph.xyz)
// which do not execute JavaScript and therefore never see react-helmet's
// per-route head.
//
// Usage:
//   GET /functions/v1/newsroom-prerender?path=/newsroom/press-releases/<slug>
//   GET /functions/v1/newsroom-prerender?path=/newsroom/news/<slug>
//
// Routing crawlers to this endpoint requires either a DNS-level proxy
// (Cloudflare worker user-agent rule) or sharing the prerender URL
// directly. Lovable hosting cannot inspect User-Agent at the edge.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://goldsainte.ai";
const DEFAULT_OG = `${BASE_URL}/newsroom-og-default.jpg`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string | null | undefined) {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parsePath(raw: string | null): { segment: "press-releases" | "news"; slug: string } | null {
  if (!raw) return null;
  const m = raw.match(/^\/?newsroom\/(press-releases|news)\/([^\/?#]+)\/?$/);
  if (!m) return null;
  return { segment: m[1] as "press-releases" | "news", slug: m[2] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const parsed = parsePath(url.searchParams.get("path"));
  if (!parsed) {
    return new Response("invalid path", { status: 400, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const expectedType = parsed.segment === "press-releases" ? "press_release" : "news";

    const { data: article, error } = await supabase
      .from("newsroom_articles")
      .select(
        "slug, type, title, subtitle, excerpt, body, hero_image_url, hero_image_alt, og_image_url, canonical_url, meta_title, meta_description, published_at, updated_at, category, tags, author_id",
      )
      .eq("slug", parsed.slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    if (!article) return new Response("not found", { status: 404, headers: corsHeaders });

    let author: { full_name: string; title: string | null; slug: string } | null = null;
    if (article.author_id) {
      const { data: a } = await supabase
        .from("newsroom_authors")
        .select("full_name, title, slug")
        .eq("id", article.author_id)
        .maybeSingle();
      author = a as typeof author;
    }

    const canonicalPath = `/newsroom/${article.type === "press_release" ? "press-releases" : "news"}/${article.slug}`;
    const canonical = article.canonical_url || `${BASE_URL}${canonicalPath}`;
    const ogImg = article.og_image_url || article.hero_image_url || DEFAULT_OG;
    const title = article.meta_title || article.title;
    const desc = article.meta_description || article.excerpt || "";
    const pubISO = article.published_at ? new Date(article.published_at).toISOString() : "";
    const modISO = article.updated_at ? new Date(article.updated_at).toISOString() : pubISO;

    // Notify mismatched-type requests
    if (article.type !== expectedType) {
      return new Response(`<meta http-equiv="refresh" content="0;url=${esc(canonical)}">`, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const ld = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      description: article.excerpt,
      image: [article.hero_image_url, article.og_image_url, DEFAULT_OG].filter(Boolean),
      datePublished: article.published_at,
      dateModified: article.updated_at,
      author: author
        ? {
            "@type": "Person",
            name: author.full_name,
            url: `${BASE_URL}/newsroom/leadership#${author.slug}`,
            jobTitle: author.title || undefined,
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
    };

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Goldsainte Newsroom</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Goldsainte Newsroom">
<meta property="og:title" content="${esc(article.title)}">
<meta property="og:description" content="${esc(article.excerpt)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImg)}">
<meta property="og:image:secure_url" content="${esc(ogImg)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(article.hero_image_alt || article.title)}">
<meta property="og:image:type" content="image/jpeg">
${pubISO ? `<meta property="article:published_time" content="${esc(pubISO)}">` : ""}
${modISO ? `<meta property="article:modified_time" content="${esc(modISO)}">` : ""}
${author?.full_name ? `<meta property="article:author" content="${esc(author.full_name)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(article.title)}">
<meta name="twitter:description" content="${esc(article.excerpt)}">
<meta name="twitter:image" content="${esc(ogImg)}">
<meta name="twitter:image:alt" content="${esc(article.hero_image_alt || article.title)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<h1>${esc(article.title)}</h1>
${article.subtitle ? `<h2>${esc(article.subtitle)}</h2>` : ""}
<p>${esc(article.excerpt)}</p>
<p><a href="${esc(canonical)}">Read the full article on Goldsainte Newsroom</a>.</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=3600",
      },
    });
  } catch (e) {
    return new Response(`error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});