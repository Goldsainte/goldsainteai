/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  amount?: string
  payoutId?: string
  tripName?: string
}

export const PayoutSentEmail = ({ amount, payoutId, tripName }: Props) => (
  <AuthEmailLayout
    title='A payout has been sent to your account'
    headline={`A payout is on its way.`}
    tagline={`Your earnings have been released from escrow.`}
    lede={`Goldsainte has released a payout of ${amount ?? ""} to your connected Stripe account for ${tripName ?? ""}. Funds typically arrive within 1–2 business days.`}
    steps={[
    `View payout details and milestone breakdown in your dashboard.`,
    `The Goldsainte platform fee has already been deducted.`,
    `Your Stripe Connect dashboard shows expected arrival.`,
    `Tax documents are generated annually for your records.`,
    `Questions? Contact our concierge team.`
  ]}
    cta={{ label: 'View payout', url: `https://goldsainte.ai/agent/payouts/${payoutId ?? ""}` }}
  />
)

export const template = {
  component: PayoutSentEmail,
  subject: 'A payout has been sent to your account',
  displayName: 'Payout Sent',
  previewData: {"amount": "USD 11,562.50", "tripName": "Amalfi in Bloom", "payoutId": "po-111"},
} satisfies TemplateEntry
