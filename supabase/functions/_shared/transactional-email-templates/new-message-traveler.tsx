/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  conversationId?: string
  senderName?: string
}

export const NewMessageTravelerEmail = ({ conversationId, senderName }: Props) => (
  <AuthEmailLayout
    title={"New message from {senderName}"}
    headline={`You have a new message.`}
    tagline={`${senderName ?? ""} has sent you a private message regarding your trip.`}
    lede={`A new message is waiting in your Goldsainte inbox. All conversations remain securely on-platform to protect both parties.`}
    steps={[
    `Open the thread to read the full message.`,
    `Reply directly within your dashboard.`,
    `All communication must stay on-platform per our Terms.`,
    `Attachments and proposals are saved automatically.`,
    `Need help? Contact our concierge team.`
  ]}
    cta={{ label: 'Open conversation', url: `https://goldsainte.ai/messages?conversation=${conversationId ?? ""}` }}
  />
)

export const template = {
  component: NewMessageTravelerEmail,
  subject: (d: any) => `New message from ${d.senderName ?? ""}`,
  displayName: 'New Message — Traveler',
  previewData: {"senderName": "Maison Atelier", "conversationId": "c-321"},
} satisfies TemplateEntry
