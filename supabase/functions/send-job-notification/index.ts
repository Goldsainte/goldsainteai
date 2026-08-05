import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface JN { subject: (title: string) => string; h2: string; p1: (titleHtml: string) => string; p2: string; }
interface S {
  newBid: JN;
  jobAssigned: JN;
  jobCompleted: JN;
  paymentReceived: JN;
  lblAmount: string;
  messageReceived: JN;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { newBid: { subject: (t) => `New bid on your job: ${t}`, h2: 'You have a new bid!', p1: (t) => `A travel agent has submitted a bid for your job: ${t}`, p2: 'Log in to review the bid and agent profile.' }, jobAssigned: { subject: (t) => `Job assigned: ${t}`, h2: 'Congratulations!', p1: (t) => `You've been assigned to the job: ${t}`, p2: 'Please review the details and begin working on this exciting project!' }, jobCompleted: { subject: (t) => `Job completed: ${t}`, h2: 'Job Completed', p1: (t) => `The agent has marked your job as complete: ${t}`, p2: 'Please review the deliverables and approve if satisfied.' }, paymentReceived: { subject: (t) => `Payment received for: ${t}`, h2: 'Payment Received', p1: (t) => `Your payment for ${t} has been processed successfully.`, p2: '' }, lblAmount: 'Amount:', messageReceived: { subject: (t) => `New message about: ${t}`, h2: 'New Message', p1: (t) => `You have a new message regarding: ${t}`, p2: 'Log in to view and respond to the message.' } },
  fr: { newBid: { subject: (t) => `Nouvelle offre sur votre mission : ${t}`, h2: 'Vous avez une nouvelle offre !', p1: (t) => `Un agent de voyage a soumis une offre pour votre mission : ${t}`, p2: "Connectez-vous pour consulter l'offre et le profil de l'agent." }, jobAssigned: { subject: (t) => `Mission attribuée : ${t}`, h2: 'Félicitations !', p1: (t) => `La mission vous a été attribuée : ${t}`, p2: 'Consultez les détails et lancez-vous dans ce beau projet !' }, jobCompleted: { subject: (t) => `Mission terminée : ${t}`, h2: 'Mission terminée', p1: (t) => `L'agent a marqué votre mission comme terminée : ${t}`, p2: 'Vérifiez les livrables et validez si tout vous convient.' }, paymentReceived: { subject: (t) => `Paiement reçu pour : ${t}`, h2: 'Paiement reçu', p1: (t) => `Votre paiement pour ${t} a été traité avec succès.`, p2: '' }, lblAmount: 'Montant :', messageReceived: { subject: (t) => `Nouveau message au sujet de : ${t}`, h2: 'Nouveau message', p1: (t) => `Vous avez un nouveau message concernant : ${t}`, p2: 'Connectez-vous pour le lire et y répondre.' } },
  es: { newBid: { subject: (t) => `Nueva oferta en tu trabajo: ${t}`, h2: '¡Tienes una nueva oferta!', p1: (t) => `Un agente de viajes ha presentado una oferta para tu trabajo: ${t}`, p2: 'Inicia sesión para revisar la oferta y el perfil del agente.' }, jobAssigned: { subject: (t) => `Trabajo asignado: ${t}`, h2: '¡Enhorabuena!', p1: (t) => `Te han asignado el trabajo: ${t}`, p2: '¡Revisa los detalles y comienza con este gran proyecto!' }, jobCompleted: { subject: (t) => `Trabajo completado: ${t}`, h2: 'Trabajo completado', p1: (t) => `El agente ha marcado tu trabajo como completado: ${t}`, p2: 'Revisa los entregables y aprueba si estás conforme.' }, paymentReceived: { subject: (t) => `Pago recibido por: ${t}`, h2: 'Pago recibido', p1: (t) => `Tu pago por ${t} se ha procesado correctamente.`, p2: '' }, lblAmount: 'Importe:', messageReceived: { subject: (t) => `Nuevo mensaje sobre: ${t}`, h2: 'Nuevo mensaje', p1: (t) => `Tienes un nuevo mensaje sobre: ${t}`, p2: 'Inicia sesión para verlo y responder.' } },
  de: { newBid: { subject: (t) => `Neues Gebot auf Ihren Auftrag: ${t}`, h2: 'Sie haben ein neues Gebot!', p1: (t) => `Ein Reiseagent hat ein Gebot für Ihren Auftrag abgegeben: ${t}`, p2: 'Melden Sie sich an, um Gebot und Agentenprofil zu prüfen.' }, jobAssigned: { subject: (t) => `Auftrag zugewiesen: ${t}`, h2: 'Glückwunsch!', p1: (t) => `Ihnen wurde der Auftrag zugewiesen: ${t}`, p2: 'Prüfen Sie die Details und starten Sie in dieses spannende Projekt!' }, jobCompleted: { subject: (t) => `Auftrag abgeschlossen: ${t}`, h2: 'Auftrag abgeschlossen', p1: (t) => `Der Agent hat Ihren Auftrag als abgeschlossen markiert: ${t}`, p2: 'Prüfen Sie die Ergebnisse und geben Sie sie frei, wenn alles passt.' }, paymentReceived: { subject: (t) => `Zahlung eingegangen für: ${t}`, h2: 'Zahlung eingegangen', p1: (t) => `Ihre Zahlung für ${t} wurde erfolgreich verarbeitet.`, p2: '' }, lblAmount: 'Betrag:', messageReceived: { subject: (t) => `Neue Nachricht zu: ${t}`, h2: 'Neue Nachricht', p1: (t) => `Sie haben eine neue Nachricht zu: ${t}`, p2: 'Melden Sie sich an, um sie zu lesen und zu antworten.' } },
  it: { newBid: { subject: (t) => `Nuova offerta sul tuo incarico: ${t}`, h2: 'Hai una nuova offerta!', p1: (t) => `Un agente di viaggio ha presentato un'offerta per il tuo incarico: ${t}`, p2: "Accedi per esaminare l'offerta e il profilo dell'agente." }, jobAssigned: { subject: (t) => `Incarico assegnato: ${t}`, h2: 'Congratulazioni!', p1: (t) => `Ti è stato assegnato l'incarico: ${t}`, p2: 'Esamina i dettagli e parti con questo bel progetto!' }, jobCompleted: { subject: (t) => `Incarico completato: ${t}`, h2: 'Incarico completato', p1: (t) => `L'agente ha segnato il tuo incarico come completato: ${t}`, p2: 'Esamina i deliverable e approva se soddisfatto.' }, paymentReceived: { subject: (t) => `Pagamento ricevuto per: ${t}`, h2: 'Pagamento ricevuto', p1: (t) => `Il tuo pagamento per ${t} è stato elaborato con successo.`, p2: '' }, lblAmount: 'Importo:', messageReceived: { subject: (t) => `Nuovo messaggio su: ${t}`, h2: 'Nuovo messaggio', p1: (t) => `Hai un nuovo messaggio riguardo: ${t}`, p2: 'Accedi per leggerlo e rispondere.' } },
  pt: { newBid: { subject: (t) => `Novo lance no seu trabalho: ${t}`, h2: 'Você tem um novo lance!', p1: (t) => `Um agente de viagens enviou um lance para o seu trabalho: ${t}`, p2: 'Entre para revisar o lance e o perfil do agente.' }, jobAssigned: { subject: (t) => `Trabalho atribuído: ${t}`, h2: 'Parabéns!', p1: (t) => `Você foi designado para o trabalho: ${t}`, p2: 'Revise os detalhes e comece este projeto empolgante!' }, jobCompleted: { subject: (t) => `Trabalho concluído: ${t}`, h2: 'Trabalho concluído', p1: (t) => `O agente marcou seu trabalho como concluído: ${t}`, p2: 'Revise as entregas e aprove se estiver satisfeito.' }, paymentReceived: { subject: (t) => `Pagamento recebido por: ${t}`, h2: 'Pagamento recebido', p1: (t) => `Seu pagamento por ${t} foi processado com sucesso.`, p2: '' }, lblAmount: 'Valor:', messageReceived: { subject: (t) => `Nova mensagem sobre: ${t}`, h2: 'Nova mensagem', p1: (t) => `Você tem uma nova mensagem sobre: ${t}`, p2: 'Entre para ver e responder.' } },
  ar: { newBid: { subject: (t) => `عرض جديد على مهمتك: ${t}`, h2: 'لديك عرض جديد!', p1: (t) => `قدّم وكيل سفر عرضاً على مهمتك: ${t}`, p2: 'سجّل الدخول لمراجعة العرض وملف الوكيل.' }, jobAssigned: { subject: (t) => `أُسندت المهمة: ${t}`, h2: 'تهانينا!', p1: (t) => `أُسندت إليك المهمة: ${t}`, p2: 'راجع التفاصيل وابدأ العمل على هذا المشروع المميز!' }, jobCompleted: { subject: (t) => `اكتملت المهمة: ${t}`, h2: 'اكتملت المهمة', p1: (t) => `حدد الوكيل مهمتك كمكتملة: ${t}`, p2: 'راجع المخرجات ووافق إن كنت راضياً.' }, paymentReceived: { subject: (t) => `استُلمت الدفعة عن: ${t}`, h2: 'استُلمت الدفعة', p1: (t) => `عولجت دفعتك عن ${t} بنجاح.`, p2: '' }, lblAmount: 'المبلغ:', messageReceived: { subject: (t) => `رسالة جديدة بخصوص: ${t}`, h2: 'رسالة جديدة', p1: (t) => `لديك رسالة جديدة بخصوص: ${t}`, p2: 'سجّل الدخول لعرضها والرد.' } },
  ja: { newBid: { subject: (t) => `案件に新しい入札：${t}`, h2: '新しい入札があります！', p1: (t) => `旅行エージェントがあなたの案件に入札しました：${t}`, p2: 'ログインして入札とエージェントのプロフィールを確認しましょう。' }, jobAssigned: { subject: (t) => `案件が割り当てられました：${t}`, h2: 'おめでとうございます！', p1: (t) => `案件があなたに割り当てられました：${t}`, p2: '詳細を確認して、この素敵なプロジェクトを始めましょう！' }, jobCompleted: { subject: (t) => `案件完了：${t}`, h2: '案件が完了しました', p1: (t) => `エージェントが案件を完了にしました：${t}`, p2: '成果物を確認し、問題なければ承認してください。' }, paymentReceived: { subject: (t) => `支払いを受領：${t}`, h2: '支払いを受領しました', p1: (t) => `${t} のお支払いが正常に処理されました。`, p2: '' }, lblAmount: '金額：', messageReceived: { subject: (t) => `新着メッセージ：${t}`, h2: '新着メッセージ', p1: (t) => `次の件について新しいメッセージがあります：${t}`, p2: 'ログインして確認・返信しましょう。' } },
  ko: { newBid: { subject: (t) => `작업에 새 입찰: ${t}`, h2: '새 입찰이 있습니다!', p1: (t) => `여행 에이전트가 작업에 입찰했습니다: ${t}`, p2: '로그인해 입찰과 에이전트 프로필을 확인하세요.' }, jobAssigned: { subject: (t) => `작업 배정: ${t}`, h2: '축하합니다!', p1: (t) => `작업이 배정되었습니다: ${t}`, p2: '상세를 확인하고 이 멋진 프로젝트를 시작하세요!' }, jobCompleted: { subject: (t) => `작업 완료: ${t}`, h2: '작업이 완료되었습니다', p1: (t) => `에이전트가 작업을 완료로 표시했습니다: ${t}`, p2: '결과물을 검토하고 만족스러우면 승인하세요.' }, paymentReceived: { subject: (t) => `결제 수령: ${t}`, h2: '결제가 접수되었습니다', p1: (t) => `${t}에 대한 결제가 정상 처리되었습니다.`, p2: '' }, lblAmount: '금액:', messageReceived: { subject: (t) => `새 메시지: ${t}`, h2: '새 메시지', p1: (t) => `다음 건에 대한 새 메시지가 있습니다: ${t}`, p2: '로그인해 확인하고 답장하세요.' } },
  zh: { newBid: { subject: (t) => `你的任务收到新报价：${t}`, h2: '你有一个新报价！', p1: (t) => `一位旅行代理为你的任务提交了报价：${t}`, p2: '登录查看报价与代理资料。' }, jobAssigned: { subject: (t) => `任务已指派：${t}`, h2: '恭喜！', p1: (t) => `任务已指派给你：${t}`, p2: '查看详情，开始这个精彩的项目吧！' }, jobCompleted: { subject: (t) => `任务已完成：${t}`, h2: '任务已完成', p1: (t) => `代理已将你的任务标记为完成：${t}`, p2: '请查看交付内容，满意即可批准。' }, paymentReceived: { subject: (t) => `已收到付款：${t}`, h2: '已收到付款', p1: (t) => `你为 ${t} 支付的款项已成功处理。`, p2: '' }, lblAmount: '金额：', messageReceived: { subject: (t) => `新消息：${t}`, h2: '新消息', p1: (t) => `你有一条关于以下内容的新消息：${t}`, p2: '登录查看并回复。' } },
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

interface NotificationRequest {
  userId: string;
  jobId: string;
  notificationType: "new_bid" | "job_assigned" | "job_completed" | "payment_received" | "message_received";
  customData?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, jobId, notificationType, customData } = await req.json() as NotificationRequest;

    // Get user profile and notification preferences
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("username, email")
      .eq("id", userId)
      .single();

    const { data: prefs } = await supabaseClient
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Get job details
    const { data: job } = await supabaseClient
      .from("marketplace_jobs")
      .select("title, booking_type")
      .eq("id", jobId)
      .single();

    if (!profile || !job) {
      throw new Error("User or job not found");
    }

    // Check if user wants email notifications for this type
    const shouldSendEmail = prefs?.email_job_updates !== false;

    if (!shouldSendEmail || !RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: true, message: "Notification preferences disabled or API key missing" }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Prepare email content based on notification type
    const lang = await resolveRecipientLanguage(supabaseClient, null, profile?.email ?? null);
    const s = pickLang(STRINGS, lang);

    let subject = "";
    let htmlContent = "";

    switch (notificationType) {
      case "new_bid":
        subject = s.newBid.subject(job.title);
        htmlContent = `
          <h2>${s.newBid.h2}</h2>
          <p>${s.newBid.p1(`<strong>${job.title}</strong>`)}</p>
          <p>${s.newBid.p2}</p>
        `;
        break;
      case "job_assigned":
        subject = s.jobAssigned.subject(job.title);
        htmlContent = `
          <h2>${s.jobAssigned.h2}</h2>
          <p>${s.jobAssigned.p1(`<strong>${job.title}</strong>`)}</p>
          <p>${s.jobAssigned.p2}</p>
        `;
        break;
      case "job_completed":
        subject = s.jobCompleted.subject(job.title);
        htmlContent = `
          <h2>${s.jobCompleted.h2}</h2>
          <p>${s.jobCompleted.p1(`<strong>${job.title}</strong>`)}</p>
          <p>${s.jobCompleted.p2}</p>
        `;
        break;
      case "payment_received":
        subject = s.paymentReceived.subject(job.title);
        htmlContent = `
          <h2>${s.paymentReceived.h2}</h2>
          <p>${s.paymentReceived.p1(`<strong>${job.title}</strong>`)}</p>
          <p>${s.lblAmount} $${customData?.amount || "0.00"}</p>
        `;
        break;
      case "message_received":
        subject = s.messageReceived.subject(job.title);
        htmlContent = `
          <h2>${s.messageReceived.h2}</h2>
          <p>${s.messageReceived.p1(`<strong>${job.title}</strong>`)}</p>
          <p>${s.messageReceived.p2}</p>
        `;
        break;
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Marketplace <hello@goldsainte.com>",
        to: [profile.email],
        subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send email: ${await res.text()}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 400 }
    );
  }
});
