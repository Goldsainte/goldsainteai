/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <AuthEmailLayout
    title="Reset your password — Goldsainte"
    headline="Reset your password."
    tagline="A secure link to restore access to your Goldsainte account."
    lede="We received a request to reset your password. Click the button below to choose a new one. This link expires in one hour."
    cta={{ label: 'Reset my password', url: confirmationUrl }}
    steps={[
      'Click the button above to open a secure password reset page.',
      'Choose a new password — at least 8 characters, with a mix of letters and numbers.',
      "You'll be signed in automatically once your new password is saved.",
      "If you didn't request this, you can safely ignore this email — your password will remain unchanged.",
    ]}
  />
)

export default RecoveryEmail
