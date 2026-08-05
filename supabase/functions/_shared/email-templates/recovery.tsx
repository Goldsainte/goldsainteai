/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  lang?: EmailLang
}

interface S { title: string; headline: string; tagline: string; lede: string; cta: string; steps: string[] }

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { title: 'Reset your password \u2014 Goldsainte', headline: 'Reset your password.', tagline: 'A secure link to restore access to your Goldsainte account.', lede: 'We received a request to reset your password. Click the button below to choose a new one. This link expires in one hour.', cta: 'Reset my password', steps: ['Click the button above to open a secure password reset page.', 'Choose a new password \u2014 at least 8 characters, with a mix of letters and numbers.', "You'll be signed in automatically once your new password is saved.", "If you didn't request this, you can safely ignore this email \u2014 your password will remain unchanged."] },
  fr: { title: 'Réinitialisez votre mot de passe \u2014 Goldsainte', headline: 'Réinitialisez votre mot de passe.', tagline: 'Un lien sécurisé pour retrouver l\'accès à votre compte Goldsainte.', lede: 'Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien expire dans une heure.', cta: 'Réinitialiser mon mot de passe', steps: ['Cliquez sur le bouton ci-dessus pour ouvrir une page de réinitialisation sécurisée.', 'Choisissez un nouveau mot de passe \u2014 au moins 8 caractères, mêlant lettres et chiffres.', 'Vous serez connecté automatiquement une fois le nouveau mot de passe enregistré.', 'Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet e-mail \u2014 votre mot de passe restera inchangé.'] },
  es: { title: 'Restablece tu contraseña \u2014 Goldsainte', headline: 'Restablece tu contraseña.', tagline: 'Un enlace seguro para recuperar el acceso a tu cuenta de Goldsainte.', lede: 'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva. Este enlace caduca en una hora.', cta: 'Restablecer mi contraseña', steps: ['Haz clic en el botón de arriba para abrir una página segura de restablecimiento.', 'Elige una nueva contraseña \u2014 al menos 8 caracteres, mezclando letras y números.', 'Entrarás automáticamente en cuanto se guarde tu nueva contraseña.', 'Si no lo solicitaste, ignora este correo \u2014 tu contraseña seguirá igual.'] },
  de: { title: 'Passwort zurücksetzen \u2014 Goldsainte', headline: 'Setzen Sie Ihr Passwort zurück.', tagline: 'Ein sicherer Link, um den Zugang zu Ihrem Goldsainte-Konto wiederherzustellen.', lede: 'Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Klicken Sie unten, um ein neues zu wählen. Der Link läuft in einer Stunde ab.', cta: 'Passwort zurücksetzen', steps: ['Klicken Sie oben, um eine sichere Seite zum Zurücksetzen zu öffnen.', 'Wählen Sie ein neues Passwort \u2014 mindestens 8 Zeichen, mit Buchstaben und Zahlen gemischt.', 'Sobald das neue Passwort gespeichert ist, werden Sie automatisch angemeldet.', 'Falls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail \u2014 Ihr Passwort bleibt unverändert.'] },
  it: { title: 'Reimposta la tua password \u2014 Goldsainte', headline: 'Reimposta la tua password.', tagline: 'Un link sicuro per ripristinare l\'accesso al tuo account Goldsainte.', lede: 'Abbiamo ricevuto una richiesta di reimpostazione della password. Clicca il pulsante qui sotto per sceglierne una nuova. Il link scade tra un\'ora.', cta: 'Reimposta la mia password', steps: ['Clicca il pulsante sopra per aprire una pagina sicura di reimpostazione.', 'Scegli una nuova password \u2014 almeno 8 caratteri, con lettere e numeri.', 'Accederai automaticamente una volta salvata la nuova password.', 'Se non l\'hai richiesto tu, ignora pure questa email \u2014 la tua password resterà invariata.'] },
  pt: { title: 'Redefina sua senha \u2014 Goldsainte', headline: 'Redefina sua senha.', tagline: 'Um link seguro para recuperar o acesso à sua conta Goldsainte.', lede: 'Recebemos um pedido para redefinir sua senha. Clique no botão abaixo para escolher uma nova. Este link expira em uma hora.', cta: 'Redefinir minha senha', steps: ['Clique no botão acima para abrir uma página segura de redefinição.', 'Escolha uma nova senha \u2014 pelo menos 8 caracteres, misturando letras e números.', 'Você entrará automaticamente assim que a nova senha for salva.', 'Se você não pediu isso, ignore este e-mail \u2014 sua senha permanecerá a mesma.'] },
  ar: { title: 'أعد تعيين كلمة مرورك \u2014 Goldsainte', headline: 'أعد تعيين كلمة مرورك.', tagline: 'رابط آمن لاستعادة الوصول إلى حسابك في Goldsainte.', lede: 'استلمنا طلباً لإعادة تعيين كلمة مرورك. انقر الزر أدناه لاختيار كلمة جديدة. تنتهي صلاحية الرابط خلال ساعة.', cta: 'أعد تعيين كلمة مروري', steps: ['انقر الزر أعلاه لفتح صفحة آمنة لإعادة التعيين.', 'اختر كلمة مرور جديدة \u2014 8 أحرف على الأقل، تمزج حروفاً وأرقاماً.', 'ستسجل الدخول تلقائياً فور حفظ كلمة المرور الجديدة.', 'إن لم تطلب ذلك، تجاهل هذه الرسالة \u2014 ستبقى كلمة مرورك دون تغيير.'] },
  ja: { title: 'パスワードをリセット \u2014 Goldsainte', headline: 'パスワードをリセットしましょう。', tagline: 'Goldsainte アカウントへのアクセスを取り戻す安全なリンクです。', lede: 'パスワードリセットのリクエストを受け付けました。下のボタンから新しいパスワードを設定してください。このリンクは1時間で期限切れになります。', cta: 'パスワードをリセット', steps: ['上のボタンをクリックして、安全なリセットページを開きます。', '新しいパスワードを設定 \u2014 8文字以上、英字と数字を混ぜてください。', '新しいパスワードが保存されると自動的にサインインします。', '心当たりがなければこのメールは無視してください \u2014 パスワードは変わりません。'] },
  ko: { title: '비밀번호 재설정 \u2014 Goldsainte', headline: '비밀번호를 재설정하세요.', tagline: 'Goldsainte 계정 접근을 복구하는 안전한 링크입니다.', lede: '비밀번호 재설정 요청을 받았습니다. 아래 버튼을 눌러 새 비밀번호를 선택하세요. 이 링크는 1시간 후 만료됩니다.', cta: '비밀번호 재설정', steps: ['위 버튼을 눌러 안전한 재설정 페이지를 여세요.', '새 비밀번호를 선택하세요 \u2014 최소 8자, 영문과 숫자를 섞어서.', '새 비밀번호가 저장되면 자동으로 로그인됩니다.', '요청한 적이 없다면 이 메일을 무시해도 됩니다 \u2014 비밀번호는 그대로 유지됩니다.'] },
  zh: { title: '重置你的密码 \u2014 Goldsainte', headline: '重置你的密码。', tagline: '一条安全链接，帮你恢复 Goldsainte 账户的访问。', lede: '我们收到了重置密码的请求。点击下方按钮设置新密码。此链接一小时后过期。', cta: '重置我的密码', steps: ['点击上方按钮打开安全的重置页面。', '设置新密码 \u2014 至少 8 个字符，混合字母与数字。', '新密码保存后你将自动登录。', '若非本人操作，忽略此邮件即可 \u2014 你的密码不会改变。'] },
}

export const RecoveryEmail = ({ confirmationUrl, lang }: RecoveryEmailProps) => {
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

export default RecoveryEmail
