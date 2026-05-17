/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface ApplicationApprovedProps {
  recipientName?: string
  applicationType?: 'agent' | 'brand' | 'creator'
  stripeOnboardingUrl?: string
  adminNotes?: string
}

export const ApplicationApprovedProfessionalEmail = ({
  recipientName,
  applicationType = 'agent',
  stripeOnboardingUrl,
  adminNotes,
}: ApplicationApprovedProps) => {
  const typeLabel =
    applicationType === 'brand' ? 'brand' : applicationType === 'creator' ? 'creator' : 'advisor'

  const steps = [
    `Log in with the email you applied with — you'll set your permanent password on first sign-in.`,
    `Complete Stripe Identity verification to unlock your dashboard.`,
    stripeOnboardingUrl
      ? `Connect your bank account through Stripe Connect to receive on-platform payouts.`
      : `Set up your public profile and your first Storyboard.`,
    `All communication and payment must remain on-platform per our Terms.`,
  ]

  const lede = adminNotes
    ? `Your ${typeLabel} application has been approved. A note from our team: "${adminNotes}"`
    : `Your ${typeLabel} application has been approved. Welcome to the Goldsainte network — a curated marketplace built on trust, taste, and discretion.`

  return (
    <AuthEmailLayout
      title={'Your Goldsainte application has been approved'}
      headline={recipientName ? `Welcome, ${recipientName}.` : `Welcome to Goldsainte.`}
      tagline={`A curated marketplace of the world's most trusted travel specialists, creators, and brands.`}
      lede={lede}
      steps={steps}
      cta={{
        label: 'Sign in to your dashboard',
        url: stripeOnboardingUrl || `https://goldsainte.ai/login`,
      }}
    />
  )
}

export const template = {
  component: ApplicationApprovedProfessionalEmail,
  subject: 'Your Goldsainte application has been approved',
  displayName: 'Application approved — Specialist',
  previewData: {
    recipientName: 'Jimmy',
    applicationType: 'agent',
    stripeOnboardingUrl: 'https://connect.stripe.com/setup/example',
    adminNotes: 'Delighted to have you with us.',
  },
} satisfies TemplateEntry
