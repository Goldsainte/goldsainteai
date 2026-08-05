/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  amount?: string
  payoutId?: string
  tripName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (amount: string, trip: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'A payout has been sent to your account',
    title: 'A payout has been sent to your account',
    headline: 'A payout is on its way.',
    tagline: 'Your payout is on its way.',
    lede: (a, t) => `Goldsainte has released a payout of ${a} to your connected Stripe account for ${t}. Funds typically arrive within 1–2 business days.`,
    step1: 'View payout details in your dashboard.',
    step2: 'The Goldsainte platform fee has already been deducted.',
    step3: 'Your Stripe Connect dashboard shows expected arrival.',
    step4: 'Tax documents are generated annually for your records.',
    step5: 'Questions? Contact our concierge team.',
    cta: 'View payout',
  },
  fr: {
    subject: 'Un versement a été envoyé sur votre compte',
    title: 'Un versement a été envoyé sur votre compte',
    headline: 'Un versement est en route.',
    tagline: 'Votre versement est en route.',
    lede: (a, t) => `Goldsainte a libéré un versement de ${a} vers votre compte Stripe connecté pour ${t}. Les fonds arrivent généralement sous 1 à 2 jours ouvrés.`,
    step1: 'Consultez les détails du versement dans votre tableau de bord.',
    step2: 'Les frais de plateforme Goldsainte ont déjà été déduits.',
    step3: 'Votre tableau de bord Stripe Connect indique la date d\u2019arrivée prévue.',
    step4: 'Les documents fiscaux sont générés chaque année pour vos archives.',
    step5: 'Des questions ? Contactez notre équipe de conciergerie.',
    cta: 'Voir le versement',
  },
  es: {
    subject: 'Se ha enviado un cobro a tu cuenta',
    title: 'Se ha enviado un cobro a tu cuenta',
    headline: 'Tu cobro está en camino.',
    tagline: 'Tu cobro está en camino.',
    lede: (a, t) => `Goldsainte ha liberado un cobro de ${a} a tu cuenta de Stripe conectada por ${t}. Los fondos suelen llegar en 1–2 días laborables.`,
    step1: 'Consulta los detalles del cobro en tu panel.',
    step2: 'La tarifa de plataforma de Goldsainte ya se ha descontado.',
    step3: 'Tu panel de Stripe Connect muestra la llegada estimada.',
    step4: 'Los documentos fiscales se generan anualmente para tus registros.',
    step5: '¿Preguntas? Contacta con nuestro equipo de conserjería.',
    cta: 'Ver cobro',
  },
  de: {
    subject: 'Eine Auszahlung wurde an Ihr Konto gesendet',
    title: 'Eine Auszahlung wurde an Ihr Konto gesendet',
    headline: 'Eine Auszahlung ist unterwegs.',
    tagline: 'Ihre Auszahlung ist unterwegs.',
    lede: (a, t) => `Goldsainte hat eine Auszahlung von ${a} an Ihr verbundenes Stripe-Konto für ${t} freigegeben. Die Mittel treffen in der Regel innerhalb von 1–2 Werktagen ein.`,
    step1: 'Sehen Sie die Auszahlungsdetails in Ihrem Dashboard.',
    step2: 'Die Goldsainte-Plattformgebühr wurde bereits abgezogen.',
    step3: 'Ihr Stripe-Connect-Dashboard zeigt die erwartete Ankunft.',
    step4: 'Steuerdokumente werden jährlich für Ihre Unterlagen erstellt.',
    step5: 'Fragen? Kontaktieren Sie unser Concierge-Team.',
    cta: 'Auszahlung ansehen',
  },
  it: {
    subject: 'Un pagamento è stato inviato al tuo conto',
    title: 'Un pagamento è stato inviato al tuo conto',
    headline: 'Un pagamento è in arrivo.',
    tagline: 'Il tuo pagamento è in arrivo.',
    lede: (a, t) => `Goldsainte ha rilasciato un pagamento di ${a} sul tuo conto Stripe collegato per ${t}. I fondi arrivano di norma entro 1–2 giorni lavorativi.`,
    step1: 'Vedi i dettagli del pagamento nella tua dashboard.',
    step2: 'La commissione piattaforma Goldsainte è già stata detratta.',
    step3: 'La tua dashboard Stripe Connect mostra l\u2019arrivo previsto.',
    step4: 'I documenti fiscali vengono generati ogni anno per i tuoi archivi.',
    step5: 'Domande? Contatta il nostro team concierge.',
    cta: 'Vedi pagamento',
  },
  pt: {
    subject: 'Um repasse foi enviado para sua conta',
    title: 'Um repasse foi enviado para sua conta',
    headline: 'Um repasse está a caminho.',
    tagline: 'Seu repasse está a caminho.',
    lede: (a, t) => `A Goldsainte liberou um repasse de ${a} para sua conta Stripe conectada por ${t}. Os fundos normalmente chegam em 1–2 dias úteis.`,
    step1: 'Veja os detalhes do repasse no seu painel.',
    step2: 'A taxa da plataforma Goldsainte já foi descontada.',
    step3: 'Seu painel do Stripe Connect mostra a chegada prevista.',
    step4: 'Documentos fiscais são gerados anualmente para seus registros.',
    step5: 'Dúvidas? Fale com nossa equipe de concierge.',
    cta: 'Ver repasse',
  },
  ar: {
    subject: 'أُرسلت دفعة إلى حسابك',
    title: 'أُرسلت دفعة إلى حسابك',
    headline: 'دفعتك في الطريق.',
    tagline: 'دفعتك في الطريق.',
    lede: (a, t) => `أطلقت Goldsainte دفعة بقيمة ${a} إلى حساب Stripe المرتبط بك عن ${t}. تصل الأموال عادة خلال يوم إلى يومي عمل.`,
    step1: 'اعرض تفاصيل الدفعة في لوحتك.',
    step2: 'خُصمت رسوم منصة Goldsainte مسبقاً.',
    step3: 'تعرض لوحة Stripe Connect موعد الوصول المتوقع.',
    step4: 'تُنشأ المستندات الضريبية سنوياً لسجلاتك.',
    step5: 'أسئلة؟ تواصل مع فريق الكونسيرج لدينا.',
    cta: 'اعرض الدفعة',
  },
  ja: {
    subject: 'お客様の口座へ入金が送られました',
    title: 'お客様の口座へ入金が送られました',
    headline: '入金が向かっています。',
    tagline: 'あなたの入金が向かっています。',
    lede: (a, t) => `Goldsainte は「${t}」の入金 ${a} を、接続済みの Stripe アカウントへリリースしました。通常1〜2営業日で着金します。`,
    step1: 'ダッシュボードで入金の詳細を確認しましょう。',
    step2: 'Goldsainte のプラットフォーム手数料は差し引き済みです。',
    step3: '着金予定は Stripe Connect ダッシュボードに表示されます。',
    step4: '税務書類は毎年、記録用に生成されます。',
    step5: 'ご質問はコンシェルジュチームへ。',
    cta: '入金を見る',
  },
  ko: {
    subject: '계좌로 정산이 발송되었습니다',
    title: '계좌로 정산이 발송되었습니다',
    headline: '정산이 이동 중입니다.',
    tagline: '당신의 정산이 이동 중입니다.',
    lede: (a, t) => `Goldsainte가 ${t}에 대한 ${a} 정산을 연결된 Stripe 계좌로 릴리스했습니다. 자금은 보통 영업일 기준 1~2일 안에 도착합니다.`,
    step1: '대시보드에서 정산 상세를 확인하세요.',
    step2: 'Goldsainte 플랫폼 수수료는 이미 차감되었습니다.',
    step3: '예상 도착일은 Stripe Connect 대시보드에 표시됩니다.',
    step4: '세무 서류는 매년 기록용으로 생성됩니다.',
    step5: '질문이 있으신가요? 컨시어지 팀에 연락하세요.',
    cta: '정산 보기',
  },
  zh: {
    subject: '一笔结算已发送至你的账户',
    title: '一笔结算已发送至你的账户',
    headline: '结算正在路上。',
    tagline: '你的结算正在路上。',
    lede: (a, t) => `Goldsainte 已就「${t}」向你关联的 Stripe 账户发放 ${a} 结算。资金通常在 1–2 个工作日内到账。`,
    step1: '在面板中查看结算详情。',
    step2: 'Goldsainte 平台费已提前扣除。',
    step3: '你的 Stripe Connect 面板会显示预计到账时间。',
    step4: '税务文件每年生成，供你留档。',
    step5: '有疑问？请联系我们的礼宾团队。',
    cta: '查看结算',
  },
}

export const PayoutSentEmail = ({ amount, payoutId, tripName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(amount ?? '', tripName ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/earnings` }}
    />
  )
}

export const template = {
  component: PayoutSentEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Payout Sent',
  previewData: { amount: 'USD 11,562.50', tripName: 'Amalfi in Bloom', payoutId: 'po-111' },
} satisfies TemplateEntry
