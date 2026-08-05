/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  inquiryId?: string
  travelerName?: string
  lang?: EmailLang
}

interface S {
  subject: (traveler: string) => string
  title: (traveler: string) => string
  headline: string
  tagline: string
  lede: (traveler: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: (t) => `${t} sent you a direct inquiry`,
    title: (t) => `${t} sent you a direct inquiry`,
    headline: 'You have a new direct inquiry.',
    tagline: 'A traveler has reached out to you privately.',
    lede: (t) => `${t} found your profile and sent a direct request. They are interested in your services and would like to begin a private conversation.`,
    step1: 'Open the inquiry to review the brief.',
    step2: 'Respond with a tailored proposal or initial message.',
    step3: 'All conversation and payment must stay on-platform.',
    step4: 'Direct inquiries typically convert faster than open requests.',
    step5: 'Aim to respond within 24 hours for best results.',
    cta: 'Open inquiry',
  },
  fr: {
    subject: (t) => `${t} vous a envoyé une demande directe`,
    title: (t) => `${t} vous a envoyé une demande directe`,
    headline: 'Vous avez une nouvelle demande directe.',
    tagline: 'Un voyageur vous a contacté en privé.',
    lede: (t) => `${t} a trouvé votre profil et vous a envoyé une demande directe. Cette personne s'intéresse à vos services et souhaite entamer une conversation privée.`,
    step1: 'Ouvrez la demande pour consulter le brief.',
    step2: 'Répondez avec une proposition sur mesure ou un premier message.',
    step3: 'Toute conversation et tout paiement doivent rester sur la plateforme.',
    step4: 'Les demandes directes se concrétisent généralement plus vite que les demandes ouvertes.',
    step5: 'Visez une réponse sous 24 heures pour de meilleurs résultats.',
    cta: 'Ouvrir la demande',
  },
  es: {
    subject: (t) => `${t} te envió una consulta directa`,
    title: (t) => `${t} te envió una consulta directa`,
    headline: 'Tienes una nueva consulta directa.',
    tagline: 'Un viajero te ha contactado en privado.',
    lede: (t) => `${t} encontró tu perfil y te envió una solicitud directa. Le interesan tus servicios y quiere iniciar una conversación privada.`,
    step1: 'Abre la consulta para revisar el brief.',
    step2: 'Responde con una propuesta a medida o un primer mensaje.',
    step3: 'Toda conversación y pago deben permanecer en la plataforma.',
    step4: 'Las consultas directas suelen convertir más rápido que las solicitudes abiertas.',
    step5: 'Intenta responder en 24 horas para mejores resultados.',
    cta: 'Abrir consulta',
  },
  de: {
    subject: (t) => `${t} hat Ihnen eine Direktanfrage gesendet`,
    title: (t) => `${t} hat Ihnen eine Direktanfrage gesendet`,
    headline: 'Sie haben eine neue Direktanfrage.',
    tagline: 'Ein Reisender hat Sie privat kontaktiert.',
    lede: (t) => `${t} hat Ihr Profil gefunden und eine Direktanfrage gesendet. Es besteht Interesse an Ihren Leistungen und der Wunsch nach einem privaten Gespräch.`,
    step1: 'Öffnen Sie die Anfrage, um den Brief zu prüfen.',
    step2: 'Antworten Sie mit einem maßgeschneiderten Angebot oder einer ersten Nachricht.',
    step3: 'Sämtliche Kommunikation und Zahlungen müssen auf der Plattform bleiben.',
    step4: 'Direktanfragen konvertieren in der Regel schneller als offene Anfragen.',
    step5: 'Antworten Sie möglichst innerhalb von 24 Stunden.',
    cta: 'Anfrage öffnen',
  },
  it: {
    subject: (t) => `${t} ti ha inviato una richiesta diretta`,
    title: (t) => `${t} ti ha inviato una richiesta diretta`,
    headline: 'Hai una nuova richiesta diretta.',
    tagline: 'Un viaggiatore ti ha contattato in privato.',
    lede: (t) => `${t} ha trovato il tuo profilo e ti ha inviato una richiesta diretta. È interessato ai tuoi servizi e vorrebbe iniziare una conversazione privata.`,
    step1: 'Apri la richiesta per esaminare il brief.',
    step2: 'Rispondi con una proposta su misura o un primo messaggio.',
    step3: 'Tutta la conversazione e i pagamenti devono restare sulla piattaforma.',
    step4: 'Le richieste dirette di norma si concretizzano più in fretta di quelle aperte.',
    step5: 'Cerca di rispondere entro 24 ore per i migliori risultati.',
    cta: 'Apri richiesta',
  },
  pt: {
    subject: (t) => `${t} enviou uma consulta direta para você`,
    title: (t) => `${t} enviou uma consulta direta para você`,
    headline: 'Você tem uma nova consulta direta.',
    tagline: 'Um viajante entrou em contato de forma privada.',
    lede: (t) => `${t} encontrou seu perfil e enviou um pedido direto. Há interesse nos seus serviços e vontade de iniciar uma conversa privada.`,
    step1: 'Abra a consulta para revisar o briefing.',
    step2: 'Responda com uma proposta sob medida ou uma primeira mensagem.',
    step3: 'Toda conversa e pagamento devem permanecer na plataforma.',
    step4: 'Consultas diretas costumam converter mais rápido que pedidos abertos.',
    step5: 'Procure responder em até 24 horas para melhores resultados.',
    cta: 'Abrir consulta',
  },
  ar: {
    subject: (t) => `أرسل لك ${t} استفساراً مباشراً`,
    title: (t) => `أرسل لك ${t} استفساراً مباشراً`,
    headline: 'لديك استفسار مباشر جديد.',
    tagline: 'تواصل معك مسافر بشكل خاص.',
    lede: (t) => `وجد ${t} ملفك وأرسل طلباً مباشراً. يهتم بخدماتك ويرغب في بدء محادثة خاصة.`,
    step1: 'افتح الاستفسار لمراجعة الموجز.',
    step2: 'رد بعرض مخصص أو رسالة أولى.',
    step3: 'يجب أن تبقى كل المحادثات والمدفوعات على المنصة.',
    step4: 'الاستفسارات المباشرة تتحول عادة أسرع من الطلبات المفتوحة.',
    step5: 'احرص على الرد خلال 24 ساعة لأفضل النتائج.',
    cta: 'افتح الاستفسار',
  },
  ja: {
    subject: (t) => `${t} さんから直接のお問い合わせが届きました`,
    title: (t) => `${t} さんから直接のお問い合わせが届きました`,
    headline: '新しい直接のお問い合わせがあります。',
    tagline: '旅行者からプライベートに連絡がありました。',
    lede: (t) => `${t} さんがあなたのプロフィールを見つけ、直接リクエストを送りました。あなたのサービスに関心があり、プライベートな会話を始めたいとのことです。`,
    step1: 'お問い合わせを開いてブリーフを確認しましょう。',
    step2: 'オーダーメイドの提案か最初のメッセージで応えましょう。',
    step3: '会話も支払いもすべてプラットフォーム上で行ってください。',
    step4: '直接のお問い合わせは通常、公開リクエストより早く成約します。',
    step5: '最良の結果のため、24時間以内の返信を心がけましょう。',
    cta: 'お問い合わせを開く',
  },
  ko: {
    subject: (t) => `${t}님이 다이렉트 문의를 보냈습니다`,
    title: (t) => `${t}님이 다이렉트 문의를 보냈습니다`,
    headline: '새 다이렉트 문의가 있습니다.',
    tagline: '여행자가 비공개로 연락해 왔습니다.',
    lede: (t) => `${t}님이 프로필을 보고 다이렉트 요청을 보냈습니다. 당신의 서비스에 관심이 있으며 비공개 대화를 시작하고 싶어 합니다.`,
    step1: '문의를 열어 브리프를 확인하세요.',
    step2: '맞춤 제안이나 첫 메시지로 응답하세요.',
    step3: '모든 대화와 결제는 플랫폼 안에 있어야 합니다.',
    step4: '다이렉트 문의는 보통 공개 요청보다 빨리 성사됩니다.',
    step5: '최상의 결과를 위해 24시간 안에 응답하세요.',
    cta: '문의 열기',
  },
  zh: {
    subject: (t) => `${t} 向你发来了直接咨询`,
    title: (t) => `${t} 向你发来了直接咨询`,
    headline: '你有一条新的直接咨询。',
    tagline: '一位旅行者私下联系了你。',
    lede: (t) => `${t} 看到了你的资料并发来了直接请求。对方对你的服务感兴趣，希望开始私下沟通。`,
    step1: '打开咨询，查看需求。',
    step2: '以定制提案或首条消息回复。',
    step3: '所有沟通与支付必须留在平台内。',
    step4: '直接咨询通常比公开需求更快成交。',
    step5: '尽量在 24 小时内回复，效果最佳。',
    cta: '打开咨询',
  },
}

export const NewInquiryProfessionalEmail = ({ inquiryId, travelerName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title(travelerName ?? '')}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(travelerName ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/messages` }}
    />
  )
}

export const template = {
  component: NewInquiryProfessionalEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject(data?.travelerName ?? ''),
  displayName: 'New Inquiry — Specialist',
  previewData: { travelerName: 'Alexandra', inquiryId: 'i-654' },
} satisfies TemplateEntry
