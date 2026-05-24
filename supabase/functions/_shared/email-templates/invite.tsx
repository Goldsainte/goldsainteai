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
      'Accept your invitation to activate your account and secure your profile.',
      "You'll be signed in automatically and guided to your concierge dashboard.",
      'Complete your profile so our specialists can tailor recommendations to your taste.',
      'Browse curated trips across 50+ countries, designed by certified specialists and trusted creators.',
      'Request a trip or book directly — every reservation is protected on-platform.',
    ]}
  />
)

export default InviteEmail
