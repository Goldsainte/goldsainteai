/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  specialistName?: string
  tripId?: string
  tripName?: string
}

export const AdminNewTripPendingEmail = ({ specialistName, tripId, tripName }: Props) => (
  <AuthEmailLayout
    title='New trip awaiting moderation'
    headline={`A new trip awaits moderation.`}
    tagline={`A specialist has published a trip for review.`}
    lede={`${specialistName ?? ""} has submitted ${tripName ?? ""} for moderation. Review the storyboard, pricing, and inclusions to ensure the listing meets Goldsainte standards.`}
    steps={[
    `Open the moderation queue.`,
    `Review imagery, copy, and policy compliance.`,
    `Approve to publish to the marketplace.`,
    `Decline with feedback — the specialist is notified automatically.`,
    `All moderation decisions are recorded in the audit log.`
  ]}
    cta={{ label: 'Open moderation queue', url: `https://goldsainte.ai/admin/trips/${tripId ?? ""}` }}
  />
)

export const template = {
  component: AdminNewTripPendingEmail,
  subject: 'New trip awaiting moderation',
  displayName: 'Admin — New Trip Pending',
  previewData: {"specialistName": "Maison Atelier", "tripName": "Amalfi in Bloom", "tripId": "t-222"},
} satisfies TemplateEntry
