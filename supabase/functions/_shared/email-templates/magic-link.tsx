/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  lang?: EmailLang
}

interface S { title: string; headline: string; tagline: string; lede: string; cta: string; steps: string[] }

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { title: 'Your sign-in link \u2014 Goldsainte', headline: 'Your sign-in link.', tagline: 'One secure link, signed and ready \u2014 no password required.', lede: 'Click the button below to sign in to your Goldsainte account. This link expires shortly for your security.', cta: 'Sign in to Goldsainte', steps: ["You'll be signed in automatically and returned to where you left off.", 'Your dashboard opens with whatever needs your attention first.', 'This link is single-use and expires shortly \u2014 request a new one anytime.'] },
  fr: { title: 'Votre lien de connexion \u2014 Goldsainte', headline: 'Votre lien de connexion.', tagline: 'Un lien sécurisé, signé et prêt \u2014 sans mot de passe.', lede: 'Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Goldsainte. Ce lien expire bientôt pour votre sécurité.', cta: 'Se connecter à Goldsainte', steps: ['Vous serez connecté automatiquement et ramené là où vous en étiez.', 'Votre tableau de bord s\'ouvre sur ce qui demande votre attention en premier.', 'Ce lien est à usage unique et expire bientôt \u2014 demandez-en un nouveau à tout moment.'] },
  es: { title: 'Tu enlace de acceso \u2014 Goldsainte', headline: 'Tu enlace de acceso.', tagline: 'Un enlace seguro, firmado y listo \u2014 sin contraseña.', lede: 'Haz clic en el botón de abajo para entrar en tu cuenta de Goldsainte. Este enlace caduca pronto por tu seguridad.', cta: 'Entrar en Goldsainte', steps: ['Entrarás automáticamente y volverás donde lo dejaste.', 'Tu panel se abre con lo que primero requiere tu atención.', 'Este enlace es de un solo uso y caduca pronto \u2014 pide uno nuevo cuando quieras.'] },
  de: { title: 'Ihr Anmeldelink \u2014 Goldsainte', headline: 'Ihr Anmeldelink.', tagline: 'Ein sicherer Link, signiert und bereit \u2014 ohne Passwort.', lede: 'Klicken Sie unten, um sich bei Ihrem Goldsainte-Konto anzumelden. Der Link läuft zu Ihrer Sicherheit bald ab.', cta: 'Bei Goldsainte anmelden', steps: ['Sie werden automatisch angemeldet und kehren dorthin zurück, wo Sie aufgehört haben.', 'Ihr Dashboard öffnet sich mit dem, was zuerst Ihre Aufmerksamkeit braucht.', 'Dieser Link ist einmalig nutzbar und läuft bald ab \u2014 fordern Sie jederzeit einen neuen an.'] },
  it: { title: 'Il tuo link di accesso \u2014 Goldsainte', headline: 'Il tuo link di accesso.', tagline: 'Un link sicuro, firmato e pronto \u2014 senza password.', lede: 'Clicca il pulsante qui sotto per accedere al tuo account Goldsainte. Il link scade a breve per la tua sicurezza.', cta: 'Accedi a Goldsainte', steps: ['Accederai automaticamente e tornerai dove eri rimasto.', 'La tua dashboard si apre con ciò che richiede prima la tua attenzione.', 'Questo link è monouso e scade a breve \u2014 richiedine uno nuovo in qualsiasi momento.'] },
  pt: { title: 'Seu link de acesso \u2014 Goldsainte', headline: 'Seu link de acesso.', tagline: 'Um link seguro, assinado e pronto \u2014 sem senha.', lede: 'Clique no botão abaixo para entrar na sua conta Goldsainte. Este link expira em breve, para sua segurança.', cta: 'Entrar na Goldsainte', steps: ['Você entrará automaticamente e voltará de onde parou.', 'Seu painel abre com o que precisa da sua atenção primeiro.', 'Este link é de uso único e expira em breve \u2014 peça um novo a qualquer momento.'] },
  ar: { title: 'رابط تسجيل دخولك \u2014 Goldsainte', headline: 'رابط تسجيل دخولك.', tagline: 'رابط آمن واحد، موقّع وجاهز \u2014 بلا كلمة مرور.', lede: 'انقر الزر أدناه لتسجيل الدخول إلى حسابك في Goldsainte. تنتهي صلاحية الرابط قريباً لأمانك.', cta: 'سجّل الدخول إلى Goldsainte', steps: ['ستسجل الدخول تلقائياً وتعود حيث توقفت.', 'تفتح لوحتك على ما يحتاج انتباهك أولاً.', 'هذا الرابط لاستخدام واحد وتنتهي صلاحيته قريباً \u2014 اطلب رابطاً جديداً متى شئت.'] },
  ja: { title: 'サインインリンク \u2014 Goldsainte', headline: 'サインインリンクです。', tagline: '安全な署名済みリンクひとつ \u2014 パスワード不要。', lede: '下のボタンをクリックして Goldsainte アカウントにサインインしましょう。安全のため、このリンクはまもなく期限切れになります。', cta: 'Goldsainte にサインイン', steps: ['自動的にサインインし、中断したところに戻ります。', 'ダッシュボードは、まず注意が必要なものから開きます。', 'このリンクは一回限りでまもなく期限切れ \u2014 いつでも新しいリンクを請求できます。'] },
  ko: { title: '로그인 링크 \u2014 Goldsainte', headline: '로그인 링크입니다.', tagline: '서명된 안전한 링크 하나 \u2014 비밀번호가 필요 없습니다.', lede: '아래 버튼을 눌러 Goldsainte 계정에 로그인하세요. 보안을 위해 이 링크는 곧 만료됩니다.', cta: 'Goldsainte 로그인', steps: ['자동으로 로그인되어 중단한 곳으로 돌아갑니다.', '가장 먼저 확인이 필요한 항목과 함께 대시보드가 열립니다.', '이 링크는 일회용이며 곧 만료됩니다 \u2014 언제든 새 링크를 요청하세요.'] },
  zh: { title: '你的登录链接 \u2014 Goldsainte', headline: '你的登录链接。', tagline: '一条安全链接，已签名且随时可用 \u2014 无需密码。', lede: '点击下方按钮登录你的 Goldsainte 账户。为了安全，此链接很快过期。', cta: '登录 Goldsainte', steps: ['你将自动登录并回到上次停下的地方。', '面板会优先显示最需要你关注的内容。', '此链接仅可使用一次且很快过期 \u2014 可随时请求新链接。'] },
}

export const MagicLinkEmail = ({ confirmationUrl, lang }: MagicLinkEmailProps) => {
  const s = pickLang(STRINGS, lang ?? 'en')
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede}
      cta={{ label: s.cta, url: confirmationUrl }}
      steps={s.steps}
    />
  )
}

export default MagicLinkEmail
