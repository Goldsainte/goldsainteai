/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  requestSummary?: string
  travelerName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (traveler: string, summary: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Your proposal was not selected',
    title: 'Your proposal was not selected',
    headline: 'Thank you for submitting.',
    tagline: 'Your proposal was thoughtfully reviewed.',
    lede: (t, r) => `${t} has decided not to move forward with your proposal for ${r}. Every proposal sharpens your craft — the next opportunity is already in motion.`,
    step1: 'Review the request in your dashboard if you wish to learn more.',
    step2: 'Travelers often decline due to timing, scope, or fit — not quality.',
    step3: 'New matching requests are surfaced to you continuously.',
    step4: 'Consider refining your storefront or services to broaden your reach.',
    step5: 'Our team is here to help you grow your practice.',
    cta: 'View dashboard',
  },
  fr: {
    subject: "Votre proposition n'a pas été retenue",
    title: "Votre proposition n'a pas été retenue",
    headline: "Merci pour votre proposition.",
    tagline: 'Votre proposition a été examinée avec attention.',
    lede: (t, r) => `${t} a décidé de ne pas donner suite à votre proposition pour ${r}. Chaque proposition affine votre savoir-faire — la prochaine opportunité est déjà en route.`,
    step1: 'Consultez la demande dans votre tableau de bord si vous souhaitez en savoir plus.',
    step2: 'Les voyageurs déclinent souvent pour des raisons de calendrier, de périmètre ou d\u2019affinité — pas de qualité.',
    step3: 'De nouvelles demandes correspondantes vous sont proposées en continu.',
    step4: 'Envisagez d\u2019affiner votre vitrine ou vos services pour élargir votre portée.',
    step5: 'Notre équipe est là pour vous aider à développer votre activité.',
    cta: 'Voir le tableau de bord',
  },
  es: {
    subject: 'Tu propuesta no fue seleccionada',
    title: 'Tu propuesta no fue seleccionada',
    headline: 'Gracias por participar.',
    tagline: 'Tu propuesta fue revisada con atención.',
    lede: (t, r) => `${t} ha decidido no seguir adelante con tu propuesta para ${r}. Cada propuesta afina tu oficio — la próxima oportunidad ya está en marcha.`,
    step1: 'Revisa la solicitud en tu panel si quieres saber más.',
    step2: 'Los viajeros suelen declinar por calendario, alcance o afinidad — no por calidad.',
    step3: 'Nuevas solicitudes compatibles te llegan continuamente.',
    step4: 'Considera pulir tu escaparate o servicios para ampliar tu alcance.',
    step5: 'Nuestro equipo está aquí para ayudarte a crecer.',
    cta: 'Ver panel',
  },
  de: {
    subject: 'Ihr Angebot wurde nicht ausgewählt',
    title: 'Ihr Angebot wurde nicht ausgewählt',
    headline: 'Danke für Ihre Einreichung.',
    tagline: 'Ihr Angebot wurde sorgfältig geprüft.',
    lede: (t, r) => `${t} hat entschieden, mit Ihrem Angebot für ${r} nicht fortzufahren. Jedes Angebot schärft Ihr Handwerk — die nächste Gelegenheit ist schon unterwegs.`,
    step1: 'Sehen Sie sich die Anfrage in Ihrem Dashboard an, wenn Sie mehr erfahren möchten.',
    step2: 'Reisende lehnen oft wegen Timing, Umfang oder Passung ab — nicht wegen Qualität.',
    step3: 'Neue passende Anfragen werden Ihnen laufend angezeigt.',
    step4: 'Erwägen Sie, Ihr Schaufenster oder Ihre Leistungen zu schärfen, um mehr Reichweite zu gewinnen.',
    step5: 'Unser Team hilft Ihnen, Ihr Geschäft auszubauen.',
    cta: 'Dashboard ansehen',
  },
  it: {
    subject: 'La tua proposta non è stata selezionata',
    title: 'La tua proposta non è stata selezionata',
    headline: 'Grazie per aver partecipato.',
    tagline: 'La tua proposta è stata esaminata con cura.',
    lede: (t, r) => `${t} ha deciso di non procedere con la tua proposta per ${r}. Ogni proposta affina il tuo mestiere — la prossima occasione è già in arrivo.`,
    step1: 'Esamina la richiesta nella tua dashboard se vuoi saperne di più.',
    step2: 'I viaggiatori spesso declinano per tempistiche, ambito o affinità — non per qualità.',
    step3: 'Nuove richieste compatibili ti vengono proposte di continuo.',
    step4: 'Valuta di rifinire la tua vetrina o i tuoi servizi per ampliare la portata.',
    step5: 'Il nostro team è qui per aiutarti a crescere.',
    cta: 'Vedi dashboard',
  },
  pt: {
    subject: 'Sua proposta não foi selecionada',
    title: 'Sua proposta não foi selecionada',
    headline: 'Obrigado por participar.',
    tagline: 'Sua proposta foi analisada com cuidado.',
    lede: (t, r) => `${t} decidiu não seguir com sua proposta para ${r}. Cada proposta aprimora seu ofício — a próxima oportunidade já está a caminho.`,
    step1: 'Revise o pedido no seu painel se quiser saber mais.',
    step2: 'Viajantes costumam recusar por cronograma, escopo ou afinidade — não por qualidade.',
    step3: 'Novos pedidos compatíveis chegam até você continuamente.',
    step4: 'Considere refinar sua vitrine ou serviços para ampliar seu alcance.',
    step5: 'Nossa equipe está aqui para ajudar você a crescer.',
    cta: 'Ver painel',
  },
  ar: {
    subject: 'لم يُختر عرضك',
    title: 'لم يُختر عرضك',
    headline: 'شكراً لتقديمك.',
    tagline: 'رُوجع عرضك بعناية.',
    lede: (t, r) => `قرر ${t} عدم المضي بعرضك لـ${r}. كل عرض يصقل حرفتك — والفرصة التالية في الطريق.`,
    step1: 'راجع الطلب في لوحتك إن أردت معرفة المزيد.',
    step2: 'يرفض المسافرون غالباً لأسباب التوقيت أو النطاق أو الملاءمة — لا الجودة.',
    step3: 'تصلك طلبات مطابقة جديدة باستمرار.',
    step4: 'فكر في تحسين واجهتك أو خدماتك لتوسيع نطاقك.',
    step5: 'فريقنا هنا لمساعدتك على تنمية عملك.',
    cta: 'اعرض اللوحة',
  },
  ja: {
    subject: '提案は選ばれませんでした',
    title: '提案は選ばれませんでした',
    headline: 'ご提案ありがとうございました。',
    tagline: '提案は丁寧に検討されました。',
    lede: (t, r) => `${t} さんは ${r} の提案を見送ることにしました。提案のたびに腕は磨かれます — 次のチャンスはすでに動き出しています。`,
    step1: '詳しく知りたい場合はダッシュボードでリクエストを確認しましょう。',
    step2: '見送りの理由は多くの場合タイミング・範囲・相性で、品質ではありません。',
    step3: '条件の合う新しいリクエストは継続的に届きます。',
    step4: '店構えやサービスを磨いてリーチを広げることも検討しましょう。',
    step5: 'あなたの成長を私たちのチームが支えます。',
    cta: 'ダッシュボードを見る',
  },
  ko: {
    subject: '제안이 선정되지 않았습니다',
    title: '제안이 선정되지 않았습니다',
    headline: '제출해 주셔서 감사합니다.',
    tagline: '제안은 신중하게 검토되었습니다.',
    lede: (t, r) => `${t}님이 ${r} 제안을 진행하지 않기로 했습니다. 모든 제안은 실력을 다듬어 줍니다 — 다음 기회는 이미 다가오고 있습니다.`,
    step1: '더 알고 싶다면 대시보드에서 요청을 확인하세요.',
    step2: '여행자의 거절은 대개 일정, 범위, 취향 때문이지 품질 때문이 아닙니다.',
    step3: '조건에 맞는 새 요청이 계속 도착합니다.',
    step4: '매장이나 서비스를 다듬어 도달 범위를 넓혀 보세요.',
    step5: '저희 팀이 성장을 돕겠습니다.',
    cta: '대시보드 보기',
  },
  zh: {
    subject: '你的提案未被选中',
    title: '你的提案未被选中',
    headline: '感谢你的提交。',
    tagline: '你的提案已被认真审阅。',
    lede: (t, r) => `${t} 决定不采用你为${r}提交的提案。每一次提案都在磨炼你的手艺 — 下一个机会已经在路上。`,
    step1: '想了解更多，可在工作台查看该需求。',
    step2: '旅行者的婉拒通常源于时间、范围或契合度 — 而非质量。',
    step3: '匹配的新需求会持续推送给你。',
    step4: '不妨打磨你的门面或服务，扩大触达。',
    step5: '我们的团队随时帮助你发展业务。',
    cta: '查看工作台',
  },
}

export const ProposalDeclinedEmail = ({ requestSummary, travelerName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(travelerName ?? '', requestSummary ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/agent-dashboard` }}
    />
  )
}

export const template = {
  component: ProposalDeclinedEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Proposal Declined',
  previewData: { travelerName: 'Alexandra', requestSummary: 'a 7-night Amalfi trip' },
} satisfies TemplateEntry
