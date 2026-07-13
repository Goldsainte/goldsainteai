import "../_shared/resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

/**
 * Triggered by a Supabase database webhook on direct_messages INSERT
 * (or invoked manually with { messageId } / { record: <new row> }).
 * Sends an email to the recipient via Resend if they haven't been active
 * in the conversation in the last 5 minutes.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

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
      .select("id, conversation_id, sender_id, body, created_at, is_deleted, attachments")
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
    const attachmentCount = Array.isArray((msg as any).attachments)
      ? (msg as any).attachments.length
      : 0;
    const attachmentLine = attachmentCount > 0
      ? `<p style="margin:12px 0 0 0;font-size:13px;color:#0c4d47;">&#128206; Includes ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"} &mdash; open the conversation to view.</p>`
      : "";
    const tripLine = conv.trip_title
      ? `<p style="margin:0 0 16px 0;font-size:13px;color:#7A7151;">Re: ${String(conv.trip_title).replace(/[<>]/g, "")}</p>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#f7f3ea;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a2225;">
  <div style="width:100%;background:#f7f3ea;padding:48px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#f7f3ea;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tbody><tr>
        <td align="center" style="padding:8px 0 28px;"><img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png" alt="Goldsainte" style="height:22px;width:auto;max-width:240px;display:block;margin:0 auto;"/></td>
      </tr></tbody></table>
      <hr style="border:0;border-top:1px solid rgba(10,34,37,0.15);margin:0 0 28px;"/>
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;color:#0a2225;margin:0 0 14px;text-align:center;letter-spacing:-0.01em;">New message from ${safeSender}</h1>
      ${tripLine}
      <div style="background:#ffffff;border:1px solid #E5DFC6;border-radius:12px;padding:18px;margin:16px 0 28px;font-size:14px;line-height:1.5;color:#0a2225;">
        ${escaped || "<em>(empty message)</em>"}
        ${attachmentLine}
      </div>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${link}" style="display:inline-block;background:#0c4d47;color:#f7f3ea !important;text-decoration:none;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 40px;border-radius:2px;font-weight:500;">Open conversation</a>
      </div>
      <p style="font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:36px 0 0;">If you have any questions, concerns, or require assistance, please contact <a href="mailto:support@goldsainte.com" style="color:#0c4d47;">Goldsainte Support</a>.</p>
      <p style="font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;text-align:center;text-transform:uppercase;padding:8px 0 0;">This is an automated message from Goldsainte</p>
    </div>
  </div>
</body></html>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Goldsainte <hello@goldsainte.com>",
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
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
