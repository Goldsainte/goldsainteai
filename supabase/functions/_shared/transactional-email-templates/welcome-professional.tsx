/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

export const WelcomeProfessionalEmail = () => (
  <AuthEmailLayout
    title={"Welcome to Goldsainte"}
    headline={`Welcome to the Goldsainte network.`}
    tagline={`A curated marketplace of the world's most trusted travel specialists, creators, and brands.`}
    lede={`Your application has been approved. You are now part of an invitation-only community of travel professionals serving the world's most discerning travelers.`}
    steps={[
    `Complete your public profile — this is your storefront.`,
    `Connect Stripe to receive on-platform payouts.`,
    `Publish your first storyboard or packaged trip.`,
    `Respond to inbound trip requests in your dashboard.`,
    `All communication and payment must remain on-platform per our Terms.`
  ]}
    cta={{ label: 'Open my dashboard', url: `https://goldsainte.ai/agent` }}
  />
)

export const template = {
  component: WelcomeProfessionalEmail,
  subject: "Welcome to Goldsainte",
  displayName: 'Welcome — Specialist',
  previewData: {"name": "Maison Atelier"},
} satisfies TemplateEntry
