/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  conversationId?: string
  senderName?: string
}

export const NewMessageProfessionalEmail = ({ conversationId, senderName }: Props) => (
  <AuthEmailLayout
    title={"New message from {senderName}"}
    headline={`You have a new message.`}
    tagline={`${senderName ?? ""} has sent you a private message.`}
    lede={`A new message is waiting in your Goldsainte inbox. All conversations remain securely on-platform to protect both parties.`}
    steps={[
    `Open the thread to read the full message.`,
    `Reply directly within your dashboard.`,
    `All communication must stay on-platform per our Terms.`,
    `Attachments and proposals are saved automatically.`,
    `Aim to respond within 24 hours for best results.`
  ]}
    cta={{ label: 'Open conversation', url: `https://goldsainte.ai/messages/${conversationId ?? ""}` }}
  />
)

export const template = {
  component: NewMessageProfessionalEmail,
  subject: (d: any) => `New message from ${d.senderName ?? ""}`,
  displayName: 'New Message — Specialist',
  previewData: {"senderName": "Alexandra", "conversationId": "c-321"},
} satisfies TemplateEntry
