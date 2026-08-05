/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'

interface ReauthenticationEmailProps {
  token: string
  lang?: EmailLang
}

interface S { title: string; headline: string; tagline: string; lede: string; otpCaption: string; steps: string[] }

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { title: 'Your verification code \u2014 Goldsainte', headline: "Verify it's you.", tagline: 'A one-time code to confirm a sensitive action on your Goldsainte account.', lede: 'Enter the verification code below to continue. This code expires in a few minutes.', otpCaption: 'This code expires in a few minutes.', steps: ['Return to the Goldsainte tab where you started this action.', 'Enter the six-digit code exactly as shown above.', "If you didn't initiate this, you can safely ignore this email \u2014 no changes will be made."] },
  fr: { title: 'Votre code de vérification \u2014 Goldsainte', headline: 'Confirmez que c\'est bien vous.', tagline: 'Un code à usage unique pour confirmer une action sensible sur votre compte Goldsainte.', lede: 'Saisissez le code de vérification ci-dessous pour continuer. Ce code expire dans quelques minutes.', otpCaption: 'Ce code expire dans quelques minutes.', steps: ['Revenez à l\'onglet Goldsainte où vous avez commencé cette action.', 'Saisissez le code à six chiffres exactement comme ci-dessus.', 'Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet e-mail \u2014 rien ne sera modifié.'] },
  es: { title: 'Tu código de verificación \u2014 Goldsainte', headline: 'Verifica que eres tú.', tagline: 'Un código de un solo uso para confirmar una acción sensible en tu cuenta de Goldsainte.', lede: 'Introduce el código de verificación de abajo para continuar. Este código caduca en unos minutos.', otpCaption: 'Este código caduca en unos minutos.', steps: ['Vuelve a la pestaña de Goldsainte donde iniciaste esta acción.', 'Introduce el código de seis dígitos tal como aparece arriba.', 'Si no lo iniciaste tú, ignora este correo \u2014 no se hará ningún cambio.'] },
  de: { title: 'Ihr Bestätigungscode \u2014 Goldsainte', headline: 'Bestätigen Sie, dass Sie es sind.', tagline: 'Ein Einmalcode zur Bestätigung einer sensiblen Aktion in Ihrem Goldsainte-Konto.', lede: 'Geben Sie den Code unten ein, um fortzufahren. Der Code läuft in wenigen Minuten ab.', otpCaption: 'Dieser Code läuft in wenigen Minuten ab.', steps: ['Kehren Sie zum Goldsainte-Tab zurück, in dem Sie diese Aktion gestartet haben.', 'Geben Sie den sechsstelligen Code genau wie oben ein.', 'Falls Sie das nicht veranlasst haben, ignorieren Sie diese E-Mail \u2014 es wird nichts geändert.'] },
  it: { title: 'Il tuo codice di verifica \u2014 Goldsainte', headline: 'Verifica che sei tu.', tagline: 'Un codice monouso per confermare un\'azione sensibile sul tuo account Goldsainte.', lede: 'Inserisci il codice di verifica qui sotto per continuare. Il codice scade tra pochi minuti.', otpCaption: 'Questo codice scade tra pochi minuti.', steps: ['Torna alla scheda Goldsainte dove hai avviato questa azione.', 'Inserisci il codice a sei cifre esattamente come sopra.', 'Se non sei stato tu, ignora pure questa email \u2014 non verrà fatta alcuna modifica.'] },
  pt: { title: 'Seu código de verificação \u2014 Goldsainte', headline: 'Verifique que é você.', tagline: 'Um código de uso único para confirmar uma ação sensível na sua conta Goldsainte.', lede: 'Digite o código de verificação abaixo para continuar. Este código expira em poucos minutos.', otpCaption: 'Este código expira em poucos minutos.', steps: ['Volte à aba da Goldsainte onde você iniciou esta ação.', 'Digite o código de seis dígitos exatamente como mostrado acima.', 'Se você não iniciou isso, ignore este e-mail \u2014 nenhuma mudança será feita.'] },
  ar: { title: 'رمز التحقق \u2014 Goldsainte', headline: 'تحقق أنك أنت.', tagline: 'رمز لمرة واحدة لتأكيد إجراء حساس على حسابك في Goldsainte.', lede: 'أدخل رمز التحقق أدناه للمتابعة. تنتهي صلاحية الرمز خلال دقائق.', otpCaption: 'تنتهي صلاحية هذا الرمز خلال دقائق.', steps: ['عد إلى تبويب Goldsainte الذي بدأت منه هذا الإجراء.', 'أدخل الرمز المكوَّن من ستة أرقام كما يظهر أعلاه تماماً.', 'إن لم تبدأ هذا الإجراء، تجاهل هذه الرسالة \u2014 لن يُجرى أي تغيير.'] },
  ja: { title: '確認コード \u2014 Goldsainte', headline: '本人確認をしましょう。', tagline: 'Goldsainte アカウントの重要な操作を確認するワンタイムコードです。', lede: '続行するには下の確認コードを入力してください。コードは数分で期限切れになります。', otpCaption: 'このコードは数分で期限切れになります。', steps: ['この操作を始めた Goldsainte のタブに戻ります。', '上の6桁のコードをそのまま入力します。', '心当たりがなければこのメールは無視してください \u2014 何も変更されません。'] },
  ko: { title: '인증 코드 \u2014 Goldsainte', headline: '본인 확인이 필요합니다.', tagline: 'Goldsainte 계정의 민감한 작업을 확인하는 일회용 코드입니다.', lede: '계속하려면 아래 인증 코드를 입력하세요. 이 코드는 몇 분 후 만료됩니다.', otpCaption: '이 코드는 몇 분 후 만료됩니다.', steps: ['이 작업을 시작한 Goldsainte 탭으로 돌아가세요.', '위의 여섯 자리 코드를 그대로 입력하세요.', '본인이 시작한 것이 아니라면 이 메일을 무시해도 됩니다 \u2014 아무것도 변경되지 않습니다.'] },
  zh: { title: '你的验证码 \u2014 Goldsainte', headline: '验证是你本人。', tagline: '一枚一次性验证码，用于确认 Goldsainte 账户上的敏感操作。', lede: '输入下方验证码以继续。验证码几分钟后过期。', otpCaption: '此验证码几分钟后过期。', steps: ['回到你发起此操作的 Goldsainte 标签页。', '按上方所示准确输入六位验证码。', '若非本人发起，忽略此邮件即可 \u2014 不会做任何更改。'] },
}

export const ReauthenticationEmail = ({ token, lang }: ReauthenticationEmailProps) => {
  const s = pickLang(STRINGS, lang ?? 'en')
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede}
      otp={{ code: token, caption: s.otpCaption }}
      steps={s.steps}
    />
  )
}

export default ReauthenticationEmail
