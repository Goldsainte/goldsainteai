/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  proposalId?: string
  specialistName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: (specialist: string) => string
  lede: string
  step1: string
  step2: string
  step3: (specialist: string) => string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'A new proposal has arrived',
    title: 'A new proposal has arrived',
    headline: 'A bespoke proposal awaits.',
    tagline: (sp) => `${sp} has crafted a private proposal in response to your trip request.`,
    lede: "Review the itinerary, pricing, and inclusions in your dashboard. You may compare it alongside any other proposals you've received before deciding.",
    step1: 'Review the full itinerary, day-by-day inclusions, and total investment.',
    step2: 'Compare with other proposals received for the same request.',
    step3: (sp) => `Message ${sp} directly with questions or refinements.`,
    step4: 'Accept to proceed — your deposit is paid securely through Stripe to your specialist.',
    step5: 'All communication and payment must remain on-platform per our Trust & Safety policy.',
    cta: 'Review proposal',
  },
  fr: {
    subject: 'Une nouvelle proposition est arrivée',
    title: 'Une nouvelle proposition est arrivée',
    headline: 'Une proposition sur mesure vous attend.',
    tagline: (sp) => `${sp} a conçu une proposition privée en réponse à votre demande de voyage.`,
    lede: "Consultez l'itinéraire, les tarifs et les prestations dans votre tableau de bord. Vous pouvez la comparer aux autres propositions reçues avant de décider.",
    step1: "Examinez l'itinéraire complet, les prestations jour par jour et l'investissement total.",
    step2: 'Comparez avec les autres propositions reçues pour la même demande.',
    step3: (sp) => `Écrivez directement à ${sp} pour vos questions ou ajustements.`,
    step4: 'Acceptez pour continuer — votre acompte est versé en toute sécurité via Stripe à votre spécialiste.',
    step5: 'Toute communication et tout paiement doivent rester sur la plateforme, conformément à notre politique de confiance et sécurité.',
    cta: 'Voir la proposition',
  },
  es: {
    subject: 'Ha llegado una nueva propuesta',
    title: 'Ha llegado una nueva propuesta',
    headline: 'Te espera una propuesta a medida.',
    tagline: (sp) => `${sp} ha elaborado una propuesta privada en respuesta a tu solicitud de viaje.`,
    lede: 'Revisa el itinerario, los precios y lo incluido en tu panel. Puedes compararla con otras propuestas recibidas antes de decidir.',
    step1: 'Revisa el itinerario completo, lo incluido día a día y la inversión total.',
    step2: 'Compárala con otras propuestas recibidas para la misma solicitud.',
    step3: (sp) => `Escribe directamente a ${sp} con preguntas o ajustes.`,
    step4: 'Acepta para continuar — tu depósito se paga de forma segura por Stripe a tu especialista.',
    step5: 'Toda comunicación y pago deben permanecer en la plataforma según nuestra política de confianza y seguridad.',
    cta: 'Ver propuesta',
  },
  de: {
    subject: 'Ein neues Angebot ist eingetroffen',
    title: 'Ein neues Angebot ist eingetroffen',
    headline: 'Ein maßgeschneidertes Angebot wartet.',
    tagline: (sp) => `${sp} hat als Antwort auf Ihre Reiseanfrage ein privates Angebot erstellt.`,
    lede: 'Prüfen Sie Reiseplan, Preise und Leistungen in Ihrem Dashboard. Vor Ihrer Entscheidung können Sie es mit anderen erhaltenen Angeboten vergleichen.',
    step1: 'Prüfen Sie den vollständigen Reiseplan, die täglichen Leistungen und die Gesamtinvestition.',
    step2: 'Vergleichen Sie mit anderen Angeboten zur selben Anfrage.',
    step3: (sp) => `Schreiben Sie ${sp} direkt bei Fragen oder Anpassungen.`,
    step4: 'Akzeptieren Sie, um fortzufahren — Ihre Anzahlung geht sicher über Stripe an Ihren Spezialisten.',
    step5: 'Sämtliche Kommunikation und Zahlungen müssen gemäß unserer Trust-&-Safety-Richtlinie auf der Plattform bleiben.',
    cta: 'Angebot ansehen',
  },
  it: {
    subject: 'È arrivata una nuova proposta',
    title: 'È arrivata una nuova proposta',
    headline: 'Ti attende una proposta su misura.',
    tagline: (sp) => `${sp} ha preparato una proposta privata in risposta alla tua richiesta di viaggio.`,
    lede: "Esamina itinerario, prezzi e inclusioni nella tua dashboard. Puoi confrontarla con le altre proposte ricevute prima di decidere.",
    step1: "Esamina l'itinerario completo, le inclusioni giorno per giorno e l'investimento totale.",
    step2: 'Confrontala con le altre proposte ricevute per la stessa richiesta.',
    step3: (sp) => `Scrivi direttamente a ${sp} per domande o modifiche.`,
    step4: "Accetta per procedere — l'acconto viene versato in sicurezza via Stripe al tuo specialista.",
    step5: 'Tutta la comunicazione e i pagamenti devono restare sulla piattaforma, come da politica Trust & Safety.',
    cta: 'Vedi proposta',
  },
  pt: {
    subject: 'Chegou uma nova proposta',
    title: 'Chegou uma nova proposta',
    headline: 'Uma proposta sob medida espera por você.',
    tagline: (sp) => `${sp} criou uma proposta privada em resposta ao seu pedido de viagem.`,
    lede: 'Revise o roteiro, os preços e o que está incluído no seu painel. Você pode compará-la com outras propostas recebidas antes de decidir.',
    step1: 'Revise o roteiro completo, as inclusões dia a dia e o investimento total.',
    step2: 'Compare com outras propostas recebidas para o mesmo pedido.',
    step3: (sp) => `Fale diretamente com ${sp} para perguntas ou ajustes.`,
    step4: 'Aceite para prosseguir — seu depósito é pago com segurança pelo Stripe ao seu especialista.',
    step5: 'Toda comunicação e pagamento devem permanecer na plataforma, conforme nossa política de confiança e segurança.',
    cta: 'Ver proposta',
  },
  ar: {
    subject: 'وصل عرض جديد',
    title: 'وصل عرض جديد',
    headline: 'بانتظارك عرض مصمم خصيصاً.',
    tagline: (sp) => `أعد ${sp} عرضاً خاصاً استجابة لطلب رحلتك.`,
    lede: 'راجع المسار والأسعار والمشمولات في لوحتك. يمكنك مقارنته بعروض أخرى استلمتها قبل أن تقرر.',
    step1: 'راجع المسار الكامل والمشمولات اليومية وإجمالي الاستثمار.',
    step2: 'قارن مع العروض الأخرى المستلمة لنفس الطلب.',
    step3: (sp) => `راسل ${sp} مباشرة للأسئلة أو التعديلات.`,
    step4: 'اقبل للمتابعة — يُدفع عربونك بأمان عبر Stripe إلى مختصك.',
    step5: 'يجب أن يبقى كل التواصل والدفع على المنصة وفق سياسة الثقة والأمان.',
    cta: 'راجع العرض',
  },
  ja: {
    subject: '新しい提案が届きました',
    title: '新しい提案が届きました',
    headline: 'オーダーメイドの提案が届いています。',
    tagline: (sp) => `${sp} が、あなたの旅のリクエストに応えてプライベートな提案を作成しました。`,
    lede: 'ダッシュボードで旅程・料金・含まれる内容をご確認ください。決める前に、受け取った他の提案と比較できます。',
    step1: '旅程全体、日ごとの内容、総額を確認しましょう。',
    step2: '同じリクエストに届いた他の提案と比較しましょう。',
    step3: (sp) => `質問や調整は ${sp} に直接メッセージを。`,
    step4: '承諾して進めましょう — デポジットは Stripe 経由でスペシャリストに安全に支払われます。',
    step5: 'トラスト＆セーフティ方針により、連絡と支払いはすべてプラットフォーム上で行ってください。',
    cta: '提案を確認',
  },
  ko: {
    subject: '새 제안이 도착했습니다',
    title: '새 제안이 도착했습니다',
    headline: '맞춤 제안이 기다리고 있습니다.',
    tagline: (sp) => `${sp}님이 여행 요청에 맞춰 프라이빗 제안을 준비했습니다.`,
    lede: '대시보드에서 일정, 가격, 포함 사항을 확인하세요. 결정 전에 받은 다른 제안들과 비교할 수 있습니다.',
    step1: '전체 일정, 일자별 포함 사항, 총 비용을 확인하세요.',
    step2: '같은 요청으로 받은 다른 제안들과 비교하세요.',
    step3: (sp) => `질문이나 조정 사항은 ${sp}님에게 직접 메시지하세요.`,
    step4: '수락하면 진행됩니다 — 계약금은 Stripe를 통해 전문가에게 안전하게 지급됩니다.',
    step5: '신뢰와 안전 정책에 따라 모든 소통과 결제는 플랫폼 안에서 이루어져야 합니다.',
    cta: '제안 확인하기',
  },
  zh: {
    subject: '新提案已送达',
    title: '新提案已送达',
    headline: '一份专属提案正等着你。',
    tagline: (sp) => `${sp} 针对你的旅行需求制作了一份私享提案。`,
    lede: '在面板中查看行程、价格与包含内容。决定之前，你可以将它与收到的其他提案对比。',
    step1: '查看完整行程、每日包含内容与总花费。',
    step2: '与同一需求收到的其他提案进行对比。',
    step3: (sp) => `有问题或需要调整？直接给 ${sp} 发消息。`,
    step4: '接受即可继续 — 订金将通过 Stripe 安全支付给你的专家。',
    step5: '根据信任与安全政策，所有沟通与支付必须留在平台内。',
    cta: '查看提案',
  },
}

export const NewProposalReceivedEmail = ({ proposalId, specialistName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline(specialistName ?? '')}
      lede={s.lede}
      steps={[s.step1, s.step2, s.step3(specialistName ?? ''), s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/proposals/${proposalId ?? ''}` }}
    />
  )
}

export const template = {
  component: NewProposalReceivedEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'New Proposal Received',
  previewData: { specialistName: 'Maison Atelier', proposalId: 'p-456' },
} satisfies TemplateEntry
