/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'

export interface ReplyNotificationEmailProps {
  senderName: string
  tripTitle: string
  preview: string
  confirmationUrl: string // magic link — signs the traveller in and opens the conversation
  lang?: EmailLang
}

interface S {
  title: (sender: string) => string
  headline: (sender: string) => string
  tagline: (trip: string) => string
  cta: string
  steps: string[]
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { title: (se) => `${se} replied \u2014 Goldsainte`, headline: (se) => `${se} replied.`, tagline: (t) => `A reply to your question about "${t}".`, cta: 'Open conversation', steps: ['Open the conversation to read the full reply and respond.', "You'll be signed in automatically \u2014 no password needed.", 'You can pick the conversation back up any time from this link.'] },
  fr: { title: (se) => `${se} a répondu \u2014 Goldsainte`, headline: (se) => `${se} a répondu.`, tagline: (t) => `Une réponse à votre question sur \u00AB ${t} \u00BB.`, cta: 'Ouvrir la conversation', steps: ['Ouvrez la conversation pour lire la réponse complète et y répondre.', 'Vous serez connecté automatiquement \u2014 sans mot de passe.', 'Vous pouvez reprendre la conversation à tout moment depuis ce lien.'] },
  es: { title: (se) => `${se} respondió \u2014 Goldsainte`, headline: (se) => `${se} respondió.`, tagline: (t) => `Una respuesta a tu pregunta sobre "${t}".`, cta: 'Abrir conversación', steps: ['Abre la conversación para leer la respuesta completa y contestar.', 'Entrarás automáticamente \u2014 sin contraseña.', 'Puedes retomar la conversación cuando quieras desde este enlace.'] },
  de: { title: (se) => `${se} hat geantwortet \u2014 Goldsainte`, headline: (se) => `${se} hat geantwortet.`, tagline: (t) => `Eine Antwort auf Ihre Frage zu \u201E${t}\u201C.`, cta: 'Konversation öffnen', steps: ['Öffnen Sie die Konversation, um die volle Antwort zu lesen und zu antworten.', 'Sie werden automatisch angemeldet \u2014 ohne Passwort.', 'Über diesen Link können Sie die Konversation jederzeit fortsetzen.'] },
  it: { title: (se) => `${se} ha risposto \u2014 Goldsainte`, headline: (se) => `${se} ha risposto.`, tagline: (t) => `Una risposta alla tua domanda su "${t}".`, cta: 'Apri la conversazione', steps: ['Apri la conversazione per leggere la risposta completa e rispondere.', 'Accederai automaticamente \u2014 senza password.', 'Puoi riprendere la conversazione in qualsiasi momento da questo link.'] },
  pt: { title: (se) => `${se} respondeu \u2014 Goldsainte`, headline: (se) => `${se} respondeu.`, tagline: (t) => `Uma resposta à sua pergunta sobre "${t}".`, cta: 'Abrir conversa', steps: ['Abra a conversa para ler a resposta completa e responder.', 'Você entrará automaticamente \u2014 sem senha.', 'Você pode retomar a conversa a qualquer momento por este link.'] },
  ar: { title: (se) => `رد ${se} \u2014 Goldsainte`, headline: (se) => `رد ${se}.`, tagline: (t) => `رد على سؤالك عن "${t}".`, cta: 'افتح المحادثة', steps: ['افتح المحادثة لقراءة الرد كاملاً والرد عليه.', 'ستسجل الدخول تلقائياً \u2014 بلا كلمة مرور.', 'يمكنك متابعة المحادثة في أي وقت من هذا الرابط.'] },
  ja: { title: (se) => `${se} が返信 \u2014 Goldsainte`, headline: (se) => `${se} が返信しました。`, tagline: (t) => `「${t}」についての質問への返信です。`, cta: '会話を開く', steps: ['会話を開いて返信全文を読み、返事をしましょう。', 'パスワード不要で自動的にサインインされます。', 'このリンクからいつでも会話を再開できます。'] },
  ko: { title: (se) => `${se} 답장 \u2014 Goldsainte`, headline: (se) => `${se}님이 답했습니다.`, tagline: (t) => `"${t}"에 대한 질문의 답장입니다.`, cta: '대화 열기', steps: ['대화를 열어 전체 답장을 읽고 답하세요.', '비밀번호 없이 자동으로 로그인됩니다.', '이 링크로 언제든 대화를 이어갈 수 있습니다.'] },
  zh: { title: (se) => `${se} 已回复 \u2014 Goldsainte`, headline: (se) => `${se} 回复了。`, tagline: (t) => `关于「${t}」提问的回复。`, cta: '打开会话', steps: ['打开会话阅读完整回复并作答。', '无需密码 \u2014 自动登录。', '你可以随时通过此链接继续会话。'] },
}

export const ReplyNotificationEmail = ({
  senderName,
  tripTitle,
  preview,
  confirmationUrl,
  lang,
}: ReplyNotificationEmailProps) => {
  const s = pickLang(STRINGS, lang ?? 'en')
  return (
    <AuthEmailLayout
      title={s.title(senderName)}
      headline={s.headline(senderName)}
      tagline={s.tagline(tripTitle)}
      lede={`"${preview}"`}
      cta={{ label: s.cta, url: confirmationUrl }}
      steps={s.steps}
    />
  )
}

export default ReplyNotificationEmail
