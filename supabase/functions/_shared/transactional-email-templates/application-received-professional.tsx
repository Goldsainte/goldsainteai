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
      `Our team reviews your application within 24–48 hours.`,
      `You'll receive an approval email with credentials to access your dashboard.`,
      `Complete identity verification and connect Stripe to start receiving trip requests.`,
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