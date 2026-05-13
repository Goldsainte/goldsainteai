import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { conversationId, action } = await req.json();

    if (!conversationId || !action) {
      return new Response(
        JSON.stringify({ error: "conversationId and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from("dm_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otherUserId = conversation.participant_1 === user.id
      ? conversation.participant_2
      : conversation.participant_1;

    let updateData: Record<string, any> = {};
    let message = "";

    switch (action) {
      case "accept":
        if (conversation.status !== "request") {
          return new Response(
            JSON.stringify({ error: "Can only accept message requests" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData = { status: "active" };
        message = "Message request accepted";
        break;

      case "decline":
        if (conversation.status !== "request") {
          return new Response(
            JSON.stringify({ error: "Can only decline message requests" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData = { status: "declined" };
        message = "Message request declined";
        break;

      case "archive":
        updateData = { status: "archived" };
        message = "Conversation archived";
        break;

      case "unarchive":
        updateData = { status: "active" };
        message = "Conversation unarchived";
        break;

      case "block":
        updateData = { status: "blocked" };
        
        // Also add to blocked_users in settings
        const { data: settings } = await supabase
          .from("message_settings")
          .select("blocked_users")
          .eq("user_id", user.id)
          .single();

        const blockedUsers = settings?.blocked_users || [];
        if (!blockedUsers.includes(otherUserId)) {
          blockedUsers.push(otherUserId);
          await supabase
            .from("message_settings")
            .upsert({
              user_id: user.id,
              blocked_users: blockedUsers,
            });
        }
        message = "User blocked";
        break;

      case "delete":
        // Delete all messages in the conversation
        const { error: delMsgError } = await supabase
          .from("direct_messages")
          .delete()
          .eq("conversation_id", conversationId);

        if (delMsgError) {
          console.error("Error deleting messages:", delMsgError);
          return new Response(
            JSON.stringify({ error: "Failed to delete messages" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: delConvError } = await supabase
          .from("dm_conversations")
          .delete()
          .eq("id", conversationId);

        if (delConvError) {
          console.error("Error deleting conversation:", delConvError);
          return new Response(
            JSON.stringify({ error: "Failed to delete conversation" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Conversation permanently deleted" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "mark_read":
        const isP1 = conversation.participant_1 === user.id;
        updateData = isP1 ? { unread_count_p1: 0 } : { unread_count_p2: 0 };
        
        // Mark all messages as read
        await supabase
          .from("direct_messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("is_read", false);
        
        message = "Marked as read";
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const { error: updateError } = await supabase
      .from("dm_conversations")
      .update(updateData)
      .eq("id", conversationId);

    if (updateError) {
      console.error("Error updating conversation:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update conversation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in manage-conversation:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
