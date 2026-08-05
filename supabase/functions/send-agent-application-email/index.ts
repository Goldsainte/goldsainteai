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
  subject: string;
  h1: string;
  hi: (name: string) => string;
  thereFallback: string;
  thanks: string;
  approval: string;
  btnStatus: string;
  questions: string;
  footer: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: 'Your Goldsainte advisor application has been received', h1: 'Your application has been received', hi: (n) => `Hi ${n},`, thereFallback: 'there', thanks: "Thank you for applying to join the <em>Goldsainte</em> advisor network. We've received your application and our team will review it within <strong>24\u201348 hours</strong>.", approval: "You'll receive another email as soon as your account is approved, with credentials to access your dashboard.", btnStatus: 'Check Application Status', questions: 'Questions? Reply to this email or visit our Help Centre.', footer: '\u00A9 2026 Goldsainte. The Social Marketplace for Travel.' },
  fr: { subject: 'Votre candidature de conseiller Goldsainte a bien été reçue', h1: 'Votre candidature a bien été reçue', hi: (n) => `Bonjour ${n},`, thereFallback: '', thanks: "Merci d'avoir postulé au réseau de conseillers <em>Goldsainte</em>. Nous avons bien reçu votre candidature et notre équipe l'examinera sous <strong>24 à 48 heures</strong>.", approval: 'Vous recevrez un autre e-mail dès que votre compte sera approuvé, avec vos identifiants pour accéder à votre tableau de bord.', btnStatus: 'Voir le statut de ma candidature', questions: 'Des questions ? Répondez à cet e-mail ou visitez notre centre d\'aide.', footer: '\u00A9 2026 Goldsainte. La marketplace sociale du voyage.' },
  es: { subject: 'Hemos recibido tu solicitud de asesor de Goldsainte', h1: 'Hemos recibido tu solicitud', hi: (n) => `Hola ${n}:`, thereFallback: '', thanks: 'Gracias por solicitar unirte a la red de asesores de <em>Goldsainte</em>. Hemos recibido tu solicitud y nuestro equipo la revisará en <strong>24\u201348 horas</strong>.', approval: 'Recibirás otro correo en cuanto se apruebe tu cuenta, con las credenciales para acceder a tu panel.', btnStatus: 'Ver estado de la solicitud', questions: '¿Preguntas? Responde a este correo o visita nuestro centro de ayuda.', footer: '\u00A9 2026 Goldsainte. El marketplace social de los viajes.' },
  de: { subject: 'Ihre Goldsainte-Berater-Bewerbung ist eingegangen', h1: 'Ihre Bewerbung ist eingegangen', hi: (n) => `Hallo ${n},`, thereFallback: '', thanks: 'Danke für Ihre Bewerbung für das <em>Goldsainte</em>-Beraternetzwerk. Wir haben Ihre Bewerbung erhalten; unser Team prüft sie innerhalb von <strong>24\u201348 Stunden</strong>.', approval: 'Sobald Ihr Konto genehmigt ist, erhalten Sie eine weitere E-Mail mit den Zugangsdaten zu Ihrem Dashboard.', btnStatus: 'Bewerbungsstatus prüfen', questions: 'Fragen? Antworten Sie auf diese E-Mail oder besuchen Sie unser Help Centre.', footer: '\u00A9 2026 Goldsainte. Der soziale Marktplatz fürs Reisen.' },
  it: { subject: 'Abbiamo ricevuto la tua candidatura da advisor Goldsainte', h1: 'Abbiamo ricevuto la tua candidatura', hi: (n) => `Ciao ${n},`, thereFallback: '', thanks: 'Grazie per esserti candidato alla rete di advisor <em>Goldsainte</em>. Abbiamo ricevuto la tua candidatura e il nostro team la esaminerà entro <strong>24\u201348 ore</strong>.', approval: 'Riceverai un\'altra email non appena il tuo account sarà approvato, con le credenziali per accedere alla dashboard.', btnStatus: 'Controlla lo stato della candidatura', questions: 'Domande? Rispondi a questa email o visita il nostro Help Centre.', footer: '\u00A9 2026 Goldsainte. Il marketplace sociale del viaggio.' },
  pt: { subject: 'Recebemos sua candidatura de consultor Goldsainte', h1: 'Recebemos sua candidatura', hi: (n) => `Olá ${n},`, thereFallback: '', thanks: 'Obrigado por se candidatar à rede de consultores <em>Goldsainte</em>. Recebemos sua candidatura e nossa equipe a analisará em <strong>24\u201348 horas</strong>.', approval: 'Você receberá outro e-mail assim que sua conta for aprovada, com as credenciais para acessar seu painel.', btnStatus: 'Ver status da candidatura', questions: 'Dúvidas? Responda a este e-mail ou visite nossa Central de Ajuda.', footer: '\u00A9 2026 Goldsainte. O marketplace social de viagens.' },
  ar: { subject: 'استلمنا طلبك للانضمام كمستشار Goldsainte', h1: 'استلمنا طلبك', hi: (n) => `مرحباً ${n}،`, thereFallback: '', thanks: 'شكراً لتقدمك للانضمام إلى شبكة مستشاري <em>Goldsainte</em>. استلمنا طلبك وسيراجعه فريقنا خلال <strong>24\u201348 ساعة</strong>.', approval: 'ستصلك رسالة أخرى فور اعتماد حسابك، مع بيانات الدخول إلى لوحتك.', btnStatus: 'تحقق من حالة الطلب', questions: 'أسئلة؟ رد على هذه الرسالة أو زر مركز المساعدة.', footer: '\u00A9 2026 Goldsainte. سوق السفر الاجتماعي.' },
  ja: { subject: 'Goldsainte アドバイザー応募を受け付けました', h1: '応募を受け付けました', hi: (n) => `${n} さん、こんにちは。`, thereFallback: '', thanks: '<em>Goldsainte</em> アドバイザーネットワークへのご応募ありがとうございます。応募を受け付けました。チームが <strong>24〜48時間</strong>以内に審査します。', approval: 'アカウントが承認され次第、ダッシュボードへのアクセス情報を記載したメールをお送りします。', btnStatus: '応募状況を確認', questions: 'ご質問はこのメールへの返信、またはヘルプセンターへ。', footer: '\u00A9 2026 Goldsainte. 旅のソーシャルマーケットプレイス。' },
  ko: { subject: 'Goldsainte 어드바이저 지원서가 접수되었습니다', h1: '지원서가 접수되었습니다', hi: (n) => `안녕하세요 ${n}님,`, thereFallback: '', thanks: '<em>Goldsainte</em> 어드바이저 네트워크에 지원해 주셔서 감사합니다. 지원서가 접수되었으며 팀이 <strong>24\u201348시간</strong> 안에 검토합니다.', approval: '계정이 승인되는 즉시 대시보드 접속 정보를 담은 메일을 보내드립니다.', btnStatus: '지원 상태 확인', questions: '질문이 있으면 이 메일에 회신하거나 헬프 센터를 방문하세요.', footer: '\u00A9 2026 Goldsainte. 여행을 위한 소셜 마켓플레이스.' },
  zh: { subject: '你的 Goldsainte 顾问申请已收到', h1: '你的申请已收到', hi: (n) => `你好，${n}：`, thereFallback: '', thanks: '感谢你申请加入 <em>Goldsainte</em> 顾问网络。我们已收到你的申请，团队将在 <strong>24\u201348 小时</strong>内完成审核。', approval: '账户获批后你将立即收到另一封邮件，内含访问工作台的凭据。', btnStatus: '查看申请状态', questions: '有疑问？回复本邮件或访问帮助中心。', footer: '\u00A9 2026 Goldsainte. 旅行的社交市场。' },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    const { agentEmail, agentName, lang: requestLang } = await req.json();
    if (!agentEmail) {
      return new Response(JSON.stringify({ error: "agentEmail required" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured; skipping send.");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
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
        <h1 style="font-size: 22px; margin: 0 0 16px;">${s.h1}</h1>
        <p style="font-size: 15px; line-height: 1.6;">${s.hi(agentName || s.thereFallback)}</p>
        <p style="font-size: 15px; line-height: 1.6;">${s.thanks}</p>
        <p style="font-size: 15px; line-height: 1.6;">${s.approval}</p>
        <p style="margin: 28px 0;">
          <a href="https://goldsainte.ai/application/status" style="display: inline-block; background: #0c4d47; color: #E5DFC6; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">${s.btnStatus}</a>
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
        subject: s.subject,
        html,
      }),
    });

    const result = await resp.json();
    return new Response(JSON.stringify({ ok: resp.ok, result }), {
      status: resp.ok ? 200 : 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
