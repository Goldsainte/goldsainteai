import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ReplyNotificationEmail } from "../_shared/email-templates/reply-notification.tsx";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const FROM_DOMAIN = "goldsainte.com";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

// Content filter patterns
const PHONE_REGEX = /(\+?\d[\d\-\s().]{7,}\d)/g;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_REGEX = /https?:\/\/[^\s]+/gi;
const OFFLINE_PATTERNS = [
  /\b(text|call|whatsapp|telegram|signal)\s*(me|us)?\b/gi,
  /\b(my|the)\s*(number|phone|cell|mobile)\b/gi,
  /\b(contact|reach)\s*(me|us)?\s*(at|on|via)?\b/gi,
];

function filterMessage(content: string): { safe: string; flagged: boolean; reason?: string } {
  let safe = content;
  let flagged = false;
  let reason = "";

  if (PHONE_REGEX.test(safe)) {
    flagged = true;
    reason = "phone_removed";
    safe = safe.replace(PHONE_REGEX, "[contact removed]");
  }

  if (EMAIL_REGEX.test(safe)) {
    flagged = true;
    reason = reason ? "contact_info_removed" : "email_removed";
    safe = safe.replace(EMAIL_REGEX, "[contact removed]");
  }

  if (URL_REGEX.test(safe)) {
    flagged = true;
    reason = reason ? "contact_info_removed" : "url_removed";
    safe = safe.replace(URL_REGEX, "[link removed]");
  }

  for (const pattern of OFFLINE_PATTERNS) {
    if (pattern.test(content)) {
      flagged = true;
      reason = "offline_attempt";
      break;
    }
  }

  return { safe, flagged, reason };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    let { recipientId, message, conversationId, tripId, tripTitle } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Resolve the responder from the package when the caller didn't supply one
    // (e.g. an authed "Ask a Question" on a platform/concierge trip — the client
    // has no responder id). Mirrors submit-trip-inquiry:
    // creator_id → agent_id→travel_agents.user_id → CONCIERGE_USER_ID.
    if (!recipientId && tripId) {
      const { data: pkg } = await supabase
        .from("packaged_trips")
        .select("creator_id, agent_id, title")
        .eq("id", tripId)
        .maybeSingle();
      if (pkg) {
        if (!tripTitle) tripTitle = pkg.title ?? undefined;
        if (pkg.creator_id) {
          recipientId = pkg.creator_id;
        } else if (pkg.agent_id) {
          const { data: agentRow } = await supabase
            .from("travel_agents")
            .select("user_id")
            .eq("id", pkg.agent_id)
            .maybeSingle();
          recipientId = agentRow?.user_id ?? null;
        }
      }
      if (!recipientId) recipientId = Deno.env.get("CONCIERGE_USER_ID") || null;
    }

    if (!recipientId) {
      return new Response(
        JSON.stringify({ error: "recipientId or a resolvable tripId is required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (recipientId === user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot message yourself" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Check if recipient has blocked sender
    const { data: recipientSettings } = await supabase
      .from("message_settings")
      .select("*")
      .eq("user_id", recipientId)
      .single();

    if (recipientSettings) {
      if (recipientSettings.who_can_message === "nobody") {
        return new Response(
          JSON.stringify({ error: "This user is not accepting messages" }),
          { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      if (recipientSettings.blocked_users?.includes(user.id)) {
        return new Response(
          JSON.stringify({ error: "You cannot message this user" }),
          { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      if (recipientSettings.who_can_message === "verified_only") {
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("is_verified")
          .eq("id", user.id)
          .single();

        if (!senderProfile?.is_verified) {
          return new Response(
            JSON.stringify({ error: "This user only accepts messages from verified users" }),
            { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Filter message content
    const { safe: filteredMessage, flagged, reason } = filterMessage(message);

    let targetConversationId = conversationId;
    let isNewConversation = false;

    // Find or create conversation
    if (!targetConversationId) {
      // Order participants consistently
      const [p1, p2] = [user.id, recipientId].sort();

      // Check for existing conversation
      const { data: existingConversation } = await supabase
        .from("dm_conversations")
        .select("*")
        .eq("participant_1", p1)
        .eq("participant_2", p2)
        .single();

      if (existingConversation) {
        if (existingConversation.status === "blocked") {
          return new Response(
            JSON.stringify({ error: "This conversation has been blocked" }),
            { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
          );
        }
        targetConversationId = existingConversation.id;
      } else {
        // Create new conversation as "request"
        const { data: newConversation, error: convError } = await supabase
          .from("dm_conversations")
          .insert({
            participant_1: p1,
            participant_2: p2,
            status: "request",
            initiated_by: user.id,
            last_message_at: new Date().toISOString(),
            last_message_preview: filteredMessage.substring(0, 100),
            // Optional trip context (e.g. from an "Ask a Question" inquiry) so
            // the conversation shows "Re: <trip>" and links back to the package.
            trip_id: tripId ?? null,
            trip_title: tripTitle ?? null,
          })
          .select()
          .single();

        if (convError) {
          console.error("Error creating conversation:", convError);
          return new Response(
            JSON.stringify({ error: "Failed to create conversation" }),
            { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
          );
        }

        targetConversationId = newConversation.id;
        isNewConversation = true;
      }
    }

    // Insert message
    const { data: newMessage, error: msgError } = await supabase
      .from("direct_messages")
      .insert({
        conversation_id: targetConversationId,
        sender_id: user.id,
        body: filteredMessage,
        filtered_content: flagged ? message : null,
        flagged_for_review: flagged,
        flagged_reason: reason || null,
      })
      .select()
      .single();

    if (msgError) {
      console.error("Error sending message:", msgError);
      return new Response(
        JSON.stringify({ error: "Failed to send message" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Update conversation with last message info
    const { data: conversation } = await supabase
      .from("dm_conversations")
      .select("*")
      .eq("id", targetConversationId)
      .single();

    if (conversation) {
      const isP1 = conversation.participant_1 === user.id;
      const unreadUpdate = isP1
        ? { unread_count_p2: (conversation.unread_count_p2 || 0) + 1 }
        : { unread_count_p1: (conversation.unread_count_p1 || 0) + 1 };

      await supabase
        .from("dm_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: filteredMessage.substring(0, 100),
          ...unreadUpdate,
        })
        .eq("id", targetConversationId);
    }

    // Create notification for recipient
    await supabase.from("notifications").insert({
      user_id: recipientId,
      type: "message_received",
      title: isNewConversation ? "New message request" : "New message",
      message: `You have a new message`,
      action_url: `/messages?conversation=${targetConversationId}`,
      entity_type: 'conversation',
      entity_id: targetConversationId,
      is_read: false,
    });

    // ── Reply-notification email (inquiry-origin travellers only) ─────────────
    // When the responder replies in an inquiry conversation, email the traveller
    // a passwordless link back into the thread — they may not be logged in and
    // would otherwise never see it. Best-effort, debounced, never fatal.
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      // The traveller started the inquiry thread (initiated_by). Only notify when
      // the *responder* is the one sending (recipient is that traveller).
      const isResponderReply =
        !!conversation &&
        user.id !== conversation.initiated_by &&
        recipientId === conversation.initiated_by;

      if (resendApiKey && isResponderReply) {
        // Recipient must be an inquiry-origin traveller (came via Ask-a-Question).
        const { data: inq } = await supabase
          .from("pending_inquiries")
          .select("email")
          .eq("user_id", recipientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Debounce: one email per ~15-min burst of responder messages. The
        // just-inserted message counts as 1; a prior one in the window → skip.
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { count: recentFromSender } = await supabase
          .from("direct_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", targetConversationId)
          .eq("sender_id", user.id)
          .gte("created_at", fifteenMinAgo);

        if (inq?.email && (recentFromSender ?? 0) <= 1) {
          const siteUrl = resolveAllowedOrigin(req);
          const redirectTo = `${siteUrl}/auth/callback?action=open&conversation=${targetConversationId}`;
          const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: inq.email,
            options: { redirectTo },
          });

          if (!linkErr && linkData) {
            let magicLinkUrl = linkData.properties.action_link;
            const rawUrl = new URL(magicLinkUrl);
            const tokenHash = rawUrl.searchParams.get("token_hash") ?? rawUrl.searchParams.get("token");
            const emailType = rawUrl.searchParams.get("type") ?? "magiclink";
            if (tokenHash) {
              magicLinkUrl = `${siteUrl}/auth/verify?token=${tokenHash}&type=${emailType}&redirect_to=${encodeURIComponent(redirectTo)}`;
            }

            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("display_name, full_name")
              .eq("id", user.id)
              .maybeSingle();
            const senderName = senderProfile?.display_name || senderProfile?.full_name || "Your specialist";
            const tripTitle = conversation?.trip_title || "your trip";
            const emailProps = {
              senderName,
              tripTitle,
              preview: filteredMessage.substring(0, 240),
              confirmationUrl: magicLinkUrl,
            };

            const html = await renderAsync(React.createElement(ReplyNotificationEmail, emailProps));
            const text = await renderAsync(React.createElement(ReplyNotificationEmail, emailProps), { plainText: true });

            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: `Goldsainte <support@${FROM_DOMAIN}>`,
                to: [inq.email],
                subject: `${senderName} replied to your question about ${tripTitle}`,
                html,
                text,
              }),
            });
            if (!resendRes.ok) {
              console.error("reply-notification email failed", { status: resendRes.status });
            } else {
              console.log("reply-notification email sent", { conversationId: targetConversationId });
            }
          }
        }
      }
    } catch (replyErr) {
      console.error("reply-notification (non-fatal):", replyErr instanceof Error ? replyErr.message : String(replyErr));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: newMessage,
        conversationId: targetConversationId,
        isNewConversation,
        contentFiltered: flagged,
      }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-direct-message:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
