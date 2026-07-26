/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface WelcomeProfessionalProps {
  name?: string
  accountType?: 'agent' | 'brand' | 'creator'
}

export const WelcomeProfessionalEmail = ({ name, accountType = 'agent' }: WelcomeProfessionalProps) => {
  // DEAD LINKS (fixed Jul 26): '/agent', '/brand' and '/creator' are not
  // registered routes — the main CTA of the welcome email 404'd. The real
  // dashboards are '-dashboard' suffixed.
  const dashboardPath =
    accountType === 'brand'
      ? '/partner-bookings'
      : accountType === 'creator'
        ? '/creator-dashboard'
        : '/agent-dashboard'
  return (
    <AuthEmailLayout
      title={"You're approved — your account is live"}
      headline={name ? `You're all set, ${name}.` : `You're all set.`}
      tagline={`A curated marketplace of the world's most trusted travel specialists, creators, and brands.`}
      lede={`Your application has been reviewed and approved — your Goldsainte account is now live. The final step before you start receiving trip requests is connecting Stripe so you can be paid on-platform.`}
      steps={[
        `Connect Stripe Connect — required to receive payouts.`,
        `Complete your public profile — this is your storefront.`,
        `Publish your first Storyboard or packaged trip.`,
        `Respond to inbound trip requests from your dashboard.`,
        `All communication and payment must remain on-platform per our Terms.`,
      ]}
      cta={{ label: 'Open my dashboard', url: `https://goldsainte.ai${dashboardPath}` }}
    />
  )
}

export const template = {
  component: WelcomeProfessionalEmail,
  subject: "You're approved — your Goldsainte account is live",
  displayName: 'Welcome — Specialist (post-approval)',
  previewData: { name: 'Maison Atelier', accountType: 'agent' },
} satisfies TemplateEntry
