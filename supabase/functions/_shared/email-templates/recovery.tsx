/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface Props { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: Props) => (
  <AuthEmailLayout
    title="Reset your password — Goldsainte"
    headline="Reset your password."
    tagline="Your account security is paramount. Use the secure link below to set a new password."
    lede="We received a request to reset the password for your Goldsainte account."
    cta={{ label: 'Reset my password', url: confirmationUrl }}
    steps={[
      'Click the button above to open a secure password reset page.',
      "Choose a strong, unique password you haven't used before.",
      "You'll be signed in automatically once the new password is saved.",
      'Review your account activity and connected devices.',
      'Contact our team immediately if you did not request this change.',
    ]}
  />
)

export default RecoveryEmail
