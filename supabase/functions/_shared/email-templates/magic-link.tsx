/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <AuthEmailLayout
    title="Your sign-in link — Goldsainte"
    headline="Your sign-in link."
    tagline="One secure link, signed and ready — no password required."
    lede="Click the button below to sign in to your Goldsainte account. This link expires shortly for your security."
    cta={{ label: 'Sign in to Goldsainte', url: confirmationUrl }}
    steps={[
      "You'll be signed in automatically and returned to where you left off.",
      'Review your concierge dashboard, saved trips, and recent inquiries.',
      'Continue planning with your specialist or browse new curated journeys.',
    ]}
  />
)

export default MagicLinkEmail
