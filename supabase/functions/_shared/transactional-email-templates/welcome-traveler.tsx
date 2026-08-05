/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface WelcomeTravelerProps {
  name?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headlineNamed: (name: string) => string
  headline: string
  tagline: string
  lede: string
  step1: string
  step2: string
  step3: string
  step4: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Welcome to Goldsainte',
    title: 'Welcome to Goldsainte',
    headlineNamed: (n) => `Welcome, ${n}.`,
    headline: 'Welcome to Goldsainte.',
    tagline: "A curated marketplace of the world's most trusted travel specialists, creators, and brands.",
    lede: 'Your account is ready. Tell us where you want to go and our network of vetted specialists will design the trip — privately curated, expertly arranged, and bookable on-platform.',
    step1: 'Submit a Trip Request — share your destination, dates, and style.',
    step2: 'Receive bespoke proposals from hand-picked specialists.',
    step3: 'Message and pay securely on-platform — never off it, per our Terms.',
    step4: 'Confirm your trip and travel with full Goldsainte protection.',
    cta: 'Request a Trip',
  },
  fr: {
    subject: 'Bienvenue chez Goldsainte',
    title: 'Bienvenue chez Goldsainte',
    headlineNamed: (n) => `Bienvenue, ${n}.`,
    headline: 'Bienvenue chez Goldsainte.',
    tagline: 'Une place de marché soignée réunissant les spécialistes du voyage, créateurs et marques les plus fiables au monde.',
    lede: 'Votre compte est prêt. Dites-nous où vous voulez aller et notre réseau de spécialistes vérifiés concevra le voyage — privé, expertement organisé et réservable sur la plateforme.',
    step1: 'Envoyez une demande de voyage — destination, dates et style.',
    step2: 'Recevez des propositions sur mesure de spécialistes triés sur le volet.',
    step3: 'Échangez et payez en toute sécurité sur la plateforme — jamais en dehors, conformément à nos Conditions.',
    step4: 'Confirmez votre voyage et partez avec la pleine protection Goldsainte.',
    cta: 'Demander un voyage',
  },
  es: {
    subject: 'Bienvenido a Goldsainte',
    title: 'Bienvenido a Goldsainte',
    headlineNamed: (n) => `Bienvenido, ${n}.`,
    headline: 'Bienvenido a Goldsainte.',
    tagline: 'Un marketplace curado con los especialistas en viajes, creadores y marcas más fiables del mundo.',
    lede: 'Tu cuenta está lista. Dinos a dónde quieres ir y nuestra red de especialistas verificados diseñará el viaje — curado en privado, organizado con maestría y reservable en la plataforma.',
    step1: 'Envía una solicitud de viaje — comparte destino, fechas y estilo.',
    step2: 'Recibe propuestas a medida de especialistas seleccionados.',
    step3: 'Comunícate y paga de forma segura en la plataforma — nunca fuera, según nuestros Términos.',
    step4: 'Confirma tu viaje y viaja con la protección completa de Goldsainte.',
    cta: 'Solicitar un viaje',
  },
  de: {
    subject: 'Willkommen bei Goldsainte',
    title: 'Willkommen bei Goldsainte',
    headlineNamed: (n) => `Willkommen, ${n}.`,
    headline: 'Willkommen bei Goldsainte.',
    tagline: 'Ein kuratierter Marktplatz der vertrauenswürdigsten Reisespezialisten, Creator und Marken der Welt.',
    lede: 'Ihr Konto ist bereit. Sagen Sie uns, wohin Sie möchten, und unser Netzwerk geprüfter Spezialisten gestaltet die Reise — privat kuratiert, meisterhaft arrangiert und auf der Plattform buchbar.',
    step1: 'Senden Sie eine Reiseanfrage — Ziel, Daten und Stil.',
    step2: 'Erhalten Sie maßgeschneiderte Angebote handverlesener Spezialisten.',
    step3: 'Kommunizieren und zahlen Sie sicher auf der Plattform — nie außerhalb, gemäß unseren Bedingungen.',
    step4: 'Bestätigen Sie Ihre Reise und reisen Sie mit vollem Goldsainte-Schutz.',
    cta: 'Reise anfragen',
  },
  it: {
    subject: 'Benvenuto su Goldsainte',
    title: 'Benvenuto su Goldsainte',
    headlineNamed: (n) => `Benvenuto, ${n}.`,
    headline: 'Benvenuto su Goldsainte.',
    tagline: 'Un marketplace curato con gli specialisti di viaggio, i creator e i brand più affidabili al mondo.',
    lede: 'Il tuo account è pronto. Dicci dove vuoi andare e la nostra rete di specialisti verificati disegnerà il viaggio — curato in privato, organizzato con maestria e prenotabile sulla piattaforma.',
    step1: 'Invia una richiesta di viaggio — destinazione, date e stile.',
    step2: 'Ricevi proposte su misura da specialisti selezionati.',
    step3: 'Comunica e paga in sicurezza sulla piattaforma — mai al di fuori, come da Termini.',
    step4: 'Conferma il viaggio e parti con la piena protezione Goldsainte.',
    cta: 'Richiedi un viaggio',
  },
  pt: {
    subject: 'Bem-vindo à Goldsainte',
    title: 'Bem-vindo à Goldsainte',
    headlineNamed: (n) => `Bem-vindo, ${n}.`,
    headline: 'Bem-vindo à Goldsainte.',
    tagline: 'Um marketplace curado com os especialistas em viagens, criadores e marcas mais confiáveis do mundo.',
    lede: 'Sua conta está pronta. Diga para onde quer ir e nossa rede de especialistas verificados desenhará a viagem — curada em privado, organizada com maestria e reservável na plataforma.',
    step1: 'Envie um pedido de viagem — destino, datas e estilo.',
    step2: 'Receba propostas sob medida de especialistas selecionados.',
    step3: 'Converse e pague com segurança na plataforma — nunca fora dela, conforme nossos Termos.',
    step4: 'Confirme sua viagem e viaje com a proteção completa da Goldsainte.',
    cta: 'Pedir uma viagem',
  },
  ar: {
    subject: 'مرحباً بك في Goldsainte',
    title: 'مرحباً بك في Goldsainte',
    headlineNamed: (n) => `مرحباً، ${n}.`,
    headline: 'مرحباً بك في Goldsainte.',
    tagline: 'سوق منتقى يضم أوثق مختصي السفر وصنّاع المحتوى والعلامات في العالم.',
    lede: 'حسابك جاهز. أخبرنا إلى أين تريد الذهاب وستصمم شبكتنا من المختصين المعتمدين الرحلة — منتقاة بخصوصية، ومنظمة بإتقان، وقابلة للحجز عبر المنصة.',
    step1: 'أرسل طلب رحلة — شارك الوجهة والتواريخ والأسلوب.',
    step2: 'استلم عروضاً مخصصة من مختصين منتقين بعناية.',
    step3: 'تواصل وادفع بأمان عبر المنصة — وليس خارجها أبداً وفق شروطنا.',
    step4: 'أكّد رحلتك وسافر بحماية Goldsainte الكاملة.',
    cta: 'اطلب رحلة',
  },
  ja: {
    subject: 'Goldsainte へようこそ',
    title: 'Goldsainte へようこそ',
    headlineNamed: (n) => `ようこそ、${n} さん。`,
    headline: 'Goldsainte へようこそ。',
    tagline: '世界で最も信頼される旅のスペシャリスト、クリエイター、ブランドを集めた厳選マーケットプレイス。',
    lede: 'アカウントの準備が整いました。行きたい場所を教えてください。審査済みスペシャリストのネットワークが旅をデザインします — プライベートに厳選され、巧みに手配され、プラットフォーム上で予約できます。',
    step1: '旅のリクエストを送信 — 目的地・日程・スタイルを共有。',
    step2: '厳選されたスペシャリストからオーダーメイドの提案を受け取る。',
    step3: '規約に従い、メッセージも支払いもプラットフォーム上で安全に — 外部では決して行わないでください。',
    step4: '旅を確定し、Goldsainte の完全な保護のもとで出発。',
    cta: '旅をリクエスト',
  },
  ko: {
    subject: 'Goldsainte에 오신 것을 환영합니다',
    title: 'Goldsainte에 오신 것을 환영합니다',
    headlineNamed: (n) => `환영합니다, ${n}님.`,
    headline: 'Goldsainte에 오신 것을 환영합니다.',
    tagline: '세계에서 가장 신뢰받는 여행 전문가, 크리에이터, 브랜드를 모은 큐레이션 마켓플레이스.',
    lede: '계정이 준비되었습니다. 가고 싶은 곳을 알려주시면 검증된 전문가 네트워크가 여행을 설계합니다 — 프라이빗하게 큐레이션되고, 전문적으로 준비되며, 플랫폼에서 바로 예약됩니다.',
    step1: '여행 요청 보내기 — 목적지, 날짜, 스타일을 공유하세요.',
    step2: '엄선된 전문가들의 맞춤 제안을 받아보세요.',
    step3: '약관에 따라 메시지와 결제는 플랫폼 안에서 안전하게 — 절대 외부에서 하지 마세요.',
    step4: '여행을 확정하고 Goldsainte의 완전한 보호와 함께 떠나세요.',
    cta: '여행 요청하기',
  },
  zh: {
    subject: '欢迎来到 Goldsainte',
    title: '欢迎来到 Goldsainte',
    headlineNamed: (n) => `欢迎，${n}。`,
    headline: '欢迎来到 Goldsainte。',
    tagline: '汇聚全球最值得信赖的旅行专家、创作者与品牌的精选市场。',
    lede: '你的账户已就绪。告诉我们你想去哪里，我们经过审核的专家网络将为你设计旅程 — 私享定制、精心安排、可在平台直接预订。',
    step1: '提交旅行需求 — 分享目的地、日期与风格。',
    step2: '收到来自精挑细选专家的定制提案。',
    step3: '按照条款，沟通与支付都请在平台内安全完成 — 切勿脱离平台。',
    step4: '确认旅程，在 Goldsainte 全面保障下出发。',
    cta: '发起旅行需求',
  },
}

export const WelcomeTravelerEmail = ({ name, lang }: WelcomeTravelerProps) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={name ? s.headlineNamed(name) : s.headline}
      tagline={s.tagline}
      lede={s.lede}
      steps={[s.step1, s.step2, s.step3, s.step4]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/traveler` }}
    />
  )
}

export const template = {
  component: WelcomeTravelerEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Welcome — Traveler',
  previewData: { name: 'Alex' },
} satisfies TemplateEntry
