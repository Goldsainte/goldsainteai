/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  requestId?: string
}

export const TripRequestReceivedEmail = ({ requestId }: Props) => (
  <AuthEmailLayout
    title={"We've received your trip request"}
    headline={`Your request is being reviewed.`}
    tagline={`Your private brief is now in the hands of our most trusted specialists.`}
    lede={`Thank you for sharing your vision with us. Vetted specialists matching your destination, dates, and budget are reviewing your brief now and will respond with bespoke proposals shortly.`}
    steps={[
    `Your brief is matched against our network of specialists in real time.`,
    `Specialists will respond with tailored proposals — typically within 24 to 72 hours.`,
    `You will be notified by email each time a new proposal arrives.`,
    `Compare proposals side-by-side in your dashboard.`,
    `Accept the one that resonates — payment and contracts are handled on-platform.`
  ]}
    cta={{ label: 'View my request', url: `https://goldsainte.ai/traveler/requests/${requestId ?? ""}` }}
  />
)

export const template = {
  component: TripRequestReceivedEmail,
  subject: "We've received your trip request",
  displayName: 'Trip Request Received',
  previewData: {"name": "Alexandra", "destination": "Amalfi Coast", "requestId": "abc-123"},
} satisfies TemplateEntry
