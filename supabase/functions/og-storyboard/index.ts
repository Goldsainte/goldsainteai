import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Server-rendered HTML with OG/Twitter meta for storyboard URLs.
// Designed to be hit by social-preview crawlers (LinkedIn/Slack/Facebook/Twitter)
// that do not execute client-side JS. Human users get a meta-refresh fallback
// to the SPA route at /s/:slug.

const SITE_URL = "https://goldsainte.ai";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Accept slug via path tail (.../og-storyboard/:slug) or ?slug= param.
  const slug =
    url.searchParams.get("slug") ||
    url.pathname.split("/").filter(Boolean).pop() ||
    "";

  if (!slug || slug === "og-storyboard") {
    return new Response("Missing slug", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Storyboards may be looked up by slug or id.
  const { data: storyboard } = await supabase
    .from("storyboards")
    .select("id, slug, title, description, cover_image_url, is_public")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  const canonical = `${SITE_URL}/s/${slug}`;

  if (!storyboard || storyboard.is_public === false) {
    const html = `<!doctype html><html><head>
<meta charset="utf-8"/>
<title>Storyboard — Goldsainte</title>
<meta name="robots" content="noindex"/>
<meta http-equiv="refresh" content="0; url=${canonical}"/>
<link rel="canonical" href="${canonical}"/>
</head><body><a href="${canonical}">Continue</a></body></html>`;
    return new Response(html, {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const title = escapeHtml(storyboard.title || "Goldsainte Storyboard");
  const description = escapeHtml(
    storyboard.description ||
      "Explore this curated travel storyboard on Goldsainte.",
  );
  const image = escapeHtml(
    storyboard.cover_image_url || `${SITE_URL}/og-default.jpg`,
  );

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${title} — Goldsainte</title>
<meta name="description" content="${description}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="${image}"/>
<meta property="og:site_name" content="Goldsainte"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${image}"/>
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: storyboard.title,
    description: storyboard.description,
    image: storyboard.cover_image_url,
    url: canonical,
  })}</script>
<meta http-equiv="refresh" content="0; url=${canonical}"/>
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
<p><a href="${canonical}">Open on Goldsainte</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
});