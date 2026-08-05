import "../_shared/resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

interface SubscriptionEmailRequest {
  email: string;
  type: 'upgrade' | 'downgrade' | 'expiring' | 'renewed';
  lang?: EmailLang;
  newTier?: string;
  oldTier?: string;
  expirationDate?: string;
}

interface S {
  subjUp: (tier: string) => string;
  h1Up: string;
  upP1: string;
  lblPrevPlan: string;
  freeFallback: string;
  badge: (tier: string) => string;
  upP2: (tier: string) => string;
  upP3: string;
  subjDown: (tier: string) => string;
  h1Down: string;
  downP1: string;
  downP2: string;
  downP3: string;
  subjExp: string;
  h1Exp: string;
  subFallback: string;
  expWarning: (tier: string, date: string) => string;
  expP1: string;
  expP2: string;
  feat1: string;
  feat2: string;
  feat3: string;
  btnRenew: string;
  subjRen: string;
  h1Ren: string;
  renSuccess: (tier: string) => string;
  renP1: string;
  renP2: string;
  footRights: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subjUp: (t) => `\u{1F389} Subscription Upgraded to ${t}`, h1Up: "\u{1F389} You've Upgraded!", upP1: 'Great news! Your subscription has been upgraded.', lblPrevPlan: 'Previous Plan:', freeFallback: 'Free', badge: (t) => `${t} PLAN`, upP2: (t) => `You now have access to all ${t} features. Thank you for choosing Goldsainte!`, upP3: 'If you have any questions, our support team is here to help.', subjDown: (t) => `Subscription Changed to ${t}`, h1Down: 'Subscription Updated', downP1: 'Your subscription has been changed.', downP2: 'Your new plan is now active. You can upgrade again anytime from your account settings.', downP3: 'Thank you for being part of Goldsainte.', subjExp: '\u23F0 Your Subscription Expires Soon', h1Exp: '\u23F0 Subscription Expiring Soon', subFallback: 'subscription', expWarning: (t, d) => `Your ${t} plan expires on ${d}`, expP1: "Don't lose access to your premium features!", expP2: 'Renew your subscription to continue enjoying:', feat1: 'Premium travel planning tools', feat2: 'Exclusive content and features', feat3: 'Priority support', btnRenew: 'Renew Subscription', subjRen: '\u2705 Subscription Renewed Successfully', h1Ren: '\u2705 Subscription Renewed', renSuccess: (t) => `Your ${t} has been renewed successfully!`, renP1: 'Thank you for continuing your journey with Goldsainte.', renP2: 'Your premium features remain active and ready to use.', footRights: '\u00A9 2025 Goldsainte. All rights reserved.' },
  fr: { subjUp: (t) => `\u{1F389} Abonnement mis à niveau vers ${t}`, h1Up: '\u{1F389} Vous êtes passé au niveau supérieur !', upP1: 'Bonne nouvelle ! Votre abonnement a été mis à niveau.', lblPrevPlan: 'Ancienne formule :', freeFallback: 'Gratuite', badge: (t) => `FORMULE ${t}`, upP2: (t) => `Vous avez désormais accès à toutes les fonctionnalités ${t}. Merci d'avoir choisi Goldsainte !`, upP3: 'Pour toute question, notre équipe support est là pour vous aider.', subjDown: (t) => `Abonnement modifié vers ${t}`, h1Down: 'Abonnement mis à jour', downP1: 'Votre abonnement a été modifié.', downP2: 'Votre nouvelle formule est active. Vous pouvez repasser au niveau supérieur à tout moment depuis vos réglages.', downP3: 'Merci de faire partie de Goldsainte.', subjExp: '\u23F0 Votre abonnement expire bientôt', h1Exp: '\u23F0 Abonnement bientôt expiré', subFallback: 'abonnement', expWarning: (t, d) => `Votre formule ${t} expire le ${d}`, expP1: 'Ne perdez pas vos fonctionnalités premium !', expP2: 'Renouvelez votre abonnement pour continuer à profiter de :', feat1: 'Outils premium de planification de voyage', feat2: 'Contenus et fonctionnalités exclusifs', feat3: 'Support prioritaire', btnRenew: "Renouveler l'abonnement", subjRen: '\u2705 Abonnement renouvelé avec succès', h1Ren: '\u2705 Abonnement renouvelé', renSuccess: (t) => `Votre ${t} a été renouvelé avec succès !`, renP1: 'Merci de poursuivre votre voyage avec Goldsainte.', renP2: 'Vos fonctionnalités premium restent actives et prêtes à l\'emploi.', footRights: '\u00A9 2025 Goldsainte. Tous droits réservés.' },
  es: { subjUp: (t) => `\u{1F389} Suscripción mejorada a ${t}`, h1Up: '\u{1F389} ¡Has mejorado tu plan!', upP1: '¡Buenas noticias! Tu suscripción ha sido mejorada.', lblPrevPlan: 'Plan anterior:', freeFallback: 'Gratis', badge: (t) => `PLAN ${t}`, upP2: (t) => `Ahora tienes acceso a todas las funciones ${t}. ¡Gracias por elegir Goldsainte!`, upP3: 'Si tienes preguntas, nuestro equipo de soporte está para ayudarte.', subjDown: (t) => `Suscripción cambiada a ${t}`, h1Down: 'Suscripción actualizada', downP1: 'Tu suscripción ha sido cambiada.', downP2: 'Tu nuevo plan ya está activo. Puedes volver a mejorar cuando quieras desde tus ajustes.', downP3: 'Gracias por formar parte de Goldsainte.', subjExp: '\u23F0 Tu suscripción caduca pronto', h1Exp: '\u23F0 Suscripción a punto de caducar', subFallback: 'suscripción', expWarning: (t, d) => `Tu plan ${t} caduca el ${d}`, expP1: '¡No pierdas el acceso a tus funciones premium!', expP2: 'Renueva tu suscripción para seguir disfrutando de:', feat1: 'Herramientas premium de planificación de viajes', feat2: 'Contenido y funciones exclusivas', feat3: 'Soporte prioritario', btnRenew: 'Renovar suscripción', subjRen: '\u2705 Suscripción renovada con éxito', h1Ren: '\u2705 Suscripción renovada', renSuccess: (t) => `¡Tu ${t} se ha renovado con éxito!`, renP1: 'Gracias por continuar tu viaje con Goldsainte.', renP2: 'Tus funciones premium siguen activas y listas para usar.', footRights: '\u00A9 2025 Goldsainte. Todos los derechos reservados.' },
  de: { subjUp: (t) => `\u{1F389} Abo auf ${t} hochgestuft`, h1Up: '\u{1F389} Upgrade abgeschlossen!', upP1: 'Gute Nachrichten! Ihr Abo wurde hochgestuft.', lblPrevPlan: 'Vorheriger Tarif:', freeFallback: 'Kostenlos', badge: (t) => `${t}-TARIF`, upP2: (t) => `Sie haben jetzt Zugriff auf alle ${t}-Funktionen. Danke, dass Sie sich für Goldsainte entschieden haben!`, upP3: 'Bei Fragen hilft unser Support-Team gerne weiter.', subjDown: (t) => `Abo geändert auf ${t}`, h1Down: 'Abo aktualisiert', downP1: 'Ihr Abo wurde geändert.', downP2: 'Ihr neuer Tarif ist aktiv. Ein Upgrade ist jederzeit über Ihre Kontoeinstellungen möglich.', downP3: 'Danke, dass Sie Teil von Goldsainte sind.', subjExp: '\u23F0 Ihr Abo läuft bald ab', h1Exp: '\u23F0 Abo läuft bald ab', subFallback: 'Abo', expWarning: (t, d) => `Ihr ${t}-Tarif läuft am ${d} ab`, expP1: 'Verlieren Sie nicht den Zugriff auf Ihre Premium-Funktionen!', expP2: 'Verlängern Sie Ihr Abo und genießen Sie weiterhin:', feat1: 'Premium-Tools für die Reiseplanung', feat2: 'Exklusive Inhalte und Funktionen', feat3: 'Prioritäts-Support', btnRenew: 'Abo verlängern', subjRen: '\u2705 Abo erfolgreich verlängert', h1Ren: '\u2705 Abo verlängert', renSuccess: (t) => `Ihr ${t} wurde erfolgreich verlängert!`, renP1: 'Danke, dass Sie Ihre Reise mit Goldsainte fortsetzen.', renP2: 'Ihre Premium-Funktionen bleiben aktiv und einsatzbereit.', footRights: '\u00A9 2025 Goldsainte. Alle Rechte vorbehalten.' },
  it: { subjUp: (t) => `\u{1F389} Abbonamento aggiornato a ${t}`, h1Up: '\u{1F389} Hai fatto l\'upgrade!', upP1: 'Ottime notizie! Il tuo abbonamento è stato aggiornato.', lblPrevPlan: 'Piano precedente:', freeFallback: 'Gratuito', badge: (t) => `PIANO ${t}`, upP2: (t) => `Ora hai accesso a tutte le funzionalità ${t}. Grazie per aver scelto Goldsainte!`, upP3: 'Per qualsiasi domanda, il nostro team di supporto è qui per aiutarti.', subjDown: (t) => `Abbonamento cambiato in ${t}`, h1Down: 'Abbonamento aggiornato', downP1: 'Il tuo abbonamento è stato modificato.', downP2: 'Il nuovo piano è attivo. Puoi fare di nuovo l\'upgrade in qualsiasi momento dalle impostazioni.', downP3: 'Grazie per far parte di Goldsainte.', subjExp: '\u23F0 Il tuo abbonamento scade presto', h1Exp: '\u23F0 Abbonamento in scadenza', subFallback: 'abbonamento', expWarning: (t, d) => `Il tuo piano ${t} scade il ${d}`, expP1: 'Non perdere l\'accesso alle funzionalità premium!', expP2: 'Rinnova l\'abbonamento per continuare a goderti:', feat1: 'Strumenti premium di pianificazione viaggi', feat2: 'Contenuti e funzionalità esclusivi', feat3: 'Supporto prioritario', btnRenew: 'Rinnova abbonamento', subjRen: '\u2705 Abbonamento rinnovato con successo', h1Ren: '\u2705 Abbonamento rinnovato', renSuccess: (t) => `Il tuo ${t} è stato rinnovato con successo!`, renP1: 'Grazie per continuare il viaggio con Goldsainte.', renP2: 'Le tue funzionalità premium restano attive e pronte all\'uso.', footRights: '\u00A9 2025 Goldsainte. Tutti i diritti riservati.' },
  pt: { subjUp: (t) => `\u{1F389} Assinatura atualizada para ${t}`, h1Up: '\u{1F389} Você fez upgrade!', upP1: 'Boa notícia! Sua assinatura foi atualizada.', lblPrevPlan: 'Plano anterior:', freeFallback: 'Gratuito', badge: (t) => `PLANO ${t}`, upP2: (t) => `Agora você tem acesso a todos os recursos ${t}. Obrigado por escolher a Goldsainte!`, upP3: 'Se tiver dúvidas, nossa equipe de suporte está à disposição.', subjDown: (t) => `Assinatura alterada para ${t}`, h1Down: 'Assinatura atualizada', downP1: 'Sua assinatura foi alterada.', downP2: 'Seu novo plano já está ativo. Você pode fazer upgrade novamente a qualquer momento nas configurações.', downP3: 'Obrigado por fazer parte da Goldsainte.', subjExp: '\u23F0 Sua assinatura expira em breve', h1Exp: '\u23F0 Assinatura expirando em breve', subFallback: 'assinatura', expWarning: (t, d) => `Seu plano ${t} expira em ${d}`, expP1: 'Não perca o acesso aos seus recursos premium!', expP2: 'Renove sua assinatura para continuar aproveitando:', feat1: 'Ferramentas premium de planejamento de viagens', feat2: 'Conteúdo e recursos exclusivos', feat3: 'Suporte prioritário', btnRenew: 'Renovar assinatura', subjRen: '\u2705 Assinatura renovada com sucesso', h1Ren: '\u2705 Assinatura renovada', renSuccess: (t) => `Sua ${t} foi renovada com sucesso!`, renP1: 'Obrigado por continuar sua jornada com a Goldsainte.', renP2: 'Seus recursos premium seguem ativos e prontos para uso.', footRights: '\u00A9 2025 Goldsainte. Todos os direitos reservados.' },
  ar: { subjUp: (t) => `\u{1F389} تمت ترقية الاشتراك إلى ${t}`, h1Up: '\u{1F389} تمت الترقية!', upP1: 'خبر رائع! تمت ترقية اشتراكك.', lblPrevPlan: 'الخطة السابقة:', freeFallback: 'مجانية', badge: (t) => `خطة ${t}`, upP2: (t) => `أصبح بإمكانك الوصول إلى كل ميزات ${t}. شكراً لاختيارك Goldsainte!`, upP3: 'لأي سؤال، فريق الدعم لدينا جاهز للمساعدة.', subjDown: (t) => `تغير الاشتراك إلى ${t}`, h1Down: 'تحدّث الاشتراك', downP1: 'تم تغيير اشتراكك.', downP2: 'خطتك الجديدة فعالة الآن. يمكنك الترقية مجدداً في أي وقت من إعدادات حسابك.', downP3: 'شكراً لكونك جزءاً من Goldsainte.', subjExp: '\u23F0 اشتراكك ينتهي قريباً', h1Exp: '\u23F0 الاشتراك ينتهي قريباً', subFallback: 'اشتراكك', expWarning: (t, d) => `تنتهي خطة ${t} بتاريخ ${d}`, expP1: 'لا تفقد الوصول إلى ميزاتك المميزة!', expP2: 'جدد اشتراكك لتواصل الاستمتاع بـ:', feat1: 'أدوات تخطيط سفر مميزة', feat2: 'محتوى وميزات حصرية', feat3: 'دعم ذو أولوية', btnRenew: 'جدد الاشتراك', subjRen: '\u2705 تم تجديد الاشتراك بنجاح', h1Ren: '\u2705 تم تجديد الاشتراك', renSuccess: (t) => `تم تجديد ${t} بنجاح!`, renP1: 'شكراً لمواصلة رحلتك مع Goldsainte.', renP2: 'ميزاتك المميزة لا تزال فعالة وجاهزة.', footRights: '\u00A9 2025 Goldsainte. جميع الحقوق محفوظة.' },
  ja: { subjUp: (t) => `\u{1F389} サブスクリプションが ${t} にアップグレード`, h1Up: '\u{1F389} アップグレード完了！', upP1: '朗報です！サブスクリプションがアップグレードされました。', lblPrevPlan: '以前のプラン：', freeFallback: '無料', badge: (t) => `${t} プラン`, upP2: (t) => `${t} のすべての機能が利用可能になりました。Goldsainte をお選びいただきありがとうございます！`, upP3: 'ご不明点があればサポートチームがお手伝いします。', subjDown: (t) => `サブスクリプションが ${t} に変更されました`, h1Down: 'サブスクリプション更新', downP1: 'サブスクリプションが変更されました。', downP2: '新しいプランが有効です。アカウント設定からいつでも再アップグレードできます。', downP3: 'Goldsainte の一員でいてくださりありがとうございます。', subjExp: '\u23F0 サブスクリプションがまもなく期限切れ', h1Exp: '\u23F0 まもなく期限切れ', subFallback: 'サブスクリプション', expWarning: (t, d) => `${t} プランは ${d} に期限切れになります`, expP1: 'プレミアム機能へのアクセスを失わないでください！', expP2: '更新すると引き続きご利用いただけます：', feat1: 'プレミアム旅行計画ツール', feat2: '限定コンテンツと機能', feat3: '優先サポート', btnRenew: 'サブスクリプションを更新', subjRen: '\u2705 サブスクリプションの更新が完了', h1Ren: '\u2705 更新が完了しました', renSuccess: (t) => `${t} の更新が正常に完了しました！`, renP1: 'Goldsainte との旅を続けてくださりありがとうございます。', renP2: 'プレミアム機能は引き続き有効です。', footRights: '\u00A9 2025 Goldsainte. All rights reserved.' },
  ko: { subjUp: (t) => `\u{1F389} 구독이 ${t}(으)로 업그레이드되었습니다`, h1Up: '\u{1F389} 업그레이드 완료!', upP1: '좋은 소식입니다! 구독이 업그레이드되었습니다.', lblPrevPlan: '이전 플랜:', freeFallback: '무료', badge: (t) => `${t} 플랜`, upP2: (t) => `이제 ${t}의 모든 기능을 이용할 수 있습니다. Goldsainte를 선택해 주셔서 감사합니다!`, upP3: '질문이 있으면 지원팀이 도와드립니다.', subjDown: (t) => `구독이 ${t}(으)로 변경되었습니다`, h1Down: '구독 업데이트', downP1: '구독이 변경되었습니다.', downP2: '새 플랜이 활성화되었습니다. 계정 설정에서 언제든 다시 업그레이드할 수 있습니다.', downP3: 'Goldsainte와 함께해 주셔서 감사합니다.', subjExp: '\u23F0 구독이 곧 만료됩니다', h1Exp: '\u23F0 구독 만료 임박', subFallback: '구독', expWarning: (t, d) => `${t} 플랜이 ${d}에 만료됩니다`, expP1: '프리미엄 기능을 잃지 마세요!', expP2: '구독을 갱신하고 계속 누리세요:', feat1: '프리미엄 여행 계획 도구', feat2: '독점 콘텐츠와 기능', feat3: '우선 지원', btnRenew: '구독 갱신', subjRen: '\u2705 구독이 갱신되었습니다', h1Ren: '\u2705 구독 갱신 완료', renSuccess: (t) => `${t}이(가) 성공적으로 갱신되었습니다!`, renP1: 'Goldsainte와 여정을 이어가 주셔서 감사합니다.', renP2: '프리미엄 기능은 계속 활성 상태입니다.', footRights: '\u00A9 2025 Goldsainte. All rights reserved.' },
  zh: { subjUp: (t) => `\u{1F389} 订阅已升级至 ${t}`, h1Up: '\u{1F389} 升级成功！', upP1: '好消息！你的订阅已升级。', lblPrevPlan: '原方案：', freeFallback: '免费', badge: (t) => `${t} 方案`, upP2: (t) => `你现在可以使用 ${t} 的全部功能。感谢你选择 Goldsainte！`, upP3: '如有疑问，我们的支持团队随时为你服务。', subjDown: (t) => `订阅已变更为 ${t}`, h1Down: '订阅已更新', downP1: '你的订阅已变更。', downP2: '新方案已生效。你可随时在账户设置中再次升级。', downP3: '感谢你成为 Goldsainte 的一员。', subjExp: '\u23F0 你的订阅即将到期', h1Exp: '\u23F0 订阅即将到期', subFallback: '订阅', expWarning: (t, d) => `你的 ${t} 方案将于 ${d} 到期`, expP1: '别失去你的高级功能！', expP2: '续订即可继续享受：', feat1: '高级旅行规划工具', feat2: '独家内容与功能', feat3: '优先支持', btnRenew: '续订', subjRen: '\u2705 订阅续订成功', h1Ren: '\u2705 订阅已续订', renSuccess: (t) => `你的${t}已成功续订！`, renP1: '感谢你与 Goldsainte 继续同行。', renP2: '你的高级功能保持有效，随时可用。', footRights: '\u00A9 2025 Goldsainte. 保留所有权利。' },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { email, type, newTier, oldTier, expirationDate, lang: requestLang }: SubscriptionEmailRequest = await req.json();

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

    let subject = "";
    let html = "";

    const logoUrl = `${Deno.env.get('SITE_URL') || ''}/logo-horizontal-green.png`;

    switch (type) {
      case 'upgrade':
        subject = s.subjUp(newTier?.toUpperCase() ?? "");
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Gupter', -apple-system, sans-serif; margin:0; padding:0; background:#E5DFC6; }
              .container { max-width:600px; margin:0 auto; background:#fff; }
              .header { padding:32px; text-align:center; background:#0c4d47; }
              .logo { max-width:200px; }
              .content { padding:32px; }
              h1 { color:#0c4d47; font-size:28px; margin:0 0 24px; }
              p { font-size:16px; line-height:24px; color:#333; margin:16px 0; }
              .badge { display:inline-block; padding:8px 16px; background:#0c4d47; color:#fff; border-radius:4px; font-weight:600; margin:16px 0; }
              .footer { background:#BFAD72; text-align:center; padding:24px; font-size:12px; color:#0A2225; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Goldsainte" class="logo" />
              </div>
              <div class="content">
                <h1>${s.h1Up}</h1>
                <p>${s.upP1}</p>
                <p><strong>${s.lblPrevPlan}</strong> ${oldTier?.toUpperCase() || s.freeFallback}</p>
                <div class="badge">${s.badge(newTier?.toUpperCase() ?? "")}</div>
                <p>${s.upP2(newTier ?? "")}</p>
                <p>${s.upP3}</p>
              </div>
              <div class="footer">
                <p>${s.footRights}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'downgrade':
        subject = s.subjDown(newTier?.toUpperCase() ?? "");
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Gupter', -apple-system, sans-serif; margin:0; padding:0; background:#E5DFC6; }
              .container { max-width:600px; margin:0 auto; background:#fff; }
              .header { padding:32px; text-align:center; background:#0c4d47; }
              .logo { max-width:200px; }
              .content { padding:32px; }
              h1 { color:#0c4d47; font-size:28px; margin:0 0 24px; }
              p { font-size:16px; line-height:24px; color:#333; margin:16px 0; }
              .badge { display:inline-block; padding:8px 16px; background:#BFAD72; color:#0A2225; border-radius:4px; font-weight:600; margin:16px 0; }
              .footer { background:#BFAD72; text-align:center; padding:24px; font-size:12px; color:#0A2225; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Goldsainte" class="logo" />
              </div>
              <div class="content">
                <h1>${s.h1Down}</h1>
                <p>${s.downP1}</p>
                <p><strong>${s.lblPrevPlan}</strong> ${oldTier?.toUpperCase()}</p>
                <div class="badge">${s.badge(newTier?.toUpperCase() ?? "")}</div>
                <p>${s.downP2}</p>
                <p>${s.downP3}</p>
              </div>
              <div class="footer">
                <p>${s.footRights}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'expiring':
        subject = s.subjExp;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Gupter', -apple-system, sans-serif; margin:0; padding:0; background:#E5DFC6; }
              .container { max-width:600px; margin:0 auto; background:#fff; }
              .header { padding:32px; text-align:center; background:#0c4d47; }
              .logo { max-width:200px; }
              .content { padding:32px; }
              h1 { color:#0c4d47; font-size:28px; margin:0 0 24px; }
              p { font-size:16px; line-height:24px; color:#333; margin:16px 0; }
              .warning { background:#FFF4E5; border-left:4px solid:#FFE08A; padding:16px; margin:24px 0; border-radius:4px; }
              .btn { display:inline-block; padding:14px 28px; background:#0c4d47; color:#fff !important; text-decoration:none; border-radius:4px; font-weight:600; margin:16px 0; }
              .footer { background:#BFAD72; text-align:center; padding:24px; font-size:12px; color:#0A2225; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Goldsainte" class="logo" />
              </div>
              <div class="content">
                <h1>${s.h1Exp}</h1>
                <div class="warning">
                  <p style="margin:0;"><strong>${s.expWarning(newTier?.toUpperCase() || s.subFallback, new Date(expirationDate || '').toLocaleDateString())}</strong></p>
                </div>
                <p>${s.expP1}</p>
                <p>${s.expP2}</p>
                <ul style="font-size:16px; line-height:28px; color:#333;">
                  <li>${s.feat1}</li>
                  <li>${s.feat2}</li>
                  <li>${s.feat3}</li>
                </ul>
                <div style="text-align:center; margin:32px 0;">
                  <a class="btn" href="${Deno.env.get('SITE_URL')}/subscription">${s.btnRenew}</a>
                </div>
              </div>
              <div class="footer">
                <p>${s.footRights}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'renewed':
        subject = s.subjRen;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Gupter', -apple-system, sans-serif; margin:0; padding:0; background:#E5DFC6; }
              .container { max-width:600px; margin:0 auto; background:#fff; }
              .header { padding:32px; text-align:center; background:#0c4d47; }
              .logo { max-width:200px; }
              .content { padding:32px; }
              h1 { color:#0c4d47; font-size:28px; margin:0 0 24px; }
              p { font-size:16px; line-height:24px; color:#333; margin:16px 0; }
              .success { background:#E8F5E9; border-left:4px solid:#4CAF50; padding:16px; margin:24px 0; border-radius:4px; }
              .footer { background:#BFAD72; text-align:center; padding:24px; font-size:12px; color:#0A2225; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Goldsainte" class="logo" />
              </div>
              <div class="content">
                <h1>${s.h1Ren}</h1>
                <div class="success">
                  <p style="margin:0;"><strong>${s.renSuccess(newTier?.toUpperCase() || s.subFallback)}</strong></p>
                </div>
                <p>${s.renP1}</p>
                <p>${s.renP2}</p>
              </div>
              <div class="footer">
                <p>${s.footRights}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Goldsainte <hello@goldsainte.com>',
        to: [email],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Subscription email sent:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(req),
      },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-email:", error);
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
