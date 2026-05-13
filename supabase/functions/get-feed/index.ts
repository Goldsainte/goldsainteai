import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function pickOrigin(req: Request): string {
  const requestOrigin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(requestOrigin) 
    ? requestOrigin 
    : (ALLOWED_ORIGINS[0] || "https://goldsainte.ai");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: { ...corsHeaders, "Vary": "Origin" } 
    });
  }

  const origin = pickOrigin(req);
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);
  const cursorCreatedAt = url.searchParams.get("cursorCreatedAt");
  const cursorId = url.searchParams.get("cursorId");
  const journeyId = url.searchParams.get("journeyId") || null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Extract user ID from auth token if present
    const authHeader = req.headers.get("Authorization") || "";
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Build keyset query
    let query = supabase
      .from("moments")
      .select("id, user_id, caption, media_url, media_type, created_at, journey_id");

    // Apply journey filter if specified
    if (journeyId) {
      query = query.eq("journey_id", journeyId);
    }

    // Apply keyset pagination cursor
    if (cursorCreatedAt && cursorId) {
      query = query.or(`created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Add hardcoded counts for now (can be optimized later with views/triggers)
    const items = (data || []).map(item => ({
      ...item,
      like_count: 0,
      comment_count: 0,
      liked_by_me: false,
    }));

    // Build next cursor from last item
    const last = items[items.length - 1];
    const nextCursor = last
      ? { cursorCreatedAt: last.created_at, cursorId: last.id }
      : null;

    // Compute ETag for cache validation
    const etag = `"v1-${(items[0]?.id || "empty")}-${items.length}"`;

    return new Response(
      JSON.stringify({ items, nextCursor }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          "ETag": etag,
          "Access-Control-Allow-Origin": origin,
          "Vary": "Origin",
        },
      }
    );
  } catch (e) {
    console.error("[get-feed] error", e);
    return new Response(
      JSON.stringify({ error: String(e) }), 
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Vary": "Origin",
        },
      }
    );
  }
});
