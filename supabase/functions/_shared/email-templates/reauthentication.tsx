/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'

interface Props { token: string }

export const ReauthenticationEmail = ({ token }: Props) => (
  <AuthEmailLayout
    title="Your verification code — Goldsainte"
    headline="Verify it's you."
    tagline="A short verification step to protect sensitive account changes."
    lede="Enter the verification code below to continue with the action you requested on Goldsainte."
    otp={{ code: token, caption: 'This code expires in a few minutes.' }}
    steps={[
      'Return to the Goldsainte tab where you started this action.',
      'Enter the code above when prompted to verify your identity.',
      'The action will complete once the code is accepted.',
      'The code expires shortly — request a new one if needed.',
      'Contact our team immediately if you did not request this code.',
    ]}
  />
)

export default ReauthenticationEmail
