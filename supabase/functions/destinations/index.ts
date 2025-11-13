// Deno. A neutral city autocomplete using GeoDB Cities (or switch to Expedia Places if you have creds).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const API = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";
const KEY = Deno.env.get("RAPIDAPI_KEY"); // set in Supabase

serve(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

  if (!q || q.length < 2) {
    return json({ results: [] });
  }

  try {
    const upstream = await fetch(`${API}?namePrefix=${encodeURIComponent(q)}&limit=10&sort=-population`, {
      headers: { "X-RapidAPI-Key": KEY!, "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com" }
    });
    const data = await upstream.json();
    const results = (data?.data ?? []).map((c: any) => {
      const country = c.countryCode || "";
      return `${c.city}, ${c.region || c.regionCode || country}`.replace(/,\s*$/, "");
    });
    return json({ results });
  } catch (e) {
    console.error(e);
    return json({ results: [] });
  }
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors(), "Content-Type": "application/json" }});
}
