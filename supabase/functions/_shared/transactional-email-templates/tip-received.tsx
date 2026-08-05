/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

// ============================================================================
// tip-received — branded notification to the professional who was tipped.
// Created Jul 26. Tips previously went out as ad-hoc inline HTML straight
// from stripe-webhook-handler, bypassing the branded transactional system —
// no fee breakdown table, no payout-timing expectations, off-house footer.
// ============================================================================

interface TipReceivedProps {
  firstName?: string
  /** e.g. "$10.00" */
  amount?: string
  /** e.g. "$9.30" — after the 7% platform fee */
  net?: string
  /** e.g. "$0.70" */
  fee?: string
  note?: string
  lang?: EmailLang
}

interface S {
  subject: (amount: string) => string
  title: string
  headlineNamed: (firstName: string) => string
  headline: string
  taglineNoNote: string
  lede: (amount: string) => string
  lblTipAmount: string
  lblPlatformFee: string
  lblYours: string
  step1: (net: string) => string
  step2: string
  step3: string
  step4: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: (a) => `You received a ${a} tip \u{1F389}`,
    title: 'You received a tip on Goldsainte',
    headlineNamed: (n) => `A tip for you, ${n}.`,
    headline: 'A tip for you.',
    taglineNoNote: 'A traveler wanted to say thank you for what you do.',
    lede: (a) => `Someone sent you a ${a} tip on Goldsainte. Here is exactly what happens with it:`,
    lblTipAmount: 'Tip amount',
    lblPlatformFee: 'Platform fee (7%)',
    lblYours: 'Yours',
    step1: (n) => `${n} was charged on your own connected Stripe account \u2014 Goldsainte never holds your money.`,
    step2: "Stripe pays it out to your bank on the payout schedule set on your Stripe account. Goldsainte doesn't control that timing.",
    step3: "Your Stripe dashboard is the source of truth for when a payout actually lands \u2014 Goldsainte shows what you've earned, not what your bank has settled.",
    step4: 'Nothing is needed from you \u2014 this email is just the good news.',
    cta: 'View earnings',
  },
  fr: {
    subject: (a) => `Vous avez reçu un pourboire de ${a} \u{1F389}`,
    title: 'Vous avez reçu un pourboire sur Goldsainte',
    headlineNamed: (n) => `Un pourboire pour vous, ${n}.`,
    headline: 'Un pourboire pour vous.',
    taglineNoNote: 'Un voyageur a voulu vous remercier pour ce que vous faites.',
    lede: (a) => `Quelqu'un vous a envoyé un pourboire de ${a} sur Goldsainte. Voici exactement ce qu'il devient :`,
    lblTipAmount: 'Montant du pourboire',
    lblPlatformFee: 'Frais de plateforme (7 %)',
    lblYours: 'Pour vous',
    step1: (n) => `${n} a été encaissé sur votre propre compte Stripe connecté \u2014 Goldsainte ne détient jamais votre argent.`,
    step2: 'Stripe le verse à votre banque selon le calendrier de versement défini sur votre compte Stripe. Goldsainte ne contrôle pas ce délai.',
    step3: 'Votre tableau de bord Stripe fait foi pour la date d\u2019arrivée réelle \u2014 Goldsainte montre ce que vous avez gagné, pas ce que votre banque a réglé.',
    step4: 'Rien à faire de votre côté \u2014 cet e-mail n\u2019est que la bonne nouvelle.',
    cta: 'Voir mes revenus',
  },
  es: {
    subject: (a) => `Recibiste una propina de ${a} \u{1F389}`,
    title: 'Recibiste una propina en Goldsainte',
    headlineNamed: (n) => `Una propina para ti, ${n}.`,
    headline: 'Una propina para ti.',
    taglineNoNote: 'Un viajero quiso agradecerte por lo que haces.',
    lede: (a) => `Alguien te envió una propina de ${a} en Goldsainte. Esto es exactamente lo que pasa con ella:`,
    lblTipAmount: 'Importe de la propina',
    lblPlatformFee: 'Tarifa de plataforma (7 %)',
    lblYours: 'Para ti',
    step1: (n) => `${n} se cobró en tu propia cuenta de Stripe conectada \u2014 Goldsainte nunca retiene tu dinero.`,
    step2: 'Stripe lo transfiere a tu banco según el calendario de cobros configurado en tu cuenta de Stripe. Goldsainte no controla ese plazo.',
    step3: 'Tu panel de Stripe es la fuente de verdad sobre cuándo llega realmente un cobro \u2014 Goldsainte muestra lo ganado, no lo liquidado por tu banco.',
    step4: 'No necesitas hacer nada \u2014 este correo es solo la buena noticia.',
    cta: 'Ver ingresos',
  },
  de: {
    subject: (a) => `Sie haben ein Trinkgeld von ${a} erhalten \u{1F389}`,
    title: 'Sie haben ein Trinkgeld auf Goldsainte erhalten',
    headlineNamed: (n) => `Ein Trinkgeld für Sie, ${n}.`,
    headline: 'Ein Trinkgeld für Sie.',
    taglineNoNote: 'Ein Reisender wollte sich für Ihre Arbeit bedanken.',
    lede: (a) => `Jemand hat Ihnen ein Trinkgeld von ${a} auf Goldsainte gesendet. Genau das passiert damit:`,
    lblTipAmount: 'Trinkgeldbetrag',
    lblPlatformFee: 'Plattformgebühr (7 %)',
    lblYours: 'Für Sie',
    step1: (n) => `${n} wurde über Ihr eigenes verbundenes Stripe-Konto eingezogen \u2014 Goldsainte hält Ihr Geld nie.`,
    step2: 'Stripe zahlt es gemäß dem in Ihrem Stripe-Konto festgelegten Auszahlungsplan an Ihre Bank aus. Goldsainte steuert dieses Timing nicht.',
    step3: 'Ihr Stripe-Dashboard ist die verlässliche Quelle dafür, wann eine Auszahlung wirklich ankommt \u2014 Goldsainte zeigt, was Sie verdient haben, nicht, was Ihre Bank verbucht hat.',
    step4: 'Sie müssen nichts tun \u2014 diese E-Mail ist nur die gute Nachricht.',
    cta: 'Einnahmen ansehen',
  },
  it: {
    subject: (a) => `Hai ricevuto una mancia di ${a} \u{1F389}`,
    title: 'Hai ricevuto una mancia su Goldsainte',
    headlineNamed: (n) => `Una mancia per te, ${n}.`,
    headline: 'Una mancia per te.',
    taglineNoNote: 'Un viaggiatore ha voluto ringraziarti per quello che fai.',
    lede: (a) => `Qualcuno ti ha inviato una mancia di ${a} su Goldsainte. Ecco esattamente cosa succede:`,
    lblTipAmount: 'Importo mancia',
    lblPlatformFee: 'Commissione piattaforma (7%)',
    lblYours: 'A te',
    step1: (n) => `${n} è stato incassato sul tuo conto Stripe collegato \u2014 Goldsainte non trattiene mai il tuo denaro.`,
    step2: 'Stripe lo versa alla tua banca secondo il calendario impostato sul tuo account Stripe. Goldsainte non controlla quei tempi.',
    step3: 'La tua dashboard Stripe è la fonte di verità su quando un pagamento arriva davvero \u2014 Goldsainte mostra ciò che hai guadagnato, non ciò che la banca ha regolato.',
    step4: 'Non devi fare nulla \u2014 questa email è solo la buona notizia.',
    cta: 'Vedi guadagni',
  },
  pt: {
    subject: (a) => `Você recebeu uma gorjeta de ${a} \u{1F389}`,
    title: 'Você recebeu uma gorjeta na Goldsainte',
    headlineNamed: (n) => `Uma gorjeta para você, ${n}.`,
    headline: 'Uma gorjeta para você.',
    taglineNoNote: 'Um viajante quis agradecer pelo que você faz.',
    lede: (a) => `Alguém enviou uma gorjeta de ${a} para você na Goldsainte. Veja exatamente o que acontece com ela:`,
    lblTipAmount: 'Valor da gorjeta',
    lblPlatformFee: 'Taxa da plataforma (7%)',
    lblYours: 'Seu',
    step1: (n) => `${n} foi cobrado na sua própria conta Stripe conectada \u2014 a Goldsainte nunca retém seu dinheiro.`,
    step2: 'O Stripe repassa ao seu banco conforme o cronograma configurado na sua conta Stripe. A Goldsainte não controla esse prazo.',
    step3: 'Seu painel do Stripe é a fonte da verdade sobre quando um repasse realmente cai \u2014 a Goldsainte mostra o que você ganhou, não o que seu banco liquidou.',
    step4: 'Você não precisa fazer nada \u2014 este e-mail é só a boa notícia.',
    cta: 'Ver ganhos',
  },
  ar: {
    subject: (a) => `استلمت إكرامية بقيمة ${a} \u{1F389}`,
    title: 'استلمت إكرامية على Goldsainte',
    headlineNamed: (n) => `إكرامية لك يا ${n}.`,
    headline: 'إكرامية لك.',
    taglineNoNote: 'أراد مسافر أن يشكرك على ما تقدمه.',
    lede: (a) => `أرسل لك أحدهم إكرامية بقيمة ${a} على Goldsainte. إليك بالضبط ما يحدث لها:`,
    lblTipAmount: 'قيمة الإكرامية',
    lblPlatformFee: 'رسوم المنصة (7%)',
    lblYours: 'لك',
    step1: (n) => `حُصّل ${n} على حساب Stripe المرتبط بك \u2014 لا تحتفظ Goldsainte بأموالك أبداً.`,
    step2: 'يحوّله Stripe إلى مصرفك حسب جدول الدفعات في حسابك على Stripe. لا تتحكم Goldsainte بهذا التوقيت.',
    step3: 'لوحة Stripe لديك هي المرجع لموعد وصول الدفعة فعلياً \u2014 تعرض Goldsainte ما كسبته لا ما سوّاه مصرفك.',
    step4: 'لا يلزمك شيء \u2014 هذه الرسالة مجرد خبر سعيد.',
    cta: 'اعرض الأرباح',
  },
  ja: {
    subject: (a) => `${a} のチップを受け取りました \u{1F389}`,
    title: 'Goldsainte でチップを受け取りました',
    headlineNamed: (n) => `${n} さんへのチップです。`,
    headline: 'あなたへのチップです。',
    taglineNoNote: '旅行者があなたの仕事に感謝を伝えたいと思ったのです。',
    lede: (a) => `Goldsainte であなたに ${a} のチップが送られました。その行方はこのとおりです：`,
    lblTipAmount: 'チップ額',
    lblPlatformFee: 'プラットフォーム手数料（7%）',
    lblYours: 'あなたの取り分',
    step1: (n) => `${n} はあなた自身の接続済み Stripe アカウントに課金されました \u2014 Goldsainte がお金を預かることはありません。`,
    step2: 'Stripe アカウントの入金スケジュールに従って Stripe が銀行へ支払います。Goldsainte はそのタイミングを管理しません。',
    step3: '実際の着金時期は Stripe ダッシュボードが正です \u2014 Goldsainte は稼いだ額を表示し、銀行の精算額ではありません。',
    step4: '必要な操作はありません \u2014 このメールはただの良い知らせです。',
    cta: '収益を見る',
  },
  ko: {
    subject: (a) => `${a} 팁을 받았습니다 \u{1F389}`,
    title: 'Goldsainte에서 팁을 받았습니다',
    headlineNamed: (n) => `${n}님을 위한 팁입니다.`,
    headline: '당신을 위한 팁입니다.',
    taglineNoNote: '한 여행자가 당신의 일에 감사를 전하고 싶어 했습니다.',
    lede: (a) => `누군가 Goldsainte에서 ${a} 팁을 보냈습니다. 이 팁이 어떻게 처리되는지 정확히 알려드립니다:`,
    lblTipAmount: '팁 금액',
    lblPlatformFee: '플랫폼 수수료 (7%)',
    lblYours: '내 몫',
    step1: (n) => `${n}은(는) 당신이 연결한 Stripe 계정으로 청구되었습니다 \u2014 Goldsainte는 돈을 보관하지 않습니다.`,
    step2: 'Stripe가 당신의 Stripe 계정에 설정된 정산 일정에 따라 은행으로 지급합니다. Goldsainte는 그 시점을 통제하지 않습니다.',
    step3: '실제 입금 시점은 Stripe 대시보드가 기준입니다 \u2014 Goldsainte는 번 금액을 보여줄 뿐, 은행 정산액이 아닙니다.',
    step4: '아무것도 하실 필요 없습니다 \u2014 이 메일은 그저 좋은 소식입니다.',
    cta: '수익 보기',
  },
  zh: {
    subject: (a) => `你收到了 ${a} 小费 \u{1F389}`,
    title: '你在 Goldsainte 收到了小费',
    headlineNamed: (n) => `给你的小费，${n}。`,
    headline: '给你的小费。',
    taglineNoNote: '一位旅行者想为你所做的一切说声谢谢。',
    lede: (a) => `有人在 Goldsainte 给你发了 ${a} 小费。它的去向一目了然：`,
    lblTipAmount: '小费金额',
    lblPlatformFee: '平台费（7%）',
    lblYours: '归你',
    step1: (n) => `${n} 已通过你自己关联的 Stripe 账户收款 \u2014 Goldsainte 从不代管你的钱。`,
    step2: 'Stripe 按你 Stripe 账户设置的结算周期打款到你的银行。Goldsainte 不控制该时间。',
    step3: '实际到账时间以你的 Stripe 面板为准 \u2014 Goldsainte 显示的是你赚到的，不是银行已结清的。',
    step4: '你无需任何操作 \u2014 这封邮件只是来报喜的。',
    cta: '查看收入',
  },
}

export const TipReceivedEmail = ({
  firstName,
  amount = '$0.00',
  net = '$0.00',
  fee = '$0.00',
  note,
  lang,
}: TipReceivedProps) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={firstName ? s.headlineNamed(firstName) : s.headline}
      tagline={note ? `\u201C${note}\u201D` : s.taglineNoNote}
      lede={s.lede(amount)}
      details={[
        { label: s.lblTipAmount, value: amount },
        { label: s.lblPlatformFee, value: `\u2212${fee}` },
        { label: s.lblYours, value: net },
      ]}
      steps={[s.step1(net), s.step2, s.step3, s.step4]}
      cta={{ label: s.cta, url: 'https://goldsainte.ai/creator-dashboard?tab=earnings' }}
    />
  )
}

export const template = {
  component: TipReceivedEmail,
  subject: (d: Record<string, any>) => pickLang(STRINGS, d?.lang).subject(d?.amount || 'new'),
  displayName: 'Tip — received (professional)',
  previewData: { firstName: 'Tanya', amount: '$10.00', net: '$9.30', fee: '$0.70', note: 'Thanks for the Tokyo guide!' },
} satisfies TemplateEntry
