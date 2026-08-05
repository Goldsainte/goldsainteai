import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}


import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subject: (title: string) => string;
  yourTripSubj: string;
  h1: string;
  hi: (name: string) => string;
  thereFallback: string;
  received: (titleHtml: string) => string;
  yourTripBody: string;
  approval: string;
  btnListings: string;
  questions: string;
  footer: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: (t) => `Your trip listing is under review \u2014 ${t}`, yourTripSubj: 'Your trip', h1: 'Trip submitted for review', hi: (n) => `Hi ${n},`, thereFallback: 'there', received: (t) => `We've received your listing for ${t} and it's now under review. Our team typically reviews new listings within 24\u201348 hours.`, yourTripBody: 'your trip', approval: "You'll receive another email as soon as your listing is approved and live on the marketplace.", btnListings: 'View My Listings', questions: 'Questions? Reply to this email or visit our Help Centre.', footer: '\u00A9 2026 Goldsainte. The smarter travel marketplace.' },
  fr: { subject: (t) => `Votre annonce de voyage est en cours d'examen \u2014 ${t}`, yourTripSubj: 'Votre voyage', h1: 'Voyage soumis pour examen', hi: (n) => `Bonjour ${n},`, thereFallback: '', received: (t) => `Nous avons bien reçu votre annonce pour ${t} ; elle est en cours d'examen. Notre équipe examine les nouvelles annonces sous 24 à 48 heures en général.`, yourTripBody: 'votre voyage', approval: 'Vous recevrez un autre e-mail dès que votre annonce sera approuvée et en ligne sur la place de marché.', btnListings: 'Voir mes annonces', questions: 'Des questions ? Répondez à cet e-mail ou visitez notre centre d\'aide.', footer: '\u00A9 2026 Goldsainte. La place de marché du voyage, en plus malin.' },
  es: { subject: (t) => `Tu anuncio de viaje está en revisión \u2014 ${t}`, yourTripSubj: 'Tu viaje', h1: 'Viaje enviado a revisión', hi: (n) => `Hola ${n}:`, thereFallback: '', received: (t) => `Hemos recibido tu anuncio de ${t} y ya está en revisión. Nuestro equipo suele revisar los anuncios nuevos en 24\u201348 horas.`, yourTripBody: 'tu viaje', approval: 'Recibirás otro correo en cuanto tu anuncio sea aprobado y esté publicado en el marketplace.', btnListings: 'Ver mis anuncios', questions: '¿Preguntas? Responde a este correo o visita nuestro centro de ayuda.', footer: '\u00A9 2026 Goldsainte. El marketplace de viajes más inteligente.' },
  de: { subject: (t) => `Ihr Reiseinserat wird geprüft \u2014 ${t}`, yourTripSubj: 'Ihre Reise', h1: 'Reise zur Prüfung eingereicht', hi: (n) => `Hallo ${n},`, thereFallback: '', received: (t) => `Wir haben Ihr Inserat für ${t} erhalten; es wird nun geprüft. Unser Team prüft neue Inserate in der Regel innerhalb von 24\u201348 Stunden.`, yourTripBody: 'Ihre Reise', approval: 'Sobald Ihr Inserat genehmigt und auf dem Marktplatz live ist, erhalten Sie eine weitere E-Mail.', btnListings: 'Meine Inserate ansehen', questions: 'Fragen? Antworten Sie auf diese E-Mail oder besuchen Sie unser Help Centre.', footer: '\u00A9 2026 Goldsainte. Der klügere Reisemarktplatz.' },
  it: { subject: (t) => `Il tuo annuncio di viaggio è in revisione \u2014 ${t}`, yourTripSubj: 'Il tuo viaggio', h1: 'Viaggio inviato per revisione', hi: (n) => `Ciao ${n},`, thereFallback: '', received: (t) => `Abbiamo ricevuto il tuo annuncio per ${t} ed è ora in revisione. Il nostro team esamina i nuovi annunci di norma entro 24\u201348 ore.`, yourTripBody: 'il tuo viaggio', approval: 'Riceverai un\'altra email non appena l\'annuncio sarà approvato e pubblicato sul marketplace.', btnListings: 'Vedi i miei annunci', questions: 'Domande? Rispondi a questa email o visita il nostro Help Centre.', footer: '\u00A9 2026 Goldsainte. Il marketplace di viaggio più intelligente.' },
  pt: { subject: (t) => `Seu anúncio de viagem está em análise \u2014 ${t}`, yourTripSubj: 'Sua viagem', h1: 'Viagem enviada para análise', hi: (n) => `Olá ${n},`, thereFallback: '', received: (t) => `Recebemos seu anúncio de ${t} e ele está em análise. Nossa equipe costuma revisar novos anúncios em 24\u201348 horas.`, yourTripBody: 'sua viagem', approval: 'Você receberá outro e-mail assim que o anúncio for aprovado e publicado no marketplace.', btnListings: 'Ver meus anúncios', questions: 'Dúvidas? Responda a este e-mail ou visite nossa Central de Ajuda.', footer: '\u00A9 2026 Goldsainte. O marketplace de viagens mais inteligente.' },
  ar: { subject: (t) => `إعلان رحلتك قيد المراجعة \u2014 ${t}`, yourTripSubj: 'رحلتك', h1: 'أُرسلت الرحلة للمراجعة', hi: (n) => `مرحباً ${n}،`, thereFallback: '', received: (t) => `استلمنا إعلانك عن ${t} وهو الآن قيد المراجعة. يراجع فريقنا الإعلانات الجديدة عادة خلال 24\u201348 ساعة.`, yourTripBody: 'رحلتك', approval: 'ستصلك رسالة أخرى فور اعتماد إعلانك ونشره في السوق.', btnListings: 'اعرض إعلاناتي', questions: 'أسئلة؟ رد على هذه الرسالة أو زر مركز المساعدة.', footer: '\u00A9 2026 Goldsainte. سوق السفر الأذكى.' },
  ja: { subject: (t) => `旅の掲載が審査中です \u2014 ${t}`, yourTripSubj: 'あなたの旅', h1: '旅を審査に提出しました', hi: (n) => `${n} さん、こんにちは。`, thereFallback: '', received: (t) => `${t} の掲載を受け付けました。現在審査中です。新しい掲載は通常24〜48時間以内に審査されます。`, yourTripBody: 'あなたの旅', approval: '掲載が承認されマーケットプレイスに公開され次第、メールでお知らせします。', btnListings: '自分の掲載を見る', questions: 'ご質問はこのメールへの返信、またはヘルプセンターへ。', footer: '\u00A9 2026 Goldsainte. よりスマートな旅のマーケットプレイス。' },
  ko: { subject: (t) => `여행 리스팅이 검토 중입니다 \u2014 ${t}`, yourTripSubj: '나의 여행', h1: '여행이 검토를 위해 제출되었습니다', hi: (n) => `안녕하세요 ${n}님,`, thereFallback: '', received: (t) => `${t} 리스팅이 접수되어 현재 검토 중입니다. 새 리스팅은 보통 24\u201348시간 안에 검토됩니다.`, yourTripBody: '나의 여행', approval: '리스팅이 승인되어 마켓플레이스에 게시되는 즉시 메일로 알려드립니다.', btnListings: '내 리스팅 보기', questions: '질문이 있으면 이 메일에 회신하거나 헬프 센터를 방문하세요.', footer: '\u00A9 2026 Goldsainte. 더 스마트한 여행 마켓플레이스.' },
  zh: { subject: (t) => `你的旅程发布正在审核 \u2014 ${t}`, yourTripSubj: '你的旅程', h1: '旅程已提交审核', hi: (n) => `你好，${n}：`, thereFallback: '', received: (t) => `我们已收到你为 ${t} 提交的发布，正在审核中。团队通常在 24\u201348 小时内完成新发布的审核。`, yourTripBody: '你的旅程', approval: '发布通过审核并在市场上线后，你将立即收到另一封邮件。', btnListings: '查看我的发布', questions: '有疑问？回复本邮件或访问帮助中心。', footer: '\u00A9 2026 Goldsainte. 更聪明的旅行市场。' },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    const { agentEmail, agentName, tripTitle, tripId, lang: requestLang } = await req.json();
    if (!agentEmail) {
      return new Response(JSON.stringify({ error: "agentEmail required" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let supabaseAdmin = null;
    try {
      supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
    } catch (_e) { /* fail-open */ }
    const lang = await resolveRecipientLanguage(supabaseAdmin, requestLang ?? null, agentEmail);
    const s = pickLang(STRINGS, lang);
    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f7f3ea; color: #0a2225;">
        <h1 style="font-size: 22px; color: #0a2225; margin: 0 0 16px;">${s.h1}</h1>
        <p style="font-size: 15px; line-height: 1.6;">${s.hi(agentName || s.thereFallback)}</p>
        <p style="font-size: 15px; line-height: 1.6;">${s.received(`<strong>${tripTitle || s.yourTripBody}</strong>`)}</p>
        <p style="font-size: 15px; line-height: 1.6;">${s.approval}</p>
        <p style="margin: 28px 0;">
          <a href="https://goldsainte.ai/agent-dashboard" style="display: inline-block; background: #0c4d47; color: #E5DFC6; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">${s.btnListings}</a>
        </p>
        <p style="font-size: 13px; color: #6B7280;">${s.questions}</p>
        <hr style="border: none; border-top: 1px solid #E5DFC6; margin: 32px 0;" />
        <p style="font-size: 11px; color: #9A9079;">${s.footer}</p>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte <hello@goldsainte.com>",
        to: agentEmail,
        subject: s.subject(tripTitle || s.yourTripSubj),
        html,
      }),
    });

    const result = await resp.json();
    return new Response(JSON.stringify({ ok: resp.ok, result }), {
      status: resp.ok ? 200 : 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-agent-submission-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
