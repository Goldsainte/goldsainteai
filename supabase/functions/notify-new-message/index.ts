import "../_shared/resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subject: (sender: string) => string;
  h1: (sender: string) => string;
  attachments: (count: number) => string;
  emptyMessage: string;
  btnOpen: string;
  supportPre: string;
  supportLink: string;
  supportPost: string;
  automated: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: (n) => `New message from ${n} on Goldsainte`, h1: (n) => `New message from ${n}`, attachments: (c) => `Includes ${c} attachment${c === 1 ? '' : 's'} \u2014 open the conversation to view.`, emptyMessage: '(empty message)', btnOpen: 'Open conversation', supportPre: 'If you have any questions, concerns, or require assistance, please contact ', supportLink: 'Goldsainte Support', supportPost: '.', automated: 'This is an automated message from Goldsainte' },
  fr: { subject: (n) => `Nouveau message de ${n} sur Goldsainte`, h1: (n) => `Nouveau message de ${n}`, attachments: (c) => `Contient ${c} pièce${c === 1 ? '' : 's'} jointe${c === 1 ? '' : 's'} \u2014 ouvrez la conversation pour voir.`, emptyMessage: '(message vide)', btnOpen: 'Ouvrir la conversation', supportPre: 'Pour toute question, préoccupation ou assistance, contactez ', supportLink: 'le support Goldsainte', supportPost: '.', automated: 'Ceci est un message automatique de Goldsainte' },
  es: { subject: (n) => `Nuevo mensaje de ${n} en Goldsainte`, h1: (n) => `Nuevo mensaje de ${n}`, attachments: (c) => `Incluye ${c} archivo${c === 1 ? '' : 's'} adjunto${c === 1 ? '' : 's'} \u2014 abre la conversación para verlos.`, emptyMessage: '(mensaje vacío)', btnOpen: 'Abrir conversación', supportPre: 'Si tienes preguntas, inquietudes o necesitas ayuda, contacta con ', supportLink: 'el soporte de Goldsainte', supportPost: '.', automated: 'Este es un mensaje automático de Goldsainte' },
  de: { subject: (n) => `Neue Nachricht von ${n} auf Goldsainte`, h1: (n) => `Neue Nachricht von ${n}`, attachments: (c) => `Enthält ${c} Anhang${c === 1 ? '' : '\u00E4nge'} \u2014 öffnen Sie die Konversation, um sie zu sehen.`, emptyMessage: '(leere Nachricht)', btnOpen: 'Konversation öffnen', supportPre: 'Bei Fragen, Anliegen oder für Unterstützung kontaktieren Sie ', supportLink: 'den Goldsainte-Support', supportPost: '.', automated: 'Dies ist eine automatische Nachricht von Goldsainte' },
  it: { subject: (n) => `Nuovo messaggio da ${n} su Goldsainte`, h1: (n) => `Nuovo messaggio da ${n}`, attachments: (c) => `Include ${c} allegat${c === 1 ? 'o' : 'i'} \u2014 apri la conversazione per vederli.`, emptyMessage: '(messaggio vuoto)', btnOpen: 'Apri conversazione', supportPre: 'Per domande, dubbi o assistenza, contatta ', supportLink: 'il supporto Goldsainte', supportPost: '.', automated: 'Questo è un messaggio automatico di Goldsainte' },
  pt: { subject: (n) => `Nova mensagem de ${n} na Goldsainte`, h1: (n) => `Nova mensagem de ${n}`, attachments: (c) => `Inclui ${c} anexo${c === 1 ? '' : 's'} \u2014 abra a conversa para ver.`, emptyMessage: '(mensagem vazia)', btnOpen: 'Abrir conversa', supportPre: 'Se tiver dúvidas, preocupações ou precisar de ajuda, contate ', supportLink: 'o suporte Goldsainte', supportPost: '.', automated: 'Esta é uma mensagem automática da Goldsainte' },
  ar: { subject: (n) => `رسالة جديدة من ${n} على Goldsainte`, h1: (n) => `رسالة جديدة من ${n}`, attachments: (c) => `تتضمن ${c} من المرفقات \u2014 افتح المحادثة لعرضها.`, emptyMessage: '(رسالة فارغة)', btnOpen: 'افتح المحادثة', supportPre: 'لأي أسئلة أو استفسارات أو مساعدة، تواصل مع ', supportLink: 'دعم Goldsainte', supportPost: '.', automated: 'هذه رسالة تلقائية من Goldsainte' },
  ja: { subject: (n) => `Goldsainte で ${n} さんから新着メッセージ`, h1: (n) => `${n} さんから新着メッセージ`, attachments: (c) => `添付ファイル ${c} 件あり \u2014 会話を開いてご覧ください。`, emptyMessage: '（空のメッセージ）', btnOpen: '会話を開く', supportPre: 'ご質問・ご不明点・サポートが必要な場合は、', supportLink: 'Goldsainte サポート', supportPost: ' までご連絡ください。', automated: 'これは Goldsainte からの自動送信メッセージです' },
  ko: { subject: (n) => `Goldsainte에서 ${n}님의 새 메시지`, h1: (n) => `${n}님의 새 메시지`, attachments: (c) => `첨부 파일 ${c}개 포함 \u2014 대화를 열어 확인하세요.`, emptyMessage: '(빈 메시지)', btnOpen: '대화 열기', supportPre: '질문, 우려 사항, 도움이 필요하면 ', supportLink: 'Goldsainte 지원팀', supportPost: '에 문의하세요.', automated: 'Goldsainte에서 자동 발송된 메시지입니다' },
  zh: { subject: (n) => `${n} 在 Goldsainte 给你发来新消息`, h1: (n) => `来自 ${n} 的新消息`, attachments: (c) => `包含 ${c} 个附件 \u2014 打开会话即可查看。`, emptyMessage: '（空消息）', btnOpen: '打开会话', supportPre: '如有任何疑问或需要协助，请联系', supportLink: 'Goldsainte 支持', supportPost: '。', automated: '这是来自 Goldsainte 的自动消息' },
};
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
    const lang = await resolveRecipientLanguage(supabase, null, recipientEmail ?? null);
    const s = pickLang(STRINGS, lang);
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
      ? `<p style="margin:12px 0 0 0;font-size:13px;color:#0c4d47;">&#128206; ${s.attachments(attachmentCount)}</p>`
      : "";
    // Conversation trip label removed intentionally — conversations are
    // per-pair, not per-trip, so the birth-trip title misleads.
    const tripLine = "";

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
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;color:#0a2225;margin:0 0 14px;text-align:center;letter-spacing:-0.01em;">${s.h1(safeSender)}</h1>
      ${tripLine}
      <div style="background:#ffffff;border:1px solid #E5DFC6;border-radius:12px;padding:18px;margin:16px 0 28px;font-size:14px;line-height:1.5;color:#0a2225;">
        ${escaped || `<em>${s.emptyMessage}</em>`}
        ${attachmentLine}
      </div>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${link}" style="display:inline-block;background:#0c4d47;color:#f7f3ea !important;text-decoration:none;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 40px;border-radius:2px;font-weight:500;">${s.btnOpen}</a>
      </div>
      <p style="font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:36px 0 0;">${s.supportPre}<a href="mailto:support@goldsainte.com" style="color:#0c4d47;">${s.supportLink}</a>${s.supportPost}</p>
      <p style="font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;text-align:center;text-transform:uppercase;padding:8px 0 0;">${s.automated}</p>
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
        subject: s.subject(safeSender),
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
