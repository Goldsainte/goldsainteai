import "../_shared/resend-guard.ts";
import { emailShell } from "../_shared/brandEmail.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  notifTitle: string;
  notifMsg: (score: string, title: string) => string;
  subject: (title: string) => string;
  tagline: string;
  body: (titleHtml: string) => string;
  btnView: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { notifTitle: '\u{1F3AF} Priority Job Match', notifMsg: (sc, t) => `You're a ${sc}% match for ${t}`, subject: (t) => `Priority match: ${t}`, tagline: 'A trip matched your specialty.', body: (t) => `${t} matches your profile and expertise. Review the traveler's brief on your dashboard and place your bid \u2014 priority matches move quickly.`, btnView: 'View the match' },
  fr: { notifTitle: '\u{1F3AF} Correspondance prioritaire', notifMsg: (sc, t) => `Vous correspondez à ${sc}% à ${t}`, subject: (t) => `Correspondance prioritaire : ${t}`, tagline: 'Un voyage correspond à votre spécialité.', body: (t) => `${t} correspond à votre profil et votre expertise. Consultez le brief du voyageur sur votre tableau de bord et faites votre offre \u2014 les correspondances prioritaires partent vite.`, btnView: 'Voir la correspondance' },
  es: { notifTitle: '\u{1F3AF} Coincidencia prioritaria', notifMsg: (sc, t) => `Coincides al ${sc}% con ${t}`, subject: (t) => `Coincidencia prioritaria: ${t}`, tagline: 'Un viaje coincide con tu especialidad.', body: (t) => `${t} coincide con tu perfil y experiencia. Revisa el brief del viajero en tu panel y haz tu oferta \u2014 las coincidencias prioritarias vuelan.`, btnView: 'Ver la coincidencia' },
  de: { notifTitle: '\u{1F3AF} Prioritäts-Match', notifMsg: (sc, t) => `Sie passen zu ${sc}% auf ${t}`, subject: (t) => `Prioritäts-Match: ${t}`, tagline: 'Eine Reise passt zu Ihrer Spezialität.', body: (t) => `${t} passt zu Ihrem Profil und Ihrer Expertise. Prüfen Sie den Brief des Reisenden in Ihrem Dashboard und bieten Sie \u2014 Prioritäts-Matches sind schnell vergeben.`, btnView: 'Match ansehen' },
  it: { notifTitle: '\u{1F3AF} Match prioritario', notifMsg: (sc, t) => `Sei compatibile al ${sc}% con ${t}`, subject: (t) => `Match prioritario: ${t}`, tagline: 'Un viaggio corrisponde alla tua specialità.', body: (t) => `${t} corrisponde al tuo profilo e alla tua esperienza. Esamina il brief del viaggiatore nella dashboard e fai la tua offerta \u2014 i match prioritari si muovono in fretta.`, btnView: 'Vedi il match' },
  pt: { notifTitle: '\u{1F3AF} Match prioritário', notifMsg: (sc, t) => `Você tem ${sc}% de compatibilidade com ${t}`, subject: (t) => `Match prioritário: ${t}`, tagline: 'Uma viagem combinou com sua especialidade.', body: (t) => `${t} combina com seu perfil e experiência. Revise o briefing do viajante no seu painel e dê seu lance \u2014 matches prioritários voam.`, btnView: 'Ver o match' },
  ar: { notifTitle: '\u{1F3AF} مطابقة ذات أولوية', notifMsg: (sc, t) => `تطابقك ${sc}% مع ${t}`, subject: (t) => `مطابقة ذات أولوية: ${t}`, tagline: 'رحلة تطابق تخصصك.', body: (t) => `${t} تطابق ملفك وخبرتك. راجع موجز المسافر في لوحتك وقدّم عرضك \u2014 المطابقات ذات الأولوية تُحسم سريعاً.`, btnView: 'اعرض المطابقة' },
  ja: { notifTitle: '\u{1F3AF} 優先マッチ', notifMsg: (sc, t) => `${t} と ${sc}% マッチしています`, subject: (t) => `優先マッチ：${t}`, tagline: '旅があなたの専門にマッチしました。', body: (t) => `${t} はあなたのプロフィールと専門性にマッチしています。ダッシュボードで旅行者のブリーフを確認して入札しましょう \u2014 優先マッチはすぐ動きます。`, btnView: 'マッチを見る' },
  ko: { notifTitle: '\u{1F3AF} 우선 매칭', notifMsg: (sc, t) => `${t}와(과) ${sc}% 일치합니다`, subject: (t) => `우선 매칭: ${t}`, tagline: '여행이 당신의 전문 분야와 매칭되었습니다.', body: (t) => `${t}이(가) 당신의 프로필 및 전문성과 일치합니다. 대시보드에서 여행자 브리프를 검토하고 입찰하세요 \u2014 우선 매칭은 빠르게 마감됩니다.`, btnView: '매칭 보기' },
  zh: { notifTitle: '\u{1F3AF} 优先匹配', notifMsg: (sc, t) => `你与「${t}」匹配度 ${sc}%`, subject: (t) => `优先匹配：${t}`, tagline: '一段旅程匹配了你的专长。', body: (t) => `「${t}」与你的资料和专长相符。在工作台查看旅行者需求并出价 \u2014 优先匹配转瞬即逝。`, btnView: '查看匹配' },
};
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface MatchingRequest {
  jobId: string;
  inquiryId?: string;
  generateScores?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { jobId, inquiryId, generateScores = true } = await req.json() as MatchingRequest;

    // Get job details
    const { data: job, error: jobError } = await supabaseClient
      .from("marketplace_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found");
    }

    // Get all active and verified agents
    const { data: agents } = await supabaseClient
      .from("travel_agents")
      .select("*")
      .eq("is_active", true)
      .eq("is_verified", true);

    if (!agents || agents.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], message: "No available agents" }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Calculate matching scores
    const matches = agents.map((agent) => {
      let score = 0;
      const factors: Record<string, number> = {};

      // Factor 1: Specializations match (30 points)
      if (agent.specializations && job.booking_type) {
        const hasSpecialization = agent.specializations.some((spec: string) =>
          spec.toLowerCase().includes(job.booking_type.toLowerCase()) ||
          job.booking_type.toLowerCase().includes(spec.toLowerCase())
        );
        if (hasSpecialization) {
          score += 30;
          factors.specialization_match = 30;
        }
      }

      // Factor 2: Destination match (25 points)
      if (agent.destinations && job.destination) {
        const hasDestination = agent.destinations.some((dest: string) =>
          dest.toLowerCase().includes(job.destination?.toLowerCase() || "") ||
          job.destination?.toLowerCase().includes(dest.toLowerCase())
        );
        if (hasDestination) {
          score += 25;
          factors.destination_match = 25;
        }
      }

      // Factor 3: Rating (20 points)
      const ratingScore = (agent.rating / 5) * 20;
      score += ratingScore;
      factors.rating_score = ratingScore;

      // Factor 4: Experience (15 points)
      if (agent.experience_years) {
        const expScore = Math.min((agent.experience_years / 10) * 15, 15);
        score += expScore;
        factors.experience_score = expScore;
      }

      // Factor 5: Total reviews (10 points)
      if (agent.total_reviews) {
        const reviewScore = Math.min((agent.total_reviews / 50) * 10, 10);
        score += reviewScore;
        factors.reviews_score = reviewScore;
      }

      // Determine confidence level
      let confidence: "low" | "medium" | "high" = "low";
      if (score >= 70) confidence = "high";
      else if (score >= 50) confidence = "medium";

      return {
        agent_id: agent.id,
        agent_name: agent.agency_name,
        match_score: Math.round(score),
        confidence_level: confidence,
        matching_factors: factors,
        rating: agent.rating,
        total_reviews: agent.total_reviews,
      };
    });

    // Sort by score
    matches.sort((a, b) => b.match_score - a.match_score);

    // Take top 10
    const topMatches = matches.slice(0, 10);

    // Optionally store scores in database
    if (generateScores) {
      const scoresData = topMatches.map((match) => ({
        job_id: jobId,
        agent_id: match.agent_id,
        match_score: match.match_score,
        confidence_level: match.confidence_level,
        matching_factors: match.matching_factors,
      }));

      // Delete existing scores for this job
      await supabaseClient
        .from("ai_matching_scores")
        .delete()
        .eq("job_id", jobId);

      // Insert new scores
      await supabaseClient
        .from("ai_matching_scores")
        .insert(scoresData);
    }

    // Send priority notifications to top 3 high-confidence agents
    const priorityMatches = topMatches.filter(m => m.confidence_level === 'high').slice(0, 3);
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (priorityMatches.length > 0 && resendApiKey) {
      // Get agent details with user info
      for (const match of priorityMatches) {
        const { data: agent } = await supabaseClient
          .from('travel_agents')
          .select('*, profiles(email, username)')
          .eq('id', match.agent_id)
          .single();

        if (agent?.profiles?.email) {
          const lang = await resolveRecipientLanguage(supabaseClient, null, agent.profiles.email);
          const s = pickLang(STRINGS, lang);
          // Create in-app notification
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: agent.user_id,
              type: 'system_announcement',
              title: s.notifTitle,
              message: s.notifMsg(String(match.match_score), job.title),
              entity_type: 'marketplace_job',
              entity_id: jobId,
              action_url: `/marketplace?job=${jobId}`
            });

          // Send priority email
          try {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px;">🎯 Priority Job Match</h1>
                  <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">${match.match_score}% Match Score</p>
                </div>
                
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #059669; font-weight: bold; font-size: 14px;">
                      ⚡ You're in the top 3 matches for this opportunity
                    </p>
                  </div>
                  
                  <h2 style="color: #1f2937; margin-top: 0;">${job.title}</h2>
                  
                  <div style="margin: 20px 0;">
                    <p style="color: #6b7280; margin: 5px 0;"><strong>Destination:</strong> ${job.destination}</p>
                    <p style="color: #6b7280; margin: 5px 0;"><strong>Type:</strong> ${job.booking_type}</p>
                    ${job.budget_max ? `<p style="color: #6b7280; margin: 5px 0;"><strong>Budget:</strong> ${job.currency} ${job.budget_min || 0} - ${job.budget_max}</p>` : ''}
                  </div>
                  
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #78350f; font-size: 14px;">
                      <strong>Why you're a great match:</strong>
                    </p>
                    <ul style="margin: 10px 0 0; padding-left: 20px; color: #78350f;">
                      ${match.matching_factors.specialization_match ? '<li>Your specialization matches this booking type</li>' : ''}
                      ${match.matching_factors.destination_match ? '<li>You have expertise in this destination</li>' : ''}
                      ${match.matching_factors.rating_score ? '<li>Your excellent rating and reviews</li>' : ''}
                    </ul>
                  </div>
                  
                  <div style="margin: 30px 0; text-align: center;">
                    <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/marketplace?job=${jobId}" 
                       style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                      View Job & Submit Bid
                    </a>
                  </div>
                  
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                    Respond quickly to increase your chances of winning this job
                  </p>
                </div>
              </div>
            `;

            const resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: 'Goldsainte Marketplace <hello@goldsainte.com>',
                to: [agent.profiles.email],
                subject: s.subject(job.title),
                html: emailShell(
                  s.tagline,
                  s.body(`<strong>${job.title}</strong>`),
                  s.btnView,
                  "https://goldsainte.ai/agent-dashboard"
                ),
              }),
            });

            if (!resendResponse.ok) {
              const error = await resendResponse.text();
              throw new Error(`Failed to send email: ${error}`);
            }

            const data = await resendResponse.json();
            console.log(`Priority email sent to agent ${agent.id}, ID:`, data?.id);
          } catch (emailError) {
            console.error(`Failed to send priority email to agent ${agent.id}:`, emailError);
          }
        }
      }
    }

    // Update inquiry with matched agents if inquiryId provided
    if (inquiryId) {
      const matchedAgentIds = topMatches.map(m => m.agent_id);
      await supabaseClient
        .from('agent_inquiries')
        .update({
          matched_agent_ids: matchedAgentIds,
          notification_sent_at: new Date().toISOString()
        })
        .eq('id', inquiryId);
    }

    return new Response(
      JSON.stringify({
        matches: topMatches,
        total_agents_evaluated: agents.length,
        priority_notifications_sent: priorityMatches.length,
        job_details: {
          title: job.title,
          booking_type: job.booking_type,
          destination: job.destination,
        },
      }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Matching Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 400 }
    );
  }
});
