/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  /**
   * From user_metadata.account_type, set at signup. Without it every new
   * account — creator, agent, traveler alike — was told to "complete your
   * traveler profile" and browse trips, which is wrong for two thirds of
   * signups (founder report, Jul 26: a creator received traveler steps).
   */
  accountType?: 'traveler' | 'creator' | 'agent' | 'brand'
}

// What genuinely happens next, per role. Order mirrors the real flow.
const STEPS_BY_ROLE: Record<string, string[]> = {
  traveler: [
    'Confirm your email to activate your account and secure your profile.',
    "You'll be signed in automatically and taken to your traveler dashboard.",
    'Complete your traveler profile so specialists can tailor recommendations to your taste.',
    'Browse curated trips, or post a trip request and receive proposals from specialists.',
    'Book and pay on-platform — every reservation is protected from inquiry to return.',
  ],
  creator: [
    'Confirm your email to activate your account and secure your profile.',
    "You'll be signed in automatically and taken to your creator studio.",
    'Complete your creator profile and add photos and video — this is your storefront.',
    'Publish your first tour or digital itinerary guide.',
    'Connect Stripe so bookings, guide sales, and tips pay out to your own account.',
  ],
  agent: [
    'Confirm your email to activate your account and secure your profile.',
    "You'll be returned to your travel-agent application to finish the remaining steps.",
    'Complete Stripe Identity verification — this confirms who you are, and takes 2–3 minutes.',
    'Our team then reviews your credentials and insurance, typically within one to two business days.',
    "We'll email you the moment a decision is made — your dashboard unlocks on approval.",
  ],
}

export const SignupEmail = ({ confirmationUrl, accountType }: SignupEmailProps) => (
  <AuthEmailLayout
    title="Confirm your email — Goldsainte"
    headline="Welcome to Goldsainte."
    tagline="A curated marketplace connecting discerning travelers with the world's most trusted specialists, creators, and brands."
    lede={
      accountType === 'agent'
        ? 'Confirm your email address to activate your account and return to your application.'
        : accountType === 'creator'
        ? 'Confirm your email address to activate your account and open your creator studio.'
        : 'Confirm your email address to activate your account and begin curating your journey.'
    }
    cta={{ label: 'Confirm my email', url: confirmationUrl }}
    steps={STEPS_BY_ROLE[accountType ?? 'traveler'] ?? STEPS_BY_ROLE.traveler}
  />
)

export default SignupEmail
