/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  proposalId?: string
  specialistName?: string
}

export const NewProposalReceivedEmail = ({ proposalId, specialistName }: Props) => (
  <AuthEmailLayout
    title={"A new proposal has arrived"}
    headline={`A bespoke proposal awaits.`}
    tagline={`${specialistName ?? ""} has crafted a private proposal in response to your trip request.`}
    lede={`Review the itinerary, pricing, and inclusions in your dashboard. You may compare it alongside any other proposals you've received before deciding.`}
    steps={[
    `Review the full itinerary, day-by-day inclusions, and total investment.`,
    `Compare with other proposals received for the same request.`,
    `Message ${specialistName ?? ""} directly with questions or refinements.`,
    `Accept to proceed — your deposit is paid securely through Stripe to your specialist.`,
    `All communication and payment must remain on-platform per our Trust & Safety policy.`
  ]}
    cta={{ label: 'Review proposal', url: `https://goldsainte.ai/proposals/${proposalId ?? ""}` }}
  />
)

export const template = {
  component: NewProposalReceivedEmail,
  subject: "A new proposal has arrived",
  displayName: 'New Proposal Received',
  previewData: {"specialistName": "Maison Atelier", "proposalId": "p-456"},
} satisfies TemplateEntry
