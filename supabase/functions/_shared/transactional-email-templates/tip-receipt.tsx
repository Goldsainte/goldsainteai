/// <reference types="npm:@types/react@18.3.1" />
// ============================================================================
// tip-receipt — branded confirmation to the traveler who sent the tip.
// Created Jul 26 alongside tip-received; both replace ad-hoc inline HTML in
// stripe-webhook-handler.
// ============================================================================
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface TipReceiptProps {
  /** e.g. "$10.00" */
  amount?: string
  recipientName?: string
  /** e.g. "July 26, 2026" */
  date?: string
  note?: string
}

export const TipReceiptEmail = ({
  amount = '$0.00',
  recipientName = 'your travel professional',
  date,
  note,
}: TipReceiptProps) => (
  <AuthEmailLayout
    title="Your Goldsainte tip receipt"
    headline="Thank you."
    tagline={`Tips go directly to the people who make travel special \u2014 Goldsainte never holds the money.`}
    lede={`This confirms your ${amount} tip to ${recipientName}${date ? ` on ${date}` : ''}.${note ? ` Your note: \u201C${note}\u201D` : ''}`}
    details={[
      { label: 'Tip', value: amount },
      { label: 'To', value: recipientName },
      ...(date ? [{ label: 'Date', value: date }] : []),
    ]}
    steps={[
      `Your payment was processed securely by Stripe and charged to your card.`,
      `The tip is paid directly to ${recipientName}'s own account.`,
      `Keep this email as your receipt \u2014 the charge appears on your statement from ${recipientName} via Stripe.`,
    ]}
  />
)

export const template = {
  component: TipReceiptEmail,
  subject: (d: Record<string, any>) =>
    `Your ${d?.amount || ''} tip to ${d?.recipientName || 'your travel professional'} \u2014 receipt`,
  displayName: 'Tip — receipt (traveler)',
  previewData: { amount: '$10.00', recipientName: 'Tanya', date: 'July 26, 2026', note: 'Thanks for the Tokyo guide!' },
} satisfies TemplateEntry
