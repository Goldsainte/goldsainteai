/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  travelerName?: string
  tripName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: (traveler: string) => string
  lede: (trip: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Your proposal has been accepted',
    title: 'Your proposal has been accepted',
    headline: 'Your proposal has been accepted.',
    tagline: (t) => `${t} has chosen to move forward with your proposal.`,
    lede: (trip) => `Congratulations. The traveler has accepted your proposal for ${trip}. The deposit has been paid to your Stripe account and the contract is in effect.`,
    step1: 'Review the signed contract in your dashboard.',
    step2: 'Begin coordination with the traveler on-platform.',
    step3: 'The balance is paid before departure, per the contract.',
    step4: 'Payouts settle to your connected Stripe account.',
    step5: 'Deliver an extraordinary experience — and earn a glowing review.',
    cta: 'View booking',
  },
  fr: {
    subject: 'Votre proposition a été acceptée',
    title: 'Votre proposition a été acceptée',
    headline: 'Votre proposition a été acceptée.',
    tagline: (t) => `${t} a choisi de donner suite à votre proposition.`,
    lede: (trip) => `Félicitations. Le voyageur a accepté votre proposition pour ${trip}. L'acompte a été versé sur votre compte Stripe et le contrat est en vigueur.`,
    step1: 'Consultez le contrat signé dans votre tableau de bord.',
    step2: 'Commencez la coordination avec le voyageur sur la plateforme.',
    step3: 'Le solde est réglé avant le départ, conformément au contrat.',
    step4: 'Les versements arrivent sur votre compte Stripe connecté.',
    step5: 'Offrez une expérience extraordinaire — et récoltez un avis élogieux.',
    cta: 'Voir la réservation',
  },
  es: {
    subject: 'Tu propuesta ha sido aceptada',
    title: 'Tu propuesta ha sido aceptada',
    headline: 'Tu propuesta ha sido aceptada.',
    tagline: (t) => `${t} ha decidido seguir adelante con tu propuesta.`,
    lede: (trip) => `Enhorabuena. El viajero ha aceptado tu propuesta para ${trip}. El depósito se ha pagado a tu cuenta de Stripe y el contrato está en vigor.`,
    step1: 'Revisa el contrato firmado en tu panel.',
    step2: 'Comienza la coordinación con el viajero en la plataforma.',
    step3: 'El saldo se paga antes de la salida, según el contrato.',
    step4: 'Los cobros se liquidan en tu cuenta de Stripe conectada.',
    step5: 'Ofrece una experiencia extraordinaria — y gana una reseña brillante.',
    cta: 'Ver reserva',
  },
  de: {
    subject: 'Ihr Angebot wurde angenommen',
    title: 'Ihr Angebot wurde angenommen',
    headline: 'Ihr Angebot wurde angenommen.',
    tagline: (t) => `${t} hat sich für Ihr Angebot entschieden.`,
    lede: (trip) => `Glückwunsch. Der Reisende hat Ihr Angebot für ${trip} angenommen. Die Anzahlung wurde auf Ihr Stripe-Konto gezahlt und der Vertrag ist in Kraft.`,
    step1: 'Prüfen Sie den unterzeichneten Vertrag in Ihrem Dashboard.',
    step2: 'Beginnen Sie die Abstimmung mit dem Reisenden auf der Plattform.',
    step3: 'Der Restbetrag wird vor der Abreise gezahlt, gemäß Vertrag.',
    step4: 'Auszahlungen laufen über Ihr verbundenes Stripe-Konto.',
    step5: 'Liefern Sie ein außergewöhnliches Erlebnis — und verdienen Sie eine glänzende Bewertung.',
    cta: 'Buchung ansehen',
  },
  it: {
    subject: 'La tua proposta è stata accettata',
    title: 'La tua proposta è stata accettata',
    headline: 'La tua proposta è stata accettata.',
    tagline: (t) => `${t} ha scelto di procedere con la tua proposta.`,
    lede: (trip) => `Congratulazioni. Il viaggiatore ha accettato la tua proposta per ${trip}. L'acconto è stato versato sul tuo conto Stripe e il contratto è in vigore.`,
    step1: 'Esamina il contratto firmato nella tua dashboard.',
    step2: 'Avvia il coordinamento con il viaggiatore sulla piattaforma.',
    step3: 'Il saldo viene pagato prima della partenza, come da contratto.',
    step4: 'Gli incassi arrivano sul tuo conto Stripe collegato.',
    step5: "Regala un'esperienza straordinaria — e guadagna una recensione brillante.",
    cta: 'Vedi prenotazione',
  },
  pt: {
    subject: 'Sua proposta foi aceita',
    title: 'Sua proposta foi aceita',
    headline: 'Sua proposta foi aceita.',
    tagline: (t) => `${t} decidiu seguir com a sua proposta.`,
    lede: (trip) => `Parabéns. O viajante aceitou sua proposta para ${trip}. O depósito foi pago na sua conta Stripe e o contrato está em vigor.`,
    step1: 'Revise o contrato assinado no seu painel.',
    step2: 'Comece a coordenação com o viajante na plataforma.',
    step3: 'O saldo é pago antes da partida, conforme o contrato.',
    step4: 'Os repasses caem na sua conta Stripe conectada.',
    step5: 'Entregue uma experiência extraordinária — e conquiste uma avaliação brilhante.',
    cta: 'Ver reserva',
  },
  ar: {
    subject: 'قُبل عرضك',
    title: 'قُبل عرضك',
    headline: 'قُبل عرضك.',
    tagline: (t) => `اختار ${t} المضي قدماً بعرضك.`,
    lede: (trip) => `تهانينا. قبل المسافر عرضك لرحلة ${trip}. دُفع العربون إلى حساب Stripe الخاص بك والعقد ساري المفعول.`,
    step1: 'راجع العقد الموقع في لوحتك.',
    step2: 'ابدأ التنسيق مع المسافر عبر المنصة.',
    step3: 'يُدفع المتبقي قبل المغادرة وفق العقد.',
    step4: 'تُسوّى المدفوعات إلى حساب Stripe المرتبط بك.',
    step5: 'قدّم تجربة استثنائية — واكسب تقييماً لامعاً.',
    cta: 'اعرض الحجز',
  },
  ja: {
    subject: '提案が承諾されました',
    title: '提案が承諾されました',
    headline: '提案が承諾されました。',
    tagline: (t) => `${t} さんがあなたの提案で進めることを選びました。`,
    lede: (trip) => `おめでとうございます。旅行者が「${trip}」の提案を承諾しました。デポジットはあなたの Stripe アカウントに支払われ、契約が発効しています。`,
    step1: 'ダッシュボードで署名済み契約を確認しましょう。',
    step2: 'プラットフォーム上で旅行者との調整を始めましょう。',
    step3: '残額は契約に従い出発前に支払われます。',
    step4: '入金は接続済みの Stripe アカウントに精算されます。',
    step5: '素晴らしい体験を届けて、輝くレビューを獲得しましょう。',
    cta: '予約を見る',
  },
  ko: {
    subject: '제안이 수락되었습니다',
    title: '제안이 수락되었습니다',
    headline: '제안이 수락되었습니다.',
    tagline: (t) => `${t}님이 당신의 제안으로 진행하기로 했습니다.`,
    lede: (trip) => `축하합니다. 여행자가 ${trip} 제안을 수락했습니다. 계약금이 당신의 Stripe 계좌로 지급되었고 계약이 발효되었습니다.`,
    step1: '대시보드에서 서명된 계약서를 확인하세요.',
    step2: '플랫폼에서 여행자와 조율을 시작하세요.',
    step3: '잔액은 계약에 따라 출발 전에 지급됩니다.',
    step4: '정산은 연결된 Stripe 계좌로 이루어집니다.',
    step5: '특별한 경험을 선사하고 빛나는 후기를 받으세요.',
    cta: '예약 보기',
  },
  zh: {
    subject: '你的提案已被接受',
    title: '你的提案已被接受',
    headline: '你的提案已被接受。',
    tagline: (t) => `${t} 选择采用你的提案继续推进。`,
    lede: (trip) => `恭喜。旅行者已接受你为「${trip}」提交的提案。订金已支付到你的 Stripe 账户，合同已生效。`,
    step1: '在工作台查看已签署的合同。',
    step2: '在平台上开始与旅行者协调。',
    step3: '尾款按合同在出发前支付。',
    step4: '结算款项进入你关联的 Stripe 账户。',
    step5: '交付非凡体验 — 赢得闪亮好评。',
    cta: '查看预订',
  },
}

export const ProposalAcceptedEmail = ({ bookingId, travelerName, tripName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline(travelerName ?? '')}
      lede={s.lede(tripName ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/partner-bookings` }}
    />
  )
}

export const template = {
  component: ProposalAcceptedEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Proposal Accepted',
  previewData: { travelerName: 'Alexandra', tripName: 'Amalfi in Bloom', bookingId: 'b-789' },
} satisfies TemplateEntry
