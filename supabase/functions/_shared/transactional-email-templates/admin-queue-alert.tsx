/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  dlqCount?: number
  failedCount?: number
  pendingCount?: number
  windowMinutes?: number
  details?: string
}

export const AdminQueueAlertEmail = ({
  dlqCount = 0,
  failedCount = 0,
  pendingCount = 0,
  windowMinutes = 15,
  details = '',
}: Props) => (
  <AuthEmailLayout
    title={'Email queue alert — Goldsainte'}
    headline={'Email queue needs attention.'}
    tagline={`Detected in the last ${windowMinutes} minutes.`}
    lede={`Dead-letter: ${dlqCount}. Failed: ${failedCount}. Pending: ${pendingCount}. ${details}`}
    steps={[
      'Open the admin email dashboard to inspect failures.',
      'Check Cloud → Emails for queue depth and recent errors.',
      'Confirm Mailgun/provider health and DNS verification.',
      'Re-enqueue or acknowledge stuck messages once root cause is fixed.',
    ]}
    cta={{ label: 'Open email dashboard', url: 'https://goldsainte.ai/admin/email-dlq' }}
  />
)

export const template = {
  component: AdminQueueAlertEmail,
  subject: (d: any) =>
    `[Goldsainte] Email queue alert — ${d.dlqCount ?? 0} DLQ / ${d.failedCount ?? 0} failed`,
  displayName: 'Admin — Email Queue Alert',
  previewData: { dlqCount: 3, failedCount: 1, pendingCount: 12, windowMinutes: 15 },
} satisfies TemplateEntry