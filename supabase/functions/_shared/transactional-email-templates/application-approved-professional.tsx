/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface ApplicationApprovedProps {
  recipientName?: string
  applicationType?: 'agent' | 'brand' | 'creator'
  stripeOnboardingUrl?: string
  adminNotes?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headlineNamed: (name: string) => string
  headline: string
  tagline: string
  typeAdvisor: string
  typeBrand: string
  typeCreator: string
  ledeWithNotes: (typeLabel: string, notes: string) => string
  lede: (typeLabel: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Your Goldsainte application has been approved',
    title: 'Your Goldsainte application has been approved',
    headlineNamed: (n) => `Welcome, ${n}.`,
    headline: 'Welcome to Goldsainte.',
    tagline: "A curated marketplace of the world's most trusted travel specialists, creators, and brands.",
    typeAdvisor: 'advisor', typeBrand: 'brand', typeCreator: 'creator',
    ledeWithNotes: (t, n) => `Your ${t} application has been approved. A note from our team: "${n}"`,
    lede: (t) => `Your ${t} application has been approved. Welcome to the Goldsainte network \u2014 a curated marketplace built on trust, taste, and discretion.`,
    step1: "Log in with the email you applied with \u2014 you'll set your permanent password on first sign-in.",
    step2: 'Accept the Marketplace Terms to unlock your dashboard.',
    step3: 'Connect your bank account through Stripe Connect to receive on-platform payouts.',
    step4: 'All communication and payment must remain on-platform per our Terms.',
    cta: 'Sign in to your dashboard',
  },
  fr: {
    subject: 'Votre candidature Goldsainte a été approuvée',
    title: 'Votre candidature Goldsainte a été approuvée',
    headlineNamed: (n) => `Bienvenue, ${n}.`,
    headline: 'Bienvenue chez Goldsainte.',
    tagline: 'Une place de marché soignée réunissant les spécialistes du voyage, créateurs et marques les plus fiables au monde.',
    typeAdvisor: 'de conseiller', typeBrand: 'de marque', typeCreator: 'de créateur',
    ledeWithNotes: (t, n) => `Votre candidature ${t} a été approuvée. Un mot de notre équipe : \u00AB ${n} \u00BB`,
    lede: (t) => `Votre candidature ${t} a été approuvée. Bienvenue dans le réseau Goldsainte \u2014 une place de marché bâtie sur la confiance, le goût et la discrétion.`,
    step1: "Connectez-vous avec l'e-mail de votre candidature \u2014 vous définirez votre mot de passe définitif à la première connexion.",
    step2: 'Acceptez les Conditions de la place de marché pour débloquer votre tableau de bord.',
    step3: 'Connectez votre compte bancaire via Stripe Connect pour recevoir vos versements sur la plateforme.',
    step4: 'Toute communication et tout paiement doivent rester sur la plateforme, conformément à nos Conditions.',
    cta: 'Se connecter au tableau de bord',
  },
  es: {
    subject: 'Tu solicitud de Goldsainte ha sido aprobada',
    title: 'Tu solicitud de Goldsainte ha sido aprobada',
    headlineNamed: (n) => `Bienvenido, ${n}.`,
    headline: 'Bienvenido a Goldsainte.',
    tagline: 'Un marketplace curado con los especialistas en viajes, creadores y marcas más fiables del mundo.',
    typeAdvisor: 'de asesor', typeBrand: 'de marca', typeCreator: 'de creador',
    ledeWithNotes: (t, n) => `Tu solicitud ${t} ha sido aprobada. Una nota de nuestro equipo: \u201C${n}\u201D`,
    lede: (t) => `Tu solicitud ${t} ha sido aprobada. Bienvenido a la red Goldsainte \u2014 un marketplace curado construido sobre confianza, gusto y discreción.`,
    step1: 'Inicia sesión con el correo de tu solicitud \u2014 definirás tu contraseña permanente en el primer acceso.',
    step2: 'Acepta los Términos del Marketplace para desbloquear tu panel.',
    step3: 'Conecta tu cuenta bancaria mediante Stripe Connect para recibir cobros en la plataforma.',
    step4: 'Toda comunicación y pago deben permanecer en la plataforma según nuestros Términos.',
    cta: 'Entrar a tu panel',
  },
  de: {
    subject: 'Ihre Goldsainte-Bewerbung wurde genehmigt',
    title: 'Ihre Goldsainte-Bewerbung wurde genehmigt',
    headlineNamed: (n) => `Willkommen, ${n}.`,
    headline: 'Willkommen bei Goldsainte.',
    tagline: 'Ein kuratierter Marktplatz der vertrauenswürdigsten Reisespezialisten, Creator und Marken der Welt.',
    typeAdvisor: 'Berater-', typeBrand: 'Marken-', typeCreator: 'Creator-',
    ledeWithNotes: (t, n) => `Ihre ${t}Bewerbung wurde genehmigt. Eine Notiz unseres Teams: \u201E${n}\u201C`,
    lede: (t) => `Ihre ${t}Bewerbung wurde genehmigt. Willkommen im Goldsainte-Netzwerk \u2014 einem kuratierten Marktplatz, gebaut auf Vertrauen, Geschmack und Diskretion.`,
    step1: 'Melden Sie sich mit der E-Mail Ihrer Bewerbung an \u2014 Ihr dauerhaftes Passwort legen Sie bei der ersten Anmeldung fest.',
    step2: 'Akzeptieren Sie die Marktplatz-Bedingungen, um Ihr Dashboard freizuschalten.',
    step3: 'Verbinden Sie Ihr Bankkonto über Stripe Connect, um Auszahlungen auf der Plattform zu erhalten.',
    step4: 'Sämtliche Kommunikation und Zahlungen müssen gemäß unseren Bedingungen auf der Plattform bleiben.',
    cta: 'Im Dashboard anmelden',
  },
  it: {
    subject: 'La tua candidatura Goldsainte è stata approvata',
    title: 'La tua candidatura Goldsainte è stata approvata',
    headlineNamed: (n) => `Benvenuto, ${n}.`,
    headline: 'Benvenuto su Goldsainte.',
    tagline: 'Un marketplace curato con gli specialisti di viaggio, i creator e i brand più affidabili al mondo.',
    typeAdvisor: 'da consulente', typeBrand: 'da brand', typeCreator: 'da creator',
    ledeWithNotes: (t, n) => `La tua candidatura ${t} è stata approvata. Una nota dal nostro team: \u201C${n}\u201D`,
    lede: (t) => `La tua candidatura ${t} è stata approvata. Benvenuto nella rete Goldsainte \u2014 un marketplace curato, costruito su fiducia, gusto e discrezione.`,
    step1: 'Accedi con l\u2019email della candidatura \u2014 imposterai la password definitiva al primo accesso.',
    step2: 'Accetta i Termini del Marketplace per sbloccare la dashboard.',
    step3: 'Collega il conto bancario tramite Stripe Connect per ricevere gli incassi sulla piattaforma.',
    step4: 'Tutta la comunicazione e i pagamenti devono restare sulla piattaforma, come da Termini.',
    cta: 'Accedi alla dashboard',
  },
  pt: {
    subject: 'Sua candidatura Goldsainte foi aprovada',
    title: 'Sua candidatura Goldsainte foi aprovada',
    headlineNamed: (n) => `Bem-vindo, ${n}.`,
    headline: 'Bem-vindo à Goldsainte.',
    tagline: 'Um marketplace curado com os especialistas em viagens, criadores e marcas mais confiáveis do mundo.',
    typeAdvisor: 'de consultor', typeBrand: 'de marca', typeCreator: 'de criador',
    ledeWithNotes: (t, n) => `Sua candidatura ${t} foi aprovada. Uma nota da nossa equipe: \u201C${n}\u201D`,
    lede: (t) => `Sua candidatura ${t} foi aprovada. Bem-vindo à rede Goldsainte \u2014 um marketplace curado, construído sobre confiança, bom gosto e discrição.`,
    step1: 'Entre com o e-mail da candidatura \u2014 você define sua senha permanente no primeiro acesso.',
    step2: 'Aceite os Termos do Marketplace para liberar seu painel.',
    step3: 'Conecte sua conta bancária pelo Stripe Connect para receber repasses na plataforma.',
    step4: 'Toda comunicação e pagamento devem permanecer na plataforma, conforme nossos Termos.',
    cta: 'Entrar no painel',
  },
  ar: {
    subject: 'تمت الموافقة على طلبك في Goldsainte',
    title: 'تمت الموافقة على طلبك في Goldsainte',
    headlineNamed: (n) => `مرحباً، ${n}.`,
    headline: 'مرحباً بك في Goldsainte.',
    tagline: 'سوق منتقى يضم أوثق مختصي السفر وصنّاع المحتوى والعلامات في العالم.',
    typeAdvisor: 'كمستشار', typeBrand: 'كعلامة', typeCreator: 'كصانع محتوى',
    ledeWithNotes: (t, n) => `تمت الموافقة على طلبك ${t}. ملاحظة من فريقنا: \u201C${n}\u201D`,
    lede: (t) => `تمت الموافقة على طلبك ${t}. مرحباً بك في شبكة Goldsainte \u2014 سوق منتقى مبني على الثقة والذوق والخصوصية.`,
    step1: 'سجّل الدخول بالبريد الذي تقدمت به \u2014 ستحدد كلمة مرورك الدائمة عند أول دخول.',
    step2: 'اقبل شروط السوق لفتح لوحتك.',
    step3: 'اربط حسابك المصرفي عبر Stripe Connect لاستلام المدفوعات على المنصة.',
    step4: 'يجب أن يبقى كل التواصل والدفع على المنصة وفق شروطنا.',
    cta: 'سجّل الدخول إلى لوحتك',
  },
  ja: {
    subject: 'Goldsainte への申請が承認されました',
    title: 'Goldsainte への申請が承認されました',
    headlineNamed: (n) => `ようこそ、${n} さん。`,
    headline: 'Goldsainte へようこそ。',
    tagline: '世界で最も信頼される旅のスペシャリスト、クリエイター、ブランドを集めた厳選マーケットプレイス。',
    typeAdvisor: 'アドバイザー', typeBrand: 'ブランド', typeCreator: 'クリエイター',
    ledeWithNotes: (t, n) => `${t}申請が承認されました。チームからのメモ：\u201C${n}\u201D`,
    lede: (t) => `${t}申請が承認されました。Goldsainte ネットワークへようこそ \u2014 信頼と審美眼、そして節度の上に築かれた厳選マーケットプレイスです。`,
    step1: '申請に使ったメールでログインしてください \u2014 初回サインイン時に本パスワードを設定します。',
    step2: 'マーケットプレイス規約に同意してダッシュボードを解放しましょう。',
    step3: 'Stripe Connect で銀行口座を接続し、プラットフォーム上で入金を受け取りましょう。',
    step4: '規約に従い、連絡と支払いはすべてプラットフォーム上で行ってください。',
    cta: 'ダッシュボードにサインイン',
  },
  ko: {
    subject: 'Goldsainte 신청이 승인되었습니다',
    title: 'Goldsainte 신청이 승인되었습니다',
    headlineNamed: (n) => `환영합니다, ${n}님.`,
    headline: 'Goldsainte에 오신 것을 환영합니다.',
    tagline: '세계에서 가장 신뢰받는 여행 전문가, 크리에이터, 브랜드를 모은 큐레이션 마켓플레이스.',
    typeAdvisor: '어드바이저', typeBrand: '브랜드', typeCreator: '크리에이터',
    ledeWithNotes: (t, n) => `${t} 신청이 승인되었습니다. 팀의 메모: \u201C${n}\u201D`,
    lede: (t) => `${t} 신청이 승인되었습니다. Goldsainte 네트워크에 오신 것을 환영합니다 \u2014 신뢰, 안목, 신중함 위에 세워진 큐레이션 마켓플레이스입니다.`,
    step1: '신청에 사용한 이메일로 로그인하세요 \u2014 첫 로그인 시 영구 비밀번호를 설정합니다.',
    step2: '마켓플레이스 약관에 동의해 대시보드를 여세요.',
    step3: 'Stripe Connect로 은행 계좌를 연결해 플랫폼 정산을 받으세요.',
    step4: '약관에 따라 모든 소통과 결제는 플랫폼 안에서 이루어져야 합니다.',
    cta: '대시보드 로그인',
  },
  zh: {
    subject: '你的 Goldsainte 申请已获批准',
    title: '你的 Goldsainte 申请已获批准',
    headlineNamed: (n) => `欢迎，${n}。`,
    headline: '欢迎来到 Goldsainte。',
    tagline: '汇聚全球最值得信赖的旅行专家、创作者与品牌的精选市场。',
    typeAdvisor: '顾问', typeBrand: '品牌', typeCreator: '创作者',
    ledeWithNotes: (t, n) => `你的${t}申请已获批准。来自团队的备注：\u201C${n}\u201D`,
    lede: (t) => `你的${t}申请已获批准。欢迎加入 Goldsainte 网络 \u2014 一个建立在信任、品味与审慎之上的精选市场。`,
    step1: '用申请时的邮箱登录 \u2014 首次登录时设置永久密码。',
    step2: '接受市场条款以解锁你的工作台。',
    step3: '通过 Stripe Connect 连接银行账户，在平台上接收结算。',
    step4: '按照条款，所有沟通与支付必须留在平台内。',
    cta: '登录工作台',
  },
}

export const ApplicationApprovedProfessionalEmail = ({
  recipientName,
  applicationType = 'agent',
  stripeOnboardingUrl: _stripeOnboardingUrl,
  adminNotes,
  lang,
}: ApplicationApprovedProps) => {
  const s = pickLang(STRINGS, lang)
  const typeLabel =
    applicationType === 'brand' ? s.typeBrand : applicationType === 'creator' ? s.typeCreator : s.typeAdvisor
  return (
    <AuthEmailLayout
      title={s.title}
      headline={recipientName ? s.headlineNamed(recipientName) : s.headline}
      tagline={s.tagline}
      lede={adminNotes ? s.ledeWithNotes(typeLabel, adminNotes) : s.lede(typeLabel)}
      steps={[s.step1, s.step2, s.step3, s.step4]}
      cta={{
        label: s.cta,
        url: `https://goldsainte.ai/login?redirect=%2Fagent-dashboard`,
      }}
    />
  )
}

export const template = {
  component: ApplicationApprovedProfessionalEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Application approved — Specialist',
  previewData: { recipientName: 'Jimmy', applicationType: 'agent' },
} satisfies TemplateEntry
