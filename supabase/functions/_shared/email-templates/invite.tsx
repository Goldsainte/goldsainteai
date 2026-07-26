/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <AuthEmailLayout
    title="You've been invited — Goldsainte"
    headline="You've been invited."
    tagline="An invitation to join Goldsainte — a curated marketplace for discerning travelers and the world's most trusted specialists."
    lede="Accept your invitation below to activate your account and begin curating your journey."
    cta={{ label: 'Accept invitation', url: confirmationUrl }}
    steps={[
      // ROLE-NEUTRAL (Jul 26). Invitations go to travelers, creators and
      // agents; these steps assumed a traveler ("concierge dashboard",
      // "our specialists can tailor recommendations to you") which reads
      // wrong to an invited specialist.
      'Accept your invitation to activate your account and secure your profile.',
      "You'll be signed in automatically and taken to your dashboard.",
      'Complete your profile — it is what other people on Goldsainte see.',
      'Everything runs on-platform: messages, agreements and payments alike, per our Terms.',
    ]}
  />
)

export default InviteEmail
