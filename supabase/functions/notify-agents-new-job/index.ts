import "../_shared/resend-guard.ts";
import { emailShell } from "../_shared/brandEmail.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  smsMsg: (title: string, destination: string, budgetMin: string, budgetMax: string) => string;
  subject: (title: string) => string;
  tagline: string;
  body: (name: string, titleHtml: string) => string;
  btnBid: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { smsMsg: (t, d, bm, bx) => `New job posted on the marketplace!\n\nTitle: ${t}\nDestination: ${d}\nBudget: $${bm} - $${bx}\n\nLog in to view details and place your bid!`, subject: (t) => `New trip on the marketplace: ${t}`, tagline: 'A new trip is looking for its specialist.', body: (n, t) => `Hello ${n},<br/><br/>${t} was just posted on the Goldsainte marketplace. Review the traveler's brief and place your bid before another specialist does.`, btnBid: 'View & bid' },
  fr: { smsMsg: (t, d, bm, bx) => `Nouvelle mission sur la place de marché !\n\nTitre : ${t}\nDestination : ${d}\nBudget : $${bm} - $${bx}\n\nConnectez-vous pour voir les détails et faire une offre !`, subject: (t) => `Nouveau voyage sur la place de marché : ${t}`, tagline: 'Un nouveau voyage cherche son spécialiste.', body: (n, t) => `Bonjour ${n},<br/><br/>${t} vient d'être publié sur la place de marché Goldsainte. Consultez le brief du voyageur et faites votre offre avant un autre spécialiste.`, btnBid: 'Voir et proposer' },
  es: { smsMsg: (t, d, bm, bx) => `¡Nuevo trabajo publicado en el marketplace!\n\nTítulo: ${t}\nDestino: ${d}\nPresupuesto: $${bm} - $${bx}\n\n¡Inicia sesión para ver los detalles y hacer tu oferta!`, subject: (t) => `Nuevo viaje en el marketplace: ${t}`, tagline: 'Un nuevo viaje busca a su especialista.', body: (n, t) => `Hola ${n}:<br/><br/>${t} se acaba de publicar en el marketplace de Goldsainte. Revisa el brief del viajero y haz tu oferta antes que otro especialista.`, btnBid: 'Ver y ofertar' },
  de: { smsMsg: (t, d, bm, bx) => `Neuer Auftrag auf dem Marktplatz!\n\nTitel: ${t}\nZiel: ${d}\nBudget: $${bm} - $${bx}\n\nMelden Sie sich an, um Details zu sehen und zu bieten!`, subject: (t) => `Neue Reise auf dem Marktplatz: ${t}`, tagline: 'Eine neue Reise sucht ihren Spezialisten.', body: (n, t) => `Hallo ${n},<br/><br/>${t} wurde soeben auf dem Goldsainte-Marktplatz veröffentlicht. Prüfen Sie den Brief des Reisenden und bieten Sie, bevor es ein anderer Spezialist tut.`, btnBid: 'Ansehen & bieten' },
  it: { smsMsg: (t, d, bm, bx) => `Nuovo incarico sul marketplace!\n\nTitolo: ${t}\nDestinazione: ${d}\nBudget: $${bm} - $${bx}\n\nAccedi per vedere i dettagli e fare la tua offerta!`, subject: (t) => `Nuovo viaggio sul marketplace: ${t}`, tagline: 'Un nuovo viaggio cerca il suo specialista.', body: (n, t) => `Ciao ${n},<br/><br/>${t} è appena stato pubblicato sul marketplace Goldsainte. Esamina il brief del viaggiatore e fai la tua offerta prima di un altro specialista.`, btnBid: 'Vedi e offri' },
  pt: { smsMsg: (t, d, bm, bx) => `Novo trabalho publicado no marketplace!\n\nTítulo: ${t}\nDestino: ${d}\nOrçamento: $${bm} - $${bx}\n\nEntre para ver os detalhes e dar seu lance!`, subject: (t) => `Nova viagem no marketplace: ${t}`, tagline: 'Uma nova viagem procura seu especialista.', body: (n, t) => `Olá ${n},<br/><br/>${t} acaba de ser publicada no marketplace da Goldsainte. Revise o briefing do viajante e dê seu lance antes de outro especialista.`, btnBid: 'Ver e dar lance' },
  ar: { smsMsg: (t, d, bm, bx) => `مهمة جديدة في السوق!\n\nالعنوان: ${t}\nالوجهة: ${d}\nالميزانية: $${bm} - $${bx}\n\nسجّل الدخول لعرض التفاصيل وتقديم عرضك!`, subject: (t) => `رحلة جديدة في السوق: ${t}`, tagline: 'رحلة جديدة تبحث عن مختصها.', body: (n, t) => `مرحباً ${n}،<br/><br/>نُشرت ${t} للتو في سوق Goldsainte. راجع موجز المسافر وقدّم عرضك قبل مختص آخر.`, btnBid: 'اعرض وقدّم' },
  ja: { smsMsg: (t, d, bm, bx) => `マーケットプレイスに新しい案件！\n\nタイトル：${t}\n目的地：${d}\n予算：$${bm} - $${bx}\n\nログインして詳細を確認し、入札しましょう！`, subject: (t) => `マーケットプレイスに新しい旅：${t}`, tagline: '新しい旅がスペシャリストを探しています。', body: (n, t) => `${n} さん、こんにちは。<br/><br/>${t} が Goldsainte マーケットプレイスに公開されました。旅行者のブリーフを確認し、他のスペシャリストより先に入札しましょう。`, btnBid: '見る＆入札' },
  ko: { smsMsg: (t, d, bm, bx) => `마켓플레이스에 새 작업이 게시되었습니다!\n\n제목: ${t}\n목적지: ${d}\n예산: $${bm} - $${bx}\n\n로그인해 상세를 보고 입찰하세요!`, subject: (t) => `마켓플레이스의 새 여행: ${t}`, tagline: '새 여행이 전문가를 찾고 있습니다.', body: (n, t) => `안녕하세요 ${n}님,<br/><br/>${t}이(가) 방금 Goldsainte 마켓플레이스에 게시되었습니다. 여행자 브리프를 검토하고 다른 전문가보다 먼저 입찰하세요.`, btnBid: '보기 & 입찰' },
  zh: { smsMsg: (t, d, bm, bx) => `市场上有新任务发布！\n\n标题：${t}\n目的地：${d}\n预算：$${bm} - $${bx}\n\n登录查看详情并出价！`, subject: (t) => `市场新旅程：${t}`, tagline: '一段新旅程正在寻找它的专家。', body: (n, t) => `你好，${n}：<br/><br/>${t} 刚刚发布到 Goldsainte 市场。查看旅行者需求，抢在其他专家之前出价。`, btnBid: '查看并出价' },
};
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { jobId, jobTitle, jobDescription, destination, budgetMin, budgetMax } = await req.json();

    console.log('Notifying agents about new job:', jobId);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active and verified travel agents
    const { data: agents, error: agentsError } = await supabaseClient
      .from('travel_agents')
      .select('id, email, phone, whatsapp_number, agency_name, primary_contact_name, email_notifications_enabled, sms_notifications_enabled, whatsapp_notifications_enabled')
      .eq('is_active', true)
      .eq('is_verified', true);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      throw agentsError;
    }

    if (!agents || agents.length === 0) {
      console.log('No agents to notify');
      return new Response(
        JSON.stringify({ message: 'No agents to notify', notified: 0 }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const notificationPromises = [];

    for (const agent of agents) {
      const lang = await resolveRecipientLanguage(supabaseClient, null, agent.email ?? null);
      const sa = pickLang(STRINGS, lang);
      const message = sa.smsMsg(jobTitle, destination, String(budgetMin), String(budgetMax));

      // Send Email via Resend (only if opted in)
      if (agent.email && resendApiKey && agent.email_notifications_enabled) {
        notificationPromises.push(
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Goldsainte <hello@goldsainte.com>',
              to: [agent.email],
              subject: sa.subject(jobTitle),
              html: emailShell(
                sa.tagline,
                sa.body(agent.primary_contact_name || agent.agency_name, `<strong>${jobTitle}</strong>`),
                sa.btnBid,
                "https://goldsainte.ai/agent-dashboard"
              ),
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(`Email sent to ${agent.email}:`, data);
              return data;
            })
            .catch((error) => {
              console.error(`Failed to send email to ${agent.email}:`, error);
              return null;
            })
        );
      }

      // Send SMS via Twilio (only if opted in)
      if (agent.phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber && agent.sms_notifications_enabled) {
        const smsUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        notificationPromises.push(
          fetch(smsUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: agent.phone,
              From: twilioPhoneNumber,
              Body: message,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(`SMS sent to ${agent.phone}:`, data);
              return data;
            })
            .catch((error) => {
              console.error(`Failed to send SMS to ${agent.phone}:`, error);
              return null;
            })
        );
      }

      // Send WhatsApp message via Twilio (only if opted in)
      if (agent.whatsapp_number && twilioAccountSid && twilioAuthToken && twilioPhoneNumber && agent.whatsapp_notifications_enabled) {
        const whatsappUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        notificationPromises.push(
          fetch(whatsappUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: `whatsapp:${agent.whatsapp_number}`,
              From: `whatsapp:${twilioPhoneNumber}`,
              Body: message,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(`WhatsApp sent to ${agent.whatsapp_number}:`, data);
              return data;
            })
            .catch((error) => {
              console.error(`Failed to send WhatsApp to ${agent.whatsapp_number}:`, error);
              return null;
            })
        );
      }
    }

    // Wait for all notifications to complete
    await Promise.all(notificationPromises);

    console.log(`Successfully notified ${agents.length} agents`);

    return new Response(
      JSON.stringify({ message: 'Agents notified successfully', notified: agents.length }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-agents-new-job function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
