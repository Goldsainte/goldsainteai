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
  tagline: string
  lede: (traveler: string, trip: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'New booking confirmed',
    title: 'New booking confirmed',
    headline: 'A new booking is confirmed.',
    tagline: 'Payment received. Begin coordination at your convenience.',
    lede: (t, trip) => `${t} has confirmed their booking for ${trip}. The contract is in effect and the deposit has been paid to your Stripe account.`,
    step1: 'Review the contract and traveler details in your dashboard.',
    step2: 'Begin on-platform coordination with the traveler.',
    step3: 'The balance is paid before departure, straight to your account.',
    step4: 'Payouts settle to your connected Stripe account.',
    step5: 'Communication and payment must remain on-platform.',
    cta: 'Open booking',
  },
  fr: {
    subject: 'Nouvelle réservation confirmée',
    title: 'Nouvelle réservation confirmée',
    headline: 'Une nouvelle réservation est confirmée.',
    tagline: 'Paiement reçu. Commencez la coordination quand vous le souhaitez.',
    lede: (t, trip) => `${t} a confirmé sa réservation pour ${trip}. Le contrat est en vigueur et l'acompte a été versé sur votre compte Stripe.`,
    step1: 'Consultez le contrat et les informations du voyageur dans votre tableau de bord.',
    step2: 'Commencez la coordination avec le voyageur sur la plateforme.',
    step3: 'Le solde est réglé avant le départ, directement sur votre compte.',
    step4: 'Les versements arrivent sur votre compte Stripe connecté.',
    step5: 'Communication et paiement doivent rester sur la plateforme.',
    cta: 'Ouvrir la réservation',
  },
  es: {
    subject: 'Nueva reserva confirmada',
    title: 'Nueva reserva confirmada',
    headline: 'Una nueva reserva está confirmada.',
    tagline: 'Pago recibido. Comienza la coordinación cuando quieras.',
    lede: (t, trip) => `${t} ha confirmado su reserva para ${trip}. El contrato está en vigor y el depósito se ha pagado a tu cuenta de Stripe.`,
    step1: 'Revisa el contrato y los datos del viajero en tu panel.',
    step2: 'Comienza la coordinación con el viajero en la plataforma.',
    step3: 'El saldo se paga antes de la salida, directo a tu cuenta.',
    step4: 'Los cobros se liquidan en tu cuenta de Stripe conectada.',
    step5: 'La comunicación y el pago deben permanecer en la plataforma.',
    cta: 'Abrir reserva',
  },
  de: {
    subject: 'Neue Buchung bestätigt',
    title: 'Neue Buchung bestätigt',
    headline: 'Eine neue Buchung ist bestätigt.',
    tagline: 'Zahlung eingegangen. Beginnen Sie die Abstimmung, wann es Ihnen passt.',
    lede: (t, trip) => `${t} hat die Buchung für ${trip} bestätigt. Der Vertrag ist in Kraft und die Anzahlung wurde auf Ihr Stripe-Konto gezahlt.`,
    step1: 'Prüfen Sie Vertrag und Reisenden-Details in Ihrem Dashboard.',
    step2: 'Beginnen Sie die Abstimmung mit dem Reisenden auf der Plattform.',
    step3: 'Der Restbetrag wird vor der Abreise gezahlt — direkt auf Ihr Konto.',
    step4: 'Auszahlungen laufen über Ihr verbundenes Stripe-Konto.',
    step5: 'Kommunikation und Zahlung müssen auf der Plattform bleiben.',
    cta: 'Buchung öffnen',
  },
  it: {
    subject: 'Nuova prenotazione confermata',
    title: 'Nuova prenotazione confermata',
    headline: 'Una nuova prenotazione è confermata.',
    tagline: 'Pagamento ricevuto. Avvia il coordinamento quando preferisci.',
    lede: (t, trip) => `${t} ha confermato la prenotazione per ${trip}. Il contratto è in vigore e l'acconto è stato versato sul tuo conto Stripe.`,
    step1: 'Esamina contratto e dati del viaggiatore nella tua dashboard.',
    step2: 'Avvia il coordinamento con il viaggiatore sulla piattaforma.',
    step3: 'Il saldo viene pagato prima della partenza, direttamente sul tuo conto.',
    step4: 'Gli incassi arrivano sul tuo conto Stripe collegato.',
    step5: 'Comunicazione e pagamenti devono restare sulla piattaforma.',
    cta: 'Apri prenotazione',
  },
  pt: {
    subject: 'Nova reserva confirmada',
    title: 'Nova reserva confirmada',
    headline: 'Uma nova reserva está confirmada.',
    tagline: 'Pagamento recebido. Comece a coordenação quando quiser.',
    lede: (t, trip) => `${t} confirmou a reserva para ${trip}. O contrato está em vigor e o depósito foi pago na sua conta Stripe.`,
    step1: 'Revise o contrato e os dados do viajante no seu painel.',
    step2: 'Comece a coordenação com o viajante na plataforma.',
    step3: 'O saldo é pago antes da partida, direto na sua conta.',
    step4: 'Os repasses caem na sua conta Stripe conectada.',
    step5: 'Comunicação e pagamento devem permanecer na plataforma.',
    cta: 'Abrir reserva',
  },
  ar: {
    subject: 'تم تأكيد حجز جديد',
    title: 'تم تأكيد حجز جديد',
    headline: 'تم تأكيد حجز جديد.',
    tagline: 'استُلمت الدفعة. ابدأ التنسيق متى شئت.',
    lede: (t, trip) => `أكد ${t} حجزه لرحلة ${trip}. العقد ساري المفعول ودُفع العربون إلى حساب Stripe الخاص بك.`,
    step1: 'راجع العقد وبيانات المسافر في لوحتك.',
    step2: 'ابدأ التنسيق مع المسافر عبر المنصة.',
    step3: 'يُدفع المتبقي قبل المغادرة، مباشرة إلى حسابك.',
    step4: 'تُسوّى المدفوعات إلى حساب Stripe المرتبط بك.',
    step5: 'يجب أن يبقى التواصل والدفع على المنصة.',
    cta: 'افتح الحجز',
  },
  ja: {
    subject: '新しい予約が確定しました',
    title: '新しい予約が確定しました',
    headline: '新しい予約が確定しました。',
    tagline: '支払いを受領しました。ご都合の良いときに調整を始めましょう。',
    lede: (t, trip) => `${t} さんが「${trip}」の予約を確定しました。契約が発効し、デポジットはあなたの Stripe アカウントに支払われています。`,
    step1: 'ダッシュボードで契約と旅行者情報を確認しましょう。',
    step2: 'プラットフォーム上で旅行者との調整を始めましょう。',
    step3: '残額は出発前に、あなたの口座へ直接支払われます。',
    step4: '入金は接続済みの Stripe アカウントに精算されます。',
    step5: '連絡と支払いはプラットフォーム上で行ってください。',
    cta: '予約を開く',
  },
  ko: {
    subject: '새 예약이 확정되었습니다',
    title: '새 예약이 확정되었습니다',
    headline: '새 예약이 확정되었습니다.',
    tagline: '결제가 완료되었습니다. 편하실 때 조율을 시작하세요.',
    lede: (t, trip) => `${t}님이 ${trip} 예약을 확정했습니다. 계약이 발효되었고 계약금이 당신의 Stripe 계좌로 지급되었습니다.`,
    step1: '대시보드에서 계약서와 여행자 정보를 확인하세요.',
    step2: '플랫폼에서 여행자와 조율을 시작하세요.',
    step3: '잔액은 출발 전에 계좌로 바로 지급됩니다.',
    step4: '정산은 연결된 Stripe 계좌로 이루어집니다.',
    step5: '소통과 결제는 플랫폼 안에 있어야 합니다.',
    cta: '예약 열기',
  },
  zh: {
    subject: '新预订已确认',
    title: '新预订已确认',
    headline: '一笔新预订已确认。',
    tagline: '已收到付款。可随时开始协调。',
    lede: (t, trip) => `${t} 已确认「${trip}」的预订。合同已生效，订金已支付到你的 Stripe 账户。`,
    step1: '在工作台查看合同与旅行者信息。',
    step2: '在平台上开始与旅行者协调。',
    step3: '尾款在出发前支付，直接进入你的账户。',
    step4: '结算款项进入你关联的 Stripe 账户。',
    step5: '沟通与支付必须留在平台内。',
    cta: '打开预订',
  },
}

export const BookingConfirmationProfessionalEmail = ({ bookingId, travelerName, tripName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(travelerName ?? '', tripName ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/partner-bookings` }}
    />
  )
}

export const template = {
  component: BookingConfirmationProfessionalEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Booking Confirmation — Specialist',
  previewData: { travelerName: 'Alexandra', tripName: 'Amalfi in Bloom', bookingId: 'b-789' },
} satisfies TemplateEntry
