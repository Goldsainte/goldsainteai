/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  destination?: string
  requestId?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: (destination: string) => string
  lede: string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'A traveler is seeking your specialty',
    title: 'A traveler is seeking your specialty',
    headline: 'A trip request matches your specialty.',
    tagline: (d) => `A discerning traveler is seeking a specialist for ${d}.`,
    lede: 'Their brief aligns with your destinations, services, and price tier. Review the request and submit a bespoke proposal — first thoughtful responses receive the most attention.',
    step1: 'Read the full traveler brief in your dashboard.',
    step2: 'Craft a tailored proposal — itinerary, inclusions, total investment.',
    step3: 'Submit before competitors do.',
    step4: 'Communicate with the traveler on-platform once invited.',
    step5: 'All accepted bookings are paid securely through Stripe, straight to your account.',
    cta: 'View request',
  },
  fr: {
    subject: 'Un voyageur recherche votre spécialité',
    title: 'Un voyageur recherche votre spécialité',
    headline: 'Une demande de voyage correspond à votre spécialité.',
    tagline: (d) => `Un voyageur exigeant recherche un spécialiste pour ${d}.`,
    lede: 'Son brief correspond à vos destinations, services et gamme de prix. Consultez la demande et envoyez une proposition sur mesure — les premières réponses soignées retiennent le plus l\u2019attention.',
    step1: 'Lisez le brief complet du voyageur dans votre tableau de bord.',
    step2: 'Concevez une proposition sur mesure — itinéraire, prestations, investissement total.',
    step3: 'Envoyez avant vos concurrents.',
    step4: 'Échangez avec le voyageur sur la plateforme une fois invité.',
    step5: 'Toutes les réservations acceptées sont payées en toute sécurité via Stripe, directement sur votre compte.',
    cta: 'Voir la demande',
  },
  es: {
    subject: 'Un viajero busca tu especialidad',
    title: 'Un viajero busca tu especialidad',
    headline: 'Una solicitud de viaje coincide con tu especialidad.',
    tagline: (d) => `Un viajero exigente busca un especialista para ${d}.`,
    lede: 'Su brief encaja con tus destinos, servicios y rango de precio. Revisa la solicitud y envía una propuesta a medida — las primeras respuestas cuidadas reciben la mayor atención.',
    step1: 'Lee el brief completo del viajero en tu panel.',
    step2: 'Elabora una propuesta a medida — itinerario, inclusiones, inversión total.',
    step3: 'Envíala antes que la competencia.',
    step4: 'Comunícate con el viajero en la plataforma cuando te invite.',
    step5: 'Todas las reservas aceptadas se pagan de forma segura por Stripe, directo a tu cuenta.',
    cta: 'Ver solicitud',
  },
  de: {
    subject: 'Ein Reisender sucht Ihre Spezialität',
    title: 'Ein Reisender sucht Ihre Spezialität',
    headline: 'Eine Reiseanfrage passt zu Ihrer Spezialität.',
    tagline: (d) => `Ein anspruchsvoller Reisender sucht einen Spezialisten für ${d}.`,
    lede: 'Der Brief passt zu Ihren Zielen, Leistungen und Ihrer Preisklasse. Prüfen Sie die Anfrage und senden Sie ein maßgeschneidertes Angebot — erste durchdachte Antworten erhalten die meiste Aufmerksamkeit.',
    step1: 'Lesen Sie den vollständigen Brief in Ihrem Dashboard.',
    step2: 'Erstellen Sie ein maßgeschneidertes Angebot — Reiseplan, Leistungen, Gesamtinvestition.',
    step3: 'Reichen Sie vor der Konkurrenz ein.',
    step4: 'Kommunizieren Sie nach der Einladung mit dem Reisenden auf der Plattform.',
    step5: 'Alle angenommenen Buchungen werden sicher über Stripe bezahlt — direkt auf Ihr Konto.',
    cta: 'Anfrage ansehen',
  },
  it: {
    subject: 'Un viaggiatore cerca la tua specialità',
    title: 'Un viaggiatore cerca la tua specialità',
    headline: 'Una richiesta di viaggio corrisponde alla tua specialità.',
    tagline: (d) => `Un viaggiatore esigente cerca uno specialista per ${d}.`,
    lede: 'Il suo brief è in linea con le tue destinazioni, servizi e fascia di prezzo. Esamina la richiesta e invia una proposta su misura — le prime risposte curate ricevono più attenzione.',
    step1: 'Leggi il brief completo del viaggiatore nella tua dashboard.',
    step2: 'Prepara una proposta su misura — itinerario, inclusioni, investimento totale.',
    step3: 'Invia prima dei concorrenti.',
    step4: 'Comunica con il viaggiatore sulla piattaforma quando invitato.',
    step5: 'Tutte le prenotazioni accettate sono pagate in sicurezza via Stripe, direttamente sul tuo conto.',
    cta: 'Vedi richiesta',
  },
  pt: {
    subject: 'Um viajante procura sua especialidade',
    title: 'Um viajante procura sua especialidade',
    headline: 'Um pedido de viagem combina com sua especialidade.',
    tagline: (d) => `Um viajante exigente procura um especialista para ${d}.`,
    lede: 'O briefing combina com seus destinos, serviços e faixa de preço. Revise o pedido e envie uma proposta sob medida — as primeiras respostas caprichadas recebem mais atenção.',
    step1: 'Leia o briefing completo do viajante no seu painel.',
    step2: 'Monte uma proposta sob medida — roteiro, inclusões, investimento total.',
    step3: 'Envie antes dos concorrentes.',
    step4: 'Converse com o viajante na plataforma quando for convidado.',
    step5: 'Todas as reservas aceitas são pagas com segurança pelo Stripe, direto na sua conta.',
    cta: 'Ver pedido',
  },
  ar: {
    subject: 'مسافر يبحث عن تخصصك',
    title: 'مسافر يبحث عن تخصصك',
    headline: 'طلب رحلة يطابق تخصصك.',
    tagline: (d) => `مسافر رفيع الذوق يبحث عن مختص لوجهة ${d}.`,
    lede: 'موجزه يتوافق مع وجهاتك وخدماتك وفئة أسعارك. راجع الطلب وقدّم عرضاً مصمماً — الردود الأولى المدروسة تنال أكبر اهتمام.',
    step1: 'اقرأ موجز المسافر كاملاً في لوحتك.',
    step2: 'أعد عرضاً مخصصاً — المسار والمشمولات وإجمالي الاستثمار.',
    step3: 'قدّم قبل منافسيك.',
    step4: 'تواصل مع المسافر عبر المنصة عند الدعوة.',
    step5: 'كل الحجوزات المقبولة تُدفع بأمان عبر Stripe مباشرة إلى حسابك.',
    cta: 'اعرض الطلب',
  },
  ja: {
    subject: 'あなたの専門を求める旅行者がいます',
    title: 'あなたの専門を求める旅行者がいます',
    headline: '旅のリクエストがあなたの専門にマッチしました。',
    tagline: (d) => `目の肥えた旅行者が ${d} のスペシャリストを探しています。`,
    lede: 'ブリーフはあなたの目的地・サービス・価格帯に合致しています。リクエストを確認し、オーダーメイドの提案を送りましょう — 最初の丁寧な返答ほど注目されます。',
    step1: 'ダッシュボードで旅行者のブリーフ全文を読みましょう。',
    step2: 'オーダーメイドの提案を作りましょう — 旅程、内容、総額。',
    step3: '競合より先に提出しましょう。',
    step4: '招待されたらプラットフォーム上で旅行者とやり取りしましょう。',
    step5: '成立した予約はすべて Stripe で安全に、あなたの口座へ直接支払われます。',
    cta: 'リクエストを見る',
  },
  ko: {
    subject: '당신의 전문 분야를 찾는 여행자가 있습니다',
    title: '당신의 전문 분야를 찾는 여행자가 있습니다',
    headline: '여행 요청이 당신의 전문 분야와 일치합니다.',
    tagline: (d) => `안목 있는 여행자가 ${d} 전문가를 찾고 있습니다.`,
    lede: '브리프가 당신의 목적지, 서비스, 가격대와 맞습니다. 요청을 검토하고 맞춤 제안을 제출하세요 — 정성스러운 첫 응답이 가장 주목받습니다.',
    step1: '대시보드에서 여행자 브리프 전체를 읽으세요.',
    step2: '맞춤 제안을 만드세요 — 일정, 포함 사항, 총 비용.',
    step3: '경쟁자보다 먼저 제출하세요.',
    step4: '초대되면 플랫폼에서 여행자와 소통하세요.',
    step5: '성사된 모든 예약은 Stripe를 통해 안전하게, 당신 계좌로 직접 지급됩니다.',
    cta: '요청 보기',
  },
  zh: {
    subject: '一位旅行者正在寻找你的专长',
    title: '一位旅行者正在寻找你的专长',
    headline: '一条旅行需求与你的专长匹配。',
    tagline: (d) => `一位眼光独到的旅行者正在为${d}寻找专家。`,
    lede: '对方的需求与你的目的地、服务和价位相符。查看需求并提交定制提案 — 最早的用心回复最受关注。',
    step1: '在工作台阅读旅行者的完整需求。',
    step2: '打造定制提案 — 行程、包含内容、总投入。',
    step3: '抢在竞争者之前提交。',
    step4: '受邀后在平台上与旅行者沟通。',
    step5: '所有成交预订都经 Stripe 安全支付，直接进入你的账户。',
    cta: '查看需求',
  },
}

export const NewTripMatchEmail = ({ destination, requestId, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline(destination ?? '')}
      lede={s.lede}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/marketplace/request/${requestId ?? ''}` }}
    />
  )
}

export const template = {
  component: NewTripMatchEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'New Trip Match',
  previewData: { destination: 'Amalfi Coast', requestId: 'abc-123' },
} satisfies TemplateEntry
