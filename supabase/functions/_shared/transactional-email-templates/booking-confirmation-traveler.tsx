/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  specialistName?: string
  tripName?: string
  bookingReference?: string
  amountPaid?: string
  tripTotal?: string
  balanceDue?: string
  currency?: string
}

export const BookingConfirmationTravelerEmail = ({
  bookingId,
  specialistName,
  tripName,
  bookingReference,
  amountPaid,
  tripTotal,
  balanceDue,
  currency = 'USD',
}: Props) => {
  const sym = currency === 'USD' ? '$' : ''
  const details = [
    bookingReference ? { label: 'Booking reference', value: bookingReference } : null,
    tripTotal ? { label: 'Trip total', value: `${sym}${tripTotal}` } : null,
    amountPaid ? { label: 'Deposit paid', value: `${sym}${amountPaid}` } : null,
    balanceDue ? { label: 'Balance remaining', value: `${sym}${balanceDue}` } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <AuthEmailLayout
      title={"Your trip is confirmed"}
      headline={`Your trip is confirmed.`}
      tagline={`Every detail has been arranged. We wish you an extraordinary journey.`}
      lede={`Your booking with ${specialistName ?? ""} for ${tripName ?? ""} has been confirmed and the contract is now in effect. Your deposit has been processed and is held securely in escrow.`}
      details={details}
      steps={[
        `Your specialist will contact you within 24 hours to confirm trip details.`,
        balanceDue
          ? `Your balance of ${sym}${balanceDue} is due before departure.`
          : `Any remaining balance is due before departure.`,
        `Your itinerary, contract, and receipts are saved in your dashboard.`,
        `Funds are held in escrow and released to your specialist on agreed milestones.`,
        `Message your specialist anytime from your bookings dashboard — all comms stay on-platform.`,
      ]}
      cta={{ label: 'View my booking', url: `https://goldsainte.ai/bookings/${bookingId ?? ""}` }}
    />
  )
}

export const template = {
  component: BookingConfirmationTravelerEmail,
  subject: "Your trip is confirmed",
  displayName: 'Booking Confirmation — Traveler',
  previewData: {
    specialistName: "Maison Atelier",
    tripName: "Amalfi in Bloom",
    bookingId: "b-789",
    bookingReference: "GS-7850DBA8",
    amountPaid: "5",
    tripTotal: "20",
    balanceDue: "15",
    currency: "USD",
  },
} satisfies TemplateEntry
