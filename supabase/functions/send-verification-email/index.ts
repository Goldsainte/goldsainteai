import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subjApproved: string;
  subjRejected: string;
  h1Approved: string;
  pA1: string;
  pA2: string;
  btnProfile: string;
  pA3: string;
  h1Rejected: string;
  pR1: string;
  reasonLabel: string;
  reasonFallback: string;
  pR3: string;
  btnSettings: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subjApproved: '\u2713 Your Verification is Approved!', subjRejected: 'Verification Update', h1Approved: 'Congratulations! \u{1F389}', pA1: 'Your identity verification has been approved. You now have a verified customer badge on your profile!', pA2: 'The verified badge helps build trust with travel agents and other users on the platform.', btnProfile: 'View Your Profile', pA3: 'Thank you for being a verified member of our community!', h1Rejected: 'Verification Update', pR1: 'We were unable to approve your verification request.', reasonLabel: 'Reason:', reasonFallback: 'Please contact support for details.', pR3: 'You can submit a new verification request from your settings page.', btnSettings: 'Go to Settings' },
  fr: { subjApproved: '\u2713 Votre vérification est approuvée !', subjRejected: 'Mise à jour de la vérification', h1Approved: 'Félicitations ! \u{1F389}', pA1: 'Votre vérification d\'identité a été approuvée. Un badge de client vérifié figure désormais sur votre profil !', pA2: 'Le badge vérifié renforce la confiance des agents de voyage et des autres utilisateurs de la plateforme.', btnProfile: 'Voir mon profil', pA3: 'Merci d\'être un membre vérifié de notre communauté !', h1Rejected: 'Mise à jour de la vérification', pR1: 'Nous n\'avons pas pu approuver votre demande de vérification.', reasonLabel: 'Motif :', reasonFallback: 'Veuillez contacter le support pour plus de détails.', pR3: 'Vous pouvez soumettre une nouvelle demande depuis votre page de réglages.', btnSettings: 'Aller aux réglages' },
  es: { subjApproved: '\u2713 ¡Tu verificación está aprobada!', subjRejected: 'Actualización de verificación', h1Approved: '¡Enhorabuena! \u{1F389}', pA1: '¡Tu verificación de identidad ha sido aprobada. Ahora tienes una insignia de cliente verificado en tu perfil!', pA2: 'La insignia verificada genera confianza con agentes de viaje y otros usuarios de la plataforma.', btnProfile: 'Ver mi perfil', pA3: '¡Gracias por ser un miembro verificado de nuestra comunidad!', h1Rejected: 'Actualización de verificación', pR1: 'No pudimos aprobar tu solicitud de verificación.', reasonLabel: 'Motivo:', reasonFallback: 'Contacta con soporte para más detalles.', pR3: 'Puedes enviar una nueva solicitud desde tu página de ajustes.', btnSettings: 'Ir a ajustes' },
  de: { subjApproved: '\u2713 Ihre Verifizierung ist genehmigt!', subjRejected: 'Update zur Verifizierung', h1Approved: 'Glückwunsch! \u{1F389}', pA1: 'Ihre Identitätsprüfung wurde genehmigt. Ihr Profil trägt jetzt ein Abzeichen als verifizierter Kunde!', pA2: 'Das Verifiziert-Abzeichen schafft Vertrauen bei Reiseagenten und anderen Nutzern der Plattform.', btnProfile: 'Profil ansehen', pA3: 'Danke, dass Sie ein verifiziertes Mitglied unserer Community sind!', h1Rejected: 'Update zur Verifizierung', pR1: 'Wir konnten Ihre Verifizierungsanfrage nicht genehmigen.', reasonLabel: 'Grund:', reasonFallback: 'Bitte kontaktieren Sie den Support für Details.', pR3: 'Sie können über Ihre Einstellungen eine neue Anfrage stellen.', btnSettings: 'Zu den Einstellungen' },
  it: { subjApproved: '\u2713 La tua verifica è approvata!', subjRejected: 'Aggiornamento verifica', h1Approved: 'Congratulazioni! \u{1F389}', pA1: 'La tua verifica d\'identità è stata approvata. Ora hai un badge di cliente verificato sul profilo!', pA2: 'Il badge verificato aiuta a costruire fiducia con agenti di viaggio e altri utenti della piattaforma.', btnProfile: 'Vedi il tuo profilo', pA3: 'Grazie per essere un membro verificato della nostra community!', h1Rejected: 'Aggiornamento verifica', pR1: 'Non abbiamo potuto approvare la tua richiesta di verifica.', reasonLabel: 'Motivo:', reasonFallback: 'Contatta il supporto per i dettagli.', pR3: 'Puoi inviare una nuova richiesta dalla pagina impostazioni.', btnSettings: 'Vai alle impostazioni' },
  pt: { subjApproved: '\u2713 Sua verificação foi aprovada!', subjRejected: 'Atualização da verificação', h1Approved: 'Parabéns! \u{1F389}', pA1: 'Sua verificação de identidade foi aprovada. Agora você tem um selo de cliente verificado no perfil!', pA2: 'O selo de verificado ajuda a criar confiança com agentes de viagem e outros usuários da plataforma.', btnProfile: 'Ver seu perfil', pA3: 'Obrigado por ser um membro verificado da nossa comunidade!', h1Rejected: 'Atualização da verificação', pR1: 'Não foi possível aprovar seu pedido de verificação.', reasonLabel: 'Motivo:', reasonFallback: 'Fale com o suporte para mais detalhes.', pR3: 'Você pode enviar um novo pedido pela página de configurações.', btnSettings: 'Ir para configurações' },
  ar: { subjApproved: '\u2713 تمت الموافقة على التحقق!', subjRejected: 'تحديث التحقق', h1Approved: 'تهانينا! \u{1F389}', pA1: 'تمت الموافقة على التحقق من هويتك. أصبح لديك الآن شارة عميل موثق على ملفك!', pA2: 'تساعد الشارة الموثقة في بناء الثقة مع وكلاء السفر ومستخدمي المنصة.', btnProfile: 'اعرض ملفك', pA3: 'شكراً لكونك عضواً موثقاً في مجتمعنا!', h1Rejected: 'تحديث التحقق', pR1: 'لم نتمكن من الموافقة على طلب التحقق.', reasonLabel: 'السبب:', reasonFallback: 'يرجى التواصل مع الدعم للتفاصيل.', pR3: 'يمكنك تقديم طلب تحقق جديد من صفحة الإعدادات.', btnSettings: 'اذهب إلى الإعدادات' },
  ja: { subjApproved: '\u2713 本人確認が承認されました！', subjRejected: '本人確認のお知らせ', h1Approved: 'おめでとうございます！\u{1F389}', pA1: '本人確認が承認されました。プロフィールに認証済みバッジが付きました！', pA2: '認証バッジは、旅行エージェントや他のユーザーとの信頼づくりに役立ちます。', btnProfile: 'プロフィールを見る', pA3: '認証済みメンバーでいてくださりありがとうございます！', h1Rejected: '本人確認のお知らせ', pR1: '本人確認のリクエストを承認できませんでした。', reasonLabel: '理由：', reasonFallback: '詳細はサポートへお問い合わせください。', pR3: '設定ページから新しい確認リクエストを送信できます。', btnSettings: '設定へ' },
  ko: { subjApproved: '\u2713 인증이 승인되었습니다!', subjRejected: '인증 업데이트', h1Approved: '축하합니다! \u{1F389}', pA1: '신원 인증이 승인되었습니다. 이제 프로필에 인증 고객 배지가 표시됩니다!', pA2: '인증 배지는 여행 에이전트 및 다른 사용자와의 신뢰를 쌓는 데 도움이 됩니다.', btnProfile: '프로필 보기', pA3: '커뮤니티의 인증 멤버가 되어 주셔서 감사합니다!', h1Rejected: '인증 업데이트', pR1: '인증 요청을 승인할 수 없었습니다.', reasonLabel: '사유:', reasonFallback: '자세한 내용은 지원팀에 문의하세요.', pR3: '설정 페이지에서 새 인증 요청을 제출할 수 있습니다.', btnSettings: '설정으로 이동' },
  zh: { subjApproved: '\u2713 你的验证已通过！', subjRejected: '验证进展', h1Approved: '恭喜！\u{1F389}', pA1: '你的身份验证已通过。你的资料现在拥有已验证客户徽章！', pA2: '验证徽章有助于与旅行代理及平台其他用户建立信任。', btnProfile: '查看资料', pA3: '感谢你成为社区的验证会员！', h1Rejected: '验证进展', pR1: '我们未能通过你的验证申请。', reasonLabel: '原因：', reasonFallback: '详情请联系支持团队。', pR3: '你可以在设置页面重新提交验证申请。', btnSettings: '前往设置' },
};
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-VERIFICATION-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    logStep("Function started");
    
    const { user_id, status, rejection_reason } = await req.json();
    logStep("Request body parsed", { user_id, status });

    if (!user_id || !status) {
      throw new Error("Missing required fields: user_id, status");
    }

    if (!RESEND_API_KEY) {
      logStep("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "RESEND_API_KEY not configured" }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 200
      });
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user email from Supabase Auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (userError) throw new Error(`Failed to get user: ${userError.message}`);
    if (!user?.email) throw new Error("User email not found");
    
    logStep("User email retrieved", { email: user.email });

    // Localize: profiles.preferred_language by email -> en.
    const lang = await resolveRecipientLanguage(supabaseAdmin, null, user.email);
    const s = pickLang(STRINGS, lang);

    const subject = status === 'approved' 
      ? s.subjApproved
      : s.subjRejected;
      
    const html = status === 'approved'
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">${s.h1Approved}</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            ${s.pA1}
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            ${s.pA2}
          </p>
          <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || ''}/travel-profile" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            ${s.btnProfile}
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            ${s.pA3}
          </p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">${s.h1Rejected}</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            ${s.pR1}
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>${s.reasonLabel}</strong> ${rejection_reason || s.reasonFallback}
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            ${s.pR3}
          </p>
          <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || ''}/travel-settings" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            ${s.btnSettings}
          </a>
        </div>
      `;

    // Send email using Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Goldsainte Travel <hello@goldsainte.com>",
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      logStep("ERROR sending email", { error });
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await resendResponse.json();
    logStep("Email sent successfully", { emailId: data?.id });

    return new Response(JSON.stringify({ success: true, emailId: data?.id }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-verification-email", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      status: 500
    });
  }
});
