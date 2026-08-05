/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface WelcomeProfessionalProps {
  name?: string
  accountType?: 'agent' | 'brand' | 'creator'
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
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: "You're approved — your Goldsainte account is live",
    title: "You're approved — your account is live",
    headlineNamed: (n) => `You're all set, ${n}.`,
    headline: "You're all set.",
    tagline: "A curated marketplace of the world's most trusted travel specialists, creators, and brands.",
    lede: 'Your application has been reviewed and approved — your Goldsainte account is now live. The final step before you start receiving trip requests is connecting Stripe so you can be paid on-platform.',
    step1: 'Connect Stripe Connect — required to receive payouts.',
    step2: 'Complete your public profile — this is your storefront.',
    step3: 'Publish your first Storyboard or packaged trip.',
    step4: 'Respond to inbound trip requests from your dashboard.',
    step5: 'All communication and payment must remain on-platform per our Terms.',
    cta: 'Open my dashboard',
  },
  fr: {
    subject: 'Vous êtes approuvé — votre compte Goldsainte est actif',
    title: 'Vous êtes approuvé — votre compte est actif',
    headlineNamed: (n) => `Tout est prêt, ${n}.`,
    headline: 'Tout est prêt.',
    tagline: 'Une place de marché soignée réunissant les spécialistes du voyage, créateurs et marques les plus fiables au monde.',
    lede: 'Votre candidature a été examinée et approuvée — votre compte Goldsainte est désormais actif. Dernière étape avant de recevoir des demandes de voyage : connecter Stripe pour être payé sur la plateforme.',
    step1: 'Connectez Stripe Connect — indispensable pour recevoir vos versements.',
    step2: 'Complétez votre profil public — c\u2019est votre vitrine.',
    step3: 'Publiez votre premier Storyboard ou voyage clé en main.',
    step4: 'Répondez aux demandes de voyage entrantes depuis votre tableau de bord.',
    step5: 'Toute communication et tout paiement doivent rester sur la plateforme, conformément à nos Conditions.',
    cta: 'Ouvrir mon tableau de bord',
  },
  es: {
    subject: 'Aprobado — tu cuenta de Goldsainte ya está activa',
    title: 'Aprobado — tu cuenta ya está activa',
    headlineNamed: (n) => `Todo listo, ${n}.`,
    headline: 'Todo listo.',
    tagline: 'Un marketplace curado con los especialistas en viajes, creadores y marcas más fiables del mundo.',
    lede: 'Tu solicitud fue revisada y aprobada — tu cuenta de Goldsainte ya está activa. El último paso antes de recibir solicitudes de viaje es conectar Stripe para cobrar en la plataforma.',
    step1: 'Conecta Stripe Connect — imprescindible para recibir cobros.',
    step2: 'Completa tu perfil público — es tu escaparate.',
    step3: 'Publica tu primer Storyboard o viaje empaquetado.',
    step4: 'Responde a las solicitudes de viaje entrantes desde tu panel.',
    step5: 'Toda comunicación y pago deben permanecer en la plataforma según nuestros Términos.',
    cta: 'Abrir mi panel',
  },
  de: {
    subject: 'Genehmigt — Ihr Goldsainte-Konto ist live',
    title: 'Genehmigt — Ihr Konto ist live',
    headlineNamed: (n) => `Alles bereit, ${n}.`,
    headline: 'Alles bereit.',
    tagline: 'Ein kuratierter Marktplatz der vertrauenswürdigsten Reisespezialisten, Creator und Marken der Welt.',
    lede: 'Ihre Bewerbung wurde geprüft und genehmigt — Ihr Goldsainte-Konto ist jetzt live. Der letzte Schritt vor den ersten Reiseanfragen: Stripe verbinden, damit Sie auf der Plattform bezahlt werden.',
    step1: 'Verbinden Sie Stripe Connect — Voraussetzung für Auszahlungen.',
    step2: 'Vervollständigen Sie Ihr öffentliches Profil — Ihr Schaufenster.',
    step3: 'Veröffentlichen Sie Ihr erstes Storyboard oder Ihre erste fertige Reise.',
    step4: 'Beantworten Sie eingehende Reiseanfragen über Ihr Dashboard.',
    step5: 'Sämtliche Kommunikation und Zahlungen müssen gemäß unseren Bedingungen auf der Plattform bleiben.',
    cta: 'Mein Dashboard öffnen',
  },
  it: {
    subject: 'Approvato — il tuo account Goldsainte è attivo',
    title: 'Approvato — il tuo account è attivo',
    headlineNamed: (n) => `Tutto pronto, ${n}.`,
    headline: 'Tutto pronto.',
    tagline: 'Un marketplace curato con gli specialisti di viaggio, i creator e i brand più affidabili al mondo.',
    lede: 'La tua candidatura è stata esaminata e approvata — il tuo account Goldsainte è ora attivo. Ultimo passo prima di ricevere richieste di viaggio: collega Stripe per essere pagato sulla piattaforma.',
    step1: 'Collega Stripe Connect — necessario per ricevere gli incassi.',
    step2: 'Completa il tuo profilo pubblico — è la tua vetrina.',
    step3: 'Pubblica il tuo primo Storyboard o viaggio confezionato.',
    step4: 'Rispondi alle richieste di viaggio in arrivo dalla tua dashboard.',
    step5: 'Tutta la comunicazione e i pagamenti devono restare sulla piattaforma, come da Termini.',
    cta: 'Apri la mia dashboard',
  },
  pt: {
    subject: 'Aprovado — sua conta Goldsainte está ativa',
    title: 'Aprovado — sua conta está ativa',
    headlineNamed: (n) => `Tudo pronto, ${n}.`,
    headline: 'Tudo pronto.',
    tagline: 'Um marketplace curado com os especialistas em viagens, criadores e marcas mais confiáveis do mundo.',
    lede: 'Sua candidatura foi analisada e aprovada — sua conta Goldsainte já está ativa. O último passo antes de receber pedidos de viagem é conectar o Stripe para ser pago na plataforma.',
    step1: 'Conecte o Stripe Connect — obrigatório para receber repasses.',
    step2: 'Complete seu perfil público — é a sua vitrine.',
    step3: 'Publique seu primeiro Storyboard ou viagem montada.',
    step4: 'Responda aos pedidos de viagem pelo seu painel.',
    step5: 'Toda comunicação e pagamento devem permanecer na plataforma, conforme nossos Termos.',
    cta: 'Abrir meu painel',
  },
  ar: {
    subject: 'تمت الموافقة — حسابك في Goldsainte أصبح فعالاً',
    title: 'تمت الموافقة — حسابك فعال',
    headlineNamed: (n) => `كل شيء جاهز يا ${n}.`,
    headline: 'كل شيء جاهز.',
    tagline: 'سوق منتقى يضم أوثق مختصي السفر وصنّاع المحتوى والعلامات في العالم.',
    lede: 'روجع طلبك وتمت الموافقة عليه — حسابك في Goldsainte أصبح فعالاً الآن. الخطوة الأخيرة قبل استلام طلبات الرحلات هي ربط Stripe لتُدفع لك عبر المنصة.',
    step1: 'اربط Stripe Connect — مطلوب لاستلام المدفوعات.',
    step2: 'أكمل ملفك العام — إنه واجهتك.',
    step3: 'انشر أول Storyboard أو رحلة جاهزة لك.',
    step4: 'رد على طلبات الرحلات الواردة من لوحتك.',
    step5: 'يجب أن يبقى كل التواصل والدفع على المنصة وفق شروطنا.',
    cta: 'افتح لوحتي',
  },
  ja: {
    subject: '承認されました — Goldsainte アカウントが有効になりました',
    title: '承認されました — アカウントが有効です',
    headlineNamed: (n) => `準備完了です、${n} さん。`,
    headline: '準備完了です。',
    tagline: '世界で最も信頼される旅のスペシャリスト、クリエイター、ブランドを集めた厳選マーケットプレイス。',
    lede: '申請が審査され、承認されました — Goldsainte アカウントが有効になりました。旅のリクエストを受け取る前の最後のステップは、プラットフォーム上で報酬を受け取るための Stripe 接続です。',
    step1: 'Stripe Connect を接続 — 入金の受け取りに必須です。',
    step2: '公開プロフィールを完成させましょう — あなたの店構えです。',
    step3: '最初の Storyboard またはパッケージ旅行を公開しましょう。',
    step4: 'ダッシュボードから届いた旅のリクエストに応えましょう。',
    step5: '規約に従い、連絡と支払いはすべてプラットフォーム上で行ってください。',
    cta: 'ダッシュボードを開く',
  },
  ko: {
    subject: '승인 완료 — Goldsainte 계정이 활성화되었습니다',
    title: '승인 완료 — 계정이 활성화되었습니다',
    headlineNamed: (n) => `준비 완료입니다, ${n}님.`,
    headline: '준비 완료입니다.',
    tagline: '세계에서 가장 신뢰받는 여행 전문가, 크리에이터, 브랜드를 모은 큐레이션 마켓플레이스.',
    lede: '신청서가 검토·승인되어 Goldsainte 계정이 활성화되었습니다. 여행 요청을 받기 전 마지막 단계는 플랫폼에서 정산받기 위한 Stripe 연결입니다.',
    step1: 'Stripe Connect를 연결하세요 — 정산 수령에 필수입니다.',
    step2: '공개 프로필을 완성하세요 — 당신의 매장입니다.',
    step3: '첫 Storyboard 또는 패키지 여행을 게시하세요.',
    step4: '대시보드에서 들어오는 여행 요청에 응답하세요.',
    step5: '약관에 따라 모든 소통과 결제는 플랫폼 안에서 이루어져야 합니다.',
    cta: '내 대시보드 열기',
  },
  zh: {
    subject: '审核通过 — 你的 Goldsainte 账户已激活',
    title: '审核通过 — 你的账户已激活',
    headlineNamed: (n) => `一切就绪，${n}。`,
    headline: '一切就绪。',
    tagline: '汇聚全球最值得信赖的旅行专家、创作者与品牌的精选市场。',
    lede: '你的申请已审核通过 — Goldsainte 账户现已激活。开始接收旅行需求前的最后一步：连接 Stripe，以便在平台上收款。',
    step1: '连接 Stripe Connect — 收取结算所必需。',
    step2: '完善你的公开资料 — 这是你的门面。',
    step3: '发布你的第一个 Storyboard 或打包旅程。',
    step4: '在工作台回应收到的旅行需求。',
    step5: '按照条款，所有沟通与支付必须留在平台内。',
    cta: '打开我的工作台',
  },
}

export const WelcomeProfessionalEmail = ({ name, accountType = 'agent', lang }: WelcomeProfessionalProps) => {
  const s = pickLang(STRINGS, lang)
  // DEAD LINKS (fixed Jul 26): '/agent', '/brand' and '/creator' are not
  // registered routes — the main CTA of the welcome email 404'd. The real
  // dashboards are '-dashboard' suffixed.
  const dashboardPath =
    accountType === 'brand'
      ? '/partner-bookings'
      : accountType === 'creator'
        ? '/creator-dashboard'
        : '/agent-dashboard'
  return (
    <AuthEmailLayout
      title={s.title}
      headline={name ? s.headlineNamed(name) : s.headline}
      tagline={s.tagline}
      lede={s.lede}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai${dashboardPath}` }}
    />
  )
}

export const template = {
  component: WelcomeProfessionalEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Welcome — Specialist (post-approval)',
  previewData: { name: 'Maison Atelier', accountType: 'agent' },
} satisfies TemplateEntry
