import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subject: (ref: string) => string;
  h1: string;
  dear: string;
  main: string;
  lblConfirmation: string;
  lblRoute: string;
  refundTitle: string;
  refundLine: (amountHtml: string) => string;
  refundDays: string;
  questions: string;
  thanks1: string;
  thanks2: string;
  footThanks: string;
  footAssist: string;
  footRights: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: (r) => `Booking Cancelled - ${r}`, h1: 'Booking Cancelled', dear: 'Dear Valued Guest,', main: "We've received your cancellation request for this booking. Cancellations and any refund are handled under your travel professional's terms \u2014 they are the seller of record for your trip, and any refund is issued by them.", lblConfirmation: 'Confirmation Number', lblRoute: 'Route', refundTitle: 'Refund Information', refundLine: (a) => `A refund of ${a} is being issued by your travel professional to your original payment method.`, refundDays: 'Please allow 5-10 business days for the refund to appear in your account.', questions: "If you have any questions or need assistance with a new booking, please don't hesitate to contact our 24/7 Concierge Support Team.", thanks1: 'Thank you for choosing GoldSainte.', thanks2: 'We hope to serve you again in the future.', footThanks: 'Thank you for choosing GoldSainte', footAssist: 'Need assistance? Contact our 24/7 Concierge Support Team', footRights: '\u00A9 2025 GoldSainte. All rights reserved.' },
  fr: { subject: (r) => `Réservation annulée - ${r}`, h1: 'Réservation annulée', dear: 'Cher client,', main: "Nous avons bien reçu votre demande d'annulation pour cette réservation. Les annulations et tout remboursement relèvent des conditions de votre professionnel du voyage \u2014 il est le vendeur officiel de votre voyage et c'est lui qui émet tout remboursement.", lblConfirmation: 'Numéro de confirmation', lblRoute: 'Itinéraire', refundTitle: 'Informations de remboursement', refundLine: (a) => `Un remboursement de ${a} est émis par votre professionnel du voyage vers votre moyen de paiement d'origine.`, refundDays: 'Comptez 5 à 10 jours ouvrés pour voir le remboursement sur votre compte.', questions: "Pour toute question ou pour une nouvelle réservation, n'hésitez pas à contacter notre équipe Concierge disponible 24h/24 et 7j/7.", thanks1: "Merci d'avoir choisi GoldSainte.", thanks2: 'Au plaisir de vous servir à nouveau.', footThanks: "Merci d'avoir choisi GoldSainte", footAssist: "Besoin d'aide ? Contactez notre équipe Concierge 24h/24 et 7j/7", footRights: '\u00A9 2025 GoldSainte. Tous droits réservés.' },
  es: { subject: (r) => `Reserva cancelada - ${r}`, h1: 'Reserva cancelada', dear: 'Estimado cliente:', main: 'Hemos recibido tu solicitud de cancelación para esta reserva. Las cancelaciones y cualquier reembolso se rigen por los términos de tu profesional de viajes \u2014 es el vendedor registrado de tu viaje y es quien emite cualquier reembolso.', lblConfirmation: 'Número de confirmación', lblRoute: 'Ruta', refundTitle: 'Información del reembolso', refundLine: (a) => `Tu profesional de viajes está emitiendo un reembolso de ${a} a tu método de pago original.`, refundDays: 'El reembolso puede tardar de 5 a 10 días laborables en aparecer en tu cuenta.', questions: 'Si tienes preguntas o necesitas ayuda con una nueva reserva, no dudes en contactar con nuestro equipo de conserjería 24/7.', thanks1: 'Gracias por elegir GoldSainte.', thanks2: 'Esperamos servirte de nuevo en el futuro.', footThanks: 'Gracias por elegir GoldSainte', footAssist: '¿Necesitas ayuda? Contacta con nuestro equipo de conserjería 24/7', footRights: '\u00A9 2025 GoldSainte. Todos los derechos reservados.' },
  de: { subject: (r) => `Buchung storniert - ${r}`, h1: 'Buchung storniert', dear: 'Sehr geehrter Gast,', main: 'Wir haben Ihre Stornierungsanfrage für diese Buchung erhalten. Stornierungen und etwaige Erstattungen richten sich nach den Bedingungen Ihres Reiseprofis \u2014 er ist der eingetragene Verkäufer Ihrer Reise und erstattet gegebenenfalls.', lblConfirmation: 'Bestätigungsnummer', lblRoute: 'Strecke', refundTitle: 'Erstattungsinformationen', refundLine: (a) => `Eine Erstattung von ${a} wird von Ihrem Reiseprofi auf Ihre ursprüngliche Zahlungsmethode veranlasst.`, refundDays: 'Bitte rechnen Sie mit 5\u201310 Werktagen, bis die Erstattung auf Ihrem Konto erscheint.', questions: 'Bei Fragen oder für eine neue Buchung kontaktieren Sie gerne unser rund um die Uhr erreichbares Concierge-Team.', thanks1: 'Danke, dass Sie GoldSainte gewählt haben.', thanks2: 'Wir hoffen, Sie bald wieder begrüßen zu dürfen.', footThanks: 'Danke, dass Sie GoldSainte gewählt haben', footAssist: 'Hilfe nötig? Kontaktieren Sie unser Concierge-Team, rund um die Uhr', footRights: '\u00A9 2025 GoldSainte. Alle Rechte vorbehalten.' },
  it: { subject: (r) => `Prenotazione annullata - ${r}`, h1: 'Prenotazione annullata', dear: 'Gentile ospite,', main: "Abbiamo ricevuto la tua richiesta di annullamento per questa prenotazione. Annullamenti ed eventuali rimborsi seguono i termini del tuo professionista di viaggio \u2014 è il venditore registrato del tuo viaggio ed è lui a emettere eventuali rimborsi.", lblConfirmation: 'Numero di conferma', lblRoute: 'Tratta', refundTitle: 'Informazioni sul rimborso', refundLine: (a) => `Un rimborso di ${a} viene emesso dal tuo professionista di viaggio sul metodo di pagamento originale.`, refundDays: 'Considera 5-10 giorni lavorativi perché il rimborso compaia sul tuo conto.', questions: 'Per domande o per una nuova prenotazione, contatta pure il nostro team concierge attivo 24/7.', thanks1: 'Grazie per aver scelto GoldSainte.', thanks2: 'Speriamo di servirti ancora in futuro.', footThanks: 'Grazie per aver scelto GoldSainte', footAssist: 'Serve assistenza? Contatta il nostro team concierge 24/7', footRights: '\u00A9 2025 GoldSainte. Tutti i diritti riservati.' },
  pt: { subject: (r) => `Reserva cancelada - ${r}`, h1: 'Reserva cancelada', dear: 'Prezado cliente,', main: 'Recebemos seu pedido de cancelamento para esta reserva. Cancelamentos e eventuais reembolsos seguem os termos do seu profissional de viagens \u2014 ele é o vendedor registrado da sua viagem e é quem emite qualquer reembolso.', lblConfirmation: 'Número de confirmação', lblRoute: 'Trecho', refundTitle: 'Informações do reembolso', refundLine: (a) => `Um reembolso de ${a} está sendo emitido pelo seu profissional de viagens para o método de pagamento original.`, refundDays: 'Aguarde de 5 a 10 dias úteis para o reembolso aparecer na sua conta.', questions: 'Se tiver dúvidas ou precisar de ajuda com uma nova reserva, fale com nossa equipe de concierge 24/7.', thanks1: 'Obrigado por escolher a GoldSainte.', thanks2: 'Esperamos atender você novamente.', footThanks: 'Obrigado por escolher a GoldSainte', footAssist: 'Precisa de ajuda? Fale com nossa equipe de concierge 24/7', footRights: '\u00A9 2025 GoldSainte. Todos os direitos reservados.' },
  ar: { subject: (r) => `أُلغي الحجز - ${r}`, h1: 'أُلغي الحجز', dear: 'عزيزنا الضيف،', main: 'استلمنا طلب إلغاء هذا الحجز. تخضع الإلغاءات وأي استرداد لشروط مختص السفر الخاص بك \u2014 فهو البائع المسجّل لرحلتك وهو من يصدر أي استرداد.', lblConfirmation: 'رقم التأكيد', lblRoute: 'المسار', refundTitle: 'معلومات الاسترداد', refundLine: (a) => `يقوم مختص السفر لديك بإصدار استرداد بقيمة ${a} إلى وسيلة الدفع الأصلية.`, refundDays: 'يرجى الانتظار من 5 إلى 10 أيام عمل حتى يظهر الاسترداد في حسابك.', questions: 'لأي سؤال أو للمساعدة في حجز جديد، لا تتردد في التواصل مع فريق الكونسيرج المتاح على مدار الساعة.', thanks1: 'شكراً لاختيارك GoldSainte.', thanks2: 'نأمل أن نخدمك مجدداً.', footThanks: 'شكراً لاختيارك GoldSainte', footAssist: 'تحتاج مساعدة؟ تواصل مع فريق الكونسيرج المتاح على مدار الساعة', footRights: '\u00A9 2025 GoldSainte. جميع الحقوق محفوظة.' },
  ja: { subject: (r) => `予約キャンセル - ${r}`, h1: '予約がキャンセルされました', dear: 'お客様へ', main: 'この予約のキャンセルリクエストを受け付けました。キャンセルと返金は、旅の専門家の規定に基づき処理されます \u2014 専門家がこの旅の正式な販売者であり、返金も専門家から行われます。', lblConfirmation: '確認番号', lblRoute: '経路', refundTitle: '返金のご案内', refundLine: (a) => `${a} の返金が、旅の専門家より元のお支払い方法へ手配されています。`, refundDays: '返金が口座に反映されるまで5〜10営業日ほどお待ちください。', questions: 'ご不明点や新しいご予約のご相談は、24時間365日対応のコンシェルジュサポートチームまでお気軽にどうぞ。', thanks1: 'GoldSainte をお選びいただきありがとうございます。', thanks2: 'またのご利用を心よりお待ちしております。', footThanks: 'GoldSainte をお選びいただきありがとうございます', footAssist: 'サポートが必要ですか？24時間365日対応のコンシェルジュチームへ', footRights: '\u00A9 2025 GoldSainte. All rights reserved.' },
  ko: { subject: (r) => `예약 취소 - ${r}`, h1: '예약이 취소되었습니다', dear: '고객님께,', main: '이 예약의 취소 요청을 접수했습니다. 취소와 환불은 여행 전문가의 약관에 따라 처리됩니다 \u2014 전문가가 이 여행의 등록 판매자이며 환불도 전문가가 진행합니다.', lblConfirmation: '확인 번호', lblRoute: '경로', refundTitle: '환불 안내', refundLine: (a) => `${a} 환불이 여행 전문가를 통해 원래 결제 수단으로 진행되고 있습니다.`, refundDays: '환불이 계좌에 표시되기까지 영업일 기준 5~10일이 걸릴 수 있습니다.', questions: '질문이 있거나 새 예약에 도움이 필요하면 언제든 연중무휴 컨시어지 지원팀에 연락하세요.', thanks1: 'GoldSainte를 선택해 주셔서 감사합니다.', thanks2: '다시 모실 수 있기를 바랍니다.', footThanks: 'GoldSainte를 선택해 주셔서 감사합니다', footAssist: '도움이 필요하신가요? 연중무휴 컨시어지 팀에 문의하세요', footRights: '\u00A9 2025 GoldSainte. All rights reserved.' },
  zh: { subject: (r) => `预订已取消 - ${r}`, h1: '预订已取消', dear: '尊敬的宾客：', main: '我们已收到你对此预订的取消请求。取消及任何退款均按你的旅行专家的条款处理 \u2014 专家是本次旅程的登记卖方，退款也由其发放。', lblConfirmation: '确认编号', lblRoute: '行程', refundTitle: '退款信息', refundLine: (a) => `你的旅行专家正在向你的原支付方式发放 ${a} 退款。`, refundDays: '退款到账通常需要 5\u201310 个工作日。', questions: '如有任何疑问或需要协助新的预订，请随时联系我们全天候的礼宾支持团队。', thanks1: '感谢你选择 GoldSainte。', thanks2: '期待再次为你服务。', footThanks: '感谢你选择 GoldSainte', footAssist: '需要协助？联系我们全天候的礼宾支持团队', footRights: '\u00A9 2025 GoldSainte. 保留所有权利。' },
};


function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { email, bookingReference, bookingData, refundAmount, refundCurrency, lang: requestLang } = await req.json();

    if (!email) {
      throw new Error('Email address is required');
    }

    console.log('Sending cancellation email to:', email);

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

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f3ea; color: #0a2225; }
            .container { max-width: 640px; margin: 0 auto; background: #ffffff; }
            .header { background: transparent; padding: 24px; text-align: center; }
            .logo { max-width: 280px; height: auto; }
            .content { padding: 32px 24px; }
            h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 400; font-size: 32px; color: #0a2225; margin: 0 0 16px 0; }
            p { font-size: 15px; line-height: 24px; color: #0a2225; margin: 16px 0; }
            .info-box { border: 1px solid #e7e7e7; border-radius: 4px; padding: 16px; margin: 16px 0; }
            .info-row { padding: 8px 0; }
            .label { color: #595959; font-size: 14px; }
            .value { color: #333333; font-weight: 600; font-size: 16px; }
            .refund-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; padding: 16px; margin: 24px 0; }
            .footer { background: #FDF9F0; border-top: 1px solid #E5DFC6; text-align: center; padding: 24px; color: #0a2225; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/logo-horizontal-green.png" alt="GoldSainte" class="logo" />
            </div>
            
            <div class="content">
              <h1>${s.h1}</h1>
              
              <p>${s.dear}</p>
              
              <p>${s.main}</p>
              
              <div class="info-box">
                <div class="info-row">
                  <div class="label">${s.lblConfirmation}</div>
                  <div class="value">${bookingReference}</div>
                </div>
                ${bookingData?.origin ? `
                <div class="info-row">
                  <div class="label">${s.lblRoute}</div>
                  <div class="value">${bookingData.origin} → ${bookingData.destination}</div>
                </div>
                ` : ''}
              </div>
              
              ${refundAmount ? `
              <div class="refund-box">
                <h3 style="margin: 0 0 8px 0; color: #166534;">${s.refundTitle}</h3>
                <p style="margin: 0; color: #166534;">
                  ${s.refundLine(`<strong>${refundCurrency} $${Number(refundAmount).toFixed(2)}</strong>`)}
                </p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #166534;">
                  ${s.refundDays}
                </p>
              </div>
              ` : ''}
              
              <p>${s.questions}</p>
              
              <p style="margin-top: 32px;">
                ${s.thanks1}<br>
                ${s.thanks2}
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 8px 0;">${s.footThanks}</p>
              <p style="margin: 8px 0; font-size: 11px;">${s.footAssist}</p>
              <p style="margin: 0; font-size: 11px;">${s.footRights}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: "GoldSainte <hello@goldsainte.com>",
        to: [email],
        subject: s.subject(bookingReference),
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Failed to send cancellation email: ${errorText}`);
    }

    const data = await resendResponse.json();
    console.log("Cancellation email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending cancellation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
