/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  reporter_name?: string
  publication?: string
  email?: string
  phone?: string
  topic?: string
  deadline?: string
  message?: string
}

export const PressInquiryReceivedEmail = ({
  reporter_name = '',
  publication = '',
  email = '',
  phone = '',
  topic = '',
  deadline = '',
  message = '',
}: Props) => (
  <AuthEmailLayout
    title={'New press inquiry — Goldsainte'}
    headline={`New press inquiry from ${reporter_name || 'a reporter'}.`}
    tagline={publication ? `From ${publication}` : 'Press contact form'}
    lede={`Topic: ${topic || '—'} · Deadline: ${deadline || '—'}\n\nReporter: ${reporter_name} <${email}>${phone ? ` · ${phone}` : ''}\n\nMessage:\n${message}`}
    steps={[
      'Reply directly to the reporter within one business day.',
      'Loop in the founder if the topic requires executive comment.',
      'Log the inquiry in the press tracker once responded.',
    ]}
    cta={{ label: 'Reply to reporter', url: `mailto:${email}` }}
  />
)

export const template = {
  component: PressInquiryReceivedEmail,
  subject: (d: any) =>
    `[Press] ${d.topic || 'Inquiry'} — ${d.reporter_name || 'Reporter'}${d.publication ? ` (${d.publication})` : ''}`,
  displayName: 'Press — Inquiry Received',
  previewData: {
    reporter_name: 'Jane Doe',
    publication: 'Travel Weekly',
    email: 'jane@travelweekly.com',
    phone: '+1 555 123 4567',
    topic: 'Founder Interview',
    deadline: '2026-06-01',
    message: 'I would love to schedule a 30-minute interview with Andre about the launch.',
  },
} satisfies TemplateEntry
