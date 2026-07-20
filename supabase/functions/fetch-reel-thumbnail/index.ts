// fetch-reel-thumbnail v1.0 (2026-07-20)
// Fetches a TikTok/Instagram reel's thumbnail server-side. Browsers CANNOT
// call TikTok/Instagram oembed directly (CORS blocks it, surfacing as
// "Failed to fetch"), so this proxies the request from the edge where CORS
// doesn't apply. Returns { thumbnail_url } or { thumbnail_url: null }.
import { buildCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { url } = await req.json();
    if (typeof url !== "string" || !url) {
      return json(cors, { thumbnail_url: null }, 200);
    }

    let thumbnail_url: string | null = null;

    if (url.includes("tiktok.com")) {
      try {
        const r = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
        );
        if (r.ok) {
          const data = await r.json();
          thumbnail_url = data?.thumbnail_url ?? null;
        }
      } catch (e) {
        console.warn("[fetch-reel-thumbnail] tiktok oembed failed:", e);
      }
    } else if (url.includes("instagram.com")) {
      // Instagram's public oembed requires a registered FB app token, so we
      // can't reliably fetch a thumbnail. Return null; the UI shows a branded
      // tile and recommends the creator upload a cover.
      thumbnail_url = null;
    }

    return json(cors, { thumbnail_url }, 200);
  } catch (e) {
    console.error("[fetch-reel-thumbnail] error:", e);
    return json(cors, { thumbnail_url: null }, 200); // never block the add
  }
});

function json(cors: Record<string, string>, body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
