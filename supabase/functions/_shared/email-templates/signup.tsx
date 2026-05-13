/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface Props { siteName: string; siteUrl: string; recipient: string; confirmationUrl: string }

export const SignupEmail = ({ confirmationUrl }: Props) => (
  <AuthEmailLayout
    title="Confirm your email — Goldsainte"
    headline="Welcome to Goldsainte."
    tagline="A curated marketplace connecting discerning travelers with the world's most trusted specialists, creators, and brands."
    lede="Confirm your email address to activate your account and begin curating your journey."
    cta={{ label: 'Confirm my email', url: confirmationUrl }}
    steps={[
      'Confirm your email to activate your account and secure your profile.',
      "You'll be signed in automatically and guided to your personal concierge dashboard.",
      'Complete your traveler profile so our specialists can tailor recommendations to your taste.',
      'Browse curated trips across 50+ countries, designed by certified specialists and trusted creators.',
      'Request a trip or book directly — every reservation is protected on-platform from inquiry to return.',
    ]}
  />
)

export default SignupEmail
