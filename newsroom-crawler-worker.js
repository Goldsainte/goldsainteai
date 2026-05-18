// Cloudflare Worker — route newsroom article detail URLs on
// goldsainte.ai/newsroom/* to the prerender endpoint so the origin never
// serves the generic SPA index.html for press releases or news articles.

const PRERENDER = "https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/newsroom-prerender";
const ARTICLE_PATH = /^\/newsroom\/(press-releases|news)\/[^/?#]+\/?$/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (ARTICLE_PATH.test(url.pathname)) {
      const target = `${PRERENDER}?path=${encodeURIComponent(url.pathname)}`;
      return fetch(target, {
        headers: {
          "user-agent": request.headers.get("user-agent") || "",
        },
      });
    }
    return fetch(request);
  },
};