import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all conversations where user is a participant
    const { data: conversations, error: convError } = await supabase
      .from("dm_conversations")
      .select(`
        *,
        participant_1_profile:profiles!dm_conversations_participant_1_fkey(
          id, display_name, avatar_url, account_type, is_verified
        ),
        participant_2_profile:profiles!dm_conversations_participant_2_fkey(
          id, display_name, avatar_url, account_type, is_verified
        )
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .neq("status", "declined")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (convError) {
      console.error("Error fetching conversations:", convError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch conversations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process conversations to add other participant info and unread count
    const processedConversations = conversations?.map((conv) => {
      const isP1 = conv.participant_1 === user.id;
      const otherParticipant = isP1 ? conv.participant_2_profile : conv.participant_1_profile;
      const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
      const isInitiator = conv.initiated_by === user.id;

      return {
        id: conv.id,
        status: conv.status,
        lastMessageAt: conv.last_message_at,
        lastMessagePreview: conv.last_message_preview,
        unreadCount,
        isInitiator,
        tripId: conv.trip_id ?? null,
        tripTitle: conv.trip_title ?? null,
        otherParticipant: {
          id: otherParticipant?.id,
          displayName: otherParticipant?.display_name || "Unknown",
          avatarUrl: otherParticipant?.avatar_url,
          accountType: otherParticipant?.account_type,
          isVerified: otherParticipant?.is_verified,
        },
        createdAt: conv.created_at,
      };
    }) || [];

    // Categorize conversations
    const requests = processedConversations.filter(
      (c) => c.status === "request" && !c.isInitiator
    );
    const primary = processedConversations.filter(
      (c) => c.status === "active" || (c.status === "request" && c.isInitiator)
    );
    const archived = processedConversations.filter((c) => c.status === "archived");

    // Get total unread count
    const totalUnread = processedConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const requestCount = requests.length;

    return new Response(
      JSON.stringify({
        conversations: {
          requests,
          primary,
          archived,
        },
        totalUnread,
        requestCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-conversations:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
