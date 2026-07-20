/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  destination?: string
  requestId?: string
}

export const NewTripMatchEmail = ({ destination, requestId }: Props) => (
  <AuthEmailLayout
    title={"A traveler is seeking your specialty"}
    headline={`A trip request matches your specialty.`}
    tagline={`A discerning traveler is seeking a specialist for ${destination ?? ""}.`}
    lede={`Their brief aligns with your destinations, services, and price tier. Review the request and submit a bespoke proposal — first thoughtful responses receive the most attention.`}
    steps={[
    `Read the full traveler brief in your dashboard.`,
    `Craft a tailored proposal — itinerary, inclusions, total investment.`,
    `Submit before competitors do.`,
    `Communicate with the traveler on-platform once invited.`,
    `All accepted bookings are paid securely through Stripe, straight to your account.`
  ]}
    cta={{ label: 'View request', url: `https://goldsainte.ai/marketplace/request/${requestId ?? ""}` }}
  />
)

export const template = {
  component: NewTripMatchEmail,
  subject: "A traveler is seeking your specialty",
  displayName: 'New Trip Match',
  previewData: {"destination": "Amalfi Coast", "requestId": "abc-123"},
} satisfies TemplateEntry
