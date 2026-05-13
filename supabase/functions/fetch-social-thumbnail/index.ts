import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ thumbnail_url: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try noembed oEmbed proxy (supports Instagram & TikTok, no API key needed)
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl);
    const data = await res.json();

    const thumbnail_url = data.thumbnail_url || data.url || null;

    return new Response(JSON.stringify({ thumbnail_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-social-thumbnail error:", err);
    return new Response(JSON.stringify({ thumbnail_url: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
