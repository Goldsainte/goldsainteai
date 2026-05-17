/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface ApplicationDeclinedProps {
  recipientName?: string
  adminNotes?: string
}

export const ApplicationDeclinedProfessionalEmail = ({
  recipientName,
  adminNotes,
}: ApplicationDeclinedProps) => (
  <AuthEmailLayout
    title={'Update on your Goldsainte application'}
    headline={recipientName ? `Thank you, ${recipientName}.` : `Thank you for applying.`}
    tagline={`A curated marketplace of the world's most trusted travel specialists, creators, and brands.`}
    lede={
      adminNotes
        ? `After careful review, we're unable to approve your application at this time. A note from our team: "${adminNotes}"`
        : `After careful review, we're unable to approve your application at this time. We deeply appreciate your interest in joining the Goldsainte network.`
    }
    steps={[
      `Our reviewers consider experience, references, and alignment with our standards of trust and taste.`,
      `You're welcome to reapply in the future as your portfolio and credentials evolve.`,
      `If you have questions or would like additional context, reach our team at support@goldsainte.ai.`,
      `Until then, we wish you continued success in your work.`,
    ]}
    cta={{ label: 'Contact our team', url: `mailto:support@goldsainte.ai` }}
  />
)

export const template = {
  component: ApplicationDeclinedProfessionalEmail,
  subject: 'Update on your Goldsainte application',
  displayName: 'Application declined — Specialist',
  previewData: {
    recipientName: 'Jimmy',
    adminNotes: 'We would welcome a future application once you have additional verifiable references.',
  },
} satisfies TemplateEntry
