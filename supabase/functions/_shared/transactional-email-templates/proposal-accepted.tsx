/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  travelerName?: string
  tripName?: string
}

export const ProposalAcceptedEmail = ({ bookingId, travelerName, tripName }: Props) => (
  <AuthEmailLayout
    title='Your proposal has been accepted'
    headline={`Your proposal has been accepted.`}
    tagline={`${travelerName ?? ""} has chosen to move forward with your proposal.`}
    lede={`Congratulations. The traveler has accepted your proposal for ${tripName ?? ""}. Funds are now held in escrow and the contract is in effect.`}
    steps={[
    `Review the signed contract in your dashboard.`,
    `Begin coordination with the traveler on-platform.`,
    `Funds release on milestones as per the contract.`,
    `Payouts settle to your connected Stripe account.`,
    `Deliver an extraordinary experience — and earn a glowing review.`
  ]}
    cta={{ label: 'View booking', url: `https://goldsainte.ai/agent/bookings/${bookingId ?? ""}` }}
  />
)

export const template = {
  component: ProposalAcceptedEmail,
  subject: 'Your proposal has been accepted',
  displayName: 'Proposal Accepted',
  previewData: {"travelerName": "Alexandra", "tripName": "Amalfi in Bloom", "bookingId": "b-789"},
} satisfies TemplateEntry
