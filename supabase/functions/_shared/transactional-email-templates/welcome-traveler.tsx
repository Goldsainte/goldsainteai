/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface WelcomeTravelerProps {
  name?: string
}

export const WelcomeTravelerEmail = ({ name }: WelcomeTravelerProps) => (
  <AuthEmailLayout
    title={'Welcome to Goldsainte'}
    headline={name ? `Welcome, ${name}.` : 'Welcome to Goldsainte.'}
    tagline={`A curated marketplace of the world's most trusted travel specialists, creators, and brands.`}
    lede={`Your account is ready. Tell us where you want to go and our network of vetted specialists will design the trip — privately curated, expertly arranged, and bookable on-platform.`}
    steps={[
      `Submit a Trip Request — share your destination, dates, and style.`,
      `Receive bespoke proposals from hand-picked specialists.`,
      `Message and pay securely on-platform — never off it, per our Terms.`,
      `Confirm your trip and travel with full Goldsainte protection.`,
    ]}
    cta={{ label: 'Request a Trip', url: `https://goldsainte.ai/traveler` }}
  />
)

export const template = {
  component: WelcomeTravelerEmail,
  subject: 'Welcome to Goldsainte',
  displayName: 'Welcome — Traveler',
  previewData: { name: 'Alex' },
} satisfies TemplateEntry