/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  requestId?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
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
    subject: "We've received your trip request",
    title: "We've received your trip request",
    headline: 'Your request is being reviewed.',
    tagline: 'Your private brief is now in the hands of our most trusted specialists.',
    lede: 'Thank you for sharing your vision with us. Vetted specialists matching your destination, dates, and budget are reviewing your brief now and will respond with bespoke proposals shortly.',
    step1: 'Your brief is matched against our network of specialists in real time.',
    step2: 'Specialists will respond with tailored proposals — typically within 24 to 72 hours.',
    step3: 'You will be notified by email each time a new proposal arrives.',
    step4: 'Compare proposals side-by-side in your dashboard.',
    step5: 'Accept the one that resonates — payment and contracts are handled on-platform.',
    cta: 'View my request',
  },
  fr: {
    subject: 'Nous avons bien reçu votre demande de voyage',
    title: 'Nous avons bien reçu votre demande de voyage',
    headline: 'Votre demande est en cours d\u2019examen.',
    tagline: 'Votre brief privé est désormais entre les mains de nos spécialistes les plus fiables.',
    lede: 'Merci de nous avoir confié votre vision. Des spécialistes vérifiés correspondant à votre destination, vos dates et votre budget examinent votre brief et répondront bientôt avec des propositions sur mesure.',
    step1: 'Votre brief est mis en relation avec notre réseau de spécialistes en temps réel.',
    step2: 'Les spécialistes répondront avec des propositions sur mesure — en général sous 24 à 72 heures.',
    step3: 'Vous serez averti par e-mail à chaque nouvelle proposition.',
    step4: 'Comparez les propositions côte à côte dans votre tableau de bord.',
    step5: 'Acceptez celle qui vous parle — paiement et contrats sont gérés sur la plateforme.',
    cta: 'Voir ma demande',
  },
  es: {
    subject: 'Hemos recibido tu solicitud de viaje',
    title: 'Hemos recibido tu solicitud de viaje',
    headline: 'Tu solicitud está en revisión.',
    tagline: 'Tu brief privado está ahora en manos de nuestros especialistas más fiables.',
    lede: 'Gracias por compartir tu visión con nosotros. Especialistas verificados que encajan con tu destino, fechas y presupuesto están revisando tu brief y responderán pronto con propuestas a medida.',
    step1: 'Tu brief se cruza con nuestra red de especialistas en tiempo real.',
    step2: 'Los especialistas responderán con propuestas a medida — normalmente en 24 a 72 horas.',
    step3: 'Recibirás un correo cada vez que llegue una nueva propuesta.',
    step4: 'Compara las propuestas lado a lado en tu panel.',
    step5: 'Acepta la que te convenza — pagos y contratos se gestionan en la plataforma.',
    cta: 'Ver mi solicitud',
  },
  de: {
    subject: 'Wir haben Ihre Reiseanfrage erhalten',
    title: 'Wir haben Ihre Reiseanfrage erhalten',
    headline: 'Ihre Anfrage wird geprüft.',
    tagline: 'Ihr privater Brief liegt jetzt in den Händen unserer vertrauenswürdigsten Spezialisten.',
    lede: 'Danke, dass Sie Ihre Vision mit uns teilen. Geprüfte Spezialisten, die zu Ziel, Daten und Budget passen, sichten Ihren Brief und antworten in Kürze mit maßgeschneiderten Angeboten.',
    step1: 'Ihr Brief wird in Echtzeit mit unserem Spezialisten-Netzwerk abgeglichen.',
    step2: 'Spezialisten antworten mit maßgeschneiderten Angeboten — in der Regel innerhalb von 24 bis 72 Stunden.',
    step3: 'Sie werden bei jedem neuen Angebot per E-Mail benachrichtigt.',
    step4: 'Vergleichen Sie Angebote Seite an Seite in Ihrem Dashboard.',
    step5: 'Nehmen Sie das passende an — Zahlung und Verträge laufen über die Plattform.',
    cta: 'Meine Anfrage ansehen',
  },
  it: {
    subject: 'Abbiamo ricevuto la tua richiesta di viaggio',
    title: 'Abbiamo ricevuto la tua richiesta di viaggio',
    headline: 'La tua richiesta è in revisione.',
    tagline: 'Il tuo brief privato è ora nelle mani dei nostri specialisti più fidati.',
    lede: 'Grazie per aver condiviso la tua visione. Specialisti verificati in linea con destinazione, date e budget stanno esaminando il tuo brief e risponderanno a breve con proposte su misura.',
    step1: 'Il tuo brief viene abbinato in tempo reale alla nostra rete di specialisti.',
    step2: 'Gli specialisti risponderanno con proposte su misura — di norma entro 24-72 ore.',
    step3: 'Riceverai un\u2019email a ogni nuova proposta.',
    step4: 'Confronta le proposte fianco a fianco nella tua dashboard.',
    step5: 'Accetta quella che ti convince — pagamenti e contratti sono gestiti sulla piattaforma.',
    cta: 'Vedi la mia richiesta',
  },
  pt: {
    subject: 'Recebemos seu pedido de viagem',
    title: 'Recebemos seu pedido de viagem',
    headline: 'Seu pedido está em análise.',
    tagline: 'Seu briefing privado está agora nas mãos dos nossos especialistas mais confiáveis.',
    lede: 'Obrigado por compartilhar sua visão conosco. Especialistas verificados compatíveis com seu destino, datas e orçamento estão analisando seu briefing e responderão em breve com propostas sob medida.',
    step1: 'Seu briefing é cruzado com nossa rede de especialistas em tempo real.',
    step2: 'Os especialistas responderão com propostas sob medida — normalmente em 24 a 72 horas.',
    step3: 'Você será avisado por e-mail a cada nova proposta.',
    step4: 'Compare as propostas lado a lado no seu painel.',
    step5: 'Aceite a que fizer sentido — pagamentos e contratos ficam na plataforma.',
    cta: 'Ver meu pedido',
  },
  ar: {
    subject: 'استلمنا طلب رحلتك',
    title: 'استلمنا طلب رحلتك',
    headline: 'طلبك قيد المراجعة.',
    tagline: 'موجزك الخاص الآن بين أيدي أوثق مختصينا.',
    lede: 'شكراً لمشاركتنا رؤيتك. مختصون معتمدون يطابقون وجهتك وتواريخك وميزانيتك يراجعون موجزك الآن وسيردون قريباً بعروض مصممة خصيصاً.',
    step1: 'يُطابق موجزك مع شبكة مختصينا في الوقت الفعلي.',
    step2: 'سيرد المختصون بعروض مخصصة — عادة خلال 24 إلى 72 ساعة.',
    step3: 'ستصلك رسالة بريدية عند وصول كل عرض جديد.',
    step4: 'قارن العروض جنباً إلى جنب في لوحتك.',
    step5: 'اقبل ما يناسبك — الدفع والعقود تُدار عبر المنصة.',
    cta: 'اعرض طلبي',
  },
  ja: {
    subject: '旅のリクエストを受け付けました',
    title: '旅のリクエストを受け付けました',
    headline: 'リクエストを確認しています。',
    tagline: 'あなたのプライベートブリーフは、最も信頼するスペシャリストたちの手に渡りました。',
    lede: 'ビジョンを共有いただきありがとうございます。目的地・日程・予算に合う審査済みスペシャリストがブリーフを確認中で、まもなくオーダーメイドの提案が届きます。',
    step1: 'ブリーフはリアルタイムでスペシャリストのネットワークとマッチングされます。',
    step2: 'スペシャリストがオーダーメイドの提案で応えます — 通常24〜72時間以内。',
    step3: '新しい提案が届くたびにメールでお知らせします。',
    step4: 'ダッシュボードで提案を並べて比較できます。',
    step5: '心に響くものを承諾しましょう — 支払いも契約もプラットフォーム上で完結します。',
    cta: 'リクエストを見る',
  },
  ko: {
    subject: '여행 요청을 접수했습니다',
    title: '여행 요청을 접수했습니다',
    headline: '요청을 검토하고 있습니다.',
    tagline: '당신의 프라이빗 브리프가 가장 신뢰받는 전문가들에게 전달되었습니다.',
    lede: '비전을 공유해 주셔서 감사합니다. 목적지, 날짜, 예산에 맞는 검증된 전문가들이 지금 브리프를 검토 중이며 곧 맞춤 제안으로 응답할 예정입니다.',
    step1: '브리프는 실시간으로 전문가 네트워크와 매칭됩니다.',
    step2: '전문가들이 맞춤 제안으로 응답합니다 — 보통 24~72시간 이내.',
    step3: '새 제안이 도착할 때마다 이메일로 알려드립니다.',
    step4: '대시보드에서 제안들을 나란히 비교하세요.',
    step5: '마음에 드는 제안을 수락하세요 — 결제와 계약은 플랫폼에서 처리됩니다.',
    cta: '내 요청 보기',
  },
  zh: {
    subject: '我们已收到你的旅行需求',
    title: '我们已收到你的旅行需求',
    headline: '你的需求正在审阅中。',
    tagline: '你的私享需求已交到我们最值得信赖的专家手中。',
    lede: '感谢你与我们分享你的构想。与你的目的地、日期和预算匹配的认证专家正在审阅你的需求，很快会以定制提案回复。',
    step1: '你的需求会实时与我们的专家网络匹配。',
    step2: '专家将以定制提案回复 — 通常在 24 至 72 小时内。',
    step3: '每有新提案送达，都会邮件通知你。',
    step4: '在面板中并排对比各份提案。',
    step5: '接受打动你的那一份 — 付款与合同都在平台内完成。',
    cta: '查看我的需求',
  },
}

export const TripRequestReceivedEmail = ({ requestId, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/my-bookings` }}
    />
  )
}

export const template = {
  component: TripRequestReceivedEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Trip Request Received',
  previewData: { name: 'Alexandra', destination: 'Amalfi Coast', requestId: 'abc-123' },
} satisfies TemplateEntry
