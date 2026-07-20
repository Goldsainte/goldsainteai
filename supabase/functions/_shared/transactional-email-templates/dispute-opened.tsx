/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  disputeId?: string
  disputeOpenedBy?: string
  tripName?: string
}

export const DisputeOpenedEmail = ({ disputeId, disputeOpenedBy, tripName }: Props) => (
  <AuthEmailLayout
    title={"A dispute has been opened"}
    headline={`A dispute has been opened.`}
    tagline={`Goldsainte has formally opened a dispute case.`}
    lede={`A dispute regarding ${tripName ?? ""} has been opened by ${disputeOpenedBy ?? ""}. Payments related to this booking are paused while our concierge team reviews the case. Both parties will be contacted shortly.`}
    steps={[
    `Our concierge team has been notified and will review the case.`,
    `Payments are paused pending resolution.`,
    `Both parties may submit supporting documentation.`,
    `Resolution typically occurs within 5–10 business days.`,
    `All comms regarding the dispute must remain on-platform.`
  ]}
    cta={{ label: 'View dispute', url: `https://goldsainte.ai/my-bookings` }}
  />
)

export const template = {
  component: DisputeOpenedEmail,
  subject: "A dispute has been opened",
  displayName: 'Dispute Opened',
  previewData: {"tripName": "Amalfi in Bloom", "disputeOpenedBy": "the traveler", "disputeId": "d-999"},
} satisfies TemplateEntry
