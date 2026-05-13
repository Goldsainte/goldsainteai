/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  applicantName?: string
  applicantRole?: string
  applicationId?: string
}

export const AdminNewUserPendingEmail = ({ applicantName, applicantRole, applicationId }: Props) => (
  <AuthEmailLayout
    title={"New {applicantRole} application awaiting review"}
    headline={`A new application is pending.`}
    tagline={`An applicant has submitted documents for review.`}
    lede={`${applicantName ?? ""} has applied as a ${applicantRole ?? ""}. Their identity verification, credentials, and supporting materials are ready for your review.`}
    steps={[
    `Open the admin queue to review the application.`,
    `Verify identity, credentials, and platform fit.`,
    `Approve to provision their account and send the welcome email.`,
    `Decline with a reason — the applicant is notified automatically.`,
    `All admin decisions are recorded in the audit log.`
  ]}
    cta={{ label: 'Open admin queue', url: `https://goldsainte.ai/admin/applications/${applicationId ?? ""}` }}
  />
)

export const template = {
  component: AdminNewUserPendingEmail,
  subject: (d: any) => `New ${d.applicantRole ?? ""} application awaiting review`,
  displayName: 'Admin — New User Pending',
  previewData: {"applicantName": "Maison Atelier", "applicantRole": "creator", "applicationId": "ap-555"},
} satisfies TemplateEntry
