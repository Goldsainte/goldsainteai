/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  tripId?: string
  tripName?: string
}

export const TripPublishedEmail = ({ tripId, tripName }: Props) => (
  <AuthEmailLayout
    title={"Your trip is live on the marketplace"}
    headline={`Your trip is now live.`}
    tagline={`Discerning travelers can now discover your storyboard.`}
    lede={`Your packaged trip ${tripName ?? ""} has passed moderation and is now visible on the Goldsainte marketplace. Travelers may book it directly or request bespoke variations.`}
    steps={[
    `View your live listing exactly as travelers see it.`,
    `Share the link with your audience to drive direct bookings.`,
    `Inbound inquiries appear in your dashboard.`,
    `Refine pricing, photos, and inclusions anytime.`,
    `We promote the most exceptional listings to our curated audience.`
  ]}
    cta={{ label: 'View live trip', url: `https://goldsainte.ai/marketplace/trips/${tripId ?? ""}` }}
  />
)

export const template = {
  component: TripPublishedEmail,
  subject: "Your trip is live on the marketplace",
  displayName: 'Trip Published',
  previewData: {"tripName": "Amalfi in Bloom", "tripId": "t-222"},
} satisfies TemplateEntry
