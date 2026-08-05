/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  disputeId?: string
  disputeOpenedBy?: string
  tripName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (trip: string, openedBy: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'A dispute has been opened',
    title: 'A dispute has been opened',
    headline: 'A dispute has been opened.',
    tagline: 'Goldsainte has formally opened a dispute case.',
    lede: (t, o) => `A dispute regarding ${t} has been opened by ${o}. Payments related to this booking are paused while our concierge team reviews the case. Both parties will be contacted shortly.`,
    step1: 'Our concierge team has been notified and will review the case.',
    step2: 'Payments are paused pending resolution.',
    step3: 'Both parties may submit supporting documentation.',
    step4: 'Resolution typically occurs within 5–10 business days.',
    step5: 'All comms regarding the dispute must remain on-platform.',
    cta: 'View dispute',
  },
  fr: {
    subject: 'Un litige a été ouvert',
    title: 'Un litige a été ouvert',
    headline: 'Un litige a été ouvert.',
    tagline: 'Goldsainte a formellement ouvert un dossier de litige.',
    lede: (t, o) => `Un litige concernant ${t} a été ouvert par ${o}. Les paiements liés à cette réservation sont suspendus pendant que notre équipe de conciergerie examine le dossier. Les deux parties seront contactées rapidement.`,
    step1: 'Notre équipe de conciergerie a été informée et examinera le dossier.',
    step2: 'Les paiements sont suspendus dans l\u2019attente d\u2019une résolution.',
    step3: 'Les deux parties peuvent soumettre des pièces justificatives.',
    step4: 'La résolution intervient généralement sous 5 à 10 jours ouvrés.',
    step5: 'Toute communication liée au litige doit rester sur la plateforme.',
    cta: 'Voir le litige',
  },
  es: {
    subject: 'Se ha abierto una disputa',
    title: 'Se ha abierto una disputa',
    headline: 'Se ha abierto una disputa.',
    tagline: 'Goldsainte ha abierto formalmente un caso de disputa.',
    lede: (t, o) => `Se ha abierto una disputa sobre ${t} por parte de ${o}. Los pagos de esta reserva quedan en pausa mientras nuestro equipo de conserjería revisa el caso. Contactaremos con ambas partes en breve.`,
    step1: 'Nuestro equipo de conserjería ha sido notificado y revisará el caso.',
    step2: 'Los pagos quedan en pausa hasta la resolución.',
    step3: 'Ambas partes pueden aportar documentación de apoyo.',
    step4: 'La resolución suele producirse en 5–10 días laborables.',
    step5: 'Toda comunicación sobre la disputa debe permanecer en la plataforma.',
    cta: 'Ver disputa',
  },
  de: {
    subject: 'Ein Streitfall wurde eröffnet',
    title: 'Ein Streitfall wurde eröffnet',
    headline: 'Ein Streitfall wurde eröffnet.',
    tagline: 'Goldsainte hat formell einen Streitfall eröffnet.',
    lede: (t, o) => `Zu ${t} wurde von ${o} ein Streitfall eröffnet. Zahlungen zu dieser Buchung sind pausiert, während unser Concierge-Team den Fall prüft. Beide Parteien werden in Kürze kontaktiert.`,
    step1: 'Unser Concierge-Team wurde benachrichtigt und prüft den Fall.',
    step2: 'Zahlungen sind bis zur Klärung pausiert.',
    step3: 'Beide Parteien können Unterlagen einreichen.',
    step4: 'Die Klärung erfolgt in der Regel innerhalb von 5–10 Werktagen.',
    step5: 'Sämtliche Kommunikation zum Streitfall muss auf der Plattform bleiben.',
    cta: 'Streitfall ansehen',
  },
  it: {
    subject: 'È stata aperta una disputa',
    title: 'È stata aperta una disputa',
    headline: 'È stata aperta una disputa.',
    tagline: 'Goldsainte ha formalmente aperto una pratica di disputa.',
    lede: (t, o) => `È stata aperta una disputa su ${t} da ${o}. I pagamenti relativi a questa prenotazione sono sospesi mentre il nostro team concierge esamina il caso. Entrambe le parti saranno contattate a breve.`,
    step1: 'Il nostro team concierge è stato avvisato ed esaminerà il caso.',
    step2: 'I pagamenti sono sospesi in attesa della risoluzione.',
    step3: 'Entrambe le parti possono presentare documentazione a supporto.',
    step4: 'La risoluzione avviene di norma entro 5–10 giorni lavorativi.',
    step5: 'Tutte le comunicazioni sulla disputa devono restare sulla piattaforma.',
    cta: 'Vedi disputa',
  },
  pt: {
    subject: 'Uma disputa foi aberta',
    title: 'Uma disputa foi aberta',
    headline: 'Uma disputa foi aberta.',
    tagline: 'A Goldsainte abriu formalmente um caso de disputa.',
    lede: (t, o) => `Uma disputa sobre ${t} foi aberta por ${o}. Os pagamentos desta reserva estão pausados enquanto nossa equipe de concierge analisa o caso. Ambas as partes serão contatadas em breve.`,
    step1: 'Nossa equipe de concierge foi notificada e analisará o caso.',
    step2: 'Os pagamentos ficam pausados até a resolução.',
    step3: 'Ambas as partes podem enviar documentação de apoio.',
    step4: 'A resolução normalmente ocorre em 5–10 dias úteis.',
    step5: 'Toda comunicação sobre a disputa deve permanecer na plataforma.',
    cta: 'Ver disputa',
  },
  ar: {
    subject: 'فُتح نزاع',
    title: 'فُتح نزاع',
    headline: 'فُتح نزاع.',
    tagline: 'فتحت Goldsainte رسمياً ملف نزاع.',
    lede: (t, o) => `فُتح نزاع بخصوص ${t} من قبل ${o}. أوقفت مدفوعات هذا الحجز مؤقتاً بينما يراجع فريق الكونسيرج الحالة. سيُتواصل مع الطرفين قريباً.`,
    step1: 'أُخطر فريق الكونسيرج وسيراجع الحالة.',
    step2: 'المدفوعات موقوفة حتى الحل.',
    step3: 'يمكن للطرفين تقديم مستندات داعمة.',
    step4: 'يتم الحل عادة خلال 5–10 أيام عمل.',
    step5: 'يجب أن يبقى كل التواصل بشأن النزاع على المنصة.',
    cta: 'اعرض النزاع',
  },
  ja: {
    subject: '紛争が開始されました',
    title: '紛争が開始されました',
    headline: '紛争が開始されました。',
    tagline: 'Goldsainte が正式に紛争案件を開始しました。',
    lede: (t, o) => `「${t}」に関する紛争が ${o} により開始されました。コンシェルジュチームが案件を確認する間、この予約に関する支払いは一時停止されます。まもなく両当事者にご連絡します。`,
    step1: 'コンシェルジュチームに通知され、案件を確認します。',
    step2: '解決まで支払いは一時停止されます。',
    step3: '両当事者は補足資料を提出できます。',
    step4: '解決は通常5〜10営業日以内です。',
    step5: '紛争に関する連絡はすべてプラットフォーム上で行ってください。',
    cta: '紛争を見る',
  },
  ko: {
    subject: '분쟁이 접수되었습니다',
    title: '분쟁이 접수되었습니다',
    headline: '분쟁이 접수되었습니다.',
    tagline: 'Goldsainte가 공식적으로 분쟁 건을 개시했습니다.',
    lede: (t, o) => `${t}에 관한 분쟁이 ${o}에 의해 접수되었습니다. 컨시어지 팀이 건을 검토하는 동안 이 예약 관련 결제는 일시 중지됩니다. 곧 양측에 연락드리겠습니다.`,
    step1: '컨시어지 팀이 통지를 받고 건을 검토합니다.',
    step2: '해결 시까지 결제가 일시 중지됩니다.',
    step3: '양측은 증빙 자료를 제출할 수 있습니다.',
    step4: '해결은 보통 영업일 기준 5~10일 내에 이루어집니다.',
    step5: '분쟁 관련 모든 소통은 플랫폼 안에 있어야 합니다.',
    cta: '분쟁 보기',
  },
  zh: {
    subject: '一起争议已开启',
    title: '一起争议已开启',
    headline: '一起争议已开启。',
    tagline: 'Goldsainte 已正式立案处理争议。',
    lede: (t, o) => `${o}就「${t}」发起了争议。在礼宾团队审理期间，与该预订相关的付款将暂停。我们会尽快联系双方。`,
    step1: '礼宾团队已收到通知并将审理此案。',
    step2: '付款在解决前暂停。',
    step3: '双方均可提交佐证材料。',
    step4: '通常在 5–10 个工作日内解决。',
    step5: '与争议相关的所有沟通必须留在平台内。',
    cta: '查看争议',
  },
}

export const DisputeOpenedEmail = ({ disputeId, disputeOpenedBy, tripName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(tripName ?? '', disputeOpenedBy ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/my-bookings` }}
    />
  )
}

export const template = {
  component: DisputeOpenedEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Dispute Opened',
  previewData: { tripName: 'Amalfi in Bloom', disputeOpenedBy: 'the traveler', disputeId: 'd-999' },
} satisfies TemplateEntry
