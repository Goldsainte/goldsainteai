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
const ROOT_DOMAIN = 'goldsainte.com'
const FROM_DOMAIN = 'goldsainte.com'

console.log('auth-email-hook module loaded')

// Sample data for preview mode ONLY (not used in actual email sending).
const SAMPLE_PROJECT_URL = 'https://goldsainteai.lovable.app'
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

// Preview endpoint handler - returns rendered HTML without sending email
async function handlePreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: previewCorsHeaders })
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
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
// Verification: uses Standard Webhooks (standardwebhooks.com) via webhook-id,
// webhook-timestamp, and webhook-signature headers sent by Supabase.
//
// Payload shape sent by Supabase:
// {
//   "user": { "id": "...", "email": "..." },
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

  // Read raw body for signature verification (must be done before any .json() call)
  const rawBody = await req.text()
  const headers = Object.fromEntries(req.headers)

  // Verify signature using Standard Webhooks. The secret stored as "v1,whsec_<base64>"
  // must have the prefix stripped before being passed to the Webhook constructor.
  const wh = new Webhook(hookSecret.replace('v1,whsec_', ''))
  let body: { user?: { email?: string }; email_data?: Record<string, string> }
  try {
    body = wh.verify(rawBody, headers) as typeof body
    console.log('Auth hook signature verified successfully')
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const recipientEmail = body.user?.email
  const emailData = body.email_data
  const emailType = emailData?.email_action_type

  console.log('Payload parsed', { emailType, recipientEmail, emailDataKeys: emailData ? Object.keys(emailData) : null })

  if (!recipientEmail || !emailData || !emailType) {
    console.error('Invalid hook payload - missing user.email, email_data or email_action_type', { body })
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

  // Build the confirmation URL.
  // SUPABASE_URL is auto-injected in every edge function.
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const redirectTo = emailData.redirect_to ?? `https://${ROOT_DOMAIN}`
  const confirmationUrl = emailData.token_hash
    ? `${supabaseUrl}/auth/v1/verify?token=${emailData.token_hash}&type=${emailType}&redirect_to=${encodeURIComponent(redirectTo)}`
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
    newEmail: emailData.new_email,
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

  // Send via Resend (same provider used throughout this project)
  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Goldsainte <noreply@${FROM_DOMAIN}>`,
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
