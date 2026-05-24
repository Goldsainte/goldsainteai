/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <AuthEmailLayout
    title="Confirm your new email — Goldsainte"
    headline="Confirm your new email."
    tagline={`You've requested to change the email on your Goldsainte account from ${oldEmail} to ${newEmail}.`}
    lede="Confirm the change by clicking the button below. This link expires shortly for your security."
    cta={{ label: 'Confirm new email', url: confirmationUrl }}
    steps={[
      'Click the button above to confirm the new email address on file.',
      'Once confirmed, future sign-ins and notifications will be sent to the new address.',
      "If you didn't request this change, please contact Goldsainte Support immediately to secure your account.",
    ]}
  />
)

export default EmailChangeEmail
