import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getUnreadCount, markAsRead, markAllAsRead } from "../_shared/notificationService.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const url = new URL(req.url);
    const isPost = req.method === "POST";
    let body: any = null;
    if (isPost) {
      try {
        body = await req.json();
      } catch (error) {
        console.warn('Failed to parse notifications request body', error);
      }
    }
    const action = (isPost ? body?.action : null) ?? url.searchParams.get("action") ?? "list";
    const notificationId = (isPost ? body?.id : null) ?? url.searchParams.get("id");

    // Handle different actions
    if (action === "count") {
      const count = await getUnreadCount(supabaseClient, user.id);
      return new Response(
        JSON.stringify({ count }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (action === "markRead" && notificationId) {
      const success = await markAsRead(supabaseClient, notificationId);
      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (action === "markAllRead") {
      const success = await markAllAsRead(supabaseClient, user.id);
      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Default: Get all notifications with pagination
    const limit = parseInt(((isPost ? body?.limit : null) ?? url.searchParams.get("limit") ?? "20").toString());
    const offset = parseInt(((isPost ? body?.offset : null) ?? url.searchParams.get("offset") ?? "0").toString());
    const unreadOnly = ((isPost ? body?.unread : null) ?? url.searchParams.get("unread")) === true || url.searchParams.get("unread") === "true";

    let query = supabaseClient
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data: notifications, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        notifications: notifications || [],
        total: count || 0,
        limit,
        offset,
      }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 400 }
    );
  }
});
