/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
  lang?: EmailLang
}

interface S { title: string; headline: string; tagline: (oldE: string, newE: string) => string; lede: string; cta: string; steps: string[] }

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { title: 'Confirm your new email \u2014 Goldsainte', headline: 'Confirm your new email.', tagline: (o, n) => `You've requested to change the email on your Goldsainte account from ${o} to ${n}.`, lede: 'Confirm the change by clicking the button below. This link expires shortly for your security.', cta: 'Confirm new email', steps: ['Click the button above to confirm the new email address on file.', 'Once confirmed, future sign-ins and notifications will be sent to the new address.', "If you didn't request this change, please contact Goldsainte Support immediately to secure your account."] },
  fr: { title: 'Confirmez votre nouvel e-mail \u2014 Goldsainte', headline: 'Confirmez votre nouvel e-mail.', tagline: (o, n) => `Vous avez demandé à changer l'e-mail de votre compte Goldsainte de ${o} vers ${n}.`, lede: 'Confirmez le changement en cliquant sur le bouton ci-dessous. Ce lien expire bientôt pour votre sécurité.', cta: 'Confirmer le nouvel e-mail', steps: ['Cliquez sur le bouton ci-dessus pour confirmer la nouvelle adresse e-mail.', 'Une fois confirmée, connexions et notifications iront à la nouvelle adresse.', 'Si vous n\'êtes pas à l\'origine de ce changement, contactez immédiatement le support Goldsainte pour sécuriser votre compte.'] },
  es: { title: 'Confirma tu nuevo correo \u2014 Goldsainte', headline: 'Confirma tu nuevo correo.', tagline: (o, n) => `Has solicitado cambiar el correo de tu cuenta de Goldsainte de ${o} a ${n}.`, lede: 'Confirma el cambio haciendo clic en el botón de abajo. Este enlace caduca pronto por tu seguridad.', cta: 'Confirmar nuevo correo', steps: ['Haz clic en el botón de arriba para confirmar la nueva dirección de correo.', 'Una vez confirmada, los inicios de sesión y avisos irán a la nueva dirección.', 'Si no solicitaste este cambio, contacta de inmediato con el soporte de Goldsainte para proteger tu cuenta.'] },
  de: { title: 'Bestätigen Sie Ihre neue E-Mail \u2014 Goldsainte', headline: 'Bestätigen Sie Ihre neue E-Mail.', tagline: (o, n) => `Sie haben beantragt, die E-Mail Ihres Goldsainte-Kontos von ${o} zu ${n} zu ändern.`, lede: 'Bestätigen Sie die Änderung mit dem Button unten. Der Link läuft zu Ihrer Sicherheit bald ab.', cta: 'Neue E-Mail bestätigen', steps: ['Klicken Sie oben, um die neue E-Mail-Adresse zu bestätigen.', 'Nach der Bestätigung gehen Anmeldungen und Benachrichtigungen an die neue Adresse.', 'Falls Sie diese Änderung nicht angefordert haben, kontaktieren Sie sofort den Goldsainte-Support, um Ihr Konto zu sichern.'] },
  it: { title: 'Conferma la tua nuova email \u2014 Goldsainte', headline: 'Conferma la tua nuova email.', tagline: (o, n) => `Hai richiesto di cambiare l'email del tuo account Goldsainte da ${o} a ${n}.`, lede: 'Conferma il cambio cliccando il pulsante qui sotto. Il link scade a breve per la tua sicurezza.', cta: 'Conferma nuova email', steps: ['Clicca il pulsante sopra per confermare il nuovo indirizzo email.', 'Una volta confermato, accessi e notifiche andranno al nuovo indirizzo.', 'Se non hai richiesto questo cambio, contatta subito il supporto Goldsainte per proteggere il tuo account.'] },
  pt: { title: 'Confirme seu novo e-mail \u2014 Goldsainte', headline: 'Confirme seu novo e-mail.', tagline: (o, n) => `Você pediu para mudar o e-mail da sua conta Goldsainte de ${o} para ${n}.`, lede: 'Confirme a mudança clicando no botão abaixo. Este link expira em breve, para sua segurança.', cta: 'Confirmar novo e-mail', steps: ['Clique no botão acima para confirmar o novo endereço de e-mail.', 'Uma vez confirmado, logins e notificações irão para o novo endereço.', 'Se você não pediu esta mudança, contate o suporte Goldsainte imediatamente para proteger sua conta.'] },
  ar: { title: 'أكّد بريدك الجديد \u2014 Goldsainte', headline: 'أكّد بريدك الجديد.', tagline: (o, n) => `طلبت تغيير بريد حسابك في Goldsainte من ${o} إلى ${n}.`, lede: 'أكّد التغيير بالنقر على الزر أدناه. تنتهي صلاحية الرابط قريباً لأمانك.', cta: 'أكّد البريد الجديد', steps: ['انقر الزر أعلاه لتأكيد عنوان البريد الجديد.', 'بعد التأكيد، سترسل تسجيلات الدخول والإشعارات إلى العنوان الجديد.', 'إن لم تطلب هذا التغيير، تواصل فوراً مع دعم Goldsainte لتأمين حسابك.'] },
  ja: { title: '新しいメールを確認 \u2014 Goldsainte', headline: '新しいメールを確認しましょう。', tagline: (o, n) => `Goldsainte アカウントのメールを ${o} から ${n} に変更するリクエストがありました。`, lede: '下のボタンをクリックして変更を確認してください。安全のため、このリンクはまもなく期限切れになります。', cta: '新しいメールを確認', steps: ['上のボタンをクリックして新しいメールアドレスを確認します。', '確認後、今後のサインインと通知は新しいアドレスに届きます。', '心当たりがなければ、アカウント保護のためすぐに Goldsainte サポートへご連絡ください。'] },
  ko: { title: '새 이메일 확인 \u2014 Goldsainte', headline: '새 이메일을 확인하세요.', tagline: (o, n) => `Goldsainte 계정의 이메일을 ${o}에서 ${n}(으)로 변경하도록 요청하셨습니다.`, lede: '아래 버튼을 눌러 변경을 확인하세요. 보안을 위해 이 링크는 곧 만료됩니다.', cta: '새 이메일 확인', steps: ['위 버튼을 눌러 새 이메일 주소를 확인하세요.', '확인되면 이후 로그인과 알림은 새 주소로 전송됩니다.', '요청한 적이 없다면 계정 보호를 위해 즉시 Goldsainte 지원팀에 연락하세요.'] },
  zh: { title: '确认你的新邮箱 \u2014 Goldsainte', headline: '确认你的新邮箱。', tagline: (o, n) => `你请求将 Goldsainte 账户邮箱从 ${o} 更改为 ${n}。`, lede: '点击下方按钮确认更改。为了安全，此链接很快过期。', cta: '确认新邮箱', steps: ['点击上方按钮确认新的邮箱地址。', '确认后，今后的登录与通知将发送到新地址。', '若非本人操作，请立即联系 Goldsainte 支持以保护你的账户。'] },
}

export const EmailChangeEmail = ({ oldEmail, newEmail, confirmationUrl, lang }: EmailChangeEmailProps) => {
  const s = pickLang(STRINGS, lang ?? 'en')
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline(oldEmail, newEmail)}
      lede={s.lede}
      cta={{ label: s.cta, url: confirmationUrl }}
      steps={s.steps}
    />
  )
}

export default EmailChangeEmail
