/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  specialistName?: string
}

export const ReviewRequestEmail = ({ bookingId, specialistName }: Props) => (
  <AuthEmailLayout
    title={"Share your Goldsainte experience"}
    headline={`How was your journey?`}
    tagline={`Your private review helps maintain the quality of our marketplace.`}
    lede={`Welcome home. We hope your trip with ${specialistName ?? ""} was everything you imagined. Your honest review — visible only to admins and the specialist — helps us preserve the integrity of the Goldsainte network.`}
    steps={[
    `Rate your overall experience and the specialist's craft.`,
    `Share what was extraordinary — and what could improve.`,
    `Reviews are private by default; you may opt to publish.`,
    `Specialists may respond once.`,
    `Your feedback shapes the future of our marketplace.`
  ]}
    cta={{ label: 'Leave a review', url: `https://goldsainte.ai/traveler/bookings/${bookingId ?? ""}/review` }}
  />
)

export const template = {
  component: ReviewRequestEmail,
  subject: "Share your Goldsainte experience",
  displayName: 'Post-Trip Review Request',
  previewData: {"specialistName": "Maison Atelier", "bookingId": "b-789"},
} satisfies TemplateEntry
