// Cloudflare Worker — serve prerendered HTML to search-engine and
// social-preview crawlers so they never see the SPA's blank shell
// or error-boundary fallback. Real users hit the origin SPA as usual.
//
// Newsroom article URLs are always routed to the prerender endpoint
// (those pages are content-only and benefit from per-article meta).
//
// Marketing pages (/, /marketplace, /about, /agents, /creators,
// /what-we-do) are routed to the marketing prerender ONLY for known
// bot user-agents — humans continue to get the live React app.

const NEWSROOM_PRERENDER =
  "https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/newsroom-prerender";
const MARKETING_PRERENDER =
  "https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/marketing-prerender";

const NEWSROOM_ARTICLE_PATH = /^\/newsroom\/(press-releases|news)\/[^/?#]+\/?$/i;

const MARKETING_PATHS = new Set([
  "/",
  "/marketplace",
  "/about",
  "/agents",
  "/creators",
  "/what-we-do",
  "/help",
  "/trust-safety",
  "/apply/agent",
]);

// Common search-engine + social-preview crawler signatures.
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|embedly|quora link preview|outbrain|pinterest|vkshare|w3c_validator|applebot|duckduckbot|yandex|baiduspider|petalbot|ahrefsbot|semrushbot|mj12bot|dotbot|gptbot|chatgpt-user|oai-searchbot|perplexitybot|claudebot|anthropic-ai|cohere-ai|google-extended|googleother/i;

function normalize(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";
    const path = normalize(url.pathname);

    // Newsroom article URLs are always prerendered (cheap, content-only).
    if (NEWSROOM_ARTICLE_PATH.test(url.pathname)) {
      const target = `${NEWSROOM_PRERENDER}?path=${encodeURIComponent(url.pathname)}`;
      return fetch(target, { headers: { "user-agent": ua } });
    }

    // Marketing pages: only redirect bots to the prerender, so the live
    // SPA experience for humans is untouched.
    if (BOT_UA.test(ua) && MARKETING_PATHS.has(path)) {
      const target = `${MARKETING_PRERENDER}?path=${encodeURIComponent(path === "" ? "/" : path)}`;
      return fetch(target, { headers: { "user-agent": ua } });
    }

    return fetch(request);
  },
};