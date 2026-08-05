import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

interface PasswordResetRequest {
  email: string;
  token_hash: string;
  redirect_to?: string;
  lang?: EmailLang;
}

interface S {
  subject: string;
  h1: string;
  p1: string;
  p2: string;
  btn: string;
  copyLink: string;
  secTitle: string;
  notReqTitle: string;
  notReqBody: string;
  keepTitle: string;
  keepBody: string;
  expiresTitle: string;
  expiresBody: string;
  needHelp: string;
  helpBody: string;
  questions: string;
  contact1: string;
  contact2: string;
  footThanks: string;
  footAssist: string;
  footNoReply: string;
  footRights: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: 'Reset Your Goldsainte Password', h1: '\u{1F510} Password Reset Request', p1: 'We received a request to reset your Goldsainte account password.', p2: 'To reset your password, click the button below. This link will expire in 1 hour for security purposes.', btn: 'Reset Your Password', copyLink: 'Or copy and paste this link into your browser:', secTitle: '\u{1F6E1}\uFE0F Security Notice', notReqTitle: 'Did not request this?', notReqBody: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.", keepTitle: 'Keep your account secure:', keepBody: 'Never share your password with anyone. Goldsainte will never ask you for your password via email or phone.', expiresTitle: 'Link expires:', expiresBody: "This password reset link will expire in 1 hour. After that, you'll need to request a new one.", needHelp: 'Need Help?', helpBody: "If you're having trouble resetting your password or have security concerns, please contact our 24/7 Concierge Support Team. We're here to help keep your account secure.", questions: 'Questions or concerns?', contact1: 'Contact Goldsainte Concierge Support', contact2: 'Available 24/7', footThanks: 'Thank you for choosing Goldsainte', footAssist: 'Need assistance? Contact our 24/7 Concierge Support Team', footNoReply: 'This is an automated security email. Please do not reply to this message.', footRights: '\u00A9 2025 Goldsainte. All rights reserved.' },
  fr: { subject: 'Réinitialisez votre mot de passe Goldsainte', h1: '\u{1F510} Demande de réinitialisation du mot de passe', p1: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Goldsainte.', p2: 'Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous. Ce lien expirera dans 1 heure pour des raisons de sécurité.', btn: 'Réinitialiser mon mot de passe', copyLink: 'Ou copiez-collez ce lien dans votre navigateur :', secTitle: '\u{1F6E1}\uFE0F Avis de sécurité', notReqTitle: "Vous n'êtes pas à l'origine de cette demande ?", notReqBody: "Si vous n'avez pas demandé de réinitialisation, ignorez simplement cet e-mail. Votre mot de passe restera inchangé.", keepTitle: 'Protégez votre compte :', keepBody: 'Ne partagez jamais votre mot de passe. Goldsainte ne vous le demandera jamais par e-mail ou téléphone.', expiresTitle: 'Expiration du lien :', expiresBody: 'Ce lien de réinitialisation expirera dans 1 heure. Passé ce délai, vous devrez en demander un nouveau.', needHelp: "Besoin d'aide ?", helpBody: 'Si vous rencontrez des difficultés ou avez des inquiétudes de sécurité, contactez notre équipe Concierge disponible 24h/24 et 7j/7. Nous sommes là pour protéger votre compte.', questions: 'Questions ou préoccupations ?', contact1: 'Contactez le support Concierge Goldsainte', contact2: 'Disponible 24h/24, 7j/7', footThanks: "Merci d'avoir choisi Goldsainte", footAssist: "Besoin d'aide ? Contactez notre équipe Concierge 24h/24 et 7j/7", footNoReply: 'Ceci est un e-mail de sécurité automatique. Merci de ne pas y répondre.', footRights: '\u00A9 2025 Goldsainte. Tous droits réservés.' },
  es: { subject: 'Restablece tu contraseña de Goldsainte', h1: '\u{1F510} Solicitud de restablecimiento de contraseña', p1: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta de Goldsainte.', p2: 'Para restablecer tu contraseña, haz clic en el botón de abajo. Este enlace caducará en 1 hora por seguridad.', btn: 'Restablecer contraseña', copyLink: 'O copia y pega este enlace en tu navegador:', secTitle: '\u{1F6E1}\uFE0F Aviso de seguridad', notReqTitle: '¿No solicitaste esto?', notReqBody: 'Si no pediste restablecer la contraseña, puedes ignorar este correo. Tu contraseña seguirá igual.', keepTitle: 'Mantén tu cuenta segura:', keepBody: 'Nunca compartas tu contraseña. Goldsainte nunca te la pedirá por correo o teléfono.', expiresTitle: 'Caducidad del enlace:', expiresBody: 'Este enlace caducará en 1 hora. Después tendrás que solicitar uno nuevo.', needHelp: '¿Necesitas ayuda?', helpBody: 'Si tienes problemas para restablecer tu contraseña o dudas de seguridad, contacta con nuestro equipo de conserjería 24/7. Estamos aquí para proteger tu cuenta.', questions: '¿Preguntas o dudas?', contact1: 'Contacta con el soporte Concierge de Goldsainte', contact2: 'Disponible 24/7', footThanks: 'Gracias por elegir Goldsainte', footAssist: '¿Necesitas ayuda? Contacta con nuestro equipo de conserjería 24/7', footNoReply: 'Este es un correo de seguridad automático. Por favor, no respondas a este mensaje.', footRights: '\u00A9 2025 Goldsainte. Todos los derechos reservados.' },
  de: { subject: 'Setzen Sie Ihr Goldsainte-Passwort zurück', h1: '\u{1F510} Anfrage zum Zurücksetzen des Passworts', p1: 'Wir haben eine Anfrage zum Zurücksetzen des Passworts Ihres Goldsainte-Kontos erhalten.', p2: 'Klicken Sie zum Zurücksetzen auf die Schaltfläche unten. Aus Sicherheitsgründen läuft dieser Link in 1 Stunde ab.', btn: 'Passwort zurücksetzen', copyLink: 'Oder kopieren Sie diesen Link in Ihren Browser:', secTitle: '\u{1F6E1}\uFE0F Sicherheitshinweis', notReqTitle: 'Nicht angefordert?', notReqBody: 'Wenn Sie kein Zurücksetzen angefordert haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.', keepTitle: 'Schützen Sie Ihr Konto:', keepBody: 'Teilen Sie Ihr Passwort mit niemandem. Goldsainte fragt Sie nie per E-Mail oder Telefon nach Ihrem Passwort.', expiresTitle: 'Link läuft ab:', expiresBody: 'Dieser Link läuft in 1 Stunde ab. Danach müssen Sie einen neuen anfordern.', needHelp: 'Brauchen Sie Hilfe?', helpBody: 'Bei Problemen mit dem Zurücksetzen oder Sicherheitsbedenken kontaktieren Sie unser Concierge-Team, rund um die Uhr erreichbar. Wir schützen Ihr Konto.', questions: 'Fragen oder Bedenken?', contact1: 'Kontaktieren Sie den Goldsainte Concierge-Support', contact2: 'Rund um die Uhr verfügbar', footThanks: 'Danke, dass Sie sich für Goldsainte entschieden haben', footAssist: 'Hilfe nötig? Kontaktieren Sie unser Concierge-Team, rund um die Uhr', footNoReply: 'Dies ist eine automatische Sicherheits-E-Mail. Bitte antworten Sie nicht darauf.', footRights: '\u00A9 2025 Goldsainte. Alle Rechte vorbehalten.' },
  it: { subject: 'Reimposta la tua password Goldsainte', h1: '\u{1F510} Richiesta di reimpostazione password', p1: 'Abbiamo ricevuto una richiesta di reimpostazione della password del tuo account Goldsainte.', p2: 'Per reimpostarla, clicca il pulsante qui sotto. Per sicurezza il link scadrà tra 1 ora.', btn: 'Reimposta password', copyLink: 'Oppure copia e incolla questo link nel browser:', secTitle: '\u{1F6E1}\uFE0F Avviso di sicurezza', notReqTitle: 'Non hai richiesto tu?', notReqBody: 'Se non hai richiesto la reimpostazione, ignora questa email. La tua password resterà invariata.', keepTitle: 'Proteggi il tuo account:', keepBody: 'Non condividere mai la password. Goldsainte non te la chiederà mai via email o telefono.', expiresTitle: 'Scadenza link:', expiresBody: 'Questo link scadrà tra 1 ora. Dopo dovrai richiederne uno nuovo.', needHelp: 'Serve aiuto?', helpBody: 'Se hai problemi a reimpostare la password o dubbi sulla sicurezza, contatta il nostro team concierge attivo 24/7. Siamo qui per proteggere il tuo account.', questions: 'Domande o dubbi?', contact1: 'Contatta il supporto Concierge Goldsainte', contact2: 'Disponibile 24/7', footThanks: 'Grazie per aver scelto Goldsainte', footAssist: 'Serve assistenza? Contatta il nostro team concierge 24/7', footNoReply: 'Questa è un\'email di sicurezza automatica. Non rispondere a questo messaggio.', footRights: '\u00A9 2025 Goldsainte. Tutti i diritti riservati.' },
  pt: { subject: 'Redefina sua senha Goldsainte', h1: '\u{1F510} Pedido de redefinição de senha', p1: 'Recebemos um pedido para redefinir a senha da sua conta Goldsainte.', p2: 'Para redefinir sua senha, clique no botão abaixo. Por segurança, este link expira em 1 hora.', btn: 'Redefinir senha', copyLink: 'Ou copie e cole este link no navegador:', secTitle: '\u{1F6E1}\uFE0F Aviso de segurança', notReqTitle: 'Não foi você?', notReqBody: 'Se você não pediu a redefinição, ignore este e-mail. Sua senha permanecerá a mesma.', keepTitle: 'Mantenha sua conta segura:', keepBody: 'Nunca compartilhe sua senha. A Goldsainte nunca pedirá sua senha por e-mail ou telefone.', expiresTitle: 'Expiração do link:', expiresBody: 'Este link expira em 1 hora. Depois disso, será preciso pedir um novo.', needHelp: 'Precisa de ajuda?', helpBody: 'Se tiver dificuldades para redefinir a senha ou preocupações de segurança, fale com nossa equipe de concierge 24/7. Estamos aqui para proteger sua conta.', questions: 'Dúvidas ou preocupações?', contact1: 'Fale com o suporte Concierge da Goldsainte', contact2: 'Disponível 24/7', footThanks: 'Obrigado por escolher a Goldsainte', footAssist: 'Precisa de ajuda? Fale com nossa equipe de concierge 24/7', footNoReply: 'Este é um e-mail de segurança automático. Não responda a esta mensagem.', footRights: '\u00A9 2025 Goldsainte. Todos os direitos reservados.' },
  ar: { subject: 'أعد تعيين كلمة مرور Goldsainte', h1: '\u{1F510} طلب إعادة تعيين كلمة المرور', p1: 'استلمنا طلباً لإعادة تعيين كلمة مرور حسابك في Goldsainte.', p2: 'لإعادة التعيين انقر الزر أدناه. تنتهي صلاحية الرابط خلال ساعة واحدة لأسباب أمنية.', btn: 'أعد تعيين كلمة المرور', copyLink: 'أو انسخ هذا الرابط والصقه في متصفحك:', secTitle: '\u{1F6E1}\uFE0F تنبيه أمني', notReqTitle: 'لم تطلب ذلك؟', notReqBody: 'إذا لم تطلب إعادة التعيين فتجاهل هذه الرسالة بأمان. ستبقى كلمة مرورك كما هي.', keepTitle: 'حافظ على أمان حسابك:', keepBody: 'لا تشارك كلمة مرورك مع أحد. لن تطلبها Goldsainte أبداً عبر البريد أو الهاتف.', expiresTitle: 'انتهاء صلاحية الرابط:', expiresBody: 'تنتهي صلاحية هذا الرابط خلال ساعة. بعدها ستحتاج إلى طلب رابط جديد.', needHelp: 'تحتاج مساعدة؟', helpBody: 'إذا واجهت صعوبة في إعادة التعيين أو لديك مخاوف أمنية، تواصل مع فريق الكونسيرج المتاح على مدار الساعة. نحن هنا لحماية حسابك.', questions: 'أسئلة أو استفسارات؟', contact1: 'تواصل مع دعم كونسيرج Goldsainte', contact2: 'متاح على مدار الساعة', footThanks: 'شكراً لاختيارك Goldsainte', footAssist: 'تحتاج مساعدة؟ تواصل مع فريق الكونسيرج المتاح على مدار الساعة', footNoReply: 'هذه رسالة أمنية تلقائية. يرجى عدم الرد عليها.', footRights: '\u00A9 2025 Goldsainte. جميع الحقوق محفوظة.' },
  ja: { subject: 'Goldsainte パスワードをリセット', h1: '\u{1F510} パスワードリセットのリクエスト', p1: 'Goldsainte アカウントのパスワードリセットのリクエストを受け付けました。', p2: '下のボタンからリセットしてください。セキュリティのため、リンクは1時間で失効します。', btn: 'パスワードをリセット', copyLink: 'またはこのリンクをブラウザに貼り付けてください：', secTitle: '\u{1F6E1}\uFE0F セキュリティ通知', notReqTitle: '心当たりがない場合', notReqBody: 'リセットをリクエストしていない場合は、このメールを無視して構いません。パスワードは変更されません。', keepTitle: 'アカウントを安全に：', keepBody: 'パスワードは誰とも共有しないでください。Goldsainte がメールや電話でパスワードを尋ねることはありません。', expiresTitle: 'リンクの有効期限：', expiresBody: 'このリセットリンクは1時間で失効します。その後は新しいリンクのリクエストが必要です。', needHelp: 'お困りですか？', helpBody: 'リセットがうまくいかない、またはセキュリティに不安がある場合は、24時間365日対応のコンシェルジュサポートチームへ。アカウントの安全をお守りします。', questions: 'ご質問・ご不安は？', contact1: 'Goldsainte コンシェルジュサポートへ連絡', contact2: '24時間365日対応', footThanks: 'Goldsainte をお選びいただきありがとうございます', footAssist: 'サポートが必要ですか？24時間365日対応のコンシェルジュチームへ', footNoReply: 'これは自動送信のセキュリティメールです。返信はご遠慮ください。', footRights: '\u00A9 2025 Goldsainte. All rights reserved.' },
  ko: { subject: 'Goldsainte 비밀번호 재설정', h1: '\u{1F510} 비밀번호 재설정 요청', p1: 'Goldsainte 계정 비밀번호 재설정 요청을 받았습니다.', p2: '아래 버튼을 눌러 재설정하세요. 보안을 위해 이 링크는 1시간 후 만료됩니다.', btn: '비밀번호 재설정', copyLink: '또는 이 링크를 브라우저에 붙여넣으세요:', secTitle: '\u{1F6E1}\uFE0F 보안 안내', notReqTitle: '요청하지 않으셨나요?', notReqBody: '재설정을 요청하지 않았다면 이 메일을 무시하셔도 됩니다. 비밀번호는 그대로 유지됩니다.', keepTitle: '계정을 안전하게:', keepBody: '비밀번호를 누구와도 공유하지 마세요. Goldsainte는 이메일이나 전화로 비밀번호를 묻지 않습니다.', expiresTitle: '링크 만료:', expiresBody: '이 재설정 링크는 1시간 후 만료됩니다. 이후에는 새 링크를 요청해야 합니다.', needHelp: '도움이 필요하신가요?', helpBody: '재설정에 문제가 있거나 보안이 걱정된다면 연중무휴 컨시어지 지원팀에 연락하세요. 계정 안전을 지켜드립니다.', questions: '질문이나 우려가 있으신가요?', contact1: 'Goldsainte 컨시어지 지원팀에 문의', contact2: '연중무휴 이용 가능', footThanks: 'Goldsainte를 선택해 주셔서 감사합니다', footAssist: '도움이 필요하신가요? 연중무휴 컨시어지 팀에 문의하세요', footNoReply: '자동 발송된 보안 메일입니다. 회신하지 마세요.', footRights: '\u00A9 2025 Goldsainte. All rights reserved.' },
  zh: { subject: '重置你的 Goldsainte 密码', h1: '\u{1F510} 密码重置请求', p1: '我们收到了重置你 Goldsainte 账户密码的请求。', p2: '点击下方按钮重置密码。出于安全考虑，链接将在 1 小时后失效。', btn: '重置密码', copyLink: '或将此链接复制粘贴到浏览器：', secTitle: '\u{1F6E1}\uFE0F 安全提示', notReqTitle: '不是你发起的？', notReqBody: '如果你没有请求重置密码，可放心忽略此邮件。你的密码将保持不变。', keepTitle: '保护账户安全：', keepBody: '切勿与任何人分享密码。Goldsainte 绝不会通过邮件或电话向你索要密码。', expiresTitle: '链接有效期：', expiresBody: '此重置链接将在 1 小时后失效。之后需要重新申请。', needHelp: '需要帮助？', helpBody: '如果重置遇到困难或有安全顾虑，请联系我们全天候的礼宾支持团队。我们守护你的账户安全。', questions: '有疑问或顾虑？', contact1: '联系 Goldsainte 礼宾支持', contact2: '全天候服务', footThanks: '感谢你选择 Goldsainte', footAssist: '需要协助？联系我们全天候的礼宾支持团队', footNoReply: '这是一封自动发送的安全邮件，请勿回复。', footRights: '\u00A9 2025 Goldsainte. 保留所有权利。' },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { email, token_hash, redirect_to, lang: requestLang }: PasswordResetRequest = await req.json();

    console.log('Sending password reset email to:', email);

    // Localize: explicit request lang -> profiles.preferred_language -> en.
    let supabaseAdmin = null;
    try {
      supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
    } catch (_e) { /* fail-open */ }
    const lang = await resolveRecipientLanguage(supabaseAdmin, requestLang, email);
    const s = pickLang(STRINGS, lang);

    const defaultRedirect = redirect_to || 'https://goldsainte.ai/reset-password';
    const resetLink = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${encodeURIComponent(defaultRedirect)}`;

    const emailSubject = s.subject;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Gupter:wght@400;500;700&display=swap');
            @font-face {
              font-family: 'Chiffon';
              src: url('https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/Chiffon.otf') format('opentype');
            }
            body {
              font-family: 'Gupter', BlinkMacSystemFont, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #E5DFC6;
            }
            .container {
              max-width: 640px;
              margin: 0 auto;
              background: #ffffff;
            }
            .header {
              background: transparent;
              padding: 24px;
              text-align: center;
            }
            .logo {
              max-width: 280px;
              height: auto;
            }
            .hero-image {
              width: 100%;
              height: 200px;
              object-fit: cover;
              object-position: center center;
              display: block;
            }
            .content {
              padding: 0 8px;
            }
            h1 {
              font-family: 'Chiffon', serif;
              font-size: 32px;
              line-height: 40px;
              font-weight: normal;
              color: #0c4d47;
              margin: 32px 0 16px 0;
              padding: 0 8px;
            }
            h2 {
              font-family: 'Chiffon', serif;
              font-size: 22px;
              line-height: 28px;
              font-weight: normal;
              color: #0c4d47;
              margin: 16px 0;
              padding: 0 8px;
            }
            p {
              font-size: 16px;
              line-height: 24px;
              color: #333333;
              margin: 16px 0;
              padding: 0 8px;
            }
            .button {
              display: inline-block;
              margin: 32px 0;
              padding: 16px 32px;
              background: #0c4d47;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 4px;
              font-size: 16px;
              font-weight: 600;
              text-align: center;
            }
            .button:hover {
              background: #0a3d38;
            }
            .info-box {
              border: 1px solid #e7e7e7;
              border-radius: 4px;
              padding: 16px;
              margin: 16px 8px;
              background: #f9f8f5;
            }
            .security-notice {
              border: 1px solid #FFE08A;
              background: #FEFBF0;
              border-radius: 4px;
              padding: 16px;
              margin: 24px 8px;
            }
            .security-notice-title {
              font-size: 16px;
              font-weight: 600;
              color: #333333;
              margin-bottom: 8px;
            }
            .security-notice-text {
              font-size: 14px;
              line-height: 20px;
              color: #333333;
            }
            .footer {
              background: #BFAD72;
              text-align: center;
              padding: 24px;
              color: #0A2225;
              font-size: 12px;
              margin-top: 32px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/logo-horizontal-green.png" alt="GoldSainte" class="logo" />
            </div>
            
            <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/email-hero-password-reset.jpg" alt="Password Reset" class="hero-image" />
            
            <div class="content">
              <h1>${s.h1}</h1>
              
              <p>${s.p1}</p>
              
              <p>${s.p2}</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">${s.btn}</a>
              </div>
              
              <div class="info-box">
                <p style="margin: 0; font-size: 14px; color: #595959;">
                  ${s.copyLink}<br>
                  <a href="${resetLink}" style="color: #0c4d47; word-break: break-all;">${resetLink}</a>
                </p>
              </div>
              
              <div class="security-notice">
                <div class="security-notice-title">${s.secTitle}</div>
                <div class="security-notice-text">
                  <strong>${s.notReqTitle}</strong> ${s.notReqBody}<br><br>
                  <strong>${s.keepTitle}</strong> ${s.keepBody}<br><br>
                  <strong>${s.expiresTitle}</strong> ${s.expiresBody}
                </div>
              </div>
              
              <h2>${s.needHelp}</h2>
              
              <p>${s.helpBody}</p>
              
              <p style="text-align: center; margin: 32px 0;">
                <strong>${s.questions}</strong><br>
                <span style="font-size: 14px; color: #595959;">${s.contact1}<br>${s.contact2}</span>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 8px 0;">${s.footThanks}</p>
              <p style="margin: 8px 0; font-size: 11px;">${s.footAssist}</p>
              <p style="margin: 0; font-size: 11px;">${s.footNoReply}</p>
              <p style="margin: 12px 0 0 0; font-size: 11px;">${s.footRights}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Goldsainte Security <hello@goldsainte.com>",
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Password reset email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(req),
      },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req) },
      }
    );
  }
};

serve(handler);
