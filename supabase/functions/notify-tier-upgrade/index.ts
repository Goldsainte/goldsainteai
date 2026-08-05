import "../_shared/resend-guard.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subject: (tier: string) => string;
  notifTitle: (tier: string) => string;
  notifMsgFrom: (prev: string, tier: string, rate: string) => string;
  notifMsg: (tier: string, rate: string) => string;
  notifAction: string;
  h1: (name: string) => string;
  p1: (tierHtml: string, prevPart: string) => string;
  p1Prev: (prev: string) => string;
  p2: (rateHtml: string) => string;
  p3: string;
  signoff: string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: (t) => `\u{1F389} You've reached ${t} on Goldsainte`, notifTitle: (t) => `You've reached ${t}`, notifMsgFrom: (p, t, r) => `Congrats! You've been promoted from ${p} to ${t}. Your new commission rate is ${r}%.`, notifMsg: (t, r) => `Congrats! You've reached the ${t} tier. Your new commission rate is ${r}%.`, notifAction: 'View dashboard', h1: (n) => `Congratulations, ${n} \u{1F389}`, p1: (t, pp) => `You've just been promoted to the ${t} creator tier${pp}.`, p1Prev: (p) => ` (up from ${p})`, p2: (r) => `Your new platform commission rate is ${r}, effective immediately on all future sales.`, p3: "Keep crafting incredible storyboards \u2014 we're cheering you on.", signoff: '\u2014 The Goldsainte Team' },
  fr: { subject: (t) => `\u{1F389} Vous avez atteint ${t} sur Goldsainte`, notifTitle: (t) => `Vous avez atteint ${t}`, notifMsgFrom: (p, t, r) => `Bravo ! Vous passez de ${p} à ${t}. Votre nouveau taux de commission est de ${r}%.`, notifMsg: (t, r) => `Bravo ! Vous avez atteint le niveau ${t}. Votre nouveau taux de commission est de ${r}%.`, notifAction: 'Voir le tableau de bord', h1: (n) => `Félicitations, ${n} \u{1F389}`, p1: (t, pp) => `Vous venez d'être promu au niveau créateur ${t}${pp}.`, p1Prev: (p) => ` (depuis ${p})`, p2: (r) => `Votre nouveau taux de commission est de ${r}, effectif immédiatement sur toutes les ventes futures.`, p3: 'Continuez à créer des storyboards incroyables \u2014 nous vous encourageons.', signoff: "\u2014 L'équipe Goldsainte" },
  es: { subject: (t) => `\u{1F389} Has alcanzado ${t} en Goldsainte`, notifTitle: (t) => `Has alcanzado ${t}`, notifMsgFrom: (p, t, r) => `¡Enhorabuena! Has pasado de ${p} a ${t}. Tu nueva tasa de comisión es del ${r}%.`, notifMsg: (t, r) => `¡Enhorabuena! Has alcanzado el nivel ${t}. Tu nueva tasa de comisión es del ${r}%.`, notifAction: 'Ver panel', h1: (n) => `Enhorabuena, ${n} \u{1F389}`, p1: (t, pp) => `Acabas de ascender al nivel de creador ${t}${pp}.`, p1Prev: (p) => ` (desde ${p})`, p2: (r) => `Tu nueva tasa de comisión es ${r}, efectiva de inmediato en todas las ventas futuras.`, p3: 'Sigue creando storyboards increíbles \u2014 te apoyamos.', signoff: '\u2014 El equipo de Goldsainte' },
  de: { subject: (t) => `\u{1F389} Sie haben ${t} auf Goldsainte erreicht`, notifTitle: (t) => `Sie haben ${t} erreicht`, notifMsgFrom: (p, t, r) => `Glückwunsch! Sie wurden von ${p} zu ${t} befördert. Ihr neuer Provisionssatz beträgt ${r}%.`, notifMsg: (t, r) => `Glückwunsch! Sie haben die Stufe ${t} erreicht. Ihr neuer Provisionssatz beträgt ${r}%.`, notifAction: 'Dashboard ansehen', h1: (n) => `Glückwunsch, ${n} \u{1F389}`, p1: (t, pp) => `Sie wurden soeben in die Creator-Stufe ${t} befördert${pp}.`, p1Prev: (p) => ` (zuvor ${p})`, p2: (r) => `Ihr neuer Provisionssatz beträgt ${r} und gilt sofort für alle künftigen Verkäufe.`, p3: 'Erstellen Sie weiter großartige Storyboards \u2014 wir feuern Sie an.', signoff: '\u2014 Das Goldsainte-Team' },
  it: { subject: (t) => `\u{1F389} Hai raggiunto ${t} su Goldsainte`, notifTitle: (t) => `Hai raggiunto ${t}`, notifMsgFrom: (p, t, r) => `Complimenti! Sei stato promosso da ${p} a ${t}. La tua nuova commissione è del ${r}%.`, notifMsg: (t, r) => `Complimenti! Hai raggiunto il livello ${t}. La tua nuova commissione è del ${r}%.`, notifAction: 'Vedi dashboard', h1: (n) => `Congratulazioni, ${n} \u{1F389}`, p1: (t, pp) => `Sei appena stato promosso al livello creator ${t}${pp}.`, p1Prev: (p) => ` (da ${p})`, p2: (r) => `La tua nuova commissione piattaforma è ${r}, effettiva da subito su tutte le vendite future.`, p3: 'Continua a creare storyboard incredibili \u2014 facciamo il tifo per te.', signoff: '\u2014 Il team Goldsainte' },
  pt: { subject: (t) => `\u{1F389} Você alcançou ${t} na Goldsainte`, notifTitle: (t) => `Você alcançou ${t}`, notifMsgFrom: (p, t, r) => `Parabéns! Você foi promovido de ${p} para ${t}. Sua nova taxa de comissão é ${r}%.`, notifMsg: (t, r) => `Parabéns! Você alcançou o nível ${t}. Sua nova taxa de comissão é ${r}%.`, notifAction: 'Ver painel', h1: (n) => `Parabéns, ${n} \u{1F389}`, p1: (t, pp) => `Você acaba de ser promovido ao nível de criador ${t}${pp}.`, p1Prev: (p) => ` (antes ${p})`, p2: (r) => `Sua nova taxa de comissão da plataforma é ${r}, válida imediatamente para todas as vendas futuras.`, p3: 'Continue criando storyboards incríveis \u2014 estamos torcendo por você.', signoff: '\u2014 Equipe Goldsainte' },
  ar: { subject: (t) => `\u{1F389} وصلت إلى ${t} على Goldsainte`, notifTitle: (t) => `وصلت إلى ${t}`, notifMsgFrom: (p, t, r) => `تهانينا! ترقيت من ${p} إلى ${t}. نسبة عمولتك الجديدة ${r}%.`, notifMsg: (t, r) => `تهانينا! وصلت إلى مستوى ${t}. نسبة عمولتك الجديدة ${r}%.`, notifAction: 'اعرض اللوحة', h1: (n) => `تهانينا يا ${n} \u{1F389}`, p1: (t, pp) => `رُقّيت للتو إلى مستوى صانعي المحتوى ${t}${pp}.`, p1Prev: (p) => ` (من ${p})`, p2: (r) => `نسبة عمولة المنصة الجديدة لديك ${r}، سارية فوراً على كل المبيعات القادمة.`, p3: 'واصل صناعة قصص مذهلة \u2014 نحن نشجعك.', signoff: '\u2014 فريق Goldsainte' },
  ja: { subject: (t) => `\u{1F389} Goldsainte で ${t} に到達しました`, notifTitle: (t) => `${t} に到達しました`, notifMsgFrom: (p, t, r) => `おめでとうございます！${p} から ${t} に昇格しました。新しい手数料率は ${r}% です。`, notifMsg: (t, r) => `おめでとうございます！${t} ティアに到達しました。新しい手数料率は ${r}% です。`, notifAction: 'ダッシュボードを見る', h1: (n) => `おめでとうございます、${n} さん \u{1F389}`, p1: (t, pp) => `クリエイターティア ${t} に昇格しました${pp}。`, p1Prev: (p) => `（${p} から）`, p2: (r) => `新しいプラットフォーム手数料率は ${r} で、今後のすべての販売に即時適用されます。`, p3: '素晴らしいストーリーボードをこれからも \u2014 応援しています。', signoff: '\u2014 Goldsainte チーム' },
  ko: { subject: (t) => `\u{1F389} Goldsainte에서 ${t}에 도달했습니다`, notifTitle: (t) => `${t}에 도달했습니다`, notifMsgFrom: (p, t, r) => `축하합니다! ${p}에서 ${t}(으)로 승급했습니다. 새 수수료율은 ${r}%입니다.`, notifMsg: (t, r) => `축하합니다! ${t} 티어에 도달했습니다. 새 수수료율은 ${r}%입니다.`, notifAction: '대시보드 보기', h1: (n) => `축하합니다, ${n}님 \u{1F389}`, p1: (t, pp) => `크리에이터 티어 ${t}(으)로 승급했습니다${pp}.`, p1Prev: (p) => ` (${p}에서)`, p2: (r) => `새 플랫폼 수수료율은 ${r}이며, 향후 모든 판매에 즉시 적용됩니다.`, p3: '멋진 스토리보드를 계속 만들어 주세요 \u2014 응원합니다.', signoff: '\u2014 Goldsainte 팀' },
  zh: { subject: (t) => `\u{1F389} 你在 Goldsainte 达到了 ${t}`, notifTitle: (t) => `你达到了 ${t}`, notifMsgFrom: (p, t, r) => `恭喜！你从 ${p} 晋升到 ${t}。新的佣金率为 ${r}%。`, notifMsg: (t, r) => `恭喜！你达到了 ${t} 等级。新的佣金率为 ${r}%。`, notifAction: '查看工作台', h1: (n) => `恭喜你，${n} \u{1F389}`, p1: (t, pp) => `你刚刚晋升到 ${t} 创作者等级${pp}。`, p1Prev: (p) => `（此前为 ${p}）`, p2: (r) => `你的新平台佣金率为 ${r}，即刻对所有未来销售生效。`, p3: '继续打造精彩的 Storyboard \u2014 我们为你加油。', signoff: '\u2014 Goldsainte 团队' },
};
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const { user_id, tier, previous_tier, commission_rate } = await req.json();
    if (!user_id || !tier || !TIER_LABEL[tier]) {
      return new Response(JSON.stringify({ error: "invalid params" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Look up email + name
    const { data: authUser } = await admin.auth.admin.getUserById(user_id);
    const email = authUser?.user?.email;
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", user_id)
      .maybeSingle();
    const name = (profile?.display_name || profile?.full_name || "there").split(" ")[0];

    if (!email) {
      return new Response(JSON.stringify({ ok: true, skipped: "no email" }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ ok: true, skipped: "no resend key" }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const tierLabel = TIER_LABEL[tier];
    const lang = await resolveRecipientLanguage(admin, null, email ?? null);
    const s = pickLang(STRINGS, lang);
    const subject = s.subject(tierLabel);

    // In-app notification (best-effort; do not block email if it fails)
    try {
      await admin.from("notifications").insert({
        user_id,
        type: "tier_upgrade",
        title: s.notifTitle(tierLabel),
        message: previous_tier
          ? s.notifMsgFrom(TIER_LABEL[previous_tier] || previous_tier, tierLabel, String(commission_rate))
          : s.notifMsg(tierLabel, String(commission_rate)),
        entity_type: "tier",
        action_url: "/creator/dashboard",
        action_label: s.notifAction,
        priority: "high",
        sent_via_email: true,
      });
    } catch (notifErr) {
      console.error("Failed to insert tier upgrade notification", notifErr);
    }

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0a2225; background: #f7f3ea;">
        <h1 style="font-size: 24px; margin: 0 0 12px;">${s.h1(name)}</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          ${s.p1(`<strong>${tierLabel}</strong>`, previous_tier ? s.p1Prev(TIER_LABEL[previous_tier] || previous_tier) : "")}
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          ${s.p2(`<strong>${commission_rate}%</strong>`)}
        </p>
        <p style="font-size: 14px; color: #6B7280; margin-top: 24px;">
          ${s.p3}
        </p>
        <p style="font-size: 14px; margin-top: 24px;">${s.signoff}</p>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte <hello@goldsainte.com>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Resend error", resp.status, txt);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-tier-upgrade error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
