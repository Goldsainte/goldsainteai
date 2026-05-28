/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  amount?: string
  bookingId?: string
  tripName?: string
}

export const PaymentReceiptEmail = ({ amount, bookingId, tripName }: Props) => (
  <AuthEmailLayout
    title={"Your Goldsainte payment receipt"}
    headline={`Payment received.`}
    tagline={`A formal receipt for your records.`}
    lede={`We have successfully processed your payment of ${amount ?? ""} for ${tripName ?? ""}. This serves as your official receipt for the transaction.`}
    steps={[
    `Funds are held in escrow until milestones are met.`,
    `A full receipt PDF is available in your dashboard.`,
    `All transactions are protected by the Goldsainte Promise.`,
    `Refunds, if applicable, follow the cancellation terms in your contract.`,
    `For accounting questions, contact our concierge team.`
  ]}
    cta={{ label: 'Download receipt', url: `https://goldsainte.ai/bookings/${bookingId ?? ""}` }}
  />
)

export const template = {
  component: PaymentReceiptEmail,
  subject: "Your Goldsainte payment receipt",
  displayName: 'Payment Receipt',
  previewData: {"amount": "USD 12,500.00", "tripName": "Amalfi in Bloom", "bookingId": "b-789"},
} satisfies TemplateEntry
