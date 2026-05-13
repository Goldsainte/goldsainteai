/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  statusDetail?: string
  verificationStatus?: string
}

export const IdentityVerificationUpdateEmail = ({ statusDetail, verificationStatus }: Props) => (
  <AuthEmailLayout
    title='Identity verification update'
    headline={`Identity verification update.`}
    tagline={`Your Stripe Identity verification status has changed.`}
    lede={`Stripe Identity has updated your verification status to: ${verificationStatus ?? ""}. ${statusDetail ?? ""}`}
    steps={[
    `View your verification status in your dashboard.`,
    `If approved, all features are now unlocked.`,
    `If additional information is required, follow the link provided.`,
    `Re-verification is rare but may be requested for security.`,
    `Contact our concierge team if you have questions.`
  ]}
    cta={{ label: 'Open dashboard', url: `https://goldsainte.ai/account/verification` }}
  />
)

export const template = {
  component: IdentityVerificationUpdateEmail,
  subject: 'Identity verification update',
  displayName: 'Identity Verification Update',
  previewData: {"verificationStatus": "Verified", "statusDetail": "All marketplace features are now unlocked."},
} satisfies TemplateEntry
