/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  amount?: string
  invoiceNumber?: string
  periodEnd?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (amount: string, plan: string) => string
  step1: (invoice: string) => string
  step2: (date: string) => string
  step3: string
  step4: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Your Goldsainte Verified receipt',
    title: 'Your Goldsainte Verified receipt',
    headline: 'Payment received.',
    tagline: 'Your monthly verification receipt.',
    lede: (a, p) => `We processed your monthly payment of ${a} for ${p}. This email is your official receipt.`,
    step1: (i) => `Invoice reference: ${i}.`,
    step2: (d) => `Your verification is paid through ${d}.`,
    step3: 'Your gold seal remains active everywhere on Goldsainte.',
    step4: 'Update your card or cancel anytime from Settings.',
    cta: 'Manage subscription',
  },
  fr: {
    subject: 'Votre reçu Goldsainte Verified',
    title: 'Votre reçu Goldsainte Verified',
    headline: 'Paiement reçu.',
    tagline: 'Votre reçu mensuel de vérification.',
    lede: (a, p) => `Nous avons traité votre paiement mensuel de ${a} pour ${p}. Cet e-mail est votre reçu officiel.`,
    step1: (i) => `Référence de facture : ${i}.`,
    step2: (d) => `Votre vérification est réglée jusqu’au ${d}.`,
    step3: 'Votre sceau doré reste actif partout sur Goldsainte.',
    step4: 'Mettez à jour votre carte ou annulez à tout moment depuis les Paramètres.',
    cta: 'Gérer l’abonnement',
  },
  es: {
    subject: 'Tu recibo de Goldsainte Verified',
    title: 'Tu recibo de Goldsainte Verified',
    headline: 'Pago recibido.',
    tagline: 'Tu recibo mensual de verificación.',
    lede: (a, p) => `Procesamos tu pago mensual de ${a} por ${p}. Este correo es tu recibo oficial.`,
    step1: (i) => `Referencia de factura: ${i}.`,
    step2: (d) => `Tu verificación está pagada hasta el ${d}.`,
    step3: 'Tu sello dorado sigue activo en todo Goldsainte.',
    step4: 'Actualiza tu tarjeta o cancela cuando quieras desde Ajustes.',
    cta: 'Gestionar suscripción',
  },
  de: {
    subject: 'Ihre Goldsainte Verified-Quittung',
    title: 'Ihre Goldsainte Verified-Quittung',
    headline: 'Zahlung erhalten.',
    tagline: 'Ihre monatliche Verifizierungsquittung.',
    lede: (a, p) => `Wir haben Ihre monatliche Zahlung von ${a} für ${p} verarbeitet. Diese E-Mail ist Ihre offizielle Quittung.`,
    step1: (i) => `Rechnungsreferenz: ${i}.`,
    step2: (d) => `Ihre Verifizierung ist bezahlt bis ${d}.`,
    step3: 'Ihr goldenes Siegel bleibt überall auf Goldsainte aktiv.',
    step4: 'Karte aktualisieren oder jederzeit in den Einstellungen kündigen.',
    cta: 'Abo verwalten',
  },
  it: {
    subject: 'La tua ricevuta Goldsainte Verified',
    title: 'La tua ricevuta Goldsainte Verified',
    headline: 'Pagamento ricevuto.',
    tagline: 'La tua ricevuta mensile di verifica.',
    lede: (a, p) => `Abbiamo elaborato il tuo pagamento mensile di ${a} per ${p}. Questa email è la tua ricevuta ufficiale.`,
    step1: (i) => `Riferimento fattura: ${i}.`,
    step2: (d) => `La tua verifica è pagata fino al ${d}.`,
    step3: 'Il tuo sigillo dorato resta attivo ovunque su Goldsainte.',
    step4: 'Aggiorna la carta o annulla in qualsiasi momento dalle Impostazioni.',
    cta: 'Gestisci abbonamento',
  },
  pt: {
    subject: 'Seu recibo do Goldsainte Verified',
    title: 'Seu recibo do Goldsainte Verified',
    headline: 'Pagamento recebido.',
    tagline: 'Seu recibo mensal de verificação.',
    lede: (a, p) => `Processamos seu pagamento mensal de ${a} pelo ${p}. Este e-mail é seu recibo oficial.`,
    step1: (i) => `Referência da fatura: ${i}.`,
    step2: (d) => `Sua verificação está paga até ${d}.`,
    step3: 'Seu selo dourado continua ativo em todo o Goldsainte.',
    step4: 'Atualize o cartão ou cancele quando quiser em Configurações.',
    cta: 'Gerenciar assinatura',
  },
  ar: {
    subject: 'إيصال Goldsainte Verified الخاص بك',
    title: 'إيصال Goldsainte Verified الخاص بك',
    headline: 'تم استلام الدفعة.',
    tagline: 'إيصال التوثيق الشهري الخاص بك.',
    lede: (a, p) => `عالجنا دفعتك الشهرية بقيمة ${a} مقابل ${p}. هذه الرسالة هي إيصالك الرسمي.`,
    step1: (i) => `مرجع الفاتورة: ${i}.`,
    step2: (d) => `توثيقك مدفوع حتى ${d}.`,
    step3: 'يبقى ختمك الذهبي نشطاً في كل أنحاء Goldsainte.',
    step4: 'حدّث بطاقتك أو ألغِ الاشتراك في أي وقت من الإعدادات.',
    cta: 'إدارة الاشتراك',
  },
  ja: {
    subject: 'Goldsainte Verified の領収書',
    title: 'Goldsainte Verified の領収書',
    headline: 'お支払いを受領しました。',
    tagline: '月次の認証領収書です。',
    lede: (a, p) => `${p} の月額 ${a} のお支払いを処理しました。本メールが正式な領収書です。`,
    step1: (i) => `請求書番号：${i}`,
    step2: (d) => `認証は ${d} まで有効です。`,
    step3: 'ゴールドの認証シールは Goldsainte 全体で有効なままです。',
    step4: 'カードの更新や解約は、いつでも設定から行えます。',
    cta: 'サブスクリプションを管理',
  },
  ko: {
    subject: 'Goldsainte Verified 영수증',
    title: 'Goldsainte Verified 영수증',
    headline: '결제가 완료되었습니다.',
    tagline: '월간 인증 영수증입니다.',
    lede: (a, p) => `${p}의 월 결제 ${a}이(가) 처리되었습니다. 이 메일이 공식 영수증입니다.`,
    step1: (i) => `인보이스 번호: ${i}`,
    step2: (d) => `인증은 ${d}까지 결제되어 있습니다.`,
    step3: '골드 인증 씰은 Goldsainte 전체에서 계속 유지됩니다.',
    step4: '설정에서 언제든 카드를 변경하거나 해지할 수 있습니다.',
    cta: '구독 관리',
  },
  zh: {
    subject: '你的 Goldsainte Verified 收据',
    title: '你的 Goldsainte Verified 收据',
    headline: '已收到付款。',
    tagline: '这是你的月度认证收据。',
    lede: (a, p) => `我们已处理你 ${p} 的月度付款 ${a}。本邮件为正式收据。`,
    step1: (i) => `账单编号：${i}`,
    step2: (d) => `你的认证已付费至 ${d}。`,
    step3: '你的金色认证徽章在 Goldsainte 全站保持有效。',
    step4: '可随时在“设置”中更新银行卡或取消订阅。',
    cta: '管理订阅',
  },
}

export const VerificationReceiptEmail = ({ planName, amount, invoiceNumber, periodEnd, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(amount ?? '', planName ?? 'Goldsainte Verified')}
      steps={[s.step1(invoiceNumber ?? ''), s.step2(periodEnd ?? ''), s.step3, s.step4]}
      cta={{ label: s.cta, url: 'https://goldsainte.ai/settings' }}
    />
  )
}

export const template = {
  component: VerificationReceiptEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Verification Receipt (monthly)',
  previewData: {
    planName: 'Goldsainte Verified — Agent',
    amount: 'USD 8.99',
    invoiceNumber: 'INV-0042',
    periodEnd: '2026-10-07',
  },
} satisfies TemplateEntry
