/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

export interface TripInquiryEmailProps {
  siteName: string
  confirmationUrl: string   // magic link — signs the traveller in and opens the conversation
  hostName: string
  tripTitle: string
  question: string
}

export const TripInquiryEmail = ({
  confirmationUrl,
  hostName,
  tripTitle,
  question,
}: TripInquiryEmailProps) => (
  <AuthEmailLayout
    title={`Your question is on its way to ${hostName} — Goldsainte`}
    headline={`Your question is on its way.`}
    tagline={`We've sent your question about "${tripTitle}" to ${hostName}.`}
    lede={`Here's what you asked:\n\n"${question}"`}
    cta={{ label: `Open the conversation`, url: confirmationUrl }}
    steps={[
      `Your question is with ${hostName} — they'll reply as soon as possible.`,
      'Open the conversation to follow it — you\'ll be signed in automatically, no password needed.',
      'You can reply and pick up the conversation any time from this link.',
    ]}
  />
)

export default TripInquiryEmail
