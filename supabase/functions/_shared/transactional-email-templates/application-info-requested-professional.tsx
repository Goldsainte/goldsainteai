/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface ApplicationInfoRequestedProps {
  recipientName?: string
  applicationId?: string
  adminNotes?: string
}

export const ApplicationInfoRequestedProfessionalEmail = ({
  recipientName,
  applicationId,
  adminNotes,
}: ApplicationInfoRequestedProps) => (
  <AuthEmailLayout
    title={'We need a little more information'}
    headline={recipientName ? `A quick request, ${recipientName}.` : `A quick request.`}
    tagline={`A curated marketplace of the world's most trusted travel specialists, creators, and brands.`}
    lede={
      adminNotes
        ? `Our reviewers need a little more information before we can complete your application: "${adminNotes}"`
        : `Our reviewers need a little more information before we can complete your application. Please update your submission at your earliest convenience.`
    }
    steps={[
      `Open your application using the button below.`,
      `Provide the requested information or supporting documents.`,
      `Resubmit — your application returns to active review within 24–48 hours.`,
      `Questions? Reply to this email or write to support@goldsainte.ai.`,
    ]}
    cta={{
      label: 'Update your application',
      url: applicationId
        ? `https://goldsainte.ai/application/status?id=${applicationId}`
        : `https://goldsainte.ai/application/status`,
    }}
  />
)

export const template = {
  component: ApplicationInfoRequestedProfessionalEmail,
  subject: 'Additional information needed for your Goldsainte application',
  displayName: 'Application — info requested',
  previewData: {
    recipientName: 'Jimmy',
    applicationId: 'abc-123',
    adminNotes: 'Please share two professional references from recent clients.',
  },
} satisfies TemplateEntry
