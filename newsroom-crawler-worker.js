// Cloudflare Worker — route social crawlers on goldsainte.ai/newsroom/*
// to the Supabase prerender edge function so link previews show the
// per-article og:image. Humans pass through to the SPA unchanged.

const PRERENDER = "https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/newsroom-prerender";
const BOT_UA = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|Pinterest|redditbot|Embedly|Applebot|bingbot|Googlebot|SkypeUriPreview|vkShare|W3C_Validator|outbrain|quora link preview|showyoubot|tumblr|bitlybot|nuzzel|Bytespider|ia_archiver/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";
    if (url.pathname.startsWith("/newsroom/") && BOT_UA.test(ua)) {
      const target = `${PRERENDER}?path=${encodeURIComponent(url.pathname)}`;
      return fetch(target, { headers: { "user-agent": ua } });
    }
    return fetch(request);
  },
};