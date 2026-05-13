import "./resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const EMAIL_PROVIDER = Deno.env.get("EMAIL_PROVIDER") || "resend"; // 'resend' or 'sendgrid'
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@goldsainte.com";
const FROM_NAME = Deno.env.get("FROM_NAME") || "Goldsainte";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://goldsainte.com";
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") || "support@goldsainte.com";

// ============================================================================
// TYPES
// ============================================================================

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  type: string; // MIME type
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// ============================================================================
// BASE EMAIL TEMPLATE
// ============================================================================

const getBaseTemplate = (content: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Goldsainte</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .email-logo {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 1px;
    }
    
    .email-content {
      padding: 40px 30px;
    }
    
    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      transition: opacity 0.2s;
    }
    
    .button:hover {
      opacity: 0.9;
    }
    
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    
    .text-sm {
      font-size: 14px;
      color: #6b7280;
    }
    
    .text-xs {
      font-size: 12px;
      color: #9ca3af;
    }
    
    .alert {
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .alert-warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    
    .alert-info {
      background-color: #dbeafe;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }
    
    .alert-success {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      color: #065f46;
    }
    
    .credentials-box {
      background-color: #ffffff;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .credential-item {
      background-color: #f3f4f6;
      padding: 12px;
      border-radius: 6px;
      margin: 10px 0;
    }
    
    .credential-label {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .credential-value {
      font-size: 16px;
      font-family: 'Courier New', monospace;
      color: #111827;
      font-weight: 500;
    }
    
    .social-links {
      margin: 20px 0;
    }
    
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #667eea;
      text-decoration: none;
    }
    
    h1, h2, h3 {
      color: #111827;
      margin: 20px 0 10px 0;
    }
    
    h1 { font-size: 28px; }
    h2 { font-size: 24px; }
    h3 { font-size: 20px; }
    
    p {
      margin: 15px 0;
      color: #374151;
    }
    
    ul, ol {
      margin: 15px 0;
      padding-left: 30px;
    }
    
    li {
      margin: 8px 0;
      color: #374151;
    }
    
    a {
      color: #667eea;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    strong {
      color: #111827;
    }
    
    @media only screen and (max-width: 600px) {
      .email-content {
        padding: 30px 20px;
      }
      
      .email-header {
        padding: 30px 20px;
      }
      
      .button {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="email-logo">GOLDSAINTE</div>
    </div>
    
    <div class="email-content">
      ${content}
    </div>
    
    <div class="email-footer">
      <p class="text-sm">
        <strong>Questions?</strong> Contact us at 
        <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
      
      <div class="social-links">
        <a href="https://instagram.com/goldsainte">Instagram</a> · 
        <a href="https://twitter.com/goldsainte">Twitter</a> · 
        <a href="https://linkedin.com/company/goldsainte">LinkedIn</a>
      </div>
      
      <p class="text-xs" style="margin-top: 20px;">
        © ${new Date().getFullYear()} Goldsainte. All rights reserved.<br>
        <a href="${FRONTEND_URL}/terms">Terms of Service</a> · 
        <a href="${FRONTEND_URL}/privacy">Privacy Policy</a> · 
        <a href="${FRONTEND_URL}/unsubscribe">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export const EmailTemplates = {
  /**
   * Welcome email for approved agents
   */
  agentWelcome: (data: {
    firstName: string;
    email: string;
    temporaryPassword: string;
  }): EmailTemplate => {
    const content = `
      <h1>🎉 Welcome to Goldsainte!</h1>
      
      <p>Hi ${data.firstName},</p>
      
      <p>Congratulations! Your travel agent application has been approved. Welcome to the Goldsainte community of elite travel professionals!</p>
      
      <div class="alert alert-success">
        <strong>✓ Your account is now active</strong><br>
        You can start accepting trip requests and earning commissions immediately.
      </div>
      
      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #667eea;">Your Login Credentials</h3>
        
        <div class="credential-item">
          <div class="credential-label">Email</div>
          <div class="credential-value">${data.email}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Temporary Password</div>
          <div class="credential-value">${data.temporaryPassword}</div>
        </div>
      </div>
      
      <div class="alert alert-warning">
        <strong>⚠️ Important Security Notice</strong><br>
        Please change your password immediately after your first login. This temporary password will expire in 7 days.
      </div>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/login" class="button">Log In to Your Account</a>
      </div>
      
      <h3>Next Steps:</h3>
      <ol>
        <li><strong>Log in</strong> using the credentials above</li>
        <li><strong>Complete your profile</strong> with additional details</li>
        <li><strong>Connect your Stripe account</strong> to receive payouts</li>
        <li><strong>Browse trip requests</strong> and start sending proposals</li>
        <li><strong>Set your availability</strong> and service preferences</li>
      </ol>
      
      <h3>Agent Resources:</h3>
      <ul>
        <li><a href="${FRONTEND_URL}/agent/guide">Agent Success Guide</a> - Best practices for luxury travel planning</li>
        <li><a href="${FRONTEND_URL}/agent/commission-structure">Commission Structure</a> - Understand your earnings</li>
        <li><a href="${FRONTEND_URL}/agent/training">Training Videos</a> - Master the platform features</li>
        <li><a href="${FRONTEND_URL}/support">Support Center</a> - Get help when you need it</li>
      </ul>
      
      <div class="divider"></div>
      
      <p><strong>Welcome aboard!</strong> We're excited to have you as part of the Goldsainte family.</p>
      
      <p>The Goldsainte Team</p>
    `;

    return {
      subject: "🎉 Welcome to Goldsainte - Your Agent Account is Ready!",
      html: getBaseTemplate(content),
      text: `
Welcome to Goldsainte, ${data.firstName}!

Your travel agent application has been approved and your account is now active.

LOGIN CREDENTIALS:
Email: ${data.email}
Temporary Password: ${data.temporaryPassword}

⚠️ IMPORTANT: Please change your password immediately after your first login. This temporary password expires in 7 days.

Log in at: ${FRONTEND_URL}/login

NEXT STEPS:
1. Log in using the credentials above
2. Complete your profile with additional details
3. Connect your Stripe account to receive payouts
4. Browse trip requests and start sending proposals
5. Set your availability and service preferences

AGENT RESOURCES:
- Agent Success Guide: ${FRONTEND_URL}/agent/guide
- Commission Structure: ${FRONTEND_URL}/agent/commission-structure
- Training Videos: ${FRONTEND_URL}/agent/training
- Support Center: ${FRONTEND_URL}/support

Welcome aboard!
The Goldsainte Team
      `.trim(),
    };
  },

  /**
   * Welcome email for approved brands
   */
  brandWelcome: (data: {
    contactName: string;
    brandName: string;
    email: string;
    temporaryPassword: string;
  }): EmailTemplate => {
    const firstName = data.contactName.split(" ")[0];
    const content = `
      <h1>🎉 Welcome to Goldsainte!</h1>
      
      <p>Hi ${firstName},</p>
      
      <p>Congratulations! <strong>${data.brandName}</strong> has been approved as a Goldsainte brand partner. Welcome to our curated collection of exceptional travel experiences!</p>
      
      <div class="alert alert-success">
        <strong>✓ Your brand profile is now live</strong><br>
        Your brand is now discoverable by our network of luxury travelers and agents.
      </div>
      
      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #667eea;">Your Login Credentials</h3>
        
        <div class="credential-item">
          <div class="credential-label">Email</div>
          <div class="credential-value">${data.email}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Temporary Password</div>
          <div class="credential-value">${data.temporaryPassword}</div>
        </div>
      </div>
      
      <div class="alert alert-warning">
        <strong>⚠️ Important Security Notice</strong><br>
        Please change your password immediately after your first login. This temporary password will expire in 7 days.
      </div>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/login" class="button">Log In to Your Account</a>
      </div>
      
      <h3>Next Steps:</h3>
      <ol>
        <li><strong>Log in</strong> using the credentials above</li>
        <li><strong>Enhance your profile</strong> with more photos and details</li>
        <li><strong>Connect your Stripe account</strong> to receive bookings</li>
        <li><strong>Review your listing</strong> to ensure accuracy</li>
        <li><strong>Set your availability</strong> and pricing</li>
      </ol>
      
      <h3>Brand Partner Resources:</h3>
      <ul>
        <li><a href="${FRONTEND_URL}/brand/guide">Brand Success Guide</a> - Maximize your visibility</li>
        <li><a href="${FRONTEND_URL}/brand/marketing">Marketing Best Practices</a> - Attract more bookings</li>
        <li><a href="${FRONTEND_URL}/brand/photography">Photography Guidelines</a> - Showcase your brand</li>
        <li><a href="${FRONTEND_URL}/support">Support Center</a> - Get help when you need it</li>
      </ul>
      
      <div class="divider"></div>
      
      <p><strong>Welcome to the family!</strong> We're thrilled to feature ${data.brandName} on Goldsainte.</p>
      
      <p>The Goldsainte Team</p>
    `;

    return {
      subject: `🎉 Welcome to Goldsainte - ${data.brandName} is Now Live!`,
      html: getBaseTemplate(content),
      text: `
Welcome to Goldsainte!

${data.brandName} has been approved as a Goldsainte brand partner.

LOGIN CREDENTIALS:
Email: ${data.email}
Temporary Password: ${data.temporaryPassword}

⚠️ IMPORTANT: Please change your password immediately after your first login.

Log in at: ${FRONTEND_URL}/login

NEXT STEPS:
1. Log in using the credentials above
2. Enhance your profile with more photos and details
3. Connect your Stripe account to receive bookings
4. Review your listing to ensure accuracy
5. Set your availability and pricing

BRAND RESOURCES:
- Brand Success Guide: ${FRONTEND_URL}/brand/guide
- Marketing Best Practices: ${FRONTEND_URL}/brand/marketing
- Photography Guidelines: ${FRONTEND_URL}/brand/photography
- Support Center: ${FRONTEND_URL}/support

Welcome aboard!
The Goldsainte Team
      `.trim(),
    };
  },

  /**
   * Rejection email for agents
   */
  agentRejection: (data: {
    firstName: string;
    rejectionReason: string;
    allowResubmission: boolean;
  }): EmailTemplate => {
    const content = `
      <h1>Application Status Update</h1>
      
      <p>Hi ${data.firstName},</p>
      
      <p>Thank you for your interest in joining Goldsainte as a travel agent. After careful review of your application, we regret to inform you that we are unable to approve your application at this time.</p>
      
      <div class="alert alert-warning">
        <strong>Reason for Decision:</strong><br>
        ${data.rejectionReason}
      </div>
      
      ${
        data.allowResubmission
          ? `
        <div class="alert alert-info">
          <strong>You Can Reapply</strong><br>
          We encourage you to address the items mentioned above and resubmit your application when ready.
        </div>
        
        <div style="text-align: center;">
          <a href="${FRONTEND_URL}/apply/agent" class="button">Reapply Now</a>
        </div>
      `
          : `
        <p>Based on our review, we are not accepting resubmissions at this time. We appreciate your understanding.</p>
      `
      }
      
      <div class="divider"></div>
      
      <p>If you have questions about this decision or would like more information, please don't hesitate to contact our team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      
      <p>We appreciate your interest in Goldsainte and wish you the best in your endeavors.</p>
      
      <p>The Goldsainte Team</p>
    `;

    return {
      subject: "Update on Your Goldsainte Travel Agent Application",
      html: getBaseTemplate(content),
      text: `
Hi ${data.firstName},

Thank you for your interest in joining Goldsainte as a travel agent. After careful review, we are unable to approve your application at this time.

REASON:
${data.rejectionReason}

${
  data.allowResubmission
    ? `You can address these items and reapply at: ${FRONTEND_URL}/apply/agent`
    : "Based on our review, we are not accepting resubmissions at this time."
}

Questions? Contact us at ${SUPPORT_EMAIL}

Best regards,
The Goldsainte Team
      `.trim(),
    };
  },

  /**
   * Rejection email for brands
   */
  brandRejection: (data: {
    contactName: string;
    brandName: string;
    rejectionReason: string;
    allowResubmission: boolean;
  }): EmailTemplate => {
    const firstName = data.contactName.split(" ")[0];
    const content = `
      <h1>Application Status Update</h1>
      
      <p>Hi ${firstName},</p>
      
      <p>Thank you for your interest in partnering with Goldsainte for <strong>${data.brandName}</strong>. After careful review of your application, we regret to inform you that we are unable to approve your brand partnership at this time.</p>
      
      <div class="alert alert-warning">
        <strong>Reason for Decision:</strong><br>
        ${data.rejectionReason}
      </div>
      
      ${
        data.allowResubmission
          ? `
        <div class="alert alert-info">
          <strong>You Can Reapply</strong><br>
          We encourage you to address the items mentioned above and resubmit your application when ready.
        </div>
        
        <div style="text-align: center;">
          <a href="${FRONTEND_URL}/apply/brand" class="button">Reapply Now</a>
        </div>
      `
          : `
        <p>Based on our review, we are not accepting resubmissions at this time. We appreciate your understanding.</p>
      `
      }
      
      <div class="divider"></div>
      
      <p>If you have questions about this decision or would like more information, please don't hesitate to contact our team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      
      <p>We appreciate your interest in Goldsainte and wish you continued success.</p>
      
      <p>The Goldsainte Team</p>
    `;

    return {
      subject: `Update on ${data.brandName}'s Goldsainte Partnership Application`,
      html: getBaseTemplate(content),
      text: `
Hi ${firstName},

Thank you for your interest in partnering with Goldsainte for ${data.brandName}. After careful review, we are unable to approve your brand partnership at this time.

REASON:
${data.rejectionReason}

${
  data.allowResubmission
    ? `You can address these items and reapply at: ${FRONTEND_URL}/apply/brand`
    : "Based on our review, we are not accepting resubmissions at this time."
}

Questions? Contact us at ${SUPPORT_EMAIL}

Best regards,
The Goldsainte Team
      `.trim(),
    };
  },

  /**
   * Identity verification failed
   */
  verificationFailed: (data: {
    name: string;
    applicationType: "agent" | "brand";
    reason?: string;
  }): EmailTemplate => {
    const accountType = data.applicationType === "agent" ? "Travel Agent" : "Brand Partner";
    const content = `
      <h1>Identity Verification Issue</h1>
      
      <p>Hi ${data.name},</p>
      
      <p>We encountered an issue with the identity verification for your ${accountType} application.</p>
      
      <div class="alert alert-warning">
        <strong>Verification Status:</strong> Failed<br>
        ${data.reason ? `<strong>Reason:</strong> ${data.reason}` : ""}
      </div>
      
      <p>To complete your application, please retry the identity verification process:</p>
      
      <ol>
        <li>Ensure you have a valid government-issued ID (passport, driver's license, or national ID card)</li>
        <li>Find good lighting and a plain background</li>
        <li>Take clear photos without glare or shadows</li>
        <li>Complete the selfie verification step</li>
      </ol>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/apply/${data.applicationType}/verify" class="button">Retry Verification</a>
      </div>
      
      <div class="divider"></div>
      
      <p>If you continue to experience issues or have questions, please contact our support team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      
      <p>The Goldsainte Team</p>
    `;

    return {
      subject: `Action Required: Identity Verification for Your ${accountType} Application`,
      html: getBaseTemplate(content),
      text: `
Hi ${data.name},

We encountered an issue with the identity verification for your ${accountType} application.

${data.reason ? `Reason: ${data.reason}` : ""}

To complete your application, please retry the verification:
${FRONTEND_URL}/apply/${data.applicationType}/verify

Tips for successful verification:
- Use a valid government-issued ID
- Ensure good lighting
- Take clear photos without glare
- Complete the selfie step

Questions? Contact ${SUPPORT_EMAIL}

The Goldsainte Team
      `.trim(),
    };
  },

  /**
   * Payment confirmation
   */
  paymentConfirmation: (data: {
    name: string;
    bookingNumber: string;
    amount: string;
    currency: string;
    destination: string;
    startDate: string;
    endDate: string;
  }): EmailTemplate => {
    const content = `
      <h1>✅ Payment Confirmed</h1>
      
      <p>Hi ${data.name},</p>
      
      <p>Your payment has been successfully processed! Here are your booking details:</p>
      
      <div class="credentials-box">
        <h3 style="margin-top: 0;">Booking Confirmation</h3>
        
        <div class="credential-item">
          <div class="credential-label">Booking Number</div>
          <div class="credential-value">${data.bookingNumber}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Destination</div>
          <div class="credential-value">${data.destination}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Travel Dates</div>
          <div class="credential-value">${data.startDate} - ${data.endDate}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Amount Paid</div>
          <div class="credential-value">${data.currency} ${data.amount}</div>
        </div>
      </div>
      
      <div class="alert alert-success">
        <strong>What's Next?</strong><br>
        Your travel agent will be in touch soon to finalize your itinerary and confirm all arrangements.
      </div>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/bookings/${data.bookingNumber}" class="button">View Booking Details</a>
      </div>
      
      <h3>Important Information:</h3>
      <ul>
        <li>Save this email for your records</li>
        <li>Review your itinerary once finalized</li>
        <li>Contact your agent with any questions</li>
        <li>Check your travel documents well in advance</li>
      </ul>
      
      <div class="divider"></div>
      
      <p>Have questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      
      <p>Safe travels!</p>
      <p>The Goldsainte Team</p>
    `;

    return {
      subject: `✅ Payment Confirmed - Booking ${data.bookingNumber}`,
      html: getBaseTemplate(content),
      text: `
Payment Confirmed!

Hi ${data.name},

Your payment has been successfully processed.

BOOKING DETAILS:
Booking Number: ${data.bookingNumber}
Destination: ${data.destination}
Travel Dates: ${data.startDate} - ${data.endDate}
Amount Paid: ${data.currency} ${data.amount}

Your travel agent will be in touch soon to finalize your itinerary.

View booking: ${FRONTEND_URL}/bookings/${data.bookingNumber}

Questions? Contact ${SUPPORT_EMAIL}

Safe travels!
The Goldsainte Team
      `.trim(),
    };
  },

  /**
   * Password reset
   */
  passwordReset: (data: { name: string; resetLink: string }): EmailTemplate => {
    const content = `
      <h1>🔐 Password Reset Request</h1>
      
      <p>Hi ${data.name},</p>
      
      <p>We received a request to reset your Goldsainte password. Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${data.resetLink}" class="button">Reset Your Password</a>
      </div>
      
      <div class="alert alert-warning">
        <strong>⚠️ Security Notice</strong><br>
        This link expires in 1 hour for your security.
      </div>
      
      <p class="text-sm">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      
      <div class="divider"></div>
      
      <p class="text-sm">If the button doesn't work, copy and paste this link into your browser:</p>
      <p class="text-xs" style="word-break: break-all;">${data.resetLink}</p>
      
      <p>The Goldsainte Team</p>
    `;

    return {
      subject: "Reset Your Goldsainte Password",
      html: getBaseTemplate(content),
      text: `
Password Reset Request

Hi ${data.name},

We received a request to reset your Goldsainte password.

Reset your password: ${data.resetLink}

This link expires in 1 hour for your security.

If you didn't request this, you can safely ignore this email.

The Goldsainte Team
      `.trim(),
    };
  },
};

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send email via Resend
 */
async function sendViaResend(options: EmailOptions): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend API error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  console.log("Email sent via Resend:", result);
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(options: EmailOptions): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY not configured");
  }

  const personalizations = [
    {
      to: Array.isArray(options.to)
        ? options.to.map((email) => ({ email }))
        : [{ email: options.to }],
      ...(options.cc && { cc: options.cc.map((email) => ({ email })) }),
      ...(options.bcc && { bcc: options.bcc.map((email) => ({ email })) }),
    },
  ];

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      reply_to: options.replyTo ? { email: options.replyTo } : undefined,
      subject: options.subject,
      content: [
        {
          type: "text/html",
          value: options.html,
        },
        ...(options.text
          ? [
              {
                type: "text/plain",
                value: options.text,
              },
            ]
          : []),
      ],
      attachments: options.attachments?.map((att) => ({
        content: att.content,
        filename: att.filename,
        type: att.type,
        disposition: "attachment",
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }

  console.log("Email sent via SendGrid");
}

/**
 * Main send email function (routes to appropriate provider)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (EMAIL_PROVIDER === "sendgrid") {
      await sendViaSendGrid(options);
    } else {
      await sendViaResend(options);
    }
  } catch (error: any) {
    console.error("Failed to send email:", error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}

/**
 * Send welcome email to approved agent
 */
export async function sendAgentWelcomeEmail(
  email: string,
  firstName: string,
  temporaryPassword: string
): Promise<void> {
  const template = EmailTemplates.agentWelcome({
    firstName,
    email,
    temporaryPassword,
  });

  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send welcome email to approved brand
 */
export async function sendBrandWelcomeEmail(
  email: string,
  contactName: string,
  brandName: string,
  temporaryPassword: string
): Promise<void> {
  const template = EmailTemplates.brandWelcome({
    contactName,
    brandName,
    email,
    temporaryPassword,
  });

  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send rejection email to agent
 */
export async function sendAgentRejectionEmail(
  email: string,
  firstName: string,
  rejectionReason: string,
  allowResubmission: boolean
): Promise<void> {
  const template = EmailTemplates.agentRejection({
    firstName,
    rejectionReason,
    allowResubmission,
  });

  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send rejection email to brand
 */
export async function sendBrandRejectionEmail(
  email: string,
  contactName: string,
  brandName: string,
  rejectionReason: string,
  allowResubmission: boolean
): Promise<void> {
  const template = EmailTemplates.brandRejection({
    contactName,
    brandName,
    rejectionReason,
    allowResubmission,
  });

  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send verification failed email
 */
export async function sendVerificationFailedEmail(
  email: string,
  name: string,
  applicationType: "agent" | "brand",
  reason?: string
): Promise<void> {
  const template = EmailTemplates.verificationFailed({
    name,
    applicationType,
    reason,
  });

  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  bookingNumber: string,
  amount: string,
  currency: string,
  destination: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const template = EmailTemplates.paymentConfirmation({
    name,
    bookingNumber,
    amount,
    currency,
    destination,
    startDate,
    endDate,
  });

  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
): Promise<void> {
  const template = EmailTemplates.passwordReset({ name, resetLink });

  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send custom email
 */
export async function sendCustomEmail(
  to: string | string[],
  subject: string,
  content: string,
  isHtml: boolean = true
): Promise<void> {
  await sendEmail({
    to,
    subject,
    html: isHtml ? getBaseTemplate(content) : content,
    text: isHtml ? undefined : content,
  });
}
