/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  recipientEmail?: string
  status?: string
  errorMessage?: string
  messageId?: string
  occurredAt?: string
}

export const AdminAuthEmailFailureEmail = ({
  recipientEmail,
  status = 'failed',
  errorMessage,
  messageId,
  occurredAt,
}: Props) => (
  <AuthEmailLayout
    title={'Auth email delivery failure — Goldsainte'}
    headline={'An authentication email failed to deliver.'}
    tagline={
      status === 'dlq'
        ? 'The message was retried and moved to the dead-letter queue.'
        : 'The send attempt did not succeed.'
    }
    lede={`Recipient: ${recipientEmail ?? 'unknown'} · Status: ${status.toUpperCase()}${
      occurredAt ? ` · ${occurredAt}` : ''
    }${errorMessage ? ` · Reason: ${errorMessage}` : ''}${
      messageId ? ` · Message ID: ${messageId}` : ''
    }. When auth emails fail, Supabase falls back to the default unbranded template, so this is time-sensitive.`}
    steps={[
      'Open the Email DLQ dashboard to inspect the failed message and full error.',
      'Confirm Cloud → Emails shows the domain as Active and DNS verified.',
      'Check Mailgun/provider health and rate limits — repeated 429s point to throttling.',
      'If the recipient is real and the error is transient, re-enqueue the message.',
      'If the cause is template or hook code, redeploy auth-email-hook after the fix.',
    ]}
    cta={{ label: 'Open Email DLQ', url: 'https://goldsainte.ai/admin/email-dlq' }}
  />
)

export const template = {
  component: AdminAuthEmailFailureEmail,
  subject: (d: any) =>
    `[Goldsainte] Auth email ${String(d.status ?? 'failed').toUpperCase()} — ${
      d.recipientEmail ?? 'unknown recipient'
    }`,
  displayName: 'Admin — Auth Email Failure',
  previewData: {
    recipientEmail: 'guest@example.com',
    status: 'dlq',
    errorMessage: 'Mailgun 550: recipient mailbox unavailable',
    messageId: 'auth-9f3c2b…',
    occurredAt: '2026-05-24 15:04 UTC',
  },
} satisfies TemplateEntry