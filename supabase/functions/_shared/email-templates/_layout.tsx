/// <reference types="npm:@types/react@18.3.1" />

// ============================================================================
// AuthEmailLayout — INLINE-STYLE rewrite (Jul 26).
//
// The previous version was fully branded, but every ounce of that branding
// lived in a <style> block of CSS classes. Email clients are allowed to strip
// <style> (Gmail drops blocks containing @import, some providers sanitise
// <head> entirely), and when that happened the ENTIRE design vanished at once:
// a new creator (Tanya) received "Confirm your email" as bare system-font text
// with default purple links — while our transactional emails, which inline
// their styles, rendered perfectly in the same inbox. Founder read it as "old
// unbranded templates still in use"; it was the branded template with its
// stylesheet stripped.
//
// Rule going forward: in email, every style that matters is an inline style
// attribute. The residual <style> below carries only progressive enhancement
// (mobile @media, link color default) whose loss changes nothing structural.
// The component API is unchanged — all six auth templates render as before.
// ============================================================================

import * as React from 'npm:react@18.3.1'
import { Html } from 'npm:@react-email/components@0.0.22'

const SITE_URL = 'https://goldsainte.ai'
const LOGO_URL =
  'https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png'

const SANS = "'Helvetica Neue',Arial,sans-serif"
const SERIF = "'Playfair Display',Georgia,serif"
const INK = '#0a2225'
const CREAM = '#f7f3ea'
const PINE = '#0c4d47'

// Progressive enhancement only — safe to lose.
const ENHANCEMENT_STYLES = `
a{color:${PINE};}
@media (max-width:480px){
  .h1{font-size:30px !important;}
  .outer{padding:32px 12px !important;}
  .code{font-size:26px !important;letter-spacing:0.24em !important;padding:18px 24px 18px 32px !important;}
}
`

const S: Record<string, React.CSSProperties> = {
  body: { margin: 0, padding: 0, background: CREAM, fontFamily: SANS, color: INK },
  outer: { width: '100%', background: CREAM, padding: '48px 16px' },
  container: { maxWidth: 560, margin: '0 auto', background: CREAM },
  brand: { padding: '8px 0 28px', fontSize: 0, lineHeight: 0, textAlign: 'center' as const },
  brandImg: { height: 22, width: 'auto', maxWidth: 240, display: 'block', margin: '0 auto' },
  rule: { border: 0, borderTop: '1px solid rgba(10,34,37,0.15)', margin: '0 0 28px' },
  h1: {
    fontFamily: SERIF, fontWeight: 400, fontSize: 38, lineHeight: 1.15, color: INK,
    margin: '0 0 14px', textAlign: 'center' as const, letterSpacing: '-0.01em',
  },
  tagline: {
    fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#6E6650', fontStyle: 'italic',
    textAlign: 'center' as const, maxWidth: 480, margin: '0 auto 28px',
  },
  lede: {
    fontFamily: SANS, fontSize: 16, lineHeight: 1.6, color: INK, opacity: 0.85,
    margin: '0 0 36px', textAlign: 'center' as const,
  },
  ctaWrap: { textAlign: 'center' as const, margin: '0 0 28px' },
  cta: {
    display: 'inline-block', background: PINE, color: CREAM, textDecoration: 'none',
    fontFamily: SANS, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase' as const,
    padding: '18px 40px', borderRadius: 2, fontWeight: 500,
  },
  fallback: {
    fontFamily: SANS, fontSize: 12, lineHeight: 1.6, color: INK, opacity: 0.55,
    textAlign: 'center' as const, margin: '0 0 48px',
  },
  fallbackLink: { color: PINE, wordBreak: 'break-all' as const, textDecoration: 'underline' },
  codeWrap: { textAlign: 'center' as const, margin: '0 0 18px' },
  code: {
    display: 'inline-block', background: PINE, color: CREAM, fontFamily: SERIF,
    fontSize: 34, letterSpacing: '0.32em', padding: '22px 36px 22px 44px',
    borderRadius: 2, fontWeight: 500,
  },
  codeCaption: {
    fontFamily: SANS, fontSize: 12, color: INK, opacity: 0.6,
    textAlign: 'center' as const, margin: '0 0 36px', fontStyle: 'italic',
  },
  divider: { border: 0, borderTop: '1px solid rgba(10,34,37,0.12)', margin: '40px 0' },
  sectionTitle: {
    fontFamily: SERIF, fontSize: 20, fontWeight: 400, color: INK,
    margin: '0 0 20px', textAlign: 'center' as const,
  },
  steps: { width: '100%', borderCollapse: 'collapse' as const, margin: '0 0 16px' },
  stepCell: {
    fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: INK,
    padding: '14px 0', borderBottom: '1px solid rgba(10,34,37,0.08)', verticalAlign: 'top' as const,
  },
  stepNum: {
    fontFamily: SERIF, fontStyle: 'italic', color: '#8a7a3f', fontSize: 18,
    width: 36, paddingRight: 14, whiteSpace: 'nowrap' as const,
  },
  stepBody: { opacity: 0.8 },
  help: {
    fontFamily: SANS, fontSize: 13, lineHeight: 1.7, color: INK, opacity: 0.8,
    textAlign: 'center' as const, margin: '48px 0 0',
  },
  security: {
    fontFamily: SANS, fontSize: 12, lineHeight: 1.7, color: INK, opacity: 0.65,
    textAlign: 'center' as const, margin: '20px 0 0', fontStyle: 'italic',
  },
  siteFooter: {
    background: '#FDF9F0', borderTop: '1px solid #E5DFC6', marginTop: 56,
    padding: '36px 24px 24px', textAlign: 'center' as const,
  },
  fnav: {
    fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const,
    color: INK, lineHeight: 2.2, padding: '18px 0',
    borderTop: '1px solid #E5DFC6', borderBottom: '1px solid #E5DFC6', marginBottom: 18,
  },
  fnavLink: { color: INK, textDecoration: 'none', margin: '0 10px', whiteSpace: 'nowrap' as const },
  fsocial: {
    fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const,
    color: '#9A9079', marginBottom: 14,
  },
  fsocialLink: { color: INK, textDecoration: 'none', margin: '0 8px' },
  flegal: { fontFamily: SANS, fontSize: 11, color: '#9A9079', lineHeight: 1.8, margin: '0 0 8px' },
  flegalLink: { color: '#9A9079', textDecoration: 'none', margin: '0 4px' },
  fauto: {
    fontFamily: SANS, fontSize: 10, letterSpacing: '0.1em', color: INK, opacity: 0.45,
    padding: '8px 0 0', textTransform: 'uppercase' as const,
  },
}

export interface AuthEmailLayoutProps {
  title: string
  headline: string
  tagline: string
  lede: string
  steps: string[]
  /** When provided, renders a CTA button + fallback link block */
  cta?: { label: string; url: string }
  /** When provided, renders a centered OTP code block instead of the CTA */
  otp?: { code: string; caption?: string }
  /** When provided, renders a labeled key/value summary block (e.g. receipt details) */
  details?: { label: string; value: string }[]
}

export const AuthEmailLayout = ({
  title,
  headline,
  tagline,
  lede,
  steps,
  cta,
  otp,
  details,
}: AuthEmailLayoutProps) => (
  <Html lang="en" dir="ltr">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <style dangerouslySetInnerHTML={{ __html: ENHANCEMENT_STYLES }} />
    </head>
    <body style={S.body}>
      <div className="outer" style={S.outer}>
        <div style={S.container}>
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
            <tbody>
              <tr>
                <td align="center" style={S.brand}>
                  <img src={LOGO_URL} alt="Goldsainte" style={S.brandImg} />
                </td>
              </tr>
            </tbody>
          </table>
          <hr style={S.rule} />
          <h1 className="h1" style={S.h1}>{headline}</h1>
          <p style={S.tagline}>{tagline}</p>
          <p style={S.lede}>{lede}</p>

          {details && details.length > 0 && (
            <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ ...S.steps, marginTop: 8 }}>
              <tbody>
                {details.map((d, i) => (
                  <tr key={i}>
                    <td style={{ ...S.stepCell, opacity: 0.6, width: '50%' }}>{d.label}</td>
                    <td style={{ ...S.stepCell, textAlign: 'right', fontWeight: 600 }}>{d.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {cta && (
            <>
              <div style={S.ctaWrap}>
                <a href={cta.url} style={S.cta}>{cta.label}</a>
              </div>
              <p style={S.fallback}>
                Or paste this link into your browser:<br />
                <a href={cta.url} style={S.fallbackLink}>{cta.url}</a>
              </p>
            </>
          )}

          {otp && (
            <>
              <div style={S.codeWrap}>
                <span className="code" style={S.code}>{otp.code}</span>
              </div>
              <p style={S.codeCaption}>{otp.caption || 'This code expires in a few minutes.'}</p>
            </>
          )}

          <hr style={S.divider} />
          <p style={S.sectionTitle}>What happens next</p>
          <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={S.steps}>
            <tbody>
              {steps.map((step, i) => (
                <tr key={i}>
                  <td style={{ ...S.stepCell, ...S.stepNum }}>{toRoman(i + 1)}.</td>
                  <td style={{ ...S.stepCell, ...S.stepBody }}>{step}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={S.help}>
            If you have any questions, concerns, or require assistance, please do not hesitate to contact{' '}
            <a href={`${SITE_URL}/corporate-contact`} style={{ color: PINE }}>Goldsainte Support</a>.
          </p>
          <p style={S.security}>
            Goldsainte will never email you and ask you to disclose or verify your password, credit card, or banking account number. If you receive a suspicious email with a link to update your account information, do not click on the link. Instead, report the e-mail to Goldsainte for investigation.
          </p>
        </div>
        <div style={S.siteFooter}>
          <div style={S.fnav}>
            <a href={`${SITE_URL}/marketplace`} style={S.fnavLink}>Browse Trips</a>·
            <a href={`${SITE_URL}/agents`} style={S.fnavLink}>Specialists</a>·
            <a href={`${SITE_URL}/about`} style={S.fnavLink}>About</a>·
            <a href={`${SITE_URL}/help`} style={S.fnavLink}>Help</a>·
            <a href={`${SITE_URL}/trust-safety`} style={S.fnavLink}>Trust &amp; Safety</a>·
            <a href={`${SITE_URL}/corporate-contact`} style={S.fnavLink}>Contact</a>
          </div>
          <div style={S.fsocial}>
            Follow &nbsp;
            <a href="https://www.linkedin.com/company/goldsainte/" style={S.fsocialLink}>LinkedIn</a>·
            <a href="https://www.instagram.com/goldsainteai/" style={S.fsocialLink}>Instagram</a>
          </div>
          <p style={S.flegal}>
            <a href={`${SITE_URL}/privacy-cookies`} style={S.flegalLink}>Privacy</a>·
            <a href={`${SITE_URL}/terms`} style={S.flegalLink}>Terms</a>·
            <a href={`${SITE_URL}/dispute-resolution`} style={S.flegalLink}>Disputes</a>
            <br />© 2026 Goldsainte AI Inc. All rights reserved.
          </p>
          <p style={S.fauto}>This is an automated message — please do not reply.</p>
        </div>
      </div>
    </body>
  </Html>
)

function toRoman(n: number): string {
  const map: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' }
  return map[n] || String(n)
}
