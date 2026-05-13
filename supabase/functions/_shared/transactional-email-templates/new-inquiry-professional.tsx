/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  inquiryId?: string
  travelerName?: string
}

export const NewInquiryProfessionalEmail = ({ inquiryId, travelerName }: Props) => (
  <AuthEmailLayout
    title='{travelerName} sent you a direct inquiry'
    headline={`You have a new direct inquiry.`}
    tagline={`A traveler has reached out to you privately.`}
    lede={`${travelerName ?? ""} found your profile and sent a direct request. They are interested in your services and would like to begin a private conversation.`}
    steps={[
    `Open the inquiry to review the brief.`,
    `Respond with a tailored proposal or initial message.`,
    `All conversation and payment must stay on-platform.`,
    `Direct inquiries typically convert faster than open requests.`,
    `Aim to respond within 24 hours for best results.`
  ]}
    cta={{ label: 'Open inquiry', url: `https://goldsainte.ai/agent/inquiries/${inquiryId ?? ""}` }}
  />
)

export const template = {
  component: NewInquiryProfessionalEmail,
  subject: (d: any) => `${d.travelerName ?? ""} sent you a direct inquiry`,
  displayName: 'New Inquiry — Specialist',
  previewData: {"travelerName": "Alexandra", "inquiryId": "i-654"},
} satisfies TemplateEntry
