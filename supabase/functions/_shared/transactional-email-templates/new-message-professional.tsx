/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  conversationId?: string
  senderName?: string
  lang?: EmailLang
}

interface S {
  subject: (sender: string) => string
  title: (sender: string) => string
  headline: string
  tagline: (sender: string) => string
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
    subject: (s) => `New message from ${s}`,
    title: (s) => `New message from ${s}`,
    headline: 'You have a new message.',
    tagline: (s) => `${s} has sent you a private message.`,
    lede: 'A new message is waiting in your Goldsainte inbox. All conversations remain securely on-platform to protect both parties.',
    step1: 'Open the thread to read the full message.',
    step2: 'Reply directly within your dashboard.',
    step3: 'All communication must stay on-platform per our Terms.',
    step4: 'Attachments and proposals are saved automatically.',
    step5: 'Aim to respond within 24 hours for best results.',
    cta: 'Open conversation',
  },
  fr: {
    subject: (s) => `Nouveau message de ${s}`,
    title: (s) => `Nouveau message de ${s}`,
    headline: 'Vous avez un nouveau message.',
    tagline: (s) => `${s} vous a envoyé un message privé.`,
    lede: 'Un nouveau message vous attend dans votre boîte Goldsainte. Toutes les conversations restent en sécurité sur la plateforme pour protéger les deux parties.',
    step1: 'Ouvrez le fil pour lire le message complet.',
    step2: 'Répondez directement depuis votre tableau de bord.',
    step3: 'Toute communication doit rester sur la plateforme, conformément à nos Conditions.',
    step4: 'Pièces jointes et propositions sont enregistrées automatiquement.',
    step5: 'Visez une réponse sous 24 heures pour de meilleurs résultats.',
    cta: 'Ouvrir la conversation',
  },
  es: {
    subject: (s) => `Nuevo mensaje de ${s}`,
    title: (s) => `Nuevo mensaje de ${s}`,
    headline: 'Tienes un mensaje nuevo.',
    tagline: (s) => `${s} te ha enviado un mensaje privado.`,
    lede: 'Un nuevo mensaje te espera en tu bandeja de Goldsainte. Todas las conversaciones permanecen seguras en la plataforma para proteger a ambas partes.',
    step1: 'Abre el hilo para leer el mensaje completo.',
    step2: 'Responde directamente desde tu panel.',
    step3: 'Toda comunicación debe permanecer en la plataforma según nuestros Términos.',
    step4: 'Adjuntos y propuestas se guardan automáticamente.',
    step5: 'Intenta responder en 24 horas para mejores resultados.',
    cta: 'Abrir conversación',
  },
  de: {
    subject: (s) => `Neue Nachricht von ${s}`,
    title: (s) => `Neue Nachricht von ${s}`,
    headline: 'Sie haben eine neue Nachricht.',
    tagline: (s) => `${s} hat Ihnen eine private Nachricht gesendet.`,
    lede: 'Eine neue Nachricht wartet in Ihrem Goldsainte-Postfach. Alle Gespräche bleiben zum Schutz beider Parteien sicher auf der Plattform.',
    step1: 'Öffnen Sie den Thread, um die vollständige Nachricht zu lesen.',
    step2: 'Antworten Sie direkt in Ihrem Dashboard.',
    step3: 'Sämtliche Kommunikation muss gemäß unseren Bedingungen auf der Plattform bleiben.',
    step4: 'Anhänge und Angebote werden automatisch gespeichert.',
    step5: 'Antworten Sie möglichst innerhalb von 24 Stunden.',
    cta: 'Konversation öffnen',
  },
  it: {
    subject: (s) => `Nuovo messaggio da ${s}`,
    title: (s) => `Nuovo messaggio da ${s}`,
    headline: 'Hai un nuovo messaggio.',
    tagline: (s) => `${s} ti ha inviato un messaggio privato.`,
    lede: 'Un nuovo messaggio ti aspetta nella tua casella Goldsainte. Tutte le conversazioni restano al sicuro sulla piattaforma per proteggere entrambe le parti.',
    step1: 'Apri la conversazione per leggere il messaggio completo.',
    step2: 'Rispondi direttamente dalla tua dashboard.',
    step3: 'Tutta la comunicazione deve restare sulla piattaforma, come da Termini.',
    step4: 'Allegati e proposte vengono salvati automaticamente.',
    step5: 'Cerca di rispondere entro 24 ore per i migliori risultati.',
    cta: 'Apri conversazione',
  },
  pt: {
    subject: (s) => `Nova mensagem de ${s}`,
    title: (s) => `Nova mensagem de ${s}`,
    headline: 'Você tem uma nova mensagem.',
    tagline: (s) => `${s} enviou uma mensagem privada para você.`,
    lede: 'Uma nova mensagem espera na sua caixa Goldsainte. Todas as conversas ficam seguras na plataforma para proteger ambas as partes.',
    step1: 'Abra a conversa para ler a mensagem completa.',
    step2: 'Responda direto pelo seu painel.',
    step3: 'Toda comunicação deve permanecer na plataforma, conforme nossos Termos.',
    step4: 'Anexos e propostas são salvos automaticamente.',
    step5: 'Procure responder em até 24 horas para melhores resultados.',
    cta: 'Abrir conversa',
  },
  ar: {
    subject: (s) => `رسالة جديدة من ${s}`,
    title: (s) => `رسالة جديدة من ${s}`,
    headline: 'لديك رسالة جديدة.',
    tagline: (s) => `أرسل لك ${s} رسالة خاصة.`,
    lede: 'رسالة جديدة بانتظارك في بريد Goldsainte. تبقى كل المحادثات آمنة على المنصة لحماية الطرفين.',
    step1: 'افتح المحادثة لقراءة الرسالة كاملة.',
    step2: 'رد مباشرة من لوحتك.',
    step3: 'يجب أن يبقى كل التواصل على المنصة وفق شروطنا.',
    step4: 'تُحفظ المرفقات والعروض تلقائياً.',
    step5: 'احرص على الرد خلال 24 ساعة لأفضل النتائج.',
    cta: 'افتح المحادثة',
  },
  ja: {
    subject: (s) => `${s} さんから新着メッセージ`,
    title: (s) => `${s} さんから新着メッセージ`,
    headline: '新しいメッセージがあります。',
    tagline: (s) => `${s} さんからプライベートメッセージが届きました。`,
    lede: 'Goldsainte の受信箱に新しいメッセージが届いています。双方を守るため、会話はすべてプラットフォーム上で安全に保たれます。',
    step1: 'スレッドを開いてメッセージ全文を読みましょう。',
    step2: 'ダッシュボードから直接返信できます。',
    step3: '規約に従い、連絡はすべてプラットフォーム上で行ってください。',
    step4: '添付ファイルと提案は自動的に保存されます。',
    step5: '最良の結果のため、24時間以内の返信を心がけましょう。',
    cta: '会話を開く',
  },
  ko: {
    subject: (s) => `${s}님의 새 메시지`,
    title: (s) => `${s}님의 새 메시지`,
    headline: '새 메시지가 있습니다.',
    tagline: (s) => `${s}님이 비공개 메시지를 보냈습니다.`,
    lede: 'Goldsainte 받은편지함에 새 메시지가 기다리고 있습니다. 양측 보호를 위해 모든 대화는 플랫폼 안에서 안전하게 유지됩니다.',
    step1: '대화를 열어 전체 메시지를 읽으세요.',
    step2: '대시보드에서 바로 답장하세요.',
    step3: '약관에 따라 모든 소통은 플랫폼 안에 있어야 합니다.',
    step4: '첨부 파일과 제안은 자동으로 저장됩니다.',
    step5: '최상의 결과를 위해 24시간 안에 응답하세요.',
    cta: '대화 열기',
  },
  zh: {
    subject: (s) => `来自 ${s} 的新消息`,
    title: (s) => `来自 ${s} 的新消息`,
    headline: '你有一条新消息。',
    tagline: (s) => `${s} 给你发来了一条私信。`,
    lede: '一条新消息正在你的 Goldsainte 收件箱中等候。为保护双方，所有对话都安全地留在平台内。',
    step1: '打开会话，阅读完整消息。',
    step2: '直接在面板中回复。',
    step3: '按照条款，所有沟通必须留在平台内。',
    step4: '附件与提案会自动保存。',
    step5: '尽量在 24 小时内回复，效果最佳。',
    cta: '打开会话',
  },
}

export const NewMessageProfessionalEmail = ({ conversationId, senderName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title(senderName ?? '')}
      headline={s.headline}
      tagline={s.tagline(senderName ?? '')}
      lede={s.lede}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/messages?conversation=${conversationId ?? ''}` }}
    />
  )
}

export const template = {
  component: NewMessageProfessionalEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject(data?.senderName ?? ''),
  displayName: 'New Message — Specialist',
  previewData: { senderName: 'Alexandra', conversationId: 'c-321' },
} satisfies TemplateEntry
