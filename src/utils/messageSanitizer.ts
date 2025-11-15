// Message sanitizer to prevent contact info sharing in marketplace
export function sanitizeMessageForMarketplace(raw: string): { 
  safe: string; 
  flagged: boolean;
  reason?: string;
} {
  let flagged = false;
  let safe = raw;
  let reason = "";

  // Phone number patterns: +1234567890, 123-456-7890, (123) 456-7890, etc.
  const phoneRegex = /(\+?\d[\d\-\s().]{7,}\d)/g;
  
  // Email patterns: user@domain.com
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

  if (phoneRegex.test(safe)) {
    flagged = true;
    reason = "phone_number_removed";
    safe = safe.replace(phoneRegex, "[contact removed]");
  }

  if (emailRegex.test(safe)) {
    flagged = true;
    reason = reason ? "contact_info_removed" : "email_removed";
    safe = safe.replace(emailRegex, "[contact removed]");
  }

  return { safe, flagged, reason };
}
