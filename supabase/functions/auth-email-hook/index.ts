import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'npm:@supabase/supabase-js@2'
import { pickLang, resolveRecipientLanguage, type EmailLang } from '../_shared/email-i18n.ts'

const EMAIL_SUBJECTS: { en: Record<string, string> } & Partial<Record<EmailLang, Record<string, string>>> = {
  en: { signup: 'Confirm your email', invite: "You've been invited", magiclink: 'Your login link', recovery: 'Reset your password', email_change: 'Confirm your new email', reauthentication: 'Your verification code' },
  fr: { signup: 'Confirmez votre e-mail', invite: 'Vous êtes invité', magiclink: 'Votre lien de connexion', recovery: 'Réinitialisez votre mot de passe', email_change: 'Confirmez votre nouvel e-mail', reauthentication: 'Votre code de vérification' },
  es: { signup: 'Confirma tu correo', invite: 'Te han invitado', magiclink: 'Tu enlace de acceso', recovery: 'Restablece tu contraseña', email_change: 'Confirma tu nuevo correo', reauthentication: 'Tu código de verificación' },
  de: { signup: 'Bestätigen Sie Ihre E-Mail', invite: 'Sie sind eingeladen', magiclink: 'Ihr Anmeldelink', recovery: 'Passwort zurücksetzen', email_change: 'Bestätigen Sie Ihre neue E-Mail', reauthentication: 'Ihr Bestätigungscode' },
  it: { signup: 'Conferma la tua email', invite: 'Sei stato invitato', magiclink: 'Il tuo link di accesso', recovery: 'Reimposta la tua password', email_change: 'Conferma la tua nuova email', reauthentication: 'Il tuo codice di verifica' },
  pt: { signup: 'Confirme seu e-mail', invite: 'Você foi convidado', magiclink: 'Seu link de acesso', recovery: 'Redefina sua senha', email_change: 'Confirme seu novo e-mail', reauthentication: 'Seu código de verificação' },
  ar: { signup: 'أكّد بريدك الإلكتروني', invite: 'تمت دعوتك', magiclink: 'رابط تسجيل دخولك', recovery: 'أعد تعيين كلمة مرورك', email_change: 'أكّد بريدك الجديد', reauthentication: 'رمز التحقق' },
  ja: { signup: 'メールを確認', invite: '招待が届いています', magiclink: 'サインインリンク', recovery: 'パスワードをリセット', email_change: '新しいメールを確認', reauthentication: '確認コード' },
  ko: { signup: '이메일 확인', invite: '초대장이 도착했습니다', magiclink: '로그인 링크', recovery: '비밀번호 재설정', email_change: '새 이메일 확인', reauthentication: '인증 코드' },
  zh: { signup: '确认你的邮箱', invite: '你收到一份邀请', magiclink: '你的登录链接', recovery: '重置你的密码', email_change: '确认你的新邮箱', reauthentication: '你的验证码' },
}

// Template mapping
const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// Configuration
const SITE_NAME = 'Goldsainte'
const ROOT_DOMAIN = 'goldsainte.ai'       // app domain — used in confirmation links
const FROM_DOMAIN = 'goldsainte.com'     // Resend-verified sender domain

// Sample data for preview mode ONLY (not used in actual email sending).
const SAMPLE_PROJECT_URL = 'https://goldsainte.ai'
const SAMPLE_EMAIL = 'user@example.test'
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    siteName: SITE_NAME,
    oldEmail: SAMPLE_EMAIL,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    token: '123456',
  },
}

// Preview endpoint handler - returns rendered HTML without sending email.
// Used only by the email-template preview UI; it does NOT send mail.
async function handlePreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: previewCorsHeaders })
  }

  const apiKey = Deno.env.get('PREVIEW_API_KEY')
  const authHeader = req.headers.get('Authorization')

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let type: string
  try {
    const body = await req.json()
    type = body.type
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[type]

  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = SAMPLE_DATA[type] || {}
  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { ...previewCorsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// Supabase Auth Hook handler for "Send Email".
//
// Supabase calls this function (instead of its built-in email sender) every time
// an auth email needs to go out: signup confirmation, password reset, magic link, etc.
//
// AUTHENTICATION: Supabase signs every Send Email hook request using the
// Standard Webhooks specification. It sends three headers — webhook-id,
// webhook-timestamp and webhook-signature — and the request body is signed
// with the hook secret. We MUST verify these headers with the standardwebhooks
// library. Supabase does NOT send an "Authorization: Bearer <secret>" header,
// so a plain bearer-token check rejects every legitimate request.
//
// The dashboard stores the secret as "v1,whsec_<base64>". The library expects
// only the <base64> portion, so we strip the "v1,whsec_" prefix.
//
// Payload shape (after verification):
// {
//   "user": { "id": "...", "email": "...", "new_email": "..." },
//   "email_data": {
//     "token": "6-digit OTP",
//     "token_hash": "sha256 hash used to build the confirmation URL",
//     "redirect_to": "https://goldsainte.ai/auth/callback",
//     "email_action_type": "signup" | "recovery" | "magiclink" | "invite" | "email_change" | "reauthentication",
//     "site_url": "https://goldsainte.ai"
//   }
// }
async function handleSupabaseHook(req: Request): Promise<Response> {
  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!hookSecret || !resendApiKey) {
    console.error('Missing required env vars: SEND_EMAIL_HOOK_SECRET or RESEND_API_KEY')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Read the RAW body — required for Standard Webhooks signature verification.
  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  // Verify the request actually came from Supabase Auth.
  let user: { email?: string; new_email?: string }
  let emailData: Record<string, string>
  try {
    const wh = new Webhook(hookSecret.replace('v1,whsec_', ''))
    const verified = wh.verify(payload, headers) as {
      user: { email?: string; new_email?: string }
      email_data: Record<string, string>
    }
    user = verified.user
    emailData = verified.email_data
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Webhook signature verification failed', { error: msg })
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const recipientEmail = user?.email
  const emailType = emailData?.email_action_type

  console.log('Payload parsed', { emailType, recipientEmail, emailDataKeys: emailData ? Object.keys(emailData) : null })

  if (!recipientEmail || !emailData || !emailType) {
    console.error('Invalid hook payload - missing user.email, email_data or email_action_type')
    return new Response(
      JSON.stringify({ error: 'Invalid payload' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Received Supabase auth hook', { emailType, email: recipientEmail })

  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    console.error('Unknown email type', { emailType })
    return new Response(
      JSON.stringify({ error: `Unknown email type: ${emailType}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Template found, building confirmation URL')

  // Build the confirmation URL pointing to the branded domain (/auth/verify)
  // so outbound emails show goldsainte.ai instead of the raw Supabase project URL.
  // AuthVerify calls supabase.auth.verifyOtp() client-side with the token_hash.
  const redirectTo = emailData.redirect_to ?? `https://${ROOT_DOMAIN}`
  // Build a branded confirmation URL. The /auth/verify page calls verifyOtp()
  // client-side, so the raw Supabase project URL never appears in outbound emails.
  // Pass redirect_to through so recovery flows land on /reset-password.
  // Slim link (31 Jul): a full URL nested inside the query string
  // (redirect_to=https%3A%2F%2F...) is a classic spam heuristic — a strict
  // receiving server content-rejected our confirmation email (SMTP 550,
  // "Content Rejected") while accepting our plain-linked marketing email to
  // the same mailbox. Only embed redirect_to when it actually differs from
  // the default homepage; AuthVerify already falls back to /auth/callback
  // when the param is absent.
  const isDefaultRedirect = redirectTo === `https://${ROOT_DOMAIN}` || redirectTo === `https://${ROOT_DOMAIN}/`
  const confirmationUrl = emailData.token_hash
    ? `https://${ROOT_DOMAIN}/auth/verify?token=${emailData.token_hash}&type=${emailType}${isDefaultRedirect ? '' : `&redirect_to=${encodeURIComponent(redirectTo)}`}`
    : redirectTo

  console.log('Rendering email template', { emailType, confirmationUrl: confirmationUrl.substring(0, 60) + '...' })

  // Role, so the signup email can describe the RIGHT next steps. Set at
  // signup in Auth.tsx (options.data.account_type) and carried on the auth
  // user. Without it every new account got traveler instructions.
  const accountType =
    (user?.user_metadata?.account_type as string | undefined) ??
    (user?.raw_user_meta_data?.account_type as string | undefined) ??
    undefined

  // Resolve the recipient's language (best-effort; falls back to English).
  let recipientLang: EmailLang = 'en'
  try {
    const sbUrl = Deno.env.get('SUPABASE_URL')
    const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const sb = sbUrl && sbKey ? createClient(sbUrl, sbKey) : null
    recipientLang = await resolveRecipientLanguage(sb, null, recipientEmail)
  } catch (_e) { /* fail-open */ }

  const templateProps = {
    lang: recipientLang,
    siteName: SITE_NAME,
    accountType,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: recipientEmail,
    confirmationUrl,
    token: emailData.token,       // 6-digit OTP (used by reauthentication template)
    email: recipientEmail,
    oldEmail: recipientEmail,
    newEmail: user.new_email,
  }

  // ---- Respond-first, send-in-background (31 Jul) ----
  // Supabase Auth waits at most 5s for this hook. Cold start + TWO React
  // template renders + the Resend round-trip regularly overran that, so Auth
  // reported "Failed to reach hook within maximum time of 5 seconds" to the
  // signer-upper — a FALSE failure: the account existed and the email arrived
  // moments later (observed live, 31 Jul, first signup of launch morning).
  // Now: signature is verified above (synchronously — forged calls still get
  // 401), then we acknowledge Auth immediately and render+send in the
  // background via EdgeRuntime.waitUntil, with one retry. A background send
  // failure is logged loudly and the user can use the resend-confirmation UI;
  // that trade beats failing every slow-start signup at the front door.
  const renderAndSend = async () => {
    let html: string
    let text: string
    try {
      html = await renderAsync(React.createElement(EmailTemplate, templateProps))
      text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })
    } catch (renderErr) {
      const msg = renderErr instanceof Error ? renderErr.message : String(renderErr)
      console.error('[auth-email-hook] template render failed (background)', { emailType, error: msg })
      return
    }

    const sendOnce = async (): Promise<boolean> => {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Goldsainte <support@${FROM_DOMAIN}>`,
          to: [recipientEmail],
          subject: pickLang(EMAIL_SUBJECTS, recipientLang)[emailType] || EMAIL_SUBJECTS.en[emailType] || 'Notification',
          html,
          text,
        }),
      })
      if (!resendResponse.ok) {
        const errorBody = await resendResponse.text()
        console.error('[auth-email-hook] Resend API error (background)', { status: resendResponse.status, body: errorBody, emailType })
        return false
      }
      return true
    }

    try {
      let ok = await sendOnce()
      if (!ok) {
        await new Promise((r) => setTimeout(r, 1500))
        ok = await sendOnce()
      }
      if (ok) console.log('[auth-email-hook] auth email sent', { emailType, email: recipientEmail })
      else console.error('[auth-email-hook] auth email FAILED after retry — user must use resend-confirmation', { emailType, email: recipientEmail })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('[auth-email-hook] background send threw', { error: errorMsg, emailType })
    }
  }

  // Keep the work alive after we respond; fall back to fire-and-forget if
  // the runtime ever lacks waitUntil.
  const runtime = (globalThis as any).EdgeRuntime
  if (runtime?.waitUntil) runtime.waitUntil(renderAndSend())
  else renderAndSend()

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // Handle CORS preflight for main endpoint
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Route to preview handler for /preview path
  if (url.pathname.endsWith('/preview')) {
    return handlePreview(req)
  }

  // Main Supabase auth hook handler
  try {
    return await handleSupabaseHook(req)
  } catch (error) {
    console.error('Webhook handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
