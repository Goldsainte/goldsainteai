/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'

export interface TripInquiryEmailProps {
  siteName: string
  confirmationUrl: string   // magic link — signs the traveller in and opens the conversation
  hostName: string
  tripTitle: string
  question: string
  lang?: EmailLang
}

interface S {
  title: (host: string) => string
  headline: string
  tagline: (trip: string, host: string) => string
  lede: (question: string) => string
  cta: string
  step1: (host: string) => string
  step2: string
  step3: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { title: (h) => `Your question is on its way to ${h} \u2014 Goldsainte`, headline: 'Your question is on its way.', tagline: (t, h) => `We've sent your question about "${t}" to ${h}.`, lede: (q) => `Here's what you asked:\n\n"${q}"`, cta: 'Open the conversation', step1: (h) => `Your question is with ${h} \u2014 they'll reply as soon as possible.`, step2: "Open the conversation to follow it \u2014 you'll be signed in automatically, no password needed.", step3: 'You can reply and pick up the conversation any time from this link.' },
  fr: { title: (h) => `Votre question est en route vers ${h} \u2014 Goldsainte`, headline: 'Votre question est en route.', tagline: (t, h) => `Nous avons transmis votre question sur \u00AB ${t} \u00BB à ${h}.`, lede: (q) => `Voici votre question :\n\n\u00AB ${q} \u00BB`, cta: 'Ouvrir la conversation', step1: (h) => `Votre question est entre les mains de ${h} \u2014 une réponse arrivera dès que possible.`, step2: 'Ouvrez la conversation pour la suivre \u2014 vous serez connecté automatiquement, sans mot de passe.', step3: "Vous pouvez répondre et reprendre la conversation à tout moment depuis ce lien." },
  es: { title: (h) => `Tu pregunta va de camino a ${h} \u2014 Goldsainte`, headline: 'Tu pregunta va de camino.', tagline: (t, h) => `Hemos enviado tu pregunta sobre "${t}" a ${h}.`, lede: (q) => `Esto es lo que preguntaste:\n\n"${q}"`, cta: 'Abrir la conversación', step1: (h) => `Tu pregunta está con ${h} \u2014 responderá lo antes posible.`, step2: 'Abre la conversación para seguirla \u2014 entrarás automáticamente, sin contraseña.', step3: 'Puedes responder y retomar la conversación cuando quieras desde este enlace.' },
  de: { title: (h) => `Ihre Frage ist unterwegs zu ${h} \u2014 Goldsainte`, headline: 'Ihre Frage ist unterwegs.', tagline: (t, h) => `Wir haben Ihre Frage zu \u201E${t}\u201C an ${h} gesendet.`, lede: (q) => `Das haben Sie gefragt:\n\n\u201E${q}\u201C`, cta: 'Konversation öffnen', step1: (h) => `Ihre Frage liegt bei ${h} \u2014 eine Antwort kommt so bald wie möglich.`, step2: 'Öffnen Sie die Konversation, um zu folgen \u2014 Sie werden automatisch angemeldet, ohne Passwort.', step3: 'Über diesen Link können Sie jederzeit antworten und die Konversation fortsetzen.' },
  it: { title: (h) => `La tua domanda è in viaggio verso ${h} \u2014 Goldsainte`, headline: 'La tua domanda è in viaggio.', tagline: (t, h) => `Abbiamo inviato la tua domanda su "${t}" a ${h}.`, lede: (q) => `Ecco cosa hai chiesto:\n\n"${q}"`, cta: 'Apri la conversazione', step1: (h) => `La tua domanda è con ${h} \u2014 risponderà appena possibile.`, step2: "Apri la conversazione per seguirla \u2014 accederai automaticamente, senza password.", step3: 'Puoi rispondere e riprendere la conversazione in qualsiasi momento da questo link.' },
  pt: { title: (h) => `Sua pergunta está a caminho de ${h} \u2014 Goldsainte`, headline: 'Sua pergunta está a caminho.', tagline: (t, h) => `Enviamos sua pergunta sobre "${t}" para ${h}.`, lede: (q) => `Foi isto que você perguntou:\n\n"${q}"`, cta: 'Abrir a conversa', step1: (h) => `Sua pergunta está com ${h} \u2014 a resposta chega assim que possível.`, step2: 'Abra a conversa para acompanhar \u2014 você entrará automaticamente, sem senha.', step3: 'Você pode responder e retomar a conversa a qualquer momento por este link.' },
  ar: { title: (h) => `سؤالك في طريقه إلى ${h} \u2014 Goldsainte`, headline: 'سؤالك في طريقه.', tagline: (t, h) => `أرسلنا سؤالك عن "${t}" إلى ${h}.`, lede: (q) => `هذا ما سألته:\n\n"${q}"`, cta: 'افتح المحادثة', step1: (h) => `سؤالك لدى ${h} \u2014 سيرد في أقرب وقت ممكن.`, step2: 'افتح المحادثة لمتابعتها \u2014 ستسجل الدخول تلقائياً دون كلمة مرور.', step3: 'يمكنك الرد ومتابعة المحادثة في أي وقت من هذا الرابط.' },
  ja: { title: (h) => `質問が ${h} に向かっています \u2014 Goldsainte`, headline: '質問が届けられています。', tagline: (t, h) => `「${t}」についての質問を ${h} に送りました。`, lede: (q) => `質問内容：\n\n「${q}」`, cta: '会話を開く', step1: (h) => `質問は ${h} の手元にあります \u2014 できるだけ早く返信があります。`, step2: '会話を開いてフォローしましょう \u2014 パスワード不要で自動的にサインインされます。', step3: 'このリンクからいつでも返信し、会話を再開できます。' },
  ko: { title: (h) => `질문이 ${h}에게 전달 중입니다 \u2014 Goldsainte`, headline: '질문이 전달되고 있습니다.', tagline: (t, h) => `"${t}"에 대한 질문을 ${h}에게 보냈습니다.`, lede: (q) => `질문 내용:\n\n"${q}"`, cta: '대화 열기', step1: (h) => `질문이 ${h}에게 전달되었습니다 \u2014 최대한 빨리 답변할 것입니다.`, step2: '대화를 열어 확인하세요 \u2014 비밀번호 없이 자동으로 로그인됩니다.', step3: '이 링크로 언제든 답장하고 대화를 이어갈 수 있습니다.' },
  zh: { title: (h) => `你的问题正在送达 ${h} \u2014 Goldsainte`, headline: '你的问题正在路上。', tagline: (t, h) => `我们已将你关于「${t}」的问题发送给 ${h}。`, lede: (q) => `你的提问内容：\n\n「${q}」`, cta: '打开会话', step1: (h) => `你的问题已交给 ${h} \u2014 对方会尽快回复。`, step2: '打开会话即可跟进 \u2014 无需密码，自动登录。', step3: '你可以随时通过此链接回复并继续会话。' },
}

export const TripInquiryEmail = ({
  confirmationUrl,
  hostName,
  tripTitle,
  question,
  lang,
}: TripInquiryEmailProps) => {
  const s = pickLang(STRINGS, lang ?? 'en')
  return (
    <AuthEmailLayout
      title={s.title(hostName)}
      headline={s.headline}
      tagline={s.tagline(tripTitle, hostName)}
      lede={s.lede(question)}
      cta={{ label: s.cta, url: confirmationUrl }}
      steps={[s.step1(hostName), s.step2, s.step3]}
    />
  )
}

export default TripInquiryEmail
