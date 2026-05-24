/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <AuthEmailLayout
    title="Your verification code — Goldsainte"
    headline="Verify it's you."
    tagline="A one-time code to confirm a sensitive action on your Goldsainte account."
    lede="Enter the verification code below to continue. This code expires in a few minutes."
    otp={{ code: token, caption: 'This code expires in a few minutes.' }}
    steps={[
      'Return to the Goldsainte tab where you started this action.',
      'Enter the six-digit code exactly as shown above.',
      "If you didn't initiate this, you can safely ignore this email — no changes will be made.",
    ]}
  />
)

export default ReauthenticationEmail
