/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  amount?: string
  bookingId?: string
  tripName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (amount: string, trip: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Your Goldsainte payment receipt',
    title: 'Your Goldsainte payment receipt',
    headline: 'Payment received.',
    tagline: 'A formal receipt for your records.',
    lede: (a, t) => `We have successfully processed your payment of ${a} for ${t}. This serves as your official receipt for the transaction.`,
    step1: 'Your payment goes securely to your specialist, your seller of record.',
    step2: 'A full receipt PDF is available in your dashboard.',
    step3: 'All transactions are protected by the Goldsainte Promise.',
    step4: 'Refunds, if applicable, follow the cancellation terms in your contract.',
    step5: 'For accounting questions, contact our concierge team.',
    cta: 'Download receipt',
  },
  fr: {
    subject: 'Votre reçu de paiement Goldsainte',
    title: 'Votre reçu de paiement Goldsainte',
    headline: 'Paiement reçu.',
    tagline: 'Un reçu officiel pour vos archives.',
    lede: (a, t) => `Nous avons traité avec succès votre paiement de ${a} pour ${t}. Ce document constitue votre reçu officiel pour cette transaction.`,
    step1: 'Votre paiement va en toute sécurité à votre spécialiste, votre vendeur officiel.',
    step2: 'Un reçu PDF complet est disponible dans votre tableau de bord.',
    step3: 'Toutes les transactions sont protégées par la Promesse Goldsainte.',
    step4: "Les remboursements éventuels suivent les conditions d'annulation de votre contrat.",
    step5: 'Pour toute question comptable, contactez notre équipe de conciergerie.',
    cta: 'Télécharger le reçu',
  },
  es: {
    subject: 'Tu recibo de pago de Goldsainte',
    title: 'Tu recibo de pago de Goldsainte',
    headline: 'Pago recibido.',
    tagline: 'Un recibo formal para tus registros.',
    lede: (a, t) => `Hemos procesado con éxito tu pago de ${a} por ${t}. Este documento es tu recibo oficial de la transacción.`,
    step1: 'Tu pago va de forma segura a tu especialista, tu vendedor registrado.',
    step2: 'Un recibo completo en PDF está disponible en tu panel.',
    step3: 'Todas las transacciones están protegidas por la Promesa Goldsainte.',
    step4: 'Los reembolsos, si proceden, siguen los términos de cancelación de tu contrato.',
    step5: 'Para preguntas contables, contacta con nuestro equipo de conserjería.',
    cta: 'Descargar recibo',
  },
  de: {
    subject: 'Ihre Goldsainte-Zahlungsquittung',
    title: 'Ihre Goldsainte-Zahlungsquittung',
    headline: 'Zahlung erhalten.',
    tagline: 'Eine offizielle Quittung für Ihre Unterlagen.',
    lede: (a, t) => `Wir haben Ihre Zahlung von ${a} für ${t} erfolgreich verarbeitet. Dieses Dokument dient als offizielle Quittung für die Transaktion.`,
    step1: 'Ihre Zahlung geht sicher an Ihren Spezialisten, den eingetragenen Verkäufer.',
    step2: 'Eine vollständige PDF-Quittung ist in Ihrem Dashboard verfügbar.',
    step3: 'Alle Transaktionen sind durch das Goldsainte-Versprechen geschützt.',
    step4: 'Etwaige Erstattungen folgen den Stornobedingungen Ihres Vertrags.',
    step5: 'Bei Buchhaltungsfragen wenden Sie sich an unser Concierge-Team.',
    cta: 'Quittung herunterladen',
  },
  it: {
    subject: 'La tua ricevuta di pagamento Goldsainte',
    title: 'La tua ricevuta di pagamento Goldsainte',
    headline: 'Pagamento ricevuto.',
    tagline: 'Una ricevuta formale per i tuoi archivi.',
    lede: (a, t) => `Abbiamo elaborato con successo il tuo pagamento di ${a} per ${t}. Questo documento è la tua ricevuta ufficiale della transazione.`,
    step1: 'Il tuo pagamento va in sicurezza al tuo specialista, il venditore registrato.',
    step2: 'Una ricevuta PDF completa è disponibile nella tua dashboard.',
    step3: 'Tutte le transazioni sono protette dalla Promessa Goldsainte.',
    step4: 'Gli eventuali rimborsi seguono i termini di cancellazione del tuo contratto.',
    step5: 'Per domande contabili, contatta il nostro team concierge.',
    cta: 'Scarica ricevuta',
  },
  pt: {
    subject: 'Seu recibo de pagamento Goldsainte',
    title: 'Seu recibo de pagamento Goldsainte',
    headline: 'Pagamento recebido.',
    tagline: 'Um recibo formal para seus registros.',
    lede: (a, t) => `Processamos com sucesso seu pagamento de ${a} por ${t}. Este documento é seu recibo oficial da transação.`,
    step1: 'Seu pagamento vai com segurança para seu especialista, o vendedor registrado.',
    step2: 'Um recibo completo em PDF está disponível no seu painel.',
    step3: 'Todas as transações são protegidas pela Promessa Goldsainte.',
    step4: 'Reembolsos, quando aplicáveis, seguem os termos de cancelamento do seu contrato.',
    step5: 'Para dúvidas contábeis, fale com nossa equipe de concierge.',
    cta: 'Baixar recibo',
  },
  ar: {
    subject: 'إيصال دفعك من Goldsainte',
    title: 'إيصال دفعك من Goldsainte',
    headline: 'تم استلام الدفعة.',
    tagline: 'إيصال رسمي لسجلاتك.',
    lede: (a, t) => `عالجنا بنجاح دفعتك بقيمة ${a} عن ${t}. يُعد هذا إيصالك الرسمي للمعاملة.`,
    step1: 'تذهب دفعتك بأمان إلى مختصك، البائع المسجّل.',
    step2: 'إيصال PDF كامل متاح في لوحتك.',
    step3: 'كل المعاملات محمية بوعد Goldsainte.',
    step4: 'تخضع المبالغ المستردة، إن وجدت، لشروط الإلغاء في عقدك.',
    step5: 'للأسئلة المحاسبية، تواصل مع فريق الكونسيرج لدينا.',
    cta: 'نزّل الإيصال',
  },
  ja: {
    subject: 'Goldsainte お支払い領収書',
    title: 'Goldsainte お支払い領収書',
    headline: 'お支払いを受領しました。',
    tagline: '記録用の正式な領収書です。',
    lede: (a, t) => `「${t}」への ${a} のお支払いを正常に処理しました。本メールがこの取引の正式な領収書となります。`,
    step1: 'お支払いは、正式な販売者であるスペシャリストへ安全に送られます。',
    step2: '完全な領収書 PDF はダッシュボードで入手できます。',
    step3: 'すべての取引は Goldsainte プロミスで保護されています。',
    step4: '返金がある場合は、契約のキャンセル条件に従います。',
    step5: '経理に関するご質問はコンシェルジュチームへ。',
    cta: '領収書をダウンロード',
  },
  ko: {
    subject: 'Goldsainte 결제 영수증',
    title: 'Goldsainte 결제 영수증',
    headline: '결제가 완료되었습니다.',
    tagline: '보관용 정식 영수증입니다.',
    lede: (a, t) => `${t}에 대한 ${a} 결제가 정상 처리되었습니다. 본 메일이 이 거래의 공식 영수증입니다.`,
    step1: '결제 금액은 등록 판매자인 전문가에게 안전하게 전달됩니다.',
    step2: '전체 영수증 PDF는 대시보드에서 받을 수 있습니다.',
    step3: '모든 거래는 Goldsainte 약속으로 보호됩니다.',
    step4: '환불이 발생하는 경우 계약의 취소 조건을 따릅니다.',
    step5: '회계 관련 문의는 컨시어지 팀에 연락해 주세요.',
    cta: '영수증 다운로드',
  },
  zh: {
    subject: '你的 Goldsainte 付款收据',
    title: '你的 Goldsainte 付款收据',
    headline: '已收到付款。',
    tagline: '一份供你留存的正式收据。',
    lede: (a, t) => `我们已成功处理你为「${t}」支付的 ${a}。本邮件即为此次交易的正式收据。`,
    step1: '你的付款安全支付给你的专家 — 本次交易的登记卖方。',
    step2: '完整的 PDF 收据可在你的面板中下载。',
    step3: '所有交易均受 Goldsainte 承诺保护。',
    step4: '如需退款，将按照合同中的取消条款执行。',
    step5: '如有财务问题，请联系我们的礼宾团队。',
    cta: '下载收据',
  },
}

export const PaymentReceiptEmail = ({ amount, bookingId, tripName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(amount ?? '', tripName ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/bookings/${bookingId ?? ''}` }}
    />
  )
}

export const template = {
  component: PaymentReceiptEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Payment Receipt',
  previewData: { amount: 'USD 12,500.00', tripName: 'Amalfi in Bloom', bookingId: 'b-789' },
} satisfies TemplateEntry
