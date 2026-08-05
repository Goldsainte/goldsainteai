import "../_shared/resend-guard.ts";
import { emailShell } from "../_shared/brandEmail.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subject: (title: string) => string;
  h1: string;
  h2: (agency: string) => string;
  agentFallback: string;
  lblTrip: string;
  nextSteps: string;
  reviewText: string;
  btnReview: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: (t) => `A new bid has arrived for ${t}`, h1: '\u{1F4EC} New Bid Received!', h2: (a) => `${a} submitted a bid`, agentFallback: 'An Agent', lblTrip: 'Trip:', nextSteps: 'Next Steps', reviewText: "Review this bid along with any others you've received and choose the agent that best fits your needs.", btnReview: 'Review Bid' },
  fr: { subject: (t) => `Une nouvelle offre est arrivée pour ${t}`, h1: '\u{1F4EC} Nouvelle offre reçue !', h2: (a) => `${a} a soumis une offre`, agentFallback: 'Un agent', lblTrip: 'Voyage :', nextSteps: 'Prochaines étapes', reviewText: "Examinez cette offre avec les autres reçues et choisissez l'agent qui vous convient le mieux.", btnReview: "Voir l'offre" },
  es: { subject: (t) => `Ha llegado una nueva oferta para ${t}`, h1: '\u{1F4EC} ¡Nueva oferta recibida!', h2: (a) => `${a} presentó una oferta`, agentFallback: 'Un agente', lblTrip: 'Viaje:', nextSteps: 'Próximos pasos', reviewText: 'Revisa esta oferta junto con las demás recibidas y elige el agente que mejor encaje contigo.', btnReview: 'Ver oferta' },
  de: { subject: (t) => `Ein neues Gebot ist eingegangen für ${t}`, h1: '\u{1F4EC} Neues Gebot erhalten!', h2: (a) => `${a} hat ein Gebot abgegeben`, agentFallback: 'Ein Agent', lblTrip: 'Reise:', nextSteps: 'Nächste Schritte', reviewText: 'Prüfen Sie dieses Gebot zusammen mit allen anderen und wählen Sie den Agenten, der am besten passt.', btnReview: 'Gebot ansehen' },
  it: { subject: (t) => `È arrivata una nuova offerta per ${t}`, h1: '\u{1F4EC} Nuova offerta ricevuta!', h2: (a) => `${a} ha presentato un'offerta`, agentFallback: 'Un agente', lblTrip: 'Viaggio:', nextSteps: 'Prossimi passi', reviewText: 'Esamina questa offerta insieme alle altre ricevute e scegli l\'agente più adatto a te.', btnReview: 'Vedi offerta' },
  pt: { subject: (t) => `Chegou um novo lance para ${t}`, h1: '\u{1F4EC} Novo lance recebido!', h2: (a) => `${a} enviou um lance`, agentFallback: 'Um agente', lblTrip: 'Viagem:', nextSteps: 'Próximos passos', reviewText: 'Revise este lance junto com os demais recebidos e escolha o agente que melhor atende você.', btnReview: 'Ver lance' },
  ar: { subject: (t) => `وصل عرض جديد لرحلة ${t}`, h1: '\u{1F4EC} عرض جديد!', h2: (a) => `قدّم ${a} عرضاً`, agentFallback: 'أحد الوكلاء', lblTrip: 'الرحلة:', nextSteps: 'الخطوات التالية', reviewText: 'راجع هذا العرض مع بقية العروض واختر الوكيل الأنسب لاحتياجاتك.', btnReview: 'راجع العرض' },
  ja: { subject: (t) => `「${t}」に新しい入札が届きました`, h1: '\u{1F4EC} 新しい入札が届きました！', h2: (a) => `${a} が入札しました`, agentFallback: 'エージェント', lblTrip: '旅：', nextSteps: '次のステップ', reviewText: '他の入札とあわせて内容を確認し、最適なエージェントを選びましょう。', btnReview: '入札を確認' },
  ko: { subject: (t) => `${t}에 새 입찰이 도착했습니다`, h1: '\u{1F4EC} 새 입찰 도착!', h2: (a) => `${a}이(가) 입찰했습니다`, agentFallback: '에이전트', lblTrip: '여행:', nextSteps: '다음 단계', reviewText: '받은 다른 입찰과 함께 검토하고 가장 잘 맞는 에이전트를 선택하세요.', btnReview: '입찰 확인' },
  zh: { subject: (t) => `「${t}」收到新报价`, h1: '\u{1F4EC} 收到新报价！', h2: (a) => `${a} 提交了报价`, agentFallback: '一位代理', lblTrip: '旅程：', nextSteps: '下一步', reviewText: '将此报价与收到的其他报价一起比较，选择最适合你的代理。', btnReview: '查看报价' },
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

    const { bidId, jobId } = await req.json();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title, user_id')
      .eq('id', jobId)
      .single();

    // Get bid details
    const { data: bid } = await supabaseClient
      .from('agent_bids')
      .select('customer_facing_price, currency, agent_id')
      .eq('id', bidId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('agency_name')
      .eq('id', bid?.agent_id)
      .single();

    if (!job || !bid) {
      throw new Error('Job or bid not found');
    }

    // Notify customer via in-app notification
    await supabaseClient.from('notifications').insert({
      user_id: job.user_id,
      type: 'new_bid',
      title: '📬 New Bid Received!',
      message: `${agent?.agency_name || 'An agent'} placed a bid of ${bid.currency} ${bid.customer_facing_price} on "${job.title}".`,
      entity_type: 'agent_bid',
      entity_id: bidId,
      action_url: `/marketplace`,
    });

    // Send email notification to customer
    if (Deno.env.get('RESEND_API_KEY')) {
      // Get customer email
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('id', job.user_id)
        .single();

      if (profile?.email) {
        const lang = await resolveRecipientLanguage(supabaseClient, null, profile.email);
        const s = pickLang(STRINGS, lang);
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
              .price { font-size: 32px; color: #667eea; font-weight: bold; text-align: center; margin: 20px 0; }
              .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">${s.h1}</h1>
              </div>
              <div class="content">
                <div class="section">
                  <h2 style="margin-top: 0; color: #667eea;">${s.h2(agent?.agency_name || s.agentFallback)}</h2>
                  <p><strong>${s.lblTrip}</strong> ${job.title}</p>
                  <div class="price">${bid.currency} ${bid.customer_facing_price}</div>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">${s.nextSteps}</h3>
                  <p>${s.reviewText}</p>
                  <a href="${(Deno.env.get('SUPABASE_URL') || '').replace('//', '//app.')}/marketplace?job=${jobId}" class="button">${s.btnReview}</a>
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
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            },
            body: JSON.stringify({
              from: 'Goldsainte Marketplace <hello@goldsainte.com>',
              to: [profile.email],
              subject: s.subject(job.title),
              html: emailShell(
                "A new bid has arrived.",
                `An agent has submitted a bid of <strong>${bid.currency} ${Number(bid.customer_facing_price).toLocaleString()}</strong> for <strong>${job.title}</strong>.<br/><br/>Review it alongside any other bids and choose the specialist that fits your trip best. Everything stays protected inside Goldsainte.`,
                "Review your bids",
                "https://goldsainte.ai/my-jobs"
              ),
            }),
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.text();
            throw new Error(`Failed to send email: ${error}`);
          }

          const data = await resendResponse.json();
          console.log('Bid notification email sent to:', profile.email, 'ID:', data?.id);
        } catch (emailError) {
          console.error('Error sending bid email:', emailError);
        }
      }
    }

    console.log(`New bid notification sent for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-new-bid:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
