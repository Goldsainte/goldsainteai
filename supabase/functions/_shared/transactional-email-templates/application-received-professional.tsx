/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface ApplicationReceivedProps {
  agentName?: string
}

export const ApplicationReceivedProfessionalEmail = ({ agentName }: ApplicationReceivedProps) => (
  <AuthEmailLayout
    title={'Your Goldsainte advisor application has been received'}
    headline={agentName ? `Thank you, ${agentName}.` : `Your application has been received.`}
    tagline={`A curated marketplace of the world's most trusted travel specialists, creators, and brands.`}
    lede={`We've received your application to join the Goldsainte advisor network. Our team will review it within 24–48 hours and email you the moment your account is approved.`}
    steps={[
      // CORRECTED Jul 26. Two things were false: applicants were told they'd
      // receive "credentials" (they keep the login they created — no password
      // is ever issued), and the order was inverted (identity verification
      // happens during the application, BEFORE review, not after approval).
      `You complete Stripe Identity verification as the final step of the application — it takes 2–3 minutes.`,
      `Our team then reviews your credentials, insurance and licence — typically within one to two business days.`,
      `We email you the moment a decision is made. On approval your dashboard unlocks with the login you already created — we never send passwords.`,
      `Connect Stripe from your dashboard so bookings pay out to your own account.`,
      `All communication and payment must remain on-platform per our Terms.`,
    ]}
    cta={{ label: 'Check application status', url: `https://goldsainte.ai/application/status` }}
  />
)

export const template = {
  component: ApplicationReceivedProfessionalEmail,
  subject: 'Your Goldsainte advisor application has been received',
  displayName: 'Application received — Specialist',
  previewData: { agentName: 'Jimmy' },
} satisfies TemplateEntry
