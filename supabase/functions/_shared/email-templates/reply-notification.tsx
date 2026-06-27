/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

export interface ReplyNotificationEmailProps {
  senderName: string
  tripTitle: string
  preview: string
  confirmationUrl: string // magic link — signs the traveller in and opens the conversation
}

export const ReplyNotificationEmail = ({
  senderName,
  tripTitle,
  preview,
  confirmationUrl,
}: ReplyNotificationEmailProps) => (
  <AuthEmailLayout
    title={`${senderName} replied — Goldsainte`}
    headline={`${senderName} replied.`}
    tagline={`A reply to your question about "${tripTitle}".`}
    lede={`"${preview}"`}
    cta={{ label: 'Open conversation', url: confirmationUrl }}
    steps={[
      'Open the conversation to read the full reply and respond.',
      "You'll be signed in automatically — no password needed.",
      'You can pick the conversation back up any time from this link.',
    ]}
  />
)

export default ReplyNotificationEmail
