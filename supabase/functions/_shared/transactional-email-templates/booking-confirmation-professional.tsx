/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  travelerName?: string
  tripName?: string
}

export const BookingConfirmationProfessionalEmail = ({ bookingId, travelerName, tripName }: Props) => (
  <AuthEmailLayout
    title={"New booking confirmed"}
    headline={`A new booking is confirmed.`}
    tagline={`Funds are held in escrow. Begin coordination at your convenience.`}
    lede={`${travelerName ?? ""} has confirmed their booking for ${tripName ?? ""}. The contract is in effect and the first milestone payment has been escrowed.`}
    steps={[
    `Review the contract and traveler details in your dashboard.`,
    `Begin on-platform coordination with the traveler.`,
    `Hit each milestone — funds release on completion.`,
    `Payouts settle to your connected Stripe account.`,
    `Communication and payment must remain on-platform.`
  ]}
    cta={{ label: 'Open booking', url: `https://goldsainte.ai/partner-bookings` }}
  />
)

export const template = {
  component: BookingConfirmationProfessionalEmail,
  subject: "New booking confirmed",
  displayName: 'Booking Confirmation — Specialist',
  previewData: {"travelerName": "Alexandra", "tripName": "Amalfi in Bloom", "bookingId": "b-789"},
} satisfies TemplateEntry
