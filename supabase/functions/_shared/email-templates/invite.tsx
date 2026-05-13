/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface Props { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ confirmationUrl }: Props) => (
  <AuthEmailLayout
    title="You're invited to Goldsainte"
    headline="You're invited to Goldsainte."
    tagline="A curated marketplace connecting discerning travelers with the world's most trusted specialists, creators, and brands."
    lede="Accept your invitation to activate your account and begin curating your journey."
    cta={{ label: 'Accept invitation', url: confirmationUrl }}
    steps={[
      'Accept your invitation to activate your account and secure your profile.',
      "You'll be guided to set a password and complete your profile.",
      'Tell us about your travel preferences so we can tailor recommendations.',
      'Browse trips designed by certified specialists and trusted creators.',
      'Request a trip or book directly — every reservation is protected on-platform.',
    ]}
  />
)

export default InviteEmail
