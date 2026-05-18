import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://goldsainte.ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: articles, error } = await supabase
      .from("newsroom_articles")
      .select("slug, type, published_at, updated_at, title, hero_image_url")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) throw error;

    const staticPaths = [
      "/newsroom",
      "/newsroom/media-kit",
      "/newsroom/company-facts",
      "/newsroom/leadership",
      "/newsroom/editorial-policy",
      "/newsroom/press-contact",
      "/newsroom/archive",
    ];

    const urls: string[] = [];

    for (const p of staticPaths) {
      urls.push(`  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }

    for (const a of articles || []) {
      const segment = a.type === "press_release" ? "press-releases" : "news";
      const loc = `${BASE_URL}/newsroom/${segment}/${a.slug}`;
      const pub = a.published_at ? new Date(a.published_at).toISOString() : new Date().toISOString();
      const mod = a.updated_at ? new Date(a.updated_at).toISOString() : pub;
      const isRecent = a.published_at && (Date.now() - new Date(a.published_at).getTime()) < 2 * 24 * 60 * 60 * 1000;
      const newsBlock = isRecent
        ? `\n    <news:news>\n      <news:publication>\n        <news:name>Goldsainte Newsroom</news:name>\n        <news:language>en</news:language>\n      </news:publication>\n      <news:publication_date>${pub}</news:publication_date>\n      <news:title>${esc(a.title)}</news:title>\n    </news:news>`
        : "";
      urls.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>${newsBlock}\n  </url>`,
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls.join("\n")}\n</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(`error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});