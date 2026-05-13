/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface Props {
  siteName: string
  oldEmail?: string
  email?: string
  newEmail?: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ confirmationUrl }: Props) => (
  <AuthEmailLayout
    title="Confirm your new email — Goldsainte"
    headline="Confirm your new email."
    tagline="A request was made to update the email associated with your Goldsainte account."
    lede="Confirm this change to keep your account secure and continue receiving important notifications at your new address."
    cta={{ label: 'Confirm new email', url: confirmationUrl }}
    steps={[
      'Click the button above to confirm your new email address.',
      'Future communications and sign-ins will use the new address.',
      'Your old email will no longer have access to this account.',
      'Review your account security settings if anything looks unfamiliar.',
      'Contact our team immediately if you did not request this change.',
    ]}
  />
)

export default EmailChangeEmail
