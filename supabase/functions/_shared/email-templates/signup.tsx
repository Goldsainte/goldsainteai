/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
    </Head>
    <Preview>Welcome to Goldsainte — confirm your email to begin.</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={headerSection}>
          <Text style={wordmark}>GOLDSAINTE</Text>
        </Section>

        <Container style={card}>
          <Heading style={h1}>Welcome to Goldsainte</Heading>
          <Text style={tagline}>
            The members-only marketplace for extraordinary travel.
          </Text>

          <Text style={body}>
            We've received your request to join Goldsainte. To complete your
            account setup and unlock access to our curated network of
            world-class travel designers, please confirm your email address
            below.
          </Text>

          <Section style={ctaWrap}>
            <Link href={confirmationUrl} style={cta}>
              Verify My Email
            </Link>
          </Section>

          <Text style={fineprint}>
            This link will expire in 24 hours. If the button above doesn't
            work, copy and paste this URL into your browser:
          </Text>
          <Text style={urlLine}>{confirmationUrl}</Text>

          <Hr style={divider} />

          <Heading as="h2" style={h2}>What happens next</Heading>
          <Text style={step}><span style={stepNum}>1.</span> Confirm your email by clicking the button above.</Text>
          <Text style={step}><span style={stepNum}>2.</span> Complete your member profile and travel preferences.</Text>
          <Text style={step}><span style={stepNum}>3.</span> Verify your identity through our secure partner.</Text>
          <Text style={step}><span style={stepNum}>4.</span> Begin curating storyboards or requesting a trip.</Text>
          <Text style={step}><span style={stepNum}>5.</span> Connect with our concierge for tailored experiences.</Text>

          <Text style={support}>
            If you have any questions, our team is available at{' '}
            <Link href="mailto:hello@goldsainte.com" style={inlineLink}>
              hello@goldsainte.com
            </Link>
            .
          </Text>

          <Text style={security}>
            For your security, never share this verification link. Goldsainte
            will never ask for your password or payment details by email.
          </Text>
        </Container>

        <Section style={footer}>
          <Text style={footerBrand}>GOLDSAINTE</Text>
          <Text style={footerTag}>Curated travel for the discerning few.</Text>
          <Text style={footerLinks}>
            <Link href={siteUrl} style={footerLink}>goldsainte.com</Link>
            {'  ·  '}
            <Link href="mailto:hello@goldsainte.com" style={footerLink}>hello@goldsainte.com</Link>
          </Text>
          <Text style={footerLegal}>
            © {new Date().getFullYear()} Goldsainte. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const outer = { width: '100%', maxWidth: '620px', margin: '0 auto', padding: '0' }
const headerSection = { padding: '32px 0 8px', textAlign: 'center' as const }
const wordmark = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '20px',
  letterSpacing: '0.32em',
  color: '#0a2225',
  margin: 0,
  textAlign: 'center' as const,
}
const card = {
  backgroundColor: '#f7f3ea',
  padding: '48px 44px',
  margin: '24px 0',
}
const h1 = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '34px',
  fontWeight: '500' as const,
  color: '#0a2225',
  textAlign: 'center' as const,
  margin: '0 0 14px',
  lineHeight: '1.15',
}
const tagline = {
  fontSize: '14px',
  color: '#0a2225',
  opacity: 0.75,
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
  margin: '0 auto 28px',
}
const body = {
  fontSize: '15px',
  color: '#0a2225',
  lineHeight: '1.7',
  margin: '0 0 32px',
}
const ctaWrap = { textAlign: 'center' as const, margin: '8px 0 28px' }
const cta = {
  backgroundColor: '#0c4d47',
  color: '#f7f3ea',
  fontSize: '13px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  padding: '16px 36px',
  textDecoration: 'none',
  display: 'inline-block',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  fontWeight: '500' as const,
}
const fineprint = {
  fontSize: '12px',
  color: '#0a2225',
  opacity: 0.65,
  margin: '24px 0 6px',
  textAlign: 'center' as const,
}
const urlLine = {
  fontSize: '11px',
  color: '#0c4d47',
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
  margin: '0 0 8px',
}
const divider = {
  border: 'none',
  borderTop: '1px solid #8a7a3f',
  opacity: 0.4,
  margin: '40px 0 28px',
}
const h2 = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '20px',
  fontWeight: '500' as const,
  color: '#0a2225',
  margin: '0 0 18px',
}
const step = {
  fontSize: '14px',
  color: '#0a2225',
  lineHeight: '1.6',
  margin: '0 0 10px',
}
const stepNum = {
  color: '#8a7a3f',
  fontFamily: '"Playfair Display", Georgia, serif',
  marginRight: '8px',
  fontWeight: '500' as const,
}
const support = {
  fontSize: '14px',
  color: '#0a2225',
  lineHeight: '1.6',
  margin: '48px 0 20px',
}
const inlineLink = { color: '#0c4d47', textDecoration: 'underline' }
const security = {
  fontSize: '12px',
  color: '#0a2225',
  opacity: 0.6,
  lineHeight: '1.5',
  margin: '20px 0 0',
  fontStyle: 'italic' as const,
}
const footer = { textAlign: 'center' as const, padding: '12px 0 32px' }
const footerBrand = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '14px',
  letterSpacing: '0.32em',
  color: '#0a2225',
  margin: '0 0 6px',
  textAlign: 'center' as const,
}
const footerTag = {
  fontSize: '11px',
  color: '#0a2225',
  opacity: 0.6,
  fontStyle: 'italic' as const,
  margin: '0 0 12px',
  textAlign: 'center' as const,
}
const footerLinks = {
  fontSize: '11px',
  color: '#0a2225',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}
const footerLink = { color: '#0c4d47', textDecoration: 'none' }
const footerLegal = {
  fontSize: '10px',
  color: '#0a2225',
  opacity: 0.5,
  margin: 0,
  textAlign: 'center' as const,
}
