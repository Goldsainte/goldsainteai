/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  requestSummary?: string
  travelerName?: string
}

export const ProposalDeclinedEmail = ({ requestSummary, travelerName }: Props) => (
  <AuthEmailLayout
    title={"Your proposal was not selected"}
    headline={`Thank you for submitting.`}
    tagline={`Your proposal was thoughtfully reviewed.`}
    lede={`${travelerName ?? ""} has decided not to move forward with your proposal for ${requestSummary ?? ""}. Every proposal sharpens your craft — the next opportunity is already in motion.`}
    steps={[
    `Review the request in your dashboard if you wish to learn more.`,
    `Travelers often decline due to timing, scope, or fit — not quality.`,
    `New matching requests are surfaced to you continuously.`,
    `Consider refining your storefront or services to broaden your reach.`,
    `Our team is here to help you grow your practice.`
  ]}
    cta={{ label: 'View dashboard', url: `https://goldsainte.ai/agent-dashboard` }}
  />
)

export const template = {
  component: ProposalDeclinedEmail,
  subject: "Your proposal was not selected",
  displayName: 'Proposal Declined',
  previewData: {"travelerName": "Alexandra", "requestSummary": "a 7-night Amalfi trip"},
} satisfies TemplateEntry
