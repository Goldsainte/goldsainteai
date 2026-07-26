/// <reference types="npm:@types/react@18.3.1" />
// ============================================================================
// tip-received — branded notification to the professional who was tipped.
// Created Jul 26. Tips previously went out as ad-hoc inline HTML straight
// from stripe-webhook-handler, bypassing the branded transactional system —
// no fee breakdown table, no payout-timing expectations, off-house footer.
// ============================================================================
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface TipReceivedProps {
  firstName?: string
  /** e.g. "$10.00" */
  amount?: string
  /** e.g. "$9.30" — after the 7% platform fee */
  net?: string
  /** e.g. "$0.70" */
  fee?: string
  note?: string
}

export const TipReceivedEmail = ({
  firstName,
  amount = '$0.00',
  net = '$0.00',
  fee = '$0.00',
  note,
}: TipReceivedProps) => (
  <AuthEmailLayout
    title="You received a tip on Goldsainte"
    headline={firstName ? `A tip for you, ${firstName}.` : 'A tip for you.'}
    tagline={
      note
        ? `\u201C${note}\u201D`
        : 'A traveler wanted to say thank you for what you do.'
    }
    lede={`Someone sent you a ${amount} tip on Goldsainte. Here is exactly what happens with it:`}
    details={[
      { label: 'Tip amount', value: amount },
      { label: 'Platform fee (7%)', value: `\u2212${fee}` },
      { label: 'Yours', value: net },
    ]}
    steps={[
      `${net} was charged on your own connected Stripe account \u2014 Goldsainte never holds your money.`,
      `Stripe pays it out to your bank on the payout schedule set on your Stripe account. Goldsainte doesn't control that timing.`,
      `Your Stripe dashboard is the source of truth for when a payout actually lands \u2014 Goldsainte shows what you've earned, not what your bank has settled.`,
      `Nothing is needed from you \u2014 this email is just the good news.`,
    ]}
    cta={{ label: 'View earnings', url: 'https://goldsainte.ai/creator-dashboard?tab=earnings' }}
  />
)

export const template = {
  component: TipReceivedEmail,
  subject: (d: Record<string, any>) => `You received a ${d?.amount || 'new'} tip \u{1F389}`,
  displayName: 'Tip — received (professional)',
  previewData: { firstName: 'Tanya', amount: '$10.00', net: '$9.30', fee: '$0.70', note: 'Thanks for the Tokyo guide!' },
} satisfies TemplateEntry
