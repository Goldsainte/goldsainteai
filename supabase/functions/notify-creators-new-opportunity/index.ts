import "../_shared/resend-guard.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  notifMsg: (destination: string) => string;
  subject: (destination: string) => string;
  h1: string;
  badge: string;
  h2Trip: string;
  lblDestination: string;
  lblBudget: string;
  lblType: string;
  lblDescription: string;
  h3Why: string;
  aiMatched: string;
  whatOffer: string;
  li1: string;
  li2: string;
  li3: string;
  li4: string;
  btnView: string;
  cocurated: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { notifMsg: (d) => `A traveler is looking for a content creator to design their ${d} experience. This matches your profile!`, subject: (d) => `\u{1F3A8} New CoCurated Trip to ${d}`, h1: '\u{1F3A8} New CoCurated Opportunity', badge: 'CONTENT CREATOR', h2Trip: 'Trip Details', lblDestination: 'Destination:', lblBudget: 'Budget:', lblType: 'Type:', lblDescription: 'Description:', h3Why: "Why You're Matched", aiMatched: 'Our AI matched you with this opportunity based on your content style, destination expertise, and audience engagement.', whatOffer: 'What You Can Offer:', li1: 'Design a unique, Instagram-worthy itinerary', li2: 'Share insider tips and hidden gems', li3: 'Create content from the trip', li4: 'Earn commission on the booking', btnView: 'View Opportunity & Submit Proposal', cocurated: 'This is a CoCurated opportunity. Submit your creative proposal to win this collaboration!' },
  fr: { notifMsg: (d) => `Un voyageur cherche un créateur de contenu pour concevoir son expérience ${d}. Cela correspond à votre profil !`, subject: (d) => `\u{1F3A8} Nouveau voyage CoCurated vers ${d}`, h1: '\u{1F3A8} Nouvelle opportunité CoCurated', badge: 'CRÉATEUR DE CONTENU', h2Trip: 'Détails du voyage', lblDestination: 'Destination :', lblBudget: 'Budget :', lblType: 'Type :', lblDescription: 'Description :', h3Why: 'Pourquoi vous êtes sélectionné', aiMatched: 'Notre IA vous a associé à cette opportunité selon votre style de contenu, votre expertise de la destination et l\'engagement de votre audience.', whatOffer: 'Ce que vous pouvez offrir :', li1: 'Concevoir un itinéraire unique, digne d\'Instagram', li2: 'Partager conseils d\'initié et trésors cachés', li3: 'Créer du contenu pendant le voyage', li4: 'Gagner une commission sur la réservation', btnView: "Voir l'opportunité et proposer", cocurated: 'Ceci est une opportunité CoCurated. Soumettez votre proposition créative pour remporter cette collaboration !' },
  es: { notifMsg: (d) => `Un viajero busca un creador de contenido para diseñar su experiencia en ${d}. ¡Encaja con tu perfil!`, subject: (d) => `\u{1F3A8} Nuevo viaje CoCurated a ${d}`, h1: '\u{1F3A8} Nueva oportunidad CoCurated', badge: 'CREADOR DE CONTENIDO', h2Trip: 'Detalles del viaje', lblDestination: 'Destino:', lblBudget: 'Presupuesto:', lblType: 'Tipo:', lblDescription: 'Descripción:', h3Why: 'Por qué te hemos emparejado', aiMatched: 'Nuestra IA te asoció con esta oportunidad por tu estilo de contenido, tu experiencia en el destino y el engagement de tu audiencia.', whatOffer: 'Lo que puedes ofrecer:', li1: 'Diseñar un itinerario único, digno de Instagram', li2: 'Compartir consejos de experto y joyas ocultas', li3: 'Crear contenido durante el viaje', li4: 'Ganar comisión por la reserva', btnView: 'Ver oportunidad y proponer', cocurated: '¡Esta es una oportunidad CoCurated. Envía tu propuesta creativa para ganar esta colaboración!' },
  de: { notifMsg: (d) => `Ein Reisender sucht einen Content-Creator für sein ${d}-Erlebnis. Das passt zu Ihrem Profil!`, subject: (d) => `\u{1F3A8} Neue CoCurated-Reise nach ${d}`, h1: '\u{1F3A8} Neue CoCurated-Gelegenheit', badge: 'CONTENT CREATOR', h2Trip: 'Reisedetails', lblDestination: 'Ziel:', lblBudget: 'Budget:', lblType: 'Art:', lblDescription: 'Beschreibung:', h3Why: 'Warum Sie passen', aiMatched: 'Unsere KI hat Sie aufgrund Ihres Content-Stils, Ihrer Zielgebiets-Expertise und Ihres Audience-Engagements zugeordnet.', whatOffer: 'Was Sie bieten können:', li1: 'Einen einzigartigen, Instagram-tauglichen Reiseplan gestalten', li2: 'Insider-Tipps und Geheimtipps teilen', li3: 'Content von der Reise erstellen', li4: 'Provision auf die Buchung verdienen', btnView: 'Gelegenheit ansehen & Vorschlag einreichen', cocurated: 'Dies ist eine CoCurated-Gelegenheit. Reichen Sie Ihren kreativen Vorschlag ein und gewinnen Sie diese Zusammenarbeit!' },
  it: { notifMsg: (d) => `Un viaggiatore cerca un creator per progettare la sua esperienza a ${d}. Corrisponde al tuo profilo!`, subject: (d) => `\u{1F3A8} Nuovo viaggio CoCurated a ${d}`, h1: '\u{1F3A8} Nuova opportunità CoCurated', badge: 'CONTENT CREATOR', h2Trip: 'Dettagli del viaggio', lblDestination: 'Destinazione:', lblBudget: 'Budget:', lblType: 'Tipo:', lblDescription: 'Descrizione:', h3Why: 'Perché sei stato scelto', aiMatched: 'La nostra IA ti ha abbinato a questa opportunità in base a stile dei contenuti, competenza sulla destinazione e coinvolgimento del pubblico.', whatOffer: 'Cosa puoi offrire:', li1: 'Progettare un itinerario unico, degno di Instagram', li2: 'Condividere consigli da insider e gemme nascoste', li3: 'Creare contenuti dal viaggio', li4: 'Guadagnare una commissione sulla prenotazione', btnView: 'Vedi opportunità e proponi', cocurated: 'Questa è un\'opportunità CoCurated. Invia la tua proposta creativa per aggiudicarti questa collaborazione!' },
  pt: { notifMsg: (d) => `Um viajante procura um criador de conteúdo para desenhar sua experiência em ${d}. Combina com seu perfil!`, subject: (d) => `\u{1F3A8} Nova viagem CoCurated para ${d}`, h1: '\u{1F3A8} Nova oportunidade CoCurated', badge: 'CRIADOR DE CONTEÚDO', h2Trip: 'Detalhes da viagem', lblDestination: 'Destino:', lblBudget: 'Orçamento:', lblType: 'Tipo:', lblDescription: 'Descrição:', h3Why: 'Por que você foi selecionado', aiMatched: 'Nossa IA combinou você com esta oportunidade com base no seu estilo de conteúdo, expertise no destino e engajamento da audiência.', whatOffer: 'O que você pode oferecer:', li1: 'Desenhar um roteiro único, digno de Instagram', li2: 'Compartilhar dicas de insider e joias escondidas', li3: 'Criar conteúdo da viagem', li4: 'Ganhar comissão na reserva', btnView: 'Ver oportunidade e propor', cocurated: 'Esta é uma oportunidade CoCurated. Envie sua proposta criativa para conquistar esta colaboração!' },
  ar: { notifMsg: (d) => `مسافر يبحث عن صانع محتوى لتصميم تجربته في ${d}. هذا يطابق ملفك!`, subject: (d) => `\u{1F3A8} رحلة CoCurated جديدة إلى ${d}`, h1: '\u{1F3A8} فرصة CoCurated جديدة', badge: 'صانع محتوى', h2Trip: 'تفاصيل الرحلة', lblDestination: 'الوجهة:', lblBudget: 'الميزانية:', lblType: 'النوع:', lblDescription: 'الوصف:', h3Why: 'لماذا تمت مطابقتك', aiMatched: 'طابقك ذكاؤنا الاصطناعي مع هذه الفرصة بناءً على أسلوب محتواك وخبرتك بالوجهة وتفاعل جمهورك.', whatOffer: 'ما يمكنك تقديمه:', li1: 'تصميم مسار فريد جدير بإنستغرام', li2: 'مشاركة نصائح الخبراء والكنوز الخفية', li3: 'صناعة محتوى من الرحلة', li4: 'كسب عمولة على الحجز', btnView: 'اعرض الفرصة وقدّم اقتراحك', cocurated: 'هذه فرصة CoCurated. قدّم اقتراحك الإبداعي للفوز بهذا التعاون!' },
  ja: { notifMsg: (d) => `旅行者が ${d} の体験をデザインするコンテンツクリエイターを探しています。あなたのプロフィールにマッチしました！`, subject: (d) => `\u{1F3A8} ${d} への新しい CoCurated 旅`, h1: '\u{1F3A8} 新しい CoCurated の機会', badge: 'コンテンツクリエイター', h2Trip: '旅の詳細', lblDestination: '目的地：', lblBudget: '予算：', lblType: '種類：', lblDescription: '説明：', h3Why: 'マッチした理由', aiMatched: 'コンテンツのスタイル、目的地の専門性、オーディエンスのエンゲージメントに基づき、AI がこの機会とマッチングしました。', whatOffer: 'あなたが提供できること：', li1: 'Instagram 映えする唯一無二の旅程をデザイン', li2: 'インサイダー情報と隠れた名所を共有', li3: '旅からコンテンツを制作', li4: '予約のコミッションを獲得', btnView: '機会を見て提案する', cocurated: 'これは CoCurated の機会です。クリエイティブな提案でこのコラボを勝ち取りましょう！' },
  ko: { notifMsg: (d) => `한 여행자가 ${d} 경험을 디자인할 콘텐츠 크리에이터를 찾고 있습니다. 당신의 프로필과 일치합니다!`, subject: (d) => `\u{1F3A8} ${d}행 새 CoCurated 여행`, h1: '\u{1F3A8} 새 CoCurated 기회', badge: '콘텐츠 크리에이터', h2Trip: '여행 상세', lblDestination: '목적지:', lblBudget: '예산:', lblType: '유형:', lblDescription: '설명:', h3Why: '매칭된 이유', aiMatched: '콘텐츠 스타일, 목적지 전문성, 오디언스 참여도를 바탕으로 AI가 이 기회와 매칭했습니다.', whatOffer: '당신이 제공할 수 있는 것:', li1: '인스타그램에 어울리는 유니크한 일정 디자인', li2: '인사이더 팁과 숨은 명소 공유', li3: '여행에서 콘텐츠 제작', li4: '예약 커미션 획득', btnView: '기회 보기 & 제안 제출', cocurated: 'CoCurated 기회입니다. 창의적인 제안을 제출해 이 협업을 따내세요!' },
  zh: { notifMsg: (d) => `一位旅行者正在寻找内容创作者来设计其${d}体验。这与你的资料匹配！`, subject: (d) => `\u{1F3A8} 新的 CoCurated ${d} 之旅`, h1: '\u{1F3A8} 新的 CoCurated 机会', badge: '内容创作者', h2Trip: '旅程详情', lblDestination: '目的地：', lblBudget: '预算：', lblType: '类型：', lblDescription: '描述：', h3Why: '为何匹配到你', aiMatched: '我们的 AI 基于你的内容风格、目的地专长与受众互动，为你匹配了这个机会。', whatOffer: '你可以提供：', li1: '设计独一无二、适合 Instagram 的行程', li2: '分享内行建议与隐藏宝藏', li3: '在旅程中创作内容', li4: '赚取预订佣金', btnView: '查看机会并提交提案', cocurated: '这是一个 CoCurated 机会。提交你的创意提案，赢得这次合作！' },
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

    const { jobId, matchedCreatorIds } = await req.json();

    // Fetch job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Fetch matched creators
    const { data: creators } = await supabaseClient
      .from('profiles')
      .select('id, username, email')
      .in('id', matchedCreatorIds);

    if (!creators || creators.length === 0) {
      console.log('No matched creators found');
      return new Response(
        JSON.stringify({ success: true, message: 'No creators to notify' }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const jobUrl = `${(Deno.env.get('SUPABASE_URL') || '').replace('//', '//app.')}/marketplace?job=${jobId}`;

    // Send notifications to each creator
    for (const creator of creators) {
      const lang = await resolveRecipientLanguage(supabaseClient, null, creator.email ?? null);
      const s = pickLang(STRINGS, lang);
      // Create in-app notification
      await supabaseClient.from('notifications').insert({
        user_id: creator.id,
        type: 'system_announcement',
        title: '🎨 New CoCurated Trip Opportunity',
        message: s.notifMsg(job.destination),
        entity_type: 'marketplace_job',
        entity_id: jobId,
        action_url: `/marketplace?job=${jobId}`,
      });

      // Send email notification
      if (creator.email && Deno.env.get('RESEND_API_KEY')) {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .badge { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
              .button { display: inline-block; background: #f59e0b; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">${s.h1}</h1>
                <p style="margin: 10px 0 0 0;"><span class="badge">${s.badge}</span></p>
              </div>
              <div class="content">
                <div class="section">
                  <h2 style="margin-top: 0; color: #f59e0b;">${s.h2Trip}</h2>
                  <p><strong>${s.lblDestination}</strong> ${job.destination}</p>
                  ${job.budget_max ? `<p><strong>${s.lblBudget}</strong> ${job.currency} ${job.budget_max}</p>` : ''}
                  <p><strong>${s.lblType}</strong> ${job.booking_type}</p>
                  <p><strong>${s.lblDescription}</strong></p>
                  <p>${job.description.substring(0, 200)}...</p>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">${s.h3Why}</h3>
                  <p>${s.aiMatched}</p>
                  <p><strong>${s.whatOffer}</strong></p>
                  <ul>
                    <li>${s.li1}</li>
                    <li>${s.li2}</li>
                    <li>${s.li3}</li>
                    <li>${s.li4}</li>
                  </ul>
                </div>

                <a href="${jobUrl}" class="button">${s.btnView}</a>

                <p style="text-align: center; color: #666; font-size: 14px;">
                  ${s.cocurated}
                </p>
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
              from: 'Goldsainte Creators <hello@goldsainte.com>',
              to: [creator.email],
              subject: s.subject(job.destination),
              html: emailHtml,
            }),
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.text();
            throw new Error(`Failed to send email: ${error}`);
          }

          const data = await resendResponse.json();
          console.log('Creator notification sent to:', creator.email, 'ID:', data?.id);
        } catch (emailError) {
          console.error('Error sending creator email:', emailError);
        }
      }
    }

    console.log(`Notified ${creators.length} creators for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true, notifiedCount: creators.length }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-creators-new-opportunity:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
