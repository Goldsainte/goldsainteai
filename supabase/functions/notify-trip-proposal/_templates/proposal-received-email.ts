// Email template for traveler receiving a proposal
export function generateProposalReceivedEmail(data: {
  firstName: string;
  tripTitle: string;
  destination: string;
  proposerName: string;
  proposerRole: string;
  priceFrom: number | null;
  headline: string | null;
  tripRequestId: string;
}) {
  const priceText = data.priceFrom 
    ? `<li><strong>Starting from:</strong> $${data.priceFrom} per person (est.)</li>` 
    : '';
  
  const headlineText = data.headline 
    ? `<li><strong>Headline:</strong> "${data.headline}"</li>` 
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Proposal Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f3ea; color: #0a2225;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f3ea; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0a2225 0%, #0c4d47 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #E5DFC6; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                Your Goldsainte trip just received a new proposal
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #0a2225; font-size: 16px; line-height: 1.6;">
                Hi <strong>${data.firstName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #0a2225; font-size: 16px; line-height: 1.6;">
                Your trip request — <strong>"${data.tripTitle}"</strong> — just received a new proposal on Goldsainte.
              </p>
              
              <div style="background-color: #f6f3ea; border-left: 4px solid #BFAD72; padding: 20px; margin: 0 0 28px; border-radius: 8px;">
                <p style="margin: 0 0 12px; color: #0a2225; font-size: 15px; font-weight: 600;">
                  Here's what's included:
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                  <li><strong>From:</strong> ${data.proposerName} (${data.proposerRole})</li>
                  ${priceText}
                  ${headlineText}
                </ul>
              </div>
              
              <p style="margin: 0 0 28px; color: #0a2225; font-size: 16px; line-height: 1.6;">
                To view the full pitch and compare it to other proposals, sign in to your Goldsainte account and open your Trip Requests.
              </p>
              
              <p style="margin: 0 0 32px; color: #0a2225; font-size: 16px; line-height: 1.6;">
                When you're ready, pick your favorite partner and they'll help you finalize every detail—hotels, transfers, experiences, and more.
              </p>
              
              <div style="text-align: center; margin: 0 0 32px;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('//', '//app.')}/trip-request/${data.tripRequestId}" 
                   style="display: inline-block; background-color: #BFAD72; color: #0a2225; text-decoration: none; padding: 14px 32px; border-radius: 24px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(191,173,114,0.3);">
                  View Proposals
                </a>
              </div>
              
              <p style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #E5DFC6; color: #8D8D8D; font-size: 14px; line-height: 1.6;">
                — The Goldsainte Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f6f3ea; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #8D8D8D; font-size: 13px; line-height: 1.5;">
                © ${new Date().getFullYear()} Goldsainte. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #8D8D8D; font-size: 13px;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('//', '//app.')}" style="color: #0c4d47; text-decoration: none;">Visit Goldsainte</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
