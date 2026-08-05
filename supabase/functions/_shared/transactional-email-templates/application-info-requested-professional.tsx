/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface ApplicationInfoRequestedProps {
  recipientName?: string
  applicationId?: string
  adminNotes?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headlineNamed: (name: string) => string
  headline: string
  tagline: string
  ledeWithNotes: (notes: string) => string
  lede: string
  step1: string
  step2: string
  step3: string
  step4: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Additional information needed for your Goldsainte application',
    title: 'We need a little more information',
    headlineNamed: (n) => `A quick request, ${n}.`,
    headline: 'A quick request.',
    tagline: "A curated marketplace of the world's most trusted travel specialists, creators, and brands.",
    ledeWithNotes: (n) => `Our reviewers need a little more information before we can complete your application: "${n}"`,
    lede: 'Our reviewers need a little more information before we can complete your application. Please update your submission at your earliest convenience.',
    step1: 'Open your application using the button below.',
    step2: 'Provide the requested information or supporting documents.',
    step3: 'Resubmit \u2014 your application returns to active review within 24\u201348 hours.',
    step4: 'Questions? Reply to this email or write to support@goldsainte.ai.',
    cta: 'Update your application',
  },
  fr: {
    subject: 'Informations supplémentaires requises pour votre candidature Goldsainte',
    title: 'Il nous faut quelques informations de plus',
    headlineNamed: (n) => `Une petite demande, ${n}.`,
    headline: 'Une petite demande.',
    tagline: 'Une place de marché soignée réunissant les spécialistes du voyage, créateurs et marques les plus fiables au monde.',
    ledeWithNotes: (n) => `Nos examinateurs ont besoin d'un complément d'information avant de finaliser votre candidature : \u00AB ${n} \u00BB`,
    lede: "Nos examinateurs ont besoin d'un complément d'information avant de finaliser votre candidature. Merci de mettre à jour votre dossier dès que possible.",
    step1: 'Ouvrez votre candidature via le bouton ci-dessous.',
    step2: 'Fournissez les informations ou documents demandés.',
    step3: 'Renvoyez \u2014 votre candidature repasse en examen actif sous 24 à 48 heures.',
    step4: 'Des questions ? Répondez à cet e-mail ou écrivez à support@goldsainte.ai.',
    cta: 'Mettre à jour la candidature',
  },
  es: {
    subject: 'Se necesita información adicional para tu solicitud de Goldsainte',
    title: 'Necesitamos un poco más de información',
    headlineNamed: (n) => `Una petición rápida, ${n}.`,
    headline: 'Una petición rápida.',
    tagline: 'Un marketplace curado con los especialistas en viajes, creadores y marcas más fiables del mundo.',
    ledeWithNotes: (n) => `Nuestros revisores necesitan algo más de información antes de completar tu solicitud: \u201C${n}\u201D`,
    lede: 'Nuestros revisores necesitan algo más de información antes de completar tu solicitud. Actualiza tu envío en cuanto puedas.',
    step1: 'Abre tu solicitud con el botón de abajo.',
    step2: 'Aporta la información o los documentos solicitados.',
    step3: 'Reenvía \u2014 tu solicitud vuelve a revisión activa en 24\u201348 horas.',
    step4: '¿Preguntas? Responde a este correo o escribe a support@goldsainte.ai.',
    cta: 'Actualizar solicitud',
  },
  de: {
    subject: 'Weitere Informationen für Ihre Goldsainte-Bewerbung benötigt',
    title: 'Wir brauchen noch ein paar Informationen',
    headlineNamed: (n) => `Eine kurze Bitte, ${n}.`,
    headline: 'Eine kurze Bitte.',
    tagline: 'Ein kuratierter Marktplatz der vertrauenswürdigsten Reisespezialisten, Creator und Marken der Welt.',
    ledeWithNotes: (n) => `Unsere Prüfer benötigen noch einige Informationen, bevor wir Ihre Bewerbung abschließen können: \u201E${n}\u201C`,
    lede: 'Unsere Prüfer benötigen noch einige Informationen, bevor wir Ihre Bewerbung abschließen können. Bitte aktualisieren Sie Ihre Einreichung bei Gelegenheit.',
    step1: 'Öffnen Sie Ihre Bewerbung über die Schaltfläche unten.',
    step2: 'Reichen Sie die angeforderten Informationen oder Unterlagen ein.',
    step3: 'Erneut einreichen \u2014 Ihre Bewerbung kehrt innerhalb von 24\u201348 Stunden in die aktive Prüfung zurück.',
    step4: 'Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie an support@goldsainte.ai.',
    cta: 'Bewerbung aktualisieren',
  },
  it: {
    subject: 'Servono altre informazioni per la tua candidatura Goldsainte',
    title: 'Ci servono ancora poche informazioni',
    headlineNamed: (n) => `Una richiesta veloce, ${n}.`,
    headline: 'Una richiesta veloce.',
    tagline: 'Un marketplace curato con gli specialisti di viaggio, i creator e i brand più affidabili al mondo.',
    ledeWithNotes: (n) => `I nostri revisori hanno bisogno di qualche informazione in più per completare la tua candidatura: \u201C${n}\u201D`,
    lede: 'I nostri revisori hanno bisogno di qualche informazione in più per completare la tua candidatura. Aggiorna la tua domanda appena possibile.',
    step1: 'Apri la tua candidatura con il pulsante qui sotto.',
    step2: 'Fornisci le informazioni o i documenti richiesti.',
    step3: 'Reinvia \u2014 la candidatura torna in revisione attiva entro 24\u201348 ore.',
    step4: 'Domande? Rispondi a questa email o scrivi a support@goldsainte.ai.',
    cta: 'Aggiorna candidatura',
  },
  pt: {
    subject: 'Informações adicionais necessárias para sua candidatura Goldsainte',
    title: 'Precisamos de mais algumas informações',
    headlineNamed: (n) => `Um pedido rápido, ${n}.`,
    headline: 'Um pedido rápido.',
    tagline: 'Um marketplace curado com os especialistas em viagens, criadores e marcas mais confiáveis do mundo.',
    ledeWithNotes: (n) => `Nossos avaliadores precisam de mais algumas informações antes de concluir sua candidatura: \u201C${n}\u201D`,
    lede: 'Nossos avaliadores precisam de mais algumas informações antes de concluir sua candidatura. Atualize seu envio assim que puder.',
    step1: 'Abra sua candidatura pelo botão abaixo.',
    step2: 'Forneça as informações ou documentos solicitados.',
    step3: 'Reenvie \u2014 sua candidatura volta à análise ativa em 24\u201348 horas.',
    step4: 'Dúvidas? Responda a este e-mail ou escreva para support@goldsainte.ai.',
    cta: 'Atualizar candidatura',
  },
  ar: {
    subject: 'معلومات إضافية مطلوبة لطلبك في Goldsainte',
    title: 'نحتاج مزيداً من المعلومات',
    headlineNamed: (n) => `طلب سريع يا ${n}.`,
    headline: 'طلب سريع.',
    tagline: 'سوق منتقى يضم أوثق مختصي السفر وصنّاع المحتوى والعلامات في العالم.',
    ledeWithNotes: (n) => `يحتاج مراجعونا مزيداً من المعلومات قبل إكمال طلبك: \u201C${n}\u201D`,
    lede: 'يحتاج مراجعونا مزيداً من المعلومات قبل إكمال طلبك. يرجى تحديث طلبك في أقرب وقت يناسبك.',
    step1: 'افتح طلبك عبر الزر أدناه.',
    step2: 'قدّم المعلومات أو المستندات المطلوبة.',
    step3: 'أعد الإرسال \u2014 يعود طلبك إلى المراجعة النشطة خلال 24\u201348 ساعة.',
    step4: 'أسئلة؟ رد على هذه الرسالة أو راسل support@goldsainte.ai.',
    cta: 'حدّث طلبك',
  },
  ja: {
    subject: 'Goldsainte 申請に追加情報が必要です',
    title: 'もう少しだけ情報が必要です',
    headlineNamed: (n) => `${n} さん、ひとつお願いです。`,
    headline: 'ひとつお願いです。',
    tagline: '世界で最も信頼される旅のスペシャリスト、クリエイター、ブランドを集めた厳選マーケットプレイス。',
    ledeWithNotes: (n) => `申請の完了には、審査チームがもう少し情報を必要としています：\u201C${n}\u201D`,
    lede: '申請の完了には、審査チームがもう少し情報を必要としています。ご都合のつき次第、提出内容を更新してください。',
    step1: '下のボタンから申請を開きます。',
    step2: '求められた情報または書類を提出します。',
    step3: '再提出すると \u2014 24〜48時間以内に審査が再開されます。',
    step4: 'ご質問は？このメールに返信するか support@goldsainte.ai へ。',
    cta: '申請を更新',
  },
  ko: {
    subject: 'Goldsainte 신청에 추가 정보가 필요합니다',
    title: '조금 더 정보가 필요합니다',
    headlineNamed: (n) => `${n}님, 간단한 요청이 있습니다.`,
    headline: '간단한 요청이 있습니다.',
    tagline: '세계에서 가장 신뢰받는 여행 전문가, 크리에이터, 브랜드를 모은 큐레이션 마켓플레이스.',
    ledeWithNotes: (n) => `신청을 완료하려면 심사팀에 조금 더 정보가 필요합니다: \u201C${n}\u201D`,
    lede: '신청을 완료하려면 심사팀에 조금 더 정보가 필요합니다. 가능한 한 빨리 제출 내용을 업데이트해 주세요.',
    step1: '아래 버튼으로 신청서를 여세요.',
    step2: '요청된 정보나 증빙 서류를 제출하세요.',
    step3: '다시 제출하면 \u2014 24~48시간 안에 심사가 재개됩니다.',
    step4: '질문이 있으면 이 메일에 회신하거나 support@goldsainte.ai 로 보내세요.',
    cta: '신청서 업데이트',
  },
  zh: {
    subject: '你的 Goldsainte 申请需要补充信息',
    title: '还需要一点信息',
    headlineNamed: (n) => `${n}，有个小请求。`,
    headline: '有个小请求。',
    tagline: '汇聚全球最值得信赖的旅行专家、创作者与品牌的精选市场。',
    ledeWithNotes: (n) => `审核团队在完成你的申请前还需要一些信息：\u201C${n}\u201D`,
    lede: '审核团队在完成你的申请前还需要一些信息。请尽快更新你的提交内容。',
    step1: '点击下方按钮打开你的申请。',
    step2: '提供所需的信息或证明文件。',
    step3: '重新提交 \u2014 你的申请将在 24\u201348 小时内回到审核中。',
    step4: '有疑问？回复本邮件或写信至 support@goldsainte.ai。',
    cta: '更新申请',
  },
}

export const ApplicationInfoRequestedProfessionalEmail = ({
  recipientName,
  applicationId,
  adminNotes,
  lang,
}: ApplicationInfoRequestedProps) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={recipientName ? s.headlineNamed(recipientName) : s.headline}
      tagline={s.tagline}
      lede={adminNotes ? s.ledeWithNotes(adminNotes) : s.lede}
      steps={[s.step1, s.step2, s.step3, s.step4]}
      cta={{
        label: s.cta,
        url: applicationId
          ? `https://goldsainte.ai/application/status?id=${applicationId}`
          : `https://goldsainte.ai/application/status`,
      }}
    />
  )
}

export const template = {
  component: ApplicationInfoRequestedProfessionalEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Application — info requested',
  previewData: {
    recipientName: 'Jimmy',
    applicationId: 'abc-123',
    adminNotes: 'Please add a copy of your current E&O insurance certificate.',
  },
} satisfies TemplateEntry
