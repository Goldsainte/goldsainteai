import "../_shared/resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subject: string;
  intro: string;
  lblDestination: string;
  lblDates: string;
  lblTravelers: string;
  lblBudget: string;
  flexible: string;
  notSpecified: string;
  signIn: string;
  openLink: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: 'New Goldsainte trip opportunity', intro: 'You have been matched to a new trip request.', lblDestination: 'Destination:', lblDates: 'Dates:', lblTravelers: 'Travelers:', lblBudget: 'Budget:', flexible: 'Flexible', notSpecified: 'Not specified', signIn: 'Sign in to review the request and accept or decline.', openLink: 'Open Goldsainte' },
  fr: { subject: 'Nouvelle opportunité de voyage Goldsainte', intro: 'Vous avez été associé à une nouvelle demande de voyage.', lblDestination: 'Destination :', lblDates: 'Dates :', lblTravelers: 'Voyageurs :', lblBudget: 'Budget :', flexible: 'Flexible', notSpecified: 'Non précisé', signIn: 'Connectez-vous pour examiner la demande, puis accepter ou décliner.', openLink: 'Ouvrir Goldsainte' },
  es: { subject: 'Nueva oportunidad de viaje en Goldsainte', intro: 'Has sido emparejado con una nueva solicitud de viaje.', lblDestination: 'Destino:', lblDates: 'Fechas:', lblTravelers: 'Viajeros:', lblBudget: 'Presupuesto:', flexible: 'Flexible', notSpecified: 'No especificado', signIn: 'Inicia sesión para revisar la solicitud y aceptar o rechazar.', openLink: 'Abrir Goldsainte' },
  de: { subject: 'Neue Goldsainte-Reisegelegenheit', intro: 'Sie wurden einer neuen Reiseanfrage zugeordnet.', lblDestination: 'Ziel:', lblDates: 'Daten:', lblTravelers: 'Reisende:', lblBudget: 'Budget:', flexible: 'Flexibel', notSpecified: 'Nicht angegeben', signIn: 'Melden Sie sich an, um die Anfrage zu prüfen und anzunehmen oder abzulehnen.', openLink: 'Goldsainte öffnen' },
  it: { subject: 'Nuova opportunità di viaggio Goldsainte', intro: 'Sei stato abbinato a una nuova richiesta di viaggio.', lblDestination: 'Destinazione:', lblDates: 'Date:', lblTravelers: 'Viaggiatori:', lblBudget: 'Budget:', flexible: 'Flessibile', notSpecified: 'Non specificato', signIn: 'Accedi per esaminare la richiesta e accettare o rifiutare.', openLink: 'Apri Goldsainte' },
  pt: { subject: 'Nova oportunidade de viagem Goldsainte', intro: 'Você foi combinado com um novo pedido de viagem.', lblDestination: 'Destino:', lblDates: 'Datas:', lblTravelers: 'Viajantes:', lblBudget: 'Orçamento:', flexible: 'Flexível', notSpecified: 'Não especificado', signIn: 'Entre para revisar o pedido e aceitar ou recusar.', openLink: 'Abrir Goldsainte' },
  ar: { subject: 'فرصة رحلة جديدة من Goldsainte', intro: 'تمت مطابقتك مع طلب رحلة جديد.', lblDestination: 'الوجهة:', lblDates: 'التواريخ:', lblTravelers: 'المسافرون:', lblBudget: 'الميزانية:', flexible: 'مرن', notSpecified: 'غير محدد', signIn: 'سجّل الدخول لمراجعة الطلب وقبوله أو رفضه.', openLink: 'افتح Goldsainte' },
  ja: { subject: 'Goldsainte の新しい旅の機会', intro: '新しい旅のリクエストとマッチングされました。', lblDestination: '目的地：', lblDates: '日程：', lblTravelers: '旅行者：', lblBudget: '予算：', flexible: '柔軟', notSpecified: '未指定', signIn: 'サインインしてリクエストを確認し、承諾または辞退してください。', openLink: 'Goldsainte を開く' },
  ko: { subject: '새 Goldsainte 여행 기회', intro: '새 여행 요청과 매칭되었습니다.', lblDestination: '목적지:', lblDates: '날짜:', lblTravelers: '여행자:', lblBudget: '예산:', flexible: '유연함', notSpecified: '미지정', signIn: '로그인해 요청을 검토하고 수락 또는 거절하세요.', openLink: 'Goldsainte 열기' },
  zh: { subject: 'Goldsainte 新旅行机会', intro: '你已与一条新的旅行需求匹配。', lblDestination: '目的地：', lblDates: '日期：', lblTravelers: '旅行者：', lblBudget: '预算：', flexible: '灵活', notSpecified: '未指定', signIn: '登录查看需求并选择接受或婉拒。', openLink: '打开 Goldsainte' },
};
import { resolveAllowedOrigin } from "../_shared/cors.ts";

interface NotifyBody {
  tripRequestId: string;
}

interface AssignmentRow {
  assignee_profile_id: string;
  role: string;
  status: string;
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const siteUrl = Deno.env.get("SITE_URL") || "";
function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const { tripRequestId } = (await req.json()) as NotifyBody;
    if (!tripRequestId) {
      return new Response(JSON.stringify({ error: "Missing tripRequestId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(req) },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: trip } = await supabase
      .from("trip_requests")
      .select("id, destination, date_range, travelers_count, budget_range")
      .eq("id", tripRequestId)
      .maybeSingle();

    const { data: assignments, error: assignError } = await supabase
      .from("trip_assignments")
      .select("assignee_profile_id, role, status")
      .eq("trip_request_id", tripRequestId)
      .in("status", ["pending", "accepted"]);

    if (assignError) throw assignError;

    const emails: { email: string; role: string }[] = [];
    for (const assignment of (assignments as AssignmentRow[] | null) ?? []) {
      const { data: userRes } = await supabase.auth.admin.getUserById(
        assignment.assignee_profile_id
      );
      const email = userRes?.user?.email;
      if (email) {
        emails.push({ email, role: assignment.role });
      }
    }

    if (!resendApiKey || emails.length === 0) {
      console.log("send-match-notifications: skipping email send", {
        hasKey: !!resendApiKey,
        recipientCount: emails.length,
      });
      return new Response(JSON.stringify({ ok: true, recipients: emails.length }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req) },
      });
    }

    const buildEmail = (s: S) => ({
      subject: s.subject,
      html: `
      <div style="font-family:Arial, sans-serif; color:#0a2225;">
        <p>${s.intro}</p>
        <ul>
          <li><strong>${s.lblDestination}</strong> ${trip?.destination ?? s.flexible}</li>
          <li><strong>${s.lblDates}</strong> ${trip?.date_range ?? s.flexible}</li>
          <li><strong>${s.lblTravelers}</strong> ${trip?.travelers_count ?? s.notSpecified}</li>
          <li><strong>${s.lblBudget}</strong> ${trip?.budget_range ?? s.notSpecified}</li>
        </ul>
        <p>${s.signIn}</p>
        ${siteUrl ? `<p><a href="${siteUrl}" target="_blank" rel="noreferrer">${s.openLink}</a></p>` : ""}
      </div>
    `,
    });

    for (const recipient of emails) {
      const lang = await resolveRecipientLanguage(supabase, null, recipient.email);
      const { subject, html } = buildEmail(pickLang(STRINGS, lang));
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Goldsainte Concierge <hello@goldsainte.com>",
          to: [recipient.email],
          subject,
          html,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, recipients: emails.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    });
  } catch (err) {
    console.error("send-match-notifications error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    });
  }
});
