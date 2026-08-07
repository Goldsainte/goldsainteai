/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  amount?: string
  nextBillingDate?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (plan: string, amount: string) => string
  step1: string
  step2: (date: string) => string
  step3: string
  step4: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Welcome to Goldsainte Verified — your receipt',
    title: 'Welcome to Goldsainte Verified',
    headline: 'You are Verified.',
    tagline: 'Your signup receipt and what happens next.',
    lede: (p, a) => `Your ${p} subscription is active. This email is your official receipt for the first payment of ${a}.`,
    step1: 'Your gold seal appears across Goldsainte as soon as your identity check is complete.',
    step2: (d) => `Your subscription renews monthly; the next billing date is ${d}.`,
    step3: 'A receipt is emailed to you after every renewal for your records.',
    step4: 'Manage or cancel anytime from Settings — no calls, no waiting.',
    cta: 'Manage subscription',
  },
  fr: {
    subject: 'Bienvenue dans Goldsainte Verified — votre reçu',
    title: 'Bienvenue dans Goldsainte Verified',
    headline: 'Vous êtes vérifié.',
    tagline: 'Votre reçu d’inscription et la suite.',
    lede: (p, a) => `Votre abonnement ${p} est actif. Cet e-mail est votre reçu officiel du premier paiement de ${a}.`,
    step1: 'Votre sceau doré apparaît sur Goldsainte dès que votre vérification d’identité est terminée.',
    step2: (d) => `Votre abonnement se renouvelle chaque mois ; prochaine facturation le ${d}.`,
    step3: 'Un reçu vous est envoyé après chaque renouvellement.',
    step4: 'Gérez ou annulez à tout moment depuis les Paramètres — sans appel, sans attente.',
    cta: 'Gérer l’abonnement',
  },
  es: {
    subject: 'Bienvenido a Goldsainte Verified — tu recibo',
    title: 'Bienvenido a Goldsainte Verified',
    headline: 'Estás verificado.',
    tagline: 'Tu recibo de alta y los próximos pasos.',
    lede: (p, a) => `Tu suscripción ${p} está activa. Este correo es tu recibo oficial del primer pago de ${a}.`,
    step1: 'Tu sello dorado aparecerá en Goldsainte en cuanto se complete tu verificación de identidad.',
    step2: (d) => `Tu suscripción se renueva cada mes; la próxima facturación es el ${d}.`,
    step3: 'Recibirás un recibo por correo tras cada renovación.',
    step4: 'Gestiona o cancela cuando quieras desde Ajustes — sin llamadas ni esperas.',
    cta: 'Gestionar suscripción',
  },
  de: {
    subject: 'Willkommen bei Goldsainte Verified — Ihre Quittung',
    title: 'Willkommen bei Goldsainte Verified',
    headline: 'Sie sind verifiziert.',
    tagline: 'Ihre Anmeldequittung und die nächsten Schritte.',
    lede: (p, a) => `Ihr ${p}-Abonnement ist aktiv. Diese E-Mail ist Ihre offizielle Quittung über die erste Zahlung von ${a}.`,
    step1: 'Ihr goldenes Siegel erscheint auf Goldsainte, sobald Ihre Identitätsprüfung abgeschlossen ist.',
    step2: (d) => `Ihr Abo verlängert sich monatlich; nächste Abbuchung am ${d}.`,
    step3: 'Nach jeder Verlängerung erhalten Sie eine Quittung per E-Mail.',
    step4: 'Verwalten oder kündigen Sie jederzeit in den Einstellungen — ohne Anruf, ohne Wartezeit.',
    cta: 'Abo verwalten',
  },
  it: {
    subject: 'Benvenuto in Goldsainte Verified — la tua ricevuta',
    title: 'Benvenuto in Goldsainte Verified',
    headline: 'Sei verificato.',
    tagline: 'La tua ricevuta di iscrizione e i prossimi passi.',
    lede: (p, a) => `Il tuo abbonamento ${p} è attivo. Questa email è la tua ricevuta ufficiale del primo pagamento di ${a}.`,
    step1: 'Il tuo sigillo dorato apparirà su Goldsainte appena completata la verifica dell’identità.',
    step2: (d) => `L’abbonamento si rinnova ogni mese; il prossimo addebito è il ${d}.`,
    step3: 'Dopo ogni rinnovo riceverai una ricevuta via email.',
    step4: 'Gestisci o annulla in qualsiasi momento dalle Impostazioni — senza chiamate, senza attese.',
    cta: 'Gestisci abbonamento',
  },
  pt: {
    subject: 'Bem-vindo ao Goldsainte Verified — seu recibo',
    title: 'Bem-vindo ao Goldsainte Verified',
    headline: 'Você está verificado.',
    tagline: 'Seu recibo de adesão e os próximos passos.',
    lede: (p, a) => `Sua assinatura ${p} está ativa. Este e-mail é seu recibo oficial do primeiro pagamento de ${a}.`,
    step1: 'Seu selo dourado aparece no Goldsainte assim que sua verificação de identidade for concluída.',
    step2: (d) => `Sua assinatura renova mensalmente; a próxima cobrança é em ${d}.`,
    step3: 'Você recebe um recibo por e-mail após cada renovação.',
    step4: 'Gerencie ou cancele quando quiser em Configurações — sem ligações, sem espera.',
    cta: 'Gerenciar assinatura',
  },
  ar: {
    subject: 'مرحباً بك في Goldsainte Verified — إيصالك',
    title: 'مرحباً بك في Goldsainte Verified',
    headline: 'أنت موثق الآن.',
    tagline: 'إيصال اشتراكك وما يلي ذلك.',
    lede: (p, a) => `اشتراكك ${p} نشط الآن. هذه الرسالة هي إيصالك الرسمي لأول دفعة بقيمة ${a}.`,
    step1: 'يظهر ختمك الذهبي في Goldsainte فور اكتمال التحقق من هويتك.',
    step2: (d) => `يتجدد اشتراكك شهرياً؛ تاريخ الفوترة القادم ${d}.`,
    step3: 'يصلك إيصال بالبريد بعد كل تجديد لسجلاتك.',
    step4: 'أدر اشتراكك أو ألغه في أي وقت من الإعدادات — دون مكالمات أو انتظار.',
    cta: 'إدارة الاشتراك',
  },
  ja: {
    subject: 'Goldsainte Verified へようこそ — 領収書',
    title: 'Goldsainte Verified へようこそ',
    headline: '認証されました。',
    tagline: 'お申し込みの領収書と、この後のご案内です。',
    lede: (p, a) => `${p} のサブスクリプションが有効になりました。本メールは初回お支払い ${a} の正式な領収書です。`,
    step1: '本人確認が完了すると、ゴールドの認証シールが Goldsainte 全体に表示されます。',
    step2: (d) => `サブスクリプションは毎月更新されます。次回請求日は ${d} です。`,
    step3: '更新のたびに領収書をメールでお送りします。',
    step4: '設定からいつでも管理・解約できます — 電話も待ち時間も不要です。',
    cta: 'サブスクリプションを管理',
  },
  ko: {
    subject: 'Goldsainte Verified에 오신 것을 환영합니다 — 영수증',
    title: 'Goldsainte Verified에 오신 것을 환영합니다',
    headline: '인증되었습니다.',
    tagline: '가입 영수증과 다음 안내입니다.',
    lede: (p, a) => `${p} 구독이 활성화되었습니다. 이 메일은 첫 결제 ${a}에 대한 공식 영수증입니다.`,
    step1: '신원 확인이 완료되는 즉시 골드 인증 씰이 Goldsainte 전체에 표시됩니다.',
    step2: (d) => `구독은 매월 갱신되며, 다음 결제일은 ${d}입니다.`,
    step3: '갱신 때마다 영수증을 이메일로 보내드립니다.',
    step4: '설정에서 언제든 관리하거나 해지할 수 있습니다 — 전화도, 대기도 없습니다.',
    cta: '구독 관리',
  },
  zh: {
    subject: '欢迎加入 Goldsainte Verified — 你的收据',
    title: '欢迎加入 Goldsainte Verified',
    headline: '你已通过认证。',
    tagline: '这是你的开通收据与后续说明。',
    lede: (p, a) => `你的 ${p} 订阅已生效。本邮件是你首笔付款 ${a} 的正式收据。`,
    step1: '身份核验完成后，金色认证徽章将在 Goldsainte 全站显示。',
    step2: (d) => `订阅按月自动续费；下次扣款日期为 ${d}。`,
    step3: '每次续费后都会通过邮件向你发送收据。',
    step4: '可随时在“设置”中管理或取消 — 无需致电，无需等待。',
    cta: '管理订阅',
  },
}

export const VerificationWelcomeEmail = ({ planName, amount, nextBillingDate, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(planName ?? 'Goldsainte Verified', amount ?? '')}
      steps={[s.step1, s.step2(nextBillingDate ?? ''), s.step3, s.step4]}
      cta={{ label: s.cta, url: 'https://goldsainte.ai/settings' }}
    />
  )
}

export const template = {
  component: VerificationWelcomeEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Verification Welcome (signup receipt)',
  previewData: {
    planName: 'Goldsainte Verified — Creator',
    amount: 'USD 3.99',
    nextBillingDate: '2026-09-07',
  },
} satisfies TemplateEntry
