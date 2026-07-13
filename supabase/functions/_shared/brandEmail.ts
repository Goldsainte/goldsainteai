// ============================================================================
// Goldsainte branded email shell — matches _shared/email-templates/_layout.tsx
// (the approved format). ONE source of truth for functions that build email
// HTML directly. import { emailShell, sendBrandedEmail } from "../_shared/brandEmail.ts";
// ============================================================================
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

export function emailShell(heading: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  // Matches the approved Goldsainte layout (_shared/email-templates/_layout.tsx):
  // cream background, wordmark, Playfair serif headline, dark-green uppercase
  // CTA, fallback link, help footer.
  const logoUrl =
    "https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#f7f3ea;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a2225;">
  <div style="width:100%;background:#f7f3ea;padding:48px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#f7f3ea;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tbody><tr>
        <td align="center" style="padding:8px 0 28px;"><img src="${logoUrl}" alt="Goldsainte" style="height:22px;width:auto;max-width:240px;display:block;margin:0 auto;"/></td>
      </tr></tbody></table>
      <hr style="border:0;border-top:1px solid rgba(10,34,37,0.15);margin:0 0 28px;"/>
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:34px;line-height:1.15;color:#0a2225;margin:0 0 14px;text-align:center;letter-spacing:-0.01em;">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#0a2225;opacity:0.85;margin:0 0 32px;text-align:center;">${bodyHtml}</div>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#0c4d47;color:#f7f3ea !important;text-decoration:none;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 40px;border-radius:2px;font-weight:500;">${ctaLabel}</a>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#0a2225;opacity:0.55;text-align:center;margin:0 0 48px;">Or paste this link into your browser:<br/><a href="${ctaUrl}" style="color:#0c4d47;word-break:break-all;text-decoration:underline;">${ctaUrl}</a></p>
      <p style="font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:36px 0 0;">If you have any questions, concerns, or require assistance, please contact <a href="mailto:support@goldsainte.com" style="color:#0c4d47;">Goldsainte Support</a>.</p>
      <p style="font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;text-align:center;text-transform:uppercase;padding:8px 0 0;">This is an automated message from Goldsainte</p>
    </div>
  </div>
</body></html>`;
}

export async function sendBrandedEmail(
  to: string,
  subject: string,
  heading: string,
  bodyHtml: string,
  ctaLabel: string,
  ctaUrl: string,
  from = "Goldsainte <hello@goldsainte.com>",
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("Email soft-failed: RESEND_API_KEY not set");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html: emailShell(heading, bodyHtml, ctaLabel, ctaUrl) }),
    });
    if (!res.ok) {
      console.error("Email soft-failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email soft-failed:", e);
    return false;
  }
}
