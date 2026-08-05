/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  specialistName?: string
  tripName?: string
  bookingReference?: string
  amountPaid?: string
  tripTotal?: string
  balanceDue?: string
  currency?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (specialist: string, trip: string) => string
  lblReference: string
  lblTotal: string
  lblDeposit: string
  lblBalance: string
  step1: string
  step2WithBalance: (amount: string) => string
  step2NoBalance: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Your trip is confirmed',
    title: 'Your trip is confirmed',
    headline: 'Your trip is confirmed.',
    tagline: 'Every detail has been arranged. We wish you an extraordinary journey.',
    lede: (s, t) => `Your booking with ${s} for ${t} has been confirmed and the contract is now in effect. Your deposit has been processed securely through Stripe.`,
    lblReference: 'Booking reference', lblTotal: 'Trip total', lblDeposit: 'Deposit paid', lblBalance: 'Balance remaining',
    step1: 'Your specialist will contact you within 24 hours to confirm trip details.',
    step2WithBalance: (a) => `Your balance of ${a} is due before departure.`,
    step2NoBalance: 'Any remaining balance is due before departure.',
    step3: 'Your itinerary, contract, and receipts are saved in your dashboard.',
    step4: 'Your payment goes directly to your specialist — your seller of record for this trip.',
    step5: 'Message your specialist anytime from your bookings dashboard — all comms stay on-platform.',
    cta: 'View my booking',
  },
  fr: {
    subject: 'Votre voyage est confirmé',
    title: 'Votre voyage est confirmé',
    headline: 'Votre voyage est confirmé.',
    tagline: 'Chaque détail a été organisé. Nous vous souhaitons un voyage extraordinaire.',
    lede: (s, t) => `Votre réservation avec ${s} pour ${t} est confirmée et le contrat est désormais en vigueur. Votre acompte a été traité en toute sécurité via Stripe.`,
    lblReference: 'Référence de réservation', lblTotal: 'Total du voyage', lblDeposit: 'Acompte versé', lblBalance: 'Solde restant',
    step1: 'Votre spécialiste vous contactera sous 24 heures pour confirmer les détails du voyage.',
    step2WithBalance: (a) => `Votre solde de ${a} est dû avant le départ.`,
    step2NoBalance: 'Tout solde restant est dû avant le départ.',
    step3: 'Votre itinéraire, votre contrat et vos reçus sont enregistrés dans votre tableau de bord.',
    step4: 'Votre paiement va directement à votre spécialiste — votre vendeur officiel pour ce voyage.',
    step5: 'Écrivez à votre spécialiste à tout moment depuis votre tableau de bord — toutes les communications restent sur la plateforme.',
    cta: 'Voir ma réservation',
  },
  es: {
    subject: 'Tu viaje está confirmado',
    title: 'Tu viaje está confirmado',
    headline: 'Tu viaje está confirmado.',
    tagline: 'Cada detalle está organizado. Te deseamos un viaje extraordinario.',
    lede: (s, t) => `Tu reserva con ${s} para ${t} está confirmada y el contrato ya está en vigor. Tu depósito se ha procesado de forma segura a través de Stripe.`,
    lblReference: 'Referencia de reserva', lblTotal: 'Total del viaje', lblDeposit: 'Depósito pagado', lblBalance: 'Saldo pendiente',
    step1: 'Tu especialista te contactará en 24 horas para confirmar los detalles del viaje.',
    step2WithBalance: (a) => `Tu saldo de ${a} vence antes de la salida.`,
    step2NoBalance: 'Cualquier saldo pendiente vence antes de la salida.',
    step3: 'Tu itinerario, contrato y recibos quedan guardados en tu panel.',
    step4: 'Tu pago va directamente a tu especialista — tu vendedor registrado para este viaje.',
    step5: 'Escribe a tu especialista cuando quieras desde tu panel de reservas — toda la comunicación queda en la plataforma.',
    cta: 'Ver mi reserva',
  },
  de: {
    subject: 'Ihre Reise ist bestätigt',
    title: 'Ihre Reise ist bestätigt',
    headline: 'Ihre Reise ist bestätigt.',
    tagline: 'Jedes Detail ist arrangiert. Wir wünschen Ihnen eine außergewöhnliche Reise.',
    lede: (s, t) => `Ihre Buchung bei ${s} für ${t} ist bestätigt und der Vertrag ist nun in Kraft. Ihre Anzahlung wurde sicher über Stripe verarbeitet.`,
    lblReference: 'Buchungsreferenz', lblTotal: 'Reisesumme', lblDeposit: 'Anzahlung geleistet', lblBalance: 'Restbetrag',
    step1: 'Ihr Spezialist meldet sich innerhalb von 24 Stunden, um die Reisedetails zu bestätigen.',
    step2WithBalance: (a) => `Ihr Restbetrag von ${a} ist vor der Abreise fällig.`,
    step2NoBalance: 'Ein etwaiger Restbetrag ist vor der Abreise fällig.',
    step3: 'Reiseplan, Vertrag und Belege sind in Ihrem Dashboard gespeichert.',
    step4: 'Ihre Zahlung geht direkt an Ihren Spezialisten — den eingetragenen Verkäufer dieser Reise.',
    step5: 'Schreiben Sie Ihrem Spezialisten jederzeit über Ihr Buchungs-Dashboard — die gesamte Kommunikation bleibt auf der Plattform.',
    cta: 'Meine Buchung ansehen',
  },
  it: {
    subject: 'Il tuo viaggio è confermato',
    title: 'Il tuo viaggio è confermato',
    headline: 'Il tuo viaggio è confermato.',
    tagline: 'Ogni dettaglio è stato organizzato. Ti auguriamo un viaggio straordinario.',
    lede: (s, t) => `La tua prenotazione con ${s} per ${t} è confermata e il contratto è ora in vigore. Il tuo acconto è stato elaborato in sicurezza tramite Stripe.`,
    lblReference: 'Riferimento prenotazione', lblTotal: 'Totale viaggio', lblDeposit: 'Acconto versato', lblBalance: 'Saldo residuo',
    step1: 'Il tuo specialista ti contatterà entro 24 ore per confermare i dettagli del viaggio.',
    step2WithBalance: (a) => `Il tuo saldo di ${a} è dovuto prima della partenza.`,
    step2NoBalance: 'Ogni saldo residuo è dovuto prima della partenza.',
    step3: 'Itinerario, contratto e ricevute sono salvati nella tua dashboard.',
    step4: 'Il tuo pagamento va direttamente al tuo specialista — il venditore registrato per questo viaggio.',
    step5: 'Scrivi al tuo specialista in qualsiasi momento dalla dashboard prenotazioni — tutte le comunicazioni restano sulla piattaforma.',
    cta: 'Vedi la mia prenotazione',
  },
  pt: {
    subject: 'Sua viagem está confirmada',
    title: 'Sua viagem está confirmada',
    headline: 'Sua viagem está confirmada.',
    tagline: 'Cada detalhe foi organizado. Desejamos a você uma viagem extraordinária.',
    lede: (s, t) => `Sua reserva com ${s} para ${t} foi confirmada e o contrato já está em vigor. Seu depósito foi processado com segurança pelo Stripe.`,
    lblReference: 'Referência da reserva', lblTotal: 'Total da viagem', lblDeposit: 'Depósito pago', lblBalance: 'Saldo restante',
    step1: 'Seu especialista entrará em contato em até 24 horas para confirmar os detalhes da viagem.',
    step2WithBalance: (a) => `Seu saldo de ${a} vence antes da partida.`,
    step2NoBalance: 'Qualquer saldo restante vence antes da partida.',
    step3: 'Seu roteiro, contrato e recibos ficam salvos no seu painel.',
    step4: 'Seu pagamento vai direto para seu especialista — o vendedor registrado desta viagem.',
    step5: 'Fale com seu especialista a qualquer momento pelo painel de reservas — toda a comunicação fica na plataforma.',
    cta: 'Ver minha reserva',
  },
  ar: {
    subject: 'تم تأكيد رحلتك',
    title: 'تم تأكيد رحلتك',
    headline: 'تم تأكيد رحلتك.',
    tagline: 'رُتّب كل شيء بعناية. نتمنى لك رحلة استثنائية.',
    lede: (s, t) => `تم تأكيد حجزك مع ${s} لرحلة ${t} وأصبح العقد سارياً. عولج عربونك بأمان عبر Stripe.`,
    lblReference: 'مرجع الحجز', lblTotal: 'إجمالي الرحلة', lblDeposit: 'العربون المدفوع', lblBalance: 'المبلغ المتبقي',
    step1: 'سيتواصل معك مختصك خلال 24 ساعة لتأكيد تفاصيل الرحلة.',
    step2WithBalance: (a) => `المبلغ المتبقي ${a} مستحق قبل المغادرة.`,
    step2NoBalance: 'أي مبلغ متبقٍ مستحق قبل المغادرة.',
    step3: 'مسار رحلتك والعقد والإيصالات محفوظة في لوحتك.',
    step4: 'تذهب دفعتك مباشرة إلى مختصك — البائع المسجّل لهذه الرحلة.',
    step5: 'راسل مختصك في أي وقت من لوحة حجوزاتك — كل التواصل يبقى على المنصة.',
    cta: 'عرض حجزي',
  },
  ja: {
    subject: '旅の予約が確定しました',
    title: '旅の予約が確定しました',
    headline: '旅の予約が確定しました。',
    tagline: 'すべての手配が整いました。素晴らしい旅になりますように。',
    lede: (s, t) => `${s} との「${t}」のご予約が確定し、契約が発効しました。デポジットは Stripe で安全に処理されています。`,
    lblReference: '予約番号', lblTotal: '旅の総額', lblDeposit: '支払い済みデポジット', lblBalance: '残額',
    step1: 'スペシャリストが24時間以内にご連絡し、旅の詳細を確認します。',
    step2WithBalance: (a) => `残額 ${a} は出発前にお支払いください。`,
    step2NoBalance: '残額がある場合は出発前にお支払いください。',
    step3: '旅程・契約書・領収書はダッシュボードに保存されています。',
    step4: 'お支払いはスペシャリストへ直接送られます — この旅の正式な販売者です。',
    step5: '予約ダッシュボードからいつでもスペシャリストにメッセージできます — やり取りはすべてプラットフォーム上で。',
    cta: '予約を見る',
  },
  ko: {
    subject: '여행이 확정되었습니다',
    title: '여행이 확정되었습니다',
    headline: '여행이 확정되었습니다.',
    tagline: '모든 준비가 끝났습니다. 특별한 여행이 되길 바랍니다.',
    lede: (s, t) => `${s}와(과)의 ${t} 예약이 확정되었고 계약이 발효되었습니다. 계약금은 Stripe를 통해 안전하게 처리되었습니다.`,
    lblReference: '예약 번호', lblTotal: '여행 총액', lblDeposit: '지불한 계약금', lblBalance: '남은 잔액',
    step1: '전문가가 24시간 이내에 연락해 여행 세부 사항을 확인합니다.',
    step2WithBalance: (a) => `잔액 ${a}은(는) 출발 전에 지불해야 합니다.`,
    step2NoBalance: '남은 잔액은 출발 전에 지불해야 합니다.',
    step3: '일정, 계약서, 영수증은 대시보드에 저장되어 있습니다.',
    step4: '결제 금액은 이 여행의 등록 판매자인 전문가에게 직접 전달됩니다.',
    step5: '예약 대시보드에서 언제든 전문가에게 메시지를 보내세요 — 모든 소통은 플랫폼 안에서 이루어집니다.',
    cta: '내 예약 보기',
  },
  zh: {
    subject: '你的旅程已确认',
    title: '你的旅程已确认',
    headline: '你的旅程已确认。',
    tagline: '一切细节均已安排妥当。祝你旅途非凡。',
    lede: (s, t) => `你与 ${s} 的「${t}」预订已确认，合同现已生效。你的订金已通过 Stripe 安全处理。`,
    lblReference: '预订编号', lblTotal: '旅程总额', lblDeposit: '已付订金', lblBalance: '剩余款项',
    step1: '你的专家将在 24 小时内联系你，确认旅程细节。',
    step2WithBalance: (a) => `剩余款项 ${a} 需在出发前付清。`,
    step2NoBalance: '如有剩余款项，需在出发前付清。',
    step3: '你的行程、合同与收据都保存在你的面板中。',
    step4: '你的付款直接支付给你的专家 — 本次旅程的登记卖方。',
    step5: '随时可在预订面板给专家发消息 — 所有沟通都留在平台上。',
    cta: '查看我的预订',
  },
}

export const BookingConfirmationTravelerEmail = ({
  bookingId,
  specialistName,
  tripName,
  bookingReference,
  amountPaid,
  tripTotal,
  balanceDue,
  currency = 'USD',
  lang,
}: Props) => {
  const s = pickLang(STRINGS, lang)
  const sym = currency === 'USD' ? '$' : ''
  const details = [
    bookingReference ? { label: s.lblReference, value: bookingReference } : null,
    tripTotal ? { label: s.lblTotal, value: `${sym}${tripTotal}` } : null,
    amountPaid ? { label: s.lblDeposit, value: `${sym}${amountPaid}` } : null,
    balanceDue ? { label: s.lblBalance, value: `${sym}${balanceDue}` } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(specialistName ?? '', tripName ?? '')}
      details={details}
      steps={[
        s.step1,
        balanceDue ? s.step2WithBalance(`${sym}${balanceDue}`) : s.step2NoBalance,
        s.step3,
        s.step4,
        s.step5,
      ]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/bookings/${bookingId ?? ''}` }}
    />
  )
}

export const template = {
  component: BookingConfirmationTravelerEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Booking Confirmation — Traveler',
  previewData: {
    specialistName: 'Maison Atelier',
    tripName: 'Amalfi in Bloom',
    bookingId: 'b-789',
    bookingReference: 'GS-7850DBA8',
    amountPaid: '5',
    tripTotal: '20',
    balanceDue: '15',
    currency: 'USD',
  },
} satisfies TemplateEntry
