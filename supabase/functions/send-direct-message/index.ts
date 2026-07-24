// send-direct-message
// v2.0 - booking-scoped threads: bookingId param, server-derived recipient+label, participant guard on supplied conversationId (2026-07-18)
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

// Goldsainte's own links (contract signing, bookings, etc.) are never
// sanitized — they're tokenized out first and restored at the end. Without
// this, PHONE_REGEX eats the digit runs inside contract UUIDs and URL_REGEX
// strips the rest, leaving mangled "[link removed]" fragments in messages.
const PLATFORM_URL_REGEX = /https?:\/\/(?:www\.)?goldsainte\.(?:ai|com)(?:\/[^\s]*)?/gi;

function filterMessage(content: string): { safe: string; flagged: boolean; reason?: string } {
  const preserved: string[] = [];
  let safe = content.replace(PLATFORM_URL_REGEX, (m) => {
    preserved.push(m);
    return `[[GS_LINK_${preserved.length - 1}]]`;
  });
  let flagged = false;
  let reason = "";

  // NOTE: compare-after-replace instead of .test() — global regexes are
  // stateful (lastIndex persists across calls in a warm isolate), so .test()
  // intermittently skips matches.
  const afterPhone = safe.replace(PHONE_REGEX, "[contact removed]");
  if (afterPhone !== safe) {
    flagged = true;
    reason = "phone_removed";
    safe = afterPhone;
  }

  const afterEmail = safe.replace(EMAIL_REGEX, "[contact removed]");
  if (afterEmail !== safe) {
    flagged = true;
    reason = reason ? "contact_info_removed" : "email_removed";
    safe = afterEmail;
  }

  const afterUrl = safe.replace(URL_REGEX, "[link removed]");
  if (afterUrl !== safe) {
    flagged = true;
    reason = reason ? "contact_info_removed" : "url_removed";
    safe = afterUrl;
  }

  for (const pattern of OFFLINE_PATTERNS) {
    if (content.match(pattern)) {
      flagged = true;
      reason = "offline_attempt";
      break;
    }
  }

  safe = safe.replace(/\[\[GS_LINK_(\d+)\]\]/g, (_m, i) => preserved[Number(i)] ?? "");

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

    let { recipientId, message, conversationId, tripId, tripTitle, attachments, bookingId } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // BOOKING-SCOPED THREAD (v2.0): when the client passes a bookingId, the
    // conversation is scoped to that booking. Membership is verified against
    // the live booking row and the recipient + thread label are derived
    // SERVER-SIDE (any client-supplied recipientId is ignored), so nobody can
    // stamp a thread onto a booking they're not a party to.
    let bookingLabel: string | null = null;
    if (bookingId) {
      const { data: bookingRow } = await supabase
        .from("trip_bookings")
        .select("id, traveler_id, partner_id, metadata")
        .eq("id", bookingId)
        .maybeSingle();
      if (!bookingRow) {
        return new Response(
          JSON.stringify({ error: "Booking not found" }),
          { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (bookingRow.traveler_id !== user.id && bookingRow.partner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "You are not a party to this booking" }),
          { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      const otherParty = bookingRow.traveler_id === user.id ? bookingRow.partner_id : bookingRow.traveler_id;
      if (!otherParty) {
        return new Response(
          JSON.stringify({ error: "This booking has no assigned partner yet" }),
          { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      recipientId = otherParty;
      const meta = (bookingRow.metadata ?? {}) as Record<string, unknown>;
      const ref =
        (typeof meta.booking_reference === "string" && meta.booking_reference) ||
        "GS-" + String(bookingRow.id).slice(0, 8).toUpperCase();
      bookingLabel =
        typeof meta.destination === "string" && meta.destination
          ? meta.destination + " \u00b7 " + ref
          : ref;
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
      // E10: the package may reference a creator/agent id that no longer exists —
      // verify the resolved responder is a real user, else drop to the concierge
      // fallback below so the message still reaches a human.
      const conciergeId = Deno.env.get("CONCIERGE_USER_ID") || null;
      if (recipientId && recipientId !== conciergeId) {
        const { data: rp } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", recipientId)
          .maybeSingle();
        if (!rp) {
          console.warn("package responder not found in profiles — using concierge", { recipientId });
          recipientId = null;
        }
      }
      if (!recipientId) recipientId = conciergeId;
    }

    // CONVERSATION-SCOPED SEND: the proposal composer and thread replies pass
    // only a conversationId. Resolve the counterpart server-side with the same
    // membership guard the threading code enforces further down. This resolver
    // was lost in the v2.0 booking-thread rewrite — the recipient check below
    // ran before conversationId was ever consulted, so every proposal send
    // died with "recipientId or a resolvable tripId is required" while plain
    // replies (client-inserted) kept working.
    if (!recipientId && conversationId) {
      const { data: convo } = await supabase
        .from("dm_conversations")
        .select("id, participant_1, participant_2")
        .eq("id", conversationId)
        .maybeSingle();
      if (!convo) {
        return new Response(
          JSON.stringify({ error: "Conversation not found" }),
          { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (convo.participant_1 !== user.id && convo.participant_2 !== user.id) {
        return new Response(
          JSON.stringify({ error: "Not a participant in this conversation" }),
          { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      recipientId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;
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

    // Anti-disintermediation filtering applies only BEFORE the parties have a
    // paid booking together. Once money is in escrow they are committed to the
    // platform — and the agent legitimately needs to share hotel phone numbers,
    // confirmation numbers, and reservation links with their traveler.
    let hasActiveBooking = false;
    try {
      const { data: existingBooking } = await supabase
        .from("trip_bookings")
        .select("id")
        .in("status", ["confirmed", "paid_in_full", "completed"])
        .or(
          `and(traveler_id.eq.${user.id},partner_id.eq.${recipientId}),and(traveler_id.eq.${recipientId},partner_id.eq.${user.id})`,
        )
        .limit(1)
        .maybeSingle();
      hasActiveBooking = !!existingBooking;
    } catch (bookingCheckErr) {
      // If the check itself fails, stay strict: filtering applies.
      console.error("Booking check failed — filtering applies:", bookingCheckErr);
    }

    // Filter message content (skipped between parties with an active booking)
    const { safe: filteredMessage, flagged, reason } = hasActiveBooking
      ? { safe: message, flagged: false, reason: undefined as string | undefined }
      : filterMessage(message);

    // Attachments: reservation documents etc. Only allowed once the parties
    // have a paid booking together (same rule as unfiltered text -- before
    // that, files could carry the contact info the filter exists to catch).
    let safeAttachments: { path: string; name: string; type: string; size: number }[] | null = null;
    if (Array.isArray(attachments) && attachments.length > 0) {
      if (!hasActiveBooking) {
        return new Response(
          JSON.stringify({ error: "Attachments are available once a booking exists between you and this contact." }),
          { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
        );
      }
      if (attachments.length > 5) {
        return new Response(
          JSON.stringify({ error: "You can attach up to 5 files per message." }),
          { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
        );
      }
      safeAttachments = [];
      for (const a of attachments) {
        const path = typeof a?.path === "string" ? a.path : "";
        // Senders may only reference files they uploaded to their own folder.
        if (!path.startsWith(user.id + "/") || path.includes("..")) {
          return new Response(
            JSON.stringify({ error: "Invalid attachment reference." }),
            { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
          );
        }
        safeAttachments.push({
          path,
          name: typeof a?.name === "string" ? a.name.slice(0, 200) : "Attachment",
          type: typeof a?.type === "string" ? a.type.slice(0, 100) : "application/octet-stream",
          size: Number.isFinite(a?.size) ? Number(a.size) : 0,
        });
      }
    }

    let targetConversationId = conversationId;
    let isNewConversation = false;

    // v2.0 guard: when the client supplies a conversationId directly, verify
    // the sender is actually a participant (inserts run with the service role
    // and bypass RLS, so without this check any authed user could inject a
    // message into any thread by guessing its uuid).
    if (targetConversationId) {
      const { data: convoCheck } = await supabase
        .from("dm_conversations")
        .select("id, participant_1, participant_2, status")
        .eq("id", targetConversationId)
        .maybeSingle();
      if (!convoCheck || (convoCheck.participant_1 !== user.id && convoCheck.participant_2 !== user.id)) {
        return new Response(
          JSON.stringify({ error: "Not a participant in this conversation" }),
          { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (convoCheck.status === "blocked") {
        return new Response(
          JSON.stringify({ error: "This conversation has been blocked" }),
          { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // Find or create conversation — scoped by booking when bookingId is given.
    // Each booking owns its own thread; general DMs live where booking_id is null.
    if (!targetConversationId) {
      // Order participants consistently
      const [p1, p2] = [user.id, recipientId].sort();

      // Check for existing conversation in the SAME scope
      let convoQuery = supabase
        .from("dm_conversations")
        .select("*")
        .eq("participant_1", p1)
        .eq("participant_2", p2);
      convoQuery = bookingId
        ? convoQuery.eq("booking_id", bookingId)
        : convoQuery.is("booking_id", null);
      const { data: existingConversation } = await convoQuery.maybeSingle();

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
            // Booking threads start "active": the parties are already in a
            // contracted relationship — no accept-gate. General DMs keep the
            // request flow.
            status: bookingId ? "active" : "request",
            initiated_by: user.id,
            last_message_at: new Date().toISOString(),
            last_message_preview: filteredMessage.substring(0, 100),
            // Optional trip context (e.g. from an "Ask a Question" inquiry) so
            // the conversation shows "Re: <trip>" and links back to the package.
            trip_id: tripId ?? null,
            // Booking label ("Tulum · GS-1D4E07FE") wins over package title so
            // the inbox can tell sibling threads apart.
            trip_title: bookingLabel ?? tripTitle ?? null,
            booking_id: bookingId ?? null,
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
        attachments: safeAttachments,
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
