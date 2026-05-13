/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  specialistName?: string
  tripName?: string
}

export const BookingConfirmationTravelerEmail = ({ bookingId, specialistName, tripName }: Props) => (
  <AuthEmailLayout
    title={"Your trip is confirmed"}
    headline={`Your trip is confirmed.`}
    tagline={`Every detail has been arranged. We wish you an extraordinary journey.`}
    lede={`Your booking with ${specialistName ?? ""} for ${tripName ?? ""} has been confirmed and the contract is now in effect. Payment has been processed and held securely in escrow.`}
    steps={[
    `Your itinerary, contract, and receipts are saved in your dashboard.`,
    `Funds are held in escrow and released to your specialist on agreed milestones.`,
    `Message your specialist anytime — all comms must remain on-platform.`,
    `Pre-departure reminders will be sent automatically.`,
    `After your trip, you'll be invited to leave a private review.`
  ]}
    cta={{ label: 'View my booking', url: `https://goldsainte.ai/traveler/bookings/${bookingId ?? ""}` }}
  />
)

export const template = {
  component: BookingConfirmationTravelerEmail,
  subject: "Your trip is confirmed",
  displayName: 'Booking Confirmation — Traveler',
  previewData: {"specialistName": "Maison Atelier", "tripName": "Amalfi in Bloom", "bookingId": "b-789"},
} satisfies TemplateEntry
