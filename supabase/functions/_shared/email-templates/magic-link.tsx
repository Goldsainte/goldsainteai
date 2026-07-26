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
      // ROLE-NEUTRAL (Jul 26). Magic links are issued to travelers, creators
      // and agents alike, but these steps described a traveler's concierge
      // dashboard and "planning with your specialist" — wrong for the two
      // roles that ARE the specialists. The hook doesn't reliably know the
      // role on a sign-in link, so this stays accurate for everyone.
      "You'll be signed in automatically and returned to where you left off.",
      'Your dashboard opens with whatever needs your attention first.',
      'This link is single-use and expires shortly — request a new one anytime.',
    ]}
  />
)

export default MagicLinkEmail
