/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  daysUntil?: string
  specialistName?: string
  tripName?: string
}

export const TripReminderEmail = ({ bookingId, daysUntil, specialistName, tripName }: Props) => (
  <AuthEmailLayout
    title='Your trip with {specialistName} is approaching'
    headline={`Your journey begins soon.`}
    tagline={`A gentle reminder ahead of your departure.`}
    lede={`Your trip ${tripName ?? ""} departs in ${daysUntil ?? ""} days. Now is a good time to review your itinerary, confirm logistics, and reach out to ${specialistName ?? ""} with any final questions.`}
    steps={[
    `Review your full itinerary and printable PDF in your dashboard.`,
    `Confirm passports, visas, and travel insurance are in order.`,
    `Message ${specialistName ?? ""} for last-minute requests.`,
    `Save the emergency concierge number to your phone.`,
    `We hope you have an extraordinary journey.`
  ]}
    cta={{ label: 'View itinerary', url: `https://goldsainte.ai/traveler/bookings/${bookingId ?? ""}` }}
  />
)

export const template = {
  component: TripReminderEmail,
  subject: (d: any) => `Your trip with ${d.specialistName ?? ""} is approaching`,
  displayName: 'Trip Reminder',
  previewData: {"tripName": "Amalfi in Bloom", "specialistName": "Maison Atelier", "daysUntil": "7", "bookingId": "b-789"},
} satisfies TemplateEntry
