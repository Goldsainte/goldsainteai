/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  daysUntil?: string
  specialistName?: string
  tripName?: string
  lang?: EmailLang
}

interface S {
  subject: (specialist: string) => string
  title: (specialist: string) => string
  headline: string
  tagline: string
  lede: (trip: string, days: string, specialist: string) => string
  step1: string
  step2: string
  step3: (specialist: string) => string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: (sp) => `Your trip with ${sp} is approaching`,
    title: (sp) => `Your trip with ${sp} is approaching`,
    headline: 'Your journey begins soon.',
    tagline: 'A gentle reminder ahead of your departure.',
    lede: (t, d, sp) => `Your trip ${t} departs in ${d} days. Now is a good time to review your itinerary, confirm logistics, and reach out to ${sp} with any final questions.`,
    step1: 'Review your full itinerary and printable PDF in your dashboard.',
    step2: 'Confirm passports, visas, and travel insurance are in order.',
    step3: (sp) => `Message ${sp} for last-minute requests.`,
    step4: 'Save the emergency concierge number to your phone.',
    step5: 'We hope you have an extraordinary journey.',
    cta: 'View itinerary',
  },
  fr: {
    subject: (sp) => `Votre voyage avec ${sp} approche`,
    title: (sp) => `Votre voyage avec ${sp} approche`,
    headline: 'Votre voyage commence bientôt.',
    tagline: 'Un doux rappel avant votre départ.',
    lede: (t, d, sp) => `Votre voyage ${t} part dans ${d} jours. C'est le bon moment pour relire votre itinéraire, confirmer la logistique et poser vos dernières questions à ${sp}.`,
    step1: 'Consultez votre itinéraire complet et son PDF imprimable dans votre tableau de bord.',
    step2: 'Vérifiez passeports, visas et assurance voyage.',
    step3: (sp) => `Écrivez à ${sp} pour vos demandes de dernière minute.`,
    step4: 'Enregistrez le numéro du concierge d\u2019urgence dans votre téléphone.',
    step5: 'Nous vous souhaitons un voyage extraordinaire.',
    cta: 'Voir l\u2019itinéraire',
  },
  es: {
    subject: (sp) => `Tu viaje con ${sp} se acerca`,
    title: (sp) => `Tu viaje con ${sp} se acerca`,
    headline: 'Tu viaje comienza pronto.',
    tagline: 'Un suave recordatorio antes de tu salida.',
    lede: (t, d, sp) => `Tu viaje ${t} sale en ${d} días. Es buen momento para repasar el itinerario, confirmar la logística y escribir a ${sp} con las últimas preguntas.`,
    step1: 'Revisa tu itinerario completo y el PDF imprimible en tu panel.',
    step2: 'Confirma que pasaportes, visados y seguro de viaje están en orden.',
    step3: (sp) => `Escribe a ${sp} para peticiones de última hora.`,
    step4: 'Guarda el número del conserje de emergencia en tu teléfono.',
    step5: 'Te deseamos un viaje extraordinario.',
    cta: 'Ver itinerario',
  },
  de: {
    subject: (sp) => `Ihre Reise mit ${sp} rückt näher`,
    title: (sp) => `Ihre Reise mit ${sp} rückt näher`,
    headline: 'Ihre Reise beginnt bald.',
    tagline: 'Eine sanfte Erinnerung vor Ihrer Abreise.',
    lede: (t, d, sp) => `Ihre Reise ${t} startet in ${d} Tagen. Jetzt ist ein guter Moment, den Reiseplan zu prüfen, die Logistik zu bestätigen und ${sp} letzte Fragen zu stellen.`,
    step1: 'Prüfen Sie Ihren vollständigen Reiseplan samt druckbarem PDF im Dashboard.',
    step2: 'Stellen Sie sicher, dass Pässe, Visa und Reiseversicherung in Ordnung sind.',
    step3: (sp) => `Schreiben Sie ${sp} für Last-Minute-Wünsche.`,
    step4: 'Speichern Sie die Notfall-Concierge-Nummer in Ihrem Telefon.',
    step5: 'Wir wünschen Ihnen eine außergewöhnliche Reise.',
    cta: 'Reiseplan ansehen',
  },
  it: {
    subject: (sp) => `Il tuo viaggio con ${sp} si avvicina`,
    title: (sp) => `Il tuo viaggio con ${sp} si avvicina`,
    headline: 'Il tuo viaggio inizia presto.',
    tagline: 'Un dolce promemoria prima della partenza.',
    lede: (t, d, sp) => `Il tuo viaggio ${t} parte tra ${d} giorni. È il momento giusto per rivedere l'itinerario, confermare la logistica e fare a ${sp} le ultime domande.`,
    step1: 'Rivedi l\u2019itinerario completo e il PDF stampabile nella tua dashboard.',
    step2: 'Verifica che passaporti, visti e assicurazione di viaggio siano in regola.',
    step3: (sp) => `Scrivi a ${sp} per richieste dell'ultimo minuto.`,
    step4: 'Salva il numero del concierge di emergenza sul telefono.',
    step5: 'Ti auguriamo un viaggio straordinario.',
    cta: 'Vedi itinerario',
  },
  pt: {
    subject: (sp) => `Sua viagem com ${sp} está chegando`,
    title: (sp) => `Sua viagem com ${sp} está chegando`,
    headline: 'Sua jornada começa em breve.',
    tagline: 'Um lembrete gentil antes da partida.',
    lede: (t, d, sp) => `Sua viagem ${t} parte em ${d} dias. É um bom momento para revisar o roteiro, confirmar a logística e tirar as últimas dúvidas com ${sp}.`,
    step1: 'Revise o roteiro completo e o PDF imprimível no seu painel.',
    step2: 'Confirme que passaportes, vistos e seguro viagem estão em dia.',
    step3: (sp) => `Fale com ${sp} para pedidos de última hora.`,
    step4: 'Salve o número do concierge de emergência no seu telefone.',
    step5: 'Desejamos a você uma jornada extraordinária.',
    cta: 'Ver roteiro',
  },
  ar: {
    subject: (sp) => `رحلتك مع ${sp} تقترب`,
    title: (sp) => `رحلتك مع ${sp} تقترب`,
    headline: 'رحلتك تبدأ قريباً.',
    tagline: 'تذكير لطيف قبل مغادرتك.',
    lede: (t, d, sp) => `تنطلق رحلتك ${t} بعد ${d} أيام. هذا وقت مناسب لمراجعة المسار وتأكيد الترتيبات وطرح أسئلتك الأخيرة على ${sp}.`,
    step1: 'راجع مسارك الكامل وملف PDF القابل للطباعة في لوحتك.',
    step2: 'تأكد من جوازات السفر والتأشيرات وتأمين السفر.',
    step3: (sp) => `راسل ${sp} لطلبات اللحظة الأخيرة.`,
    step4: 'احفظ رقم كونسيرج الطوارئ في هاتفك.',
    step5: 'نتمنى لك رحلة استثنائية.',
    cta: 'اعرض المسار',
  },
  ja: {
    subject: (sp) => `${sp} との旅が近づいています`,
    title: (sp) => `${sp} との旅が近づいています`,
    headline: 'まもなく旅が始まります。',
    tagline: '出発前のやさしいリマインダーです。',
    lede: (t, d, sp) => `「${t}」の出発まであと ${d} 日。旅程の確認、手配の最終チェック、そして ${sp} への最後の質問に良いタイミングです。`,
    step1: 'ダッシュボードで旅程全体と印刷用 PDF を確認しましょう。',
    step2: 'パスポート・ビザ・旅行保険が揃っているか確認しましょう。',
    step3: (sp) => `直前のリクエストは ${sp} にメッセージを。`,
    step4: '緊急コンシェルジュの番号を携帯に保存しておきましょう。',
    step5: '素晴らしい旅になりますように。',
    cta: '旅程を見る',
  },
  ko: {
    subject: (sp) => `${sp}님과의 여행이 다가옵니다`,
    title: (sp) => `${sp}님과의 여행이 다가옵니다`,
    headline: '곧 여정이 시작됩니다.',
    tagline: '출발 전 드리는 가벼운 안내입니다.',
    lede: (t, d, sp) => `${t} 여행이 ${d}일 후 출발합니다. 지금이 일정을 점검하고 준비를 확인하며 ${sp}님에게 마지막 질문을 하기 좋은 때입니다.`,
    step1: '대시보드에서 전체 일정과 인쇄용 PDF를 확인하세요.',
    step2: '여권, 비자, 여행자 보험이 준비되었는지 확인하세요.',
    step3: (sp) => `막바지 요청은 ${sp}님에게 메시지하세요.`,
    step4: '긴급 컨시어지 번호를 휴대폰에 저장하세요.',
    step5: '특별한 여정이 되길 바랍니다.',
    cta: '일정 보기',
  },
  zh: {
    subject: (sp) => `你与 ${sp} 的旅程即将开始`,
    title: (sp) => `你与 ${sp} 的旅程即将开始`,
    headline: '你的旅程即将启程。',
    tagline: '出发前的温馨提醒。',
    lede: (t, d, sp) => `你的旅程「${t}」将在 ${d} 天后出发。现在正是复核行程、确认安排、向 ${sp} 提出最后问题的好时机。`,
    step1: '在面板中查看完整行程与可打印的 PDF。',
    step2: '确认护照、签证与旅行保险均已就绪。',
    step3: (sp) => `临行前的需求可给 ${sp} 发消息。`,
    step4: '把紧急礼宾电话存入手机。',
    step5: '祝你旅途非凡。',
    cta: '查看行程',
  },
}

export const TripReminderEmail = ({ bookingId, daysUntil, specialistName, tripName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title(specialistName ?? '')}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(tripName ?? '', daysUntil ?? '', specialistName ?? '')}
      steps={[s.step1, s.step2, s.step3(specialistName ?? ''), s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/bookings/${bookingId ?? ''}` }}
    />
  )
}

export const template = {
  component: TripReminderEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject(data?.specialistName ?? ''),
  displayName: 'Trip Reminder',
  previewData: { tripName: 'Amalfi in Bloom', specialistName: 'Maison Atelier', daysUntil: '7', bookingId: 'b-789' },
} satisfies TemplateEntry
