/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Html } from 'npm:@react-email/components@0.0.22'

const SITE_URL = 'https://goldsainte.ai'
const LOGO_URL =
  'https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png'

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');
body{margin:0;padding:0;background:#f7f3ea;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a2225;-webkit-font-smoothing:antialiased;}
a{color:#0c4d47;}
.outer{width:100%;background:#f7f3ea;padding:48px 16px;}
.container{max-width:560px;margin:0 auto;background:#f7f3ea;}
.brand{padding:8px 0 28px;font-size:0;line-height:0;}
.brand img{height:22px;width:auto;max-width:240px;display:block;margin:0 auto;}
.rule{border:0;border-top:1px solid rgba(10,34,37,0.15);margin:0 0 28px;}
h1{font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:38px;line-height:1.15;color:#0a2225;margin:0 0 14px;text-align:center;letter-spacing:-0.01em;}
.lede{font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#0a2225;opacity:0.85;margin:0 0 36px;text-align:center;}
.tagline{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#6E6650;font-style:italic;text-align:center;max-width:480px;margin:0 auto 28px;}
.cta-wrap{text-align:center;margin:0 0 28px;}
.cta{display:inline-block;background:#0c4d47;color:#f7f3ea !important;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 40px;border-radius:2px;font-weight:500;}
.code-wrap{text-align:center;margin:0 0 18px;}
.code{display:inline-block;background:#0c4d47;color:#f7f3ea;font-family:'Playfair Display',Georgia,serif;font-size:34px;letter-spacing:0.32em;padding:22px 36px 22px 44px;border-radius:2px;font-weight:500;}
.code-caption{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#0a2225;opacity:0.6;text-align:center;margin:0 0 36px;font-style:italic;}
.fallback{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#0a2225;opacity:0.55;text-align:center;margin:0 0 48px;}
.fallback a{color:#0c4d47;word-break:break-all;text-decoration:underline;opacity:0.8;}
.divider{border:0;border-top:1px solid rgba(10,34,37,0.12);margin:40px 0;}
.section-title{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:400;color:#0a2225;margin:0 0 20px;text-align:center;}
.steps{margin:0 0 16px;padding:0;list-style:none;}
.steps li{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#0a2225;opacity:0.8;padding:14px 0;border-bottom:1px solid rgba(10,34,37,0.08);display:flex;gap:18px;}
.steps li:last-child{border-bottom:0;}
.num{font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#8a7a3f;font-size:18px;flex-shrink:0;width:22px;}
.help{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:36px 0 0;}
.security{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.7;color:#0a2225;opacity:0.65;text-align:center;margin:20px 0 0;font-style:italic;}
.site-footer{background:#FDF9F0;border-top:1px solid #E5DFC6;margin-top:56px;padding:36px 24px 24px;text-align:center;}
.fnav{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#0a2225;line-height:2.2;padding:18px 0;border-top:1px solid #E5DFC6;border-bottom:1px solid #E5DFC6;margin-bottom:18px;}
.fnav a{color:#0a2225;text-decoration:none;margin:0 10px;white-space:nowrap;}
.fsocial{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9A9079;margin-bottom:14px;}
.fsocial a{color:#0a2225;text-decoration:none;margin:0 8px;}
.flegal{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9A9079;line-height:1.8;margin:0 0 8px;}
.flegal a{color:#9A9079;text-decoration:none;margin:0 4px;}
.fauto{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;padding:8px 0 0;text-transform:uppercase;}
@media (max-width:480px){h1{font-size:30px;}.outer{padding:32px 12px;}.code{font-size:26px;letter-spacing:0.24em;padding:18px 24px 18px 32px;}}
`

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
}

export const AuthEmailLayout = ({
  title,
  headline,
  tagline,
  lede,
  steps,
  cta,
  otp,
}: AuthEmailLayoutProps) => (
  <Html lang="en" dir="ltr">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </head>
    <body>
      <div className="outer">
        <div className="container">
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
            <tbody>
              <tr>
                <td align="center" className="brand">
                  <img src={LOGO_URL} alt="Goldsainte" />
                </td>
              </tr>
            </tbody>
          </table>
          <hr className="rule" />
          <h1>{headline}</h1>
          <p className="tagline">{tagline}</p>
          <p className="lede">{lede}</p>

          {cta && (
            <>
              <div className="cta-wrap">
                <a href={cta.url} className="cta">{cta.label}</a>
              </div>
              <p className="fallback">
                Or paste this link into your browser:<br />
                <a href={cta.url}>{cta.url}</a>
              </p>
            </>
          )}

          {otp && (
            <>
              <div className="code-wrap">
                <span className="code">{otp.code}</span>
              </div>
              <p className="code-caption">{otp.caption || 'This code expires in a few minutes.'}</p>
            </>
          )}

          <hr className="divider" />
          <p className="section-title">What happens next</p>
          <ul className="steps">
            {steps.map((step, i) => (
              <li key={i}>
                <span className="num">{toRoman(i + 1)}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
          <p className="help" style={{ marginTop: '48px' }}>
            If you have any questions, concerns, or require assistance, please do not hesitate to contact{' '}
            <a href={`${SITE_URL}/corporate-contact`}>Goldsainte Support</a>.
          </p>
          <p className="security">
            Goldsainte will never email you and ask you to disclose or verify your password, credit card, or banking account number. If you receive a suspicious email with a link to update your account information, do not click on the link. Instead, report the e-mail to Goldsainte for investigation.
          </p>
        </div>
        <div className="site-footer">
          <div className="fnav">
            <a href={`${SITE_URL}/marketplace`}>Browse Trips</a>·
            <a href={`${SITE_URL}/agents`}>Specialists</a>·
            <a href={`${SITE_URL}/about`}>About</a>·
            <a href={`${SITE_URL}/help`}>Help</a>·
            <a href={`${SITE_URL}/trust-safety`}>Trust &amp; Safety</a>·
            <a href={`${SITE_URL}/corporate-contact`}>Contact</a>
          </div>
          <div className="fsocial">
            Follow &nbsp;
            <a href="https://www.linkedin.com/company/goldsainte/">LinkedIn</a>·
            <a href="https://www.instagram.com/goldsainteai/">Instagram</a>
          </div>
          <p className="flegal">
            <a href={`${SITE_URL}/privacy-cookies`}>Privacy</a>·
            <a href={`${SITE_URL}/terms`}>Terms</a>·
            <a href={`${SITE_URL}/dispute-resolution`}>Disputes</a>
            <br />© 2026 Goldsainte AI Inc. All rights reserved.
          </p>
          <p className="fauto">This is an automated message — please do not reply.</p>
        </div>
      </div>
    </body>
  </Html>
)

function toRoman(n: number): string {
  const map: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' }
  return map[n] || String(n)
}
