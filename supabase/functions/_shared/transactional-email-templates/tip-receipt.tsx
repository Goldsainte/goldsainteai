/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

// ============================================================================
// tip-receipt — branded confirmation to the traveler who sent the tip.
// Created Jul 26 alongside tip-received; both replace ad-hoc inline HTML in
// stripe-webhook-handler.
// ============================================================================

interface TipReceiptProps {
  /** e.g. "$10.00" */
  amount?: string
  recipientName?: string
  /** e.g. "July 26, 2026" */
  date?: string
  note?: string
  lang?: EmailLang
}

interface S {
  subject: (amount: string, recipient: string) => string
  title: string
  headline: string
  tagline: string
  fallbackRecipient: string
  ledeCore: (amount: string, recipient: string) => string
  ledeOnDate: (date: string) => string
  ledeNote: (note: string) => string
  lblTip: string
  lblTo: string
  lblDate: string
  step1: string
  step2: (recipient: string) => string
  step3: (recipient: string) => string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: (a, r) => `Your ${a} tip to ${r} \u2014 receipt`,
    title: 'Your Goldsainte tip receipt',
    headline: 'Thank you.',
    tagline: 'Tips go directly to the people who make travel special \u2014 Goldsainte never holds the money.',
    fallbackRecipient: 'your travel professional',
    ledeCore: (a, r) => `This confirms your ${a} tip to ${r}`,
    ledeOnDate: (d) => ` on ${d}`,
    ledeNote: (n) => ` Your note: \u201C${n}\u201D`,
    lblTip: 'Tip', lblTo: 'To', lblDate: 'Date',
    step1: 'Your payment was processed securely by Stripe and charged to your card.',
    step2: (r) => `The tip is paid directly to ${r}'s own account.`,
    step3: (r) => `Keep this email as your receipt \u2014 the charge appears on your statement from ${r} via Stripe.`,
  },
  fr: {
    subject: (a, r) => `Votre pourboire de ${a} à ${r} \u2014 reçu`,
    title: 'Votre reçu de pourboire Goldsainte',
    headline: 'Merci.',
    tagline: 'Les pourboires vont directement aux personnes qui rendent le voyage spécial \u2014 Goldsainte ne détient jamais l\u2019argent.',
    fallbackRecipient: 'votre professionnel du voyage',
    ledeCore: (a, r) => `Ceci confirme votre pourboire de ${a} à ${r}`,
    ledeOnDate: (d) => ` le ${d}`,
    ledeNote: (n) => ` Votre note : \u201C${n}\u201D`,
    lblTip: 'Pourboire', lblTo: 'Pour', lblDate: 'Date',
    step1: 'Votre paiement a été traité en toute sécurité par Stripe et débité de votre carte.',
    step2: (r) => `Le pourboire est versé directement sur le compte de ${r}.`,
    step3: (r) => `Conservez cet e-mail comme reçu \u2014 le débit apparaît sur votre relevé au nom de ${r} via Stripe.`,
  },
  es: {
    subject: (a, r) => `Tu propina de ${a} a ${r} \u2014 recibo`,
    title: 'Tu recibo de propina de Goldsainte',
    headline: 'Gracias.',
    tagline: 'Las propinas van directamente a quienes hacen especial el viaje \u2014 Goldsainte nunca retiene el dinero.',
    fallbackRecipient: 'tu profesional de viajes',
    ledeCore: (a, r) => `Esto confirma tu propina de ${a} a ${r}`,
    ledeOnDate: (d) => ` el ${d}`,
    ledeNote: (n) => ` Tu nota: \u201C${n}\u201D`,
    lblTip: 'Propina', lblTo: 'Para', lblDate: 'Fecha',
    step1: 'Tu pago fue procesado de forma segura por Stripe y cargado a tu tarjeta.',
    step2: (r) => `La propina se paga directamente a la cuenta de ${r}.`,
    step3: (r) => `Guarda este correo como recibo \u2014 el cargo aparece en tu extracto a nombre de ${r} vía Stripe.`,
  },
  de: {
    subject: (a, r) => `Ihr Trinkgeld von ${a} an ${r} \u2014 Quittung`,
    title: 'Ihre Goldsainte-Trinkgeldquittung',
    headline: 'Danke.',
    tagline: 'Trinkgelder gehen direkt an die Menschen, die Reisen besonders machen \u2014 Goldsainte hält das Geld nie.',
    fallbackRecipient: 'Ihren Reiseprofi',
    ledeCore: (a, r) => `Hiermit wird Ihr Trinkgeld von ${a} an ${r} bestätigt`,
    ledeOnDate: (d) => ` am ${d}`,
    ledeNote: (n) => ` Ihre Notiz: \u201E${n}\u201C`,
    lblTip: 'Trinkgeld', lblTo: 'An', lblDate: 'Datum',
    step1: 'Ihre Zahlung wurde sicher von Stripe verarbeitet und Ihrer Karte belastet.',
    step2: (r) => `Das Trinkgeld geht direkt auf das eigene Konto von ${r}.`,
    step3: (r) => `Bewahren Sie diese E-Mail als Quittung auf \u2014 die Belastung erscheint auf Ihrer Abrechnung von ${r} über Stripe.`,
  },
  it: {
    subject: (a, r) => `La tua mancia di ${a} a ${r} \u2014 ricevuta`,
    title: 'La tua ricevuta di mancia Goldsainte',
    headline: 'Grazie.',
    tagline: 'Le mance vanno direttamente a chi rende speciale il viaggio \u2014 Goldsainte non trattiene mai il denaro.',
    fallbackRecipient: 'il tuo professionista di viaggio',
    ledeCore: (a, r) => `Questo conferma la tua mancia di ${a} a ${r}`,
    ledeOnDate: (d) => ` il ${d}`,
    ledeNote: (n) => ` La tua nota: \u201C${n}\u201D`,
    lblTip: 'Mancia', lblTo: 'A', lblDate: 'Data',
    step1: 'Il pagamento è stato elaborato in sicurezza da Stripe e addebitato sulla tua carta.',
    step2: (r) => `La mancia è versata direttamente sul conto di ${r}.`,
    step3: (r) => `Conserva questa email come ricevuta \u2014 l'addebito compare sull'estratto conto a nome di ${r} via Stripe.`,
  },
  pt: {
    subject: (a, r) => `Sua gorjeta de ${a} para ${r} \u2014 recibo`,
    title: 'Seu recibo de gorjeta Goldsainte',
    headline: 'Obrigado.',
    tagline: 'As gorjetas vão direto para quem torna a viagem especial \u2014 a Goldsainte nunca retém o dinheiro.',
    fallbackRecipient: 'seu profissional de viagens',
    ledeCore: (a, r) => `Isto confirma sua gorjeta de ${a} para ${r}`,
    ledeOnDate: (d) => ` em ${d}`,
    ledeNote: (n) => ` Sua nota: \u201C${n}\u201D`,
    lblTip: 'Gorjeta', lblTo: 'Para', lblDate: 'Data',
    step1: 'Seu pagamento foi processado com segurança pelo Stripe e cobrado no seu cartão.',
    step2: (r) => `A gorjeta é paga diretamente na conta de ${r}.`,
    step3: (r) => `Guarde este e-mail como recibo \u2014 a cobrança aparece no seu extrato em nome de ${r} via Stripe.`,
  },
  ar: {
    subject: (a, r) => `إكراميتك بقيمة ${a} إلى ${r} \u2014 إيصال`,
    title: 'إيصال إكراميتك من Goldsainte',
    headline: 'شكراً لك.',
    tagline: 'تذهب الإكراميات مباشرة إلى من يجعلون السفر مميزاً \u2014 لا تحتفظ Goldsainte بالمال أبداً.',
    fallbackRecipient: 'مختص السفر الخاص بك',
    ledeCore: (a, r) => `يؤكد هذا إكراميتك بقيمة ${a} إلى ${r}`,
    ledeOnDate: (d) => ` بتاريخ ${d}`,
    ledeNote: (n) => ` ملاحظتك: \u201C${n}\u201D`,
    lblTip: 'الإكرامية', lblTo: 'إلى', lblDate: 'التاريخ',
    step1: 'عولجت دفعتك بأمان عبر Stripe وخُصمت من بطاقتك.',
    step2: (r) => `تُدفع الإكرامية مباشرة إلى حساب ${r}.`,
    step3: (r) => `احتفظ بهذه الرسالة كإيصال \u2014 يظهر الخصم في كشفك باسم ${r} عبر Stripe.`,
  },
  ja: {
    subject: (a, r) => `${r} への ${a} のチップ \u2014 領収書`,
    title: 'Goldsainte チップ領収書',
    headline: 'ありがとうございます。',
    tagline: 'チップは旅を特別にする人たちへ直接届きます \u2014 Goldsainte がお金を預かることはありません。',
    fallbackRecipient: 'あなたの旅の専門家',
    ledeCore: (a, r) => `${r} への ${a} のチップを確認しました`,
    ledeOnDate: (d) => `（${d}）`,
    ledeNote: (n) => ` メモ：\u201C${n}\u201D`,
    lblTip: 'チップ', lblTo: '宛先', lblDate: '日付',
    step1: 'お支払いは Stripe が安全に処理し、カードに請求されました。',
    step2: (r) => `チップは ${r} 本人のアカウントへ直接支払われます。`,
    step3: (r) => `このメールを領収書として保管してください \u2014 明細には Stripe 経由の ${r} 名義で表示されます。`,
  },
  ko: {
    subject: (a, r) => `${r}님에게 보낸 ${a} 팁 \u2014 영수증`,
    title: 'Goldsainte 팁 영수증',
    headline: '감사합니다.',
    tagline: '팁은 여행을 특별하게 만드는 사람들에게 직접 전달됩니다 \u2014 Goldsainte는 돈을 보관하지 않습니다.',
    fallbackRecipient: '당신의 여행 전문가',
    ledeCore: (a, r) => `${r}님에게 보낸 ${a} 팁을 확인합니다`,
    ledeOnDate: (d) => ` (${d})`,
    ledeNote: (n) => ` 메모: \u201C${n}\u201D`,
    lblTip: '팁', lblTo: '받는 분', lblDate: '날짜',
    step1: '결제는 Stripe가 안전하게 처리했으며 카드로 청구되었습니다.',
    step2: (r) => `팁은 ${r}님 본인 계좌로 직접 지급됩니다.`,
    step3: (r) => `이 메일을 영수증으로 보관하세요 \u2014 명세서에는 Stripe를 통한 ${r} 명의로 표시됩니다.`,
  },
  zh: {
    subject: (a, r) => `你给 ${r} 的 ${a} 小费 \u2014 收据`,
    title: '你的 Goldsainte 小费收据',
    headline: '谢谢你。',
    tagline: '小费直接送到让旅行变得特别的人手中 \u2014 Goldsainte 从不代管这笔钱。',
    fallbackRecipient: '你的旅行专家',
    ledeCore: (a, r) => `兹确认你给 ${r} 的 ${a} 小费`,
    ledeOnDate: (d) => `（${d}）`,
    ledeNote: (n) => ` 你的留言：\u201C${n}\u201D`,
    lblTip: '小费', lblTo: '致', lblDate: '日期',
    step1: '你的付款已由 Stripe 安全处理并从你的卡中扣款。',
    step2: (r) => `小费直接支付到 ${r} 本人的账户。`,
    step3: (r) => `请保留此邮件作为收据 \u2014 账单上显示为经 Stripe 的 ${r} 收款。`,
  },
}

export const TipReceiptEmail = ({
  amount = '$0.00',
  recipientName,
  date,
  note,
  lang,
}: TipReceiptProps) => {
  const s = pickLang(STRINGS, lang)
  const recipient = recipientName || s.fallbackRecipient
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={`${s.ledeCore(amount, recipient)}${date ? s.ledeOnDate(date) : ''}.${note ? s.ledeNote(note) : ''}`}
      details={[
        { label: s.lblTip, value: amount },
        { label: s.lblTo, value: recipient },
        ...(date ? [{ label: s.lblDate, value: date }] : []),
      ]}
      steps={[s.step1, s.step2(recipient), s.step3(recipient)]}
    />
  )
}

export const template = {
  component: TipReceiptEmail,
  subject: (d: Record<string, any>) => {
    const s = pickLang(STRINGS, d?.lang)
    return s.subject(d?.amount || '', d?.recipientName || s.fallbackRecipient)
  },
  displayName: 'Tip — receipt (traveler)',
  previewData: { amount: '$10.00', recipientName: 'Tanya', date: 'July 26, 2026', note: 'Thanks for the Tokyo guide!' },
} satisfies TemplateEntry
