/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface Props { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ confirmationUrl }: Props) => (
  <AuthEmailLayout
    title="Your sign-in link — Goldsainte"
    headline="Sign in to Goldsainte."
    tagline="A passwordless link to access your concierge dashboard, valid for a short time only."
    lede="Use the secure link below to sign in to your account — no password required."
    cta={{ label: 'Sign me in', url: confirmationUrl }}
    steps={[
      'Click the button above to sign in instantly and securely.',
      "You'll arrive on your personal concierge dashboard.",
      'Pick up where you left off — saved trips, requests, and conversations.',
      'Continue browsing curated trips across 50+ countries.',
      'Reach out anytime if you need assistance from our specialists.',
    ]}
  />
)

export default MagicLinkEmail
