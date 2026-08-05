import "../_shared/resend-guard.ts";
import { emailShell } from "../_shared/brandEmail.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subjCustomer: (title: string) => string;
  h1Customer: string;
  h2Customer: string;
  lblAgent: string;
  lblTrip: string;
  lblTotalPrice: string;
  nextSteps: string;
  c1: string;
  c2: string;
  c3: string;
  btnPay: string;
  subjAgent: (title: string) => string;
  h1Agent: string;
  h2Agent: string;
  lblCustomer: string;
  lblYourPayout: string;
  customerFallback: string;
  custContact: string;
  lblEmail: string;
  lblPhone: string;
  notProvided: string;
  a1: string;
  a2: string;
  a3: string;
  a4: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subjCustomer: (t) => `Bid accepted \u2014 next: your payment for ${t}`, h1Customer: '\u{1F389} Bid Accepted!', h2Customer: 'Your trip is moving forward!', lblAgent: 'Agent:', lblTrip: 'Trip:', lblTotalPrice: 'Total Price:', nextSteps: 'Next Steps', c1: 'Complete payment to secure your booking', c2: 'Your agent will begin planning immediately', c3: "You'll receive trip details within 24-48 hours", btnPay: 'Complete Payment', subjAgent: (t) => `Your bid was accepted \u2014 ${t}`, h1Agent: '\u{1F389} Congratulations!', h2Agent: 'Your bid was accepted!', lblCustomer: 'Customer:', lblYourPayout: 'Your Payout:', customerFallback: 'Customer', custContact: 'Customer Contact Information', lblEmail: 'Email:', lblPhone: 'Phone:', notProvided: 'Not provided', a1: 'Wait for customer to complete payment', a2: 'Begin planning the trip immediately after payment confirmation', a3: 'Contact the customer within 24 hours', a4: 'Deliver trip details within 48 hours' },
  fr: { subjCustomer: (t) => `Offre acceptée \u2014 prochaine étape : votre paiement pour ${t}`, h1Customer: '\u{1F389} Offre acceptée !', h2Customer: 'Votre voyage avance !', lblAgent: 'Agent :', lblTrip: 'Voyage :', lblTotalPrice: 'Prix total :', nextSteps: 'Prochaines étapes', c1: 'Effectuez le paiement pour confirmer votre réservation', c2: 'Votre agent commence la planification immédiatement', c3: 'Vous recevrez les détails du voyage sous 24 à 48 heures', btnPay: 'Effectuer le paiement', subjAgent: (t) => `Votre offre a été acceptée \u2014 ${t}`, h1Agent: '\u{1F389} Félicitations !', h2Agent: 'Votre offre a été acceptée !', lblCustomer: 'Client :', lblYourPayout: 'Votre versement :', customerFallback: 'Client', custContact: 'Coordonnées du client', lblEmail: 'E-mail :', lblPhone: 'Téléphone :', notProvided: 'Non renseigné', a1: 'Attendez que le client effectue le paiement', a2: 'Commencez la planification dès la confirmation du paiement', a3: 'Contactez le client sous 24 heures', a4: 'Livrez les détails du voyage sous 48 heures' },
  es: { subjCustomer: (t) => `Oferta aceptada \u2014 siguiente: tu pago de ${t}`, h1Customer: '\u{1F389} ¡Oferta aceptada!', h2Customer: '¡Tu viaje avanza!', lblAgent: 'Agente:', lblTrip: 'Viaje:', lblTotalPrice: 'Precio total:', nextSteps: 'Próximos pasos', c1: 'Completa el pago para asegurar tu reserva', c2: 'Tu agente comenzará a planificar de inmediato', c3: 'Recibirás los detalles del viaje en 24-48 horas', btnPay: 'Completar pago', subjAgent: (t) => `Tu oferta fue aceptada \u2014 ${t}`, h1Agent: '\u{1F389} ¡Enhorabuena!', h2Agent: '¡Tu oferta fue aceptada!', lblCustomer: 'Cliente:', lblYourPayout: 'Tu cobro:', customerFallback: 'Cliente', custContact: 'Datos de contacto del cliente', lblEmail: 'Correo:', lblPhone: 'Teléfono:', notProvided: 'No facilitado', a1: 'Espera a que el cliente complete el pago', a2: 'Empieza a planificar en cuanto se confirme el pago', a3: 'Contacta al cliente en 24 horas', a4: 'Entrega los detalles del viaje en 48 horas' },
  de: { subjCustomer: (t) => `Gebot angenommen \u2014 als Nächstes: Ihre Zahlung für ${t}`, h1Customer: '\u{1F389} Gebot angenommen!', h2Customer: 'Ihre Reise nimmt Fahrt auf!', lblAgent: 'Agent:', lblTrip: 'Reise:', lblTotalPrice: 'Gesamtpreis:', nextSteps: 'Nächste Schritte', c1: 'Schließen Sie die Zahlung ab, um Ihre Buchung zu sichern', c2: 'Ihr Agent beginnt sofort mit der Planung', c3: 'Sie erhalten die Reisedetails innerhalb von 24-48 Stunden', btnPay: 'Zahlung abschließen', subjAgent: (t) => `Ihr Gebot wurde angenommen \u2014 ${t}`, h1Agent: '\u{1F389} Glückwunsch!', h2Agent: 'Ihr Gebot wurde angenommen!', lblCustomer: 'Kunde:', lblYourPayout: 'Ihre Auszahlung:', customerFallback: 'Kunde', custContact: 'Kontaktdaten des Kunden', lblEmail: 'E-Mail:', lblPhone: 'Telefon:', notProvided: 'Nicht angegeben', a1: 'Warten Sie, bis der Kunde die Zahlung abschließt', a2: 'Beginnen Sie direkt nach Zahlungsbestätigung mit der Planung', a3: 'Kontaktieren Sie den Kunden innerhalb von 24 Stunden', a4: 'Liefern Sie die Reisedetails innerhalb von 48 Stunden' },
  it: { subjCustomer: (t) => `Offerta accettata \u2014 prossimo passo: il tuo pagamento per ${t}`, h1Customer: '\u{1F389} Offerta accettata!', h2Customer: 'Il tuo viaggio va avanti!', lblAgent: 'Agente:', lblTrip: 'Viaggio:', lblTotalPrice: 'Prezzo totale:', nextSteps: 'Prossimi passi', c1: 'Completa il pagamento per confermare la prenotazione', c2: 'Il tuo agente inizierà subito la pianificazione', c3: 'Riceverai i dettagli del viaggio entro 24-48 ore', btnPay: 'Completa il pagamento', subjAgent: (t) => `La tua offerta è stata accettata \u2014 ${t}`, h1Agent: '\u{1F389} Congratulazioni!', h2Agent: 'La tua offerta è stata accettata!', lblCustomer: 'Cliente:', lblYourPayout: 'Il tuo incasso:', customerFallback: 'Cliente', custContact: 'Contatti del cliente', lblEmail: 'Email:', lblPhone: 'Telefono:', notProvided: 'Non fornito', a1: 'Attendi che il cliente completi il pagamento', a2: 'Inizia la pianificazione subito dopo la conferma del pagamento', a3: 'Contatta il cliente entro 24 ore', a4: 'Consegna i dettagli del viaggio entro 48 ore' },
  pt: { subjCustomer: (t) => `Lance aceito \u2014 próximo passo: seu pagamento de ${t}`, h1Customer: '\u{1F389} Lance aceito!', h2Customer: 'Sua viagem está avançando!', lblAgent: 'Agente:', lblTrip: 'Viagem:', lblTotalPrice: 'Preço total:', nextSteps: 'Próximos passos', c1: 'Conclua o pagamento para garantir sua reserva', c2: 'Seu agente começará o planejamento imediatamente', c3: 'Você receberá os detalhes da viagem em 24-48 horas', btnPay: 'Concluir pagamento', subjAgent: (t) => `Seu lance foi aceito \u2014 ${t}`, h1Agent: '\u{1F389} Parabéns!', h2Agent: 'Seu lance foi aceito!', lblCustomer: 'Cliente:', lblYourPayout: 'Seu repasse:', customerFallback: 'Cliente', custContact: 'Contato do cliente', lblEmail: 'E-mail:', lblPhone: 'Telefone:', notProvided: 'Não informado', a1: 'Aguarde o cliente concluir o pagamento', a2: 'Comece o planejamento logo após a confirmação do pagamento', a3: 'Contate o cliente em até 24 horas', a4: 'Entregue os detalhes da viagem em até 48 horas' },
  ar: { subjCustomer: (t) => `قُبل العرض \u2014 التالي: دفعتك لرحلة ${t}`, h1Customer: '\u{1F389} قُبل العرض!', h2Customer: 'رحلتك تمضي قدماً!', lblAgent: 'الوكيل:', lblTrip: 'الرحلة:', lblTotalPrice: 'السعر الإجمالي:', nextSteps: 'الخطوات التالية', c1: 'أكمل الدفع لتأمين حجزك', c2: 'سيبدأ وكيلك التخطيط فوراً', c3: 'ستستلم تفاصيل الرحلة خلال 24-48 ساعة', btnPay: 'أكمل الدفع', subjAgent: (t) => `قُبل عرضك \u2014 ${t}`, h1Agent: '\u{1F389} تهانينا!', h2Agent: 'قُبل عرضك!', lblCustomer: 'العميل:', lblYourPayout: 'مستحقاتك:', customerFallback: 'العميل', custContact: 'بيانات التواصل مع العميل', lblEmail: 'البريد:', lblPhone: 'الهاتف:', notProvided: 'غير متوفر', a1: 'انتظر إكمال العميل للدفع', a2: 'ابدأ التخطيط فور تأكيد الدفع', a3: 'تواصل مع العميل خلال 24 ساعة', a4: 'سلّم تفاصيل الرحلة خلال 48 ساعة' },
  ja: { subjCustomer: (t) => `入札が承諾されました \u2014 次は「${t}」のお支払い`, h1Customer: '\u{1F389} 入札承諾！', h2Customer: '旅が前に進んでいます！', lblAgent: 'エージェント：', lblTrip: '旅：', lblTotalPrice: '合計金額：', nextSteps: '次のステップ', c1: '支払いを完了して予約を確定しましょう', c2: 'エージェントがすぐに計画を始めます', c3: '24〜48時間以内に旅の詳細が届きます', btnPay: '支払いを完了', subjAgent: (t) => `入札が承諾されました \u2014 ${t}`, h1Agent: '\u{1F389} おめでとうございます！', h2Agent: '入札が承諾されました！', lblCustomer: 'お客様：', lblYourPayout: '受取額：', customerFallback: 'お客様', custContact: 'お客様の連絡先', lblEmail: 'メール：', lblPhone: '電話：', notProvided: '未提供', a1: 'お客様の支払い完了を待ちましょう', a2: '支払い確認後すぐに計画を始めましょう', a3: '24時間以内にお客様へ連絡しましょう', a4: '48時間以内に旅の詳細を届けましょう' },
  ko: { subjCustomer: (t) => `입찰 수락됨 \u2014 다음: ${t} 결제`, h1Customer: '\u{1F389} 입찰 수락!', h2Customer: '여행이 진행되고 있습니다!', lblAgent: '에이전트:', lblTrip: '여행:', lblTotalPrice: '총 가격:', nextSteps: '다음 단계', c1: '결제를 완료해 예약을 확정하세요', c2: '에이전트가 즉시 계획을 시작합니다', c3: '24~48시간 안에 여행 상세를 받게 됩니다', btnPay: '결제 완료', subjAgent: (t) => `입찰이 수락되었습니다 \u2014 ${t}`, h1Agent: '\u{1F389} 축하합니다!', h2Agent: '입찰이 수락되었습니다!', lblCustomer: '고객:', lblYourPayout: '나의 정산:', customerFallback: '고객', custContact: '고객 연락처', lblEmail: '이메일:', lblPhone: '전화:', notProvided: '미제공', a1: '고객의 결제 완료를 기다리세요', a2: '결제 확인 즉시 여행 계획을 시작하세요', a3: '24시간 안에 고객에게 연락하세요', a4: '48시간 안에 여행 상세를 전달하세요' },
  zh: { subjCustomer: (t) => `报价已被接受 \u2014 下一步：支付「${t}」`, h1Customer: '\u{1F389} 报价已接受！', h2Customer: '你的旅程正在推进！', lblAgent: '代理：', lblTrip: '旅程：', lblTotalPrice: '总价：', nextSteps: '下一步', c1: '完成付款以确认你的预订', c2: '你的代理会立即开始规划', c3: '你将在 24-48 小时内收到旅程详情', btnPay: '完成付款', subjAgent: (t) => `你的报价已被接受 \u2014 ${t}`, h1Agent: '\u{1F389} 恭喜！', h2Agent: '你的报价已被接受！', lblCustomer: '客户：', lblYourPayout: '你的到账：', customerFallback: '客户', custContact: '客户联系信息', lblEmail: '邮箱：', lblPhone: '电话：', notProvided: '未提供', a1: '等待客户完成付款', a2: '付款确认后立即开始规划行程', a3: '24 小时内联系客户', a4: '48 小时内交付旅程详情' },
};
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bidId, jobId, customerId, agentId } = await req.json();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title, contact_info')
      .eq('id', jobId)
      .single();

    // Get bid details
    const { data: bid } = await supabaseClient
      .from('agent_bids')
      .select('customer_facing_price, currency, agent_payout_amount')
      .eq('id', bidId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('agency_name, user_id')
      .eq('id', agentId)
      .single();

    if (!job || !bid || !agent) {
      throw new Error('Job, bid, or agent not found');
    }

    // Get customer email
    const { data: customerProfile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', customerId)
      .single();

    // Get agent email
    const { data: agentProfile } = agent.user_id ? await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', agent.user_id)
      .single() : { data: null };

    // Notify customer via in-app notification
    await supabaseClient.from('notifications').insert({
      user_id: customerId,
      type: 'system_announcement',
      title: '🎉 Bid Accepted!',
      message: `Your bid for "${job.title}" has been accepted. Payment of ${bid.currency} ${bid.customer_facing_price} is required to proceed.`,
      entity_type: 'agent_bid',
      entity_id: bidId,
      action_url: `/marketplace`,
    });

    // Notify agent via in-app notification
    if (agent.user_id) {
      await supabaseClient.from('notifications').insert({
        user_id: agent.user_id,
        type: 'system_announcement',
        title: '🎉 Your Bid Was Accepted!',
        message: `Congratulations! Your bid for "${job.title}" has been accepted. The customer will process payment shortly.`,
        entity_type: 'agent_bid',
        entity_id: bidId,
        action_url: `/agent-dashboard`,
      });
    }

    // Send email notifications
    if (Deno.env.get('RESEND_API_KEY')) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

      // Email to customer
      if (customerProfile?.email) {
        const langC = await resolveRecipientLanguage(supabaseClient, null, customerProfile.email);
        const sc = pickLang(STRINGS, langC);
        const customerEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
              .button { display: inline-block; background: #10b981; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">${sc.h1Customer}</h1>
              </div>
              <div class="content">
                <div class="section">
                  <h2 style="margin-top: 0; color: #10b981;">${sc.h2Customer}</h2>
                  <p><strong>${sc.lblAgent}</strong> ${agent.agency_name}</p>
                  <p><strong>${sc.lblTrip}</strong> ${job.title}</p>
                  <p><strong>${sc.lblTotalPrice}</strong> ${bid.currency} ${bid.customer_facing_price}</p>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">${sc.nextSteps}</h3>
                  <ol>
                    <li>${sc.c1}</li>
                    <li>${sc.c2}</li>
                  <li>${sc.c3}</li>
                  </ol>
                  <a href="${(Deno.env.get('SUPABASE_URL') || '').replace('//', '//app.')}/marketplace?job=${jobId}" class="button">${sc.btnPay}</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Goldsainte Marketplace <hello@goldsainte.com>',
              to: [customerProfile.email],
              subject: sc.subjCustomer(job.title),
              html: emailShell(
                "Your specialist is confirmed.",
                `You've accepted a bid for <strong>${job.title}</strong>. Next: complete your payment — it's processed securely through Stripe directly to your specialist, your seller of record for this trip.`,
                "Complete payment",
                "https://goldsainte.ai/my-jobs"
              ),
            }),
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.text();
            throw new Error(`Failed to send customer email: ${error}`);
          }

          console.log('Customer email sent:', await resendResponse.json());
        } catch (error) {
          console.error('Error sending customer email:', error);
        }
      }

      // Email to agent
      if (agentProfile?.email) {
        const langA = await resolveRecipientLanguage(supabaseClient, null, agentProfile.email);
        const sa = pickLang(STRINGS, langA);
        const agentEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">${sa.h1Agent}</h1>
              </div>
              <div class="content">
                <div class="section">
                  <h2 style="margin-top: 0; color: #10b981;">${sa.h2Agent}</h2>
                  <p><strong>${sa.lblTrip}</strong> ${job.title}</p>
                  <p><strong>${sa.lblCustomer}</strong> ${job.contact_info?.name || sa.customerFallback}</p>
                  <p><strong>${sa.lblYourPayout}</strong> ${bid.currency} ${bid.agent_payout_amount || bid.customer_facing_price}</p>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">${sa.custContact}</h3>
                  <p><strong>${sa.lblEmail}</strong> ${job.contact_info?.email || sa.notProvided}</p>
                  <p><strong>${sa.lblPhone}</strong> ${job.contact_info?.phone || sa.notProvided}</p>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">${sa.nextSteps}</h3>
                  <ol>
                    <li>${sa.a1}</li>
                    <li>${sa.a2}</li>
                    <li>${sa.a3}</li>
                    <li>${sa.a4}</li>
                  </ol>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Goldsainte Marketplace <hello@goldsainte.com>',
              to: [agentProfile.email],
              subject: sa.subjAgent(job.title),
              html: emailShell(
                "Your bid was accepted.",
                `Congratulations — the traveler chose your bid for <strong>${job.title}</strong>. Next: the traveler completes payment, charged directly to your Stripe account; you'll be notified the moment it lands. Keep all trip details and communication on-platform.`,
                "Open your dashboard",
                "https://goldsainte.ai/agent-dashboard"
              ),
            }),
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.text();
            throw new Error(`Failed to send agent email: ${error}`);
          }

          console.log('Agent email sent:', await resendResponse.json());
        } catch (error) {
          console.error('Error sending agent email:', error);
        }
      }
    }

    console.log(`Bid accepted notifications sent for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-bid-accepted:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
