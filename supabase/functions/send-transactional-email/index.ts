import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
 
// Email sender configuration. Emails are sent via Resend — the domain used in
// FROM_DOMAIN MUST be a verified sending domain in your Resend account.
const SITE_NAME = 'Goldsainte'
// FROM_DOMAIN is the domain shown in the From: header.
const FROM_DOMAIN = 'goldsainte.com'
 
// Generate a cryptographically random 32-byte hex token
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
 
// Sends transactional / app emails (booking confirmations, welcome emails,
// notifications, admin alerts, etc.).
//
// Design: the email is sent DIRECTLY via Resend. There is no queue and no cron
// dependency. Every database call (suppression list, unsubscribe token, send
// log) is BEST-EFFORT — wrapped so that a missing table or unapplied migration
// logs a warning and the email still sends. The send path cannot be broken by
// database/migration drift.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
 
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
 
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
 
  // Parse request body
  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
 
  if (!templateName) {
    return new Response(
      JSON.stringify({ error: 'templateName is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
 
  // Look up template from registry
  const template = TEMPLATES[templateName]
  if (!template) {
    console.error('Template not found in registry', { templateName })
    return new Response(
      JSON.stringify({
        error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`,
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
 
  // Resolve effective recipient: template-level `to` takes precedence.
  const effectiveRecipient = template.to || recipientEmail
  if (!effectiveRecipient) {
    return new Response(
      JSON.stringify({
        error: 'recipientEmail is required (unless the template defines a fixed recipient)',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
 
  const normalizedEmail = effectiveRecipient.toLowerCase()
 
  // Supabase client is OPTIONAL. All DB use below is best-effort — a missing
  // table or migration must never block a send.
  const supabase =
    supabaseUrl && supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null
 
  // Best-effort send-log writer. Never throws, never blocks the send.
  const safeLog = async (status: string, errorMessage?: string): Promise<void> => {
    if (!supabase) return
    try {
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status,
        ...(errorMessage ? { error_message: errorMessage } : {}),
      })
    } catch (_e) {
      // Logging is best-effort; ignore failures.
    }
  }
 
  // Suppression check — best-effort. If the table is missing or the query
  // errors, log a warning and continue (fail-open) rather than blocking.
  if (supabase) {
    try {
      const { data: suppressed, error } = await supabase
        .from('suppressed_emails')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle()
 
      if (error) {
        console.warn('Suppression check unavailable — sending anyway', {
          error: error.message,
        })
      } else if (suppressed) {
        await safeLog('suppressed')
        console.log('Email suppressed', { effectiveRecipient, templateName })
        return new Response(
          JSON.stringify({ success: false, reason: 'email_suppressed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      console.warn('Suppression check threw — sending anyway', { error: String(e) })
    }
  }
 
  // Unsubscribe token — best-effort. Try to reuse or persist a token; if
  // storage is unavailable, fall back to an ephemeral token so the email
  // still sends.
  let unsubscribeToken = generateToken()
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('email_unsubscribe_tokens')
        .select('token, used_at')
        .eq('email', normalizedEmail)
        .maybeSingle()
 
      if (existing && !existing.used_at) {
        unsubscribeToken = existing.token
      } else if (!existing) {
        await supabase
          .from('email_unsubscribe_tokens')
          .upsert(
            { token: unsubscribeToken, email: normalizedEmail },
            { onConflict: 'email', ignoreDuplicates: true }
          )
        const { data: stored } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token')
          .eq('email', normalizedEmail)
          .maybeSingle()
        if (stored?.token) unsubscribeToken = stored.token
      }
    } catch (e) {
      console.warn('Unsubscribe token storage unavailable — using ephemeral token', {
        error: String(e),
      })
    }
  }
 
  // Render React Email template to HTML and plain text
  const html = await renderAsync(
    React.createElement(template.component, templateData)
  )
  const plainText = await renderAsync(
    React.createElement(template.component, templateData),
    { plainText: true }
  )
 
  // Resolve subject — supports static string or dynamic function
  const resolvedSubject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject
 
  // Custom EMAIL headers (passed in the Resend request body). One-click
  // unsubscribe (RFC 8058) — best-effort, only when we know our own URL.
  const emailHeaders: Record<string, string> = {}
  if (supabaseUrl) {
    emailHeaders['List-Unsubscribe'] =
      `<${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${unsubscribeToken}>`
    emailHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }
 
  // Send the email DIRECTLY via Resend. No queue, no cron.
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        // Resend idempotency: a retry with the same key won't double-send.
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        to: [effectiveRecipient],
        subject: resolvedSubject,
        html,
        text: plainText,
        ...(Object.keys(emailHeaders).length ? { headers: emailHeaders } : {}),
      }),
    })
 
    if (!resendRes.ok) {
      const errBody = await resendRes.text()
      throw new Error(`Resend API ${resendRes.status}: ${errBody}`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Failed to send transactional email', {
      error: errorMsg,
      templateName,
      effectiveRecipient,
    })
    await safeLog('failed', errorMsg.slice(0, 1000))
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
 
  await safeLog('sent')
  console.log('Transactional email sent', { templateName, effectiveRecipient })
 
  return new Response(
    JSON.stringify({ success: true, sent: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
