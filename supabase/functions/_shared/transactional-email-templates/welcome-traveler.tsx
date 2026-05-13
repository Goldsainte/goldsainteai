/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

export const WelcomeTravelerEmail = () => (
  <AuthEmailLayout
    title={"Welcome to Goldsainte"}
    headline={`Welcome to Goldsainte.`}
    tagline={`A curated marketplace connecting discerning travelers with the world's most trusted specialists, creators, and brands.`}
    lede={`Your account is approved. The world's most extraordinary travel experiences are now at your fingertips — privately curated, expertly arranged, and exclusively bookable.`}
    steps={[
    `Complete your traveler profile so specialists can tailor proposals to you.`,
    `Browse the marketplace of curated trips, storyboards, and specialists.`,
    `Submit a private trip request and receive bespoke proposals.`,
    `Communicate and pay securely on-platform.`,
    `Travel with confidence — every booking is protected by the Goldsainte Promise.`
  ]}
    cta={{ label: 'Open my dashboard', url: `https://goldsainte.ai/traveler` }}
  />
)

export const template = {
  component: WelcomeTravelerEmail,
  subject: "Welcome to Goldsainte",
  displayName: 'Welcome — Traveler',
  previewData: {"name": "Alexandra"},
} satisfies TemplateEntry
