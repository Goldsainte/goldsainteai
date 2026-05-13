import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Triggered by a Supabase database webhook on direct_messages INSERT
 * (or invoked manually with { messageId } / { record: <new row> }).
 * Sends an email to the recipient via Resend if they haven't been active
 * in the conversation in the last 5 minutes.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json().catch(() => ({}));
    // Accept either: { messageId } OR { record: { id, ... } } (Supabase DB webhook shape)
    const messageId: string | undefined = payload?.messageId ?? payload?.record?.id;
    if (!messageId) return json({ error: "messageId required" }, 400);

    // Load message
    const { data: msg, error: msgErr } = await supabase
      .from("direct_messages")
      .select("id, conversation_id, sender_id, body, created_at, is_deleted")
      .eq("id", messageId)
      .maybeSingle();
    if (msgErr || !msg) return json({ error: "Message not found" }, 404);
    if (msg.is_deleted) return json({ skipped: "deleted" });

    // Load conversation + participants
    const { data: conv, error: convErr } = await supabase
      .from("dm_conversations")
      .select("id, participant_1, participant_2, status, trip_title")
      .eq("id", msg.conversation_id)
      .maybeSingle();
    if (convErr || !conv) return json({ error: "Conversation not found" }, 404);
    if (conv.status === "blocked" || conv.status === "declined") return json({ skipped: "status" });

    const recipientId =
      conv.participant_1 === msg.sender_id ? conv.participant_2 : conv.participant_1;

    // Activity check: if recipient has sent any message in this convo in last 5 min, skip
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentRecipientMsgs } = await supabase
      .from("direct_messages")
      .select("id")
      .eq("conversation_id", conv.id)
      .eq("sender_id", recipientId)
      .gte("created_at", fiveMinAgo)
      .limit(1);
    if (recentRecipientMsgs && recentRecipientMsgs.length > 0) {
      return json({ skipped: "recipient_active" });
    }

    // Lookup recipient email + sender name
    const { data: recipUser } = await supabase.auth.admin.getUserById(recipientId);
    const recipientEmail = recipUser?.user?.email;
    if (!recipientEmail) return json({ skipped: "no_email" });

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name, full_name")
      .eq("id", msg.sender_id)
      .maybeSingle();
    const senderName =
      senderProfile?.display_name || senderProfile?.full_name || "Someone";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured");
      return json({ skipped: "no_resend_key" });
    }

    const preview = (msg.body || "").slice(0, 280);
    const escaped = preview
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const safeSender = senderName.replace(/[<>]/g, "");
    const link = `https://goldsainte.ai/messages?conversation=${conv.id}`;
    const tripLine = conv.trip_title
      ? `<p style="margin:0 0 16px 0;font-size:13px;color:#7A7151;">Re: ${String(conv.trip_title).replace(/[<>]/g, "")}</p>`
      : "";

    const html = `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#f7f3ea;color:#0a2225;padding:32px;">
        <h1 style="font-size:22px;margin:0 0 8px 0;">New message from ${safeSender}</h1>
        ${tripLine}
        <div style="background:#fff;border:1px solid #E5DFC6;border-radius:12px;padding:18px;margin:16px 0;font-size:14px;line-height:1.5;color:#0a2225;">
          ${escaped || "<em>(empty message)</em>"}
        </div>
        <p style="margin:24px 0;">
          <a href="${link}" style="background:#0c4d47;color:#E5DFC6;padding:12px 24px;text-decoration:none;border-radius:999px;display:inline-block;font-weight:600;">Open conversation</a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#7A7151;">© ${new Date().getFullYear()} Goldsainte</p>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Goldsainte <hello@goldsainte.ai>",
        to: [recipientEmail],
        subject: `New message from ${safeSender} on Goldsainte`,
        html,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Resend error", text);
      return json({ error: text }, 500);
    }

    return json({ success: true, sentTo: recipientEmail });
  } catch (e: any) {
    console.error("notify-new-message error", e);
    return json({ error: e?.message || "Internal error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}