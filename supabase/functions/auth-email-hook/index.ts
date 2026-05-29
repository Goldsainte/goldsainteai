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

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
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
  const confirmationUrl = emailData.token_hash
    ? `https://${ROOT_DOMAIN}/auth/verify?token=${emailData.token_hash}&type=${emailType}&redirect_to=${encodeURIComponent(redirectTo)}`
    : redirectTo

  console.log('Rendering email template', { emailType, confirmationUrl: confirmationUrl.substring(0, 60) + '...' })

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: recipientEmail,
    confirmationUrl,
    token: emailData.token,       // 6-digit OTP (used by reauthentication template)
    email: recipientEmail,
    oldEmail: recipientEmail,
    newEmail: user.new_email,
  }

  let html: string
  let text: string
  try {
    html = await renderAsync(React.createElement(EmailTemplate, templateProps))
    console.log('HTML render complete, rendering plain text')
    text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })
    console.log('Plain text render complete')
  } catch (renderErr) {
    const msg = renderErr instanceof Error ? renderErr.message : String(renderErr)
    console.error('Email template render failed', { emailType, error: msg })
    return new Response(
      JSON.stringify({ error: 'Template render failed', detail: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Sending via Resend', { to: recipientEmail, subject: EMAIL_SUBJECTS[emailType] })

  // Send via Resend (same provider used throughout this project).
  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Goldsainte <support@${FROM_DOMAIN}>`,
        to: [recipientEmail],
        subject: EMAIL_SUBJECTS[emailType] || 'Notification',
        html,
        text,
      }),
    })

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text()
      console.error('Resend API error', { status: resendResponse.status, body: errorBody, emailType })
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('Resend API success', { status: resendResponse.status })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Failed to send auth email', { error: errorMsg, emailType })
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Auth email sent successfully', { emailType, email: recipientEmail })

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
