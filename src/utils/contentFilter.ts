/**
 * Content filtering utilities to prevent users from sharing contact information
 * and attempting to take transactions offline
 */

// Patterns to detect contact information
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const URL_PATTERN = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z0-9-]+\.(com|net|org|io|co|uk|ca|us|dev|app|me)\b)/gi;

// Patterns to detect attempts to move offline
const OFFLINE_KEYWORDS = [
  /\b(whatsapp|telegram|signal|viber|wechat|line|kakao)\b/gi,
  /\b(call me|text me|email me|dm me|message me|contact me)\b/gi,
  /\b(my (email|phone|number|contact)( is)?)\b/gi,
  /\b(reach (me )?at|contact at)\b/gi,
  /\b(off(line)? (transaction|payment|deal))\b/gi,
  /\b(avoid (fee|fees|platform|charge))\b/gi,
  /\b(direct(ly)? (pay|payment|transfer))\b/gi,
  /\b(outside (the )?(platform|app|system))\b/gi,
];

// Common obfuscation patterns
const OBFUSCATED_EMAIL = /\b[A-Za-z0-9._%+-]+\s*(at|AT|\(at\)|\[at\]|@)\s*[A-Za-z0-9.-]+\s*(dot|DOT|\(dot\)|\[dot\]|\.)\s*[A-Z|a-z]{2,}\b/gi;
const OBFUSCATED_PHONE = /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

export interface FilterResult {
  isViolation: boolean;
  reason?: string;
  sanitizedText?: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Filters message content for violations
 */
export function filterMessageContent(message: string): FilterResult {
  const violations: string[] = [];
  
  // Check for emails
  if (EMAIL_PATTERN.test(message) || OBFUSCATED_EMAIL.test(message)) {
    violations.push('email addresses');
  }
  
  // Check for phone numbers
  if (PHONE_PATTERN.test(message) || OBFUSCATED_PHONE.test(message)) {
    violations.push('phone numbers');
  }
  
  // Check for URLs
  if (URL_PATTERN.test(message)) {
    violations.push('external links');
  }
  
  // Check for offline keywords
  for (const pattern of OFFLINE_KEYWORDS) {
    if (pattern.test(message)) {
      violations.push('attempts to move communication offline');
      break;
    }
  }
  
  if (violations.length > 0) {
    return {
      isViolation: true,
      reason: `Message contains prohibited content: ${violations.join(', ')}. Please communicate only through the platform.`,
      severity: violations.includes('attempts to move communication offline') ? 'high' : 'medium'
    };
  }
  
  return {
    isViolation: false,
    severity: 'low'
  };
}

/**
 * Sanitizes text by removing contact information
 */
export function sanitizeContactInfo(text: string): string {
  let sanitized = text;
  
  // Replace emails
  sanitized = sanitized.replace(EMAIL_PATTERN, '[EMAIL REMOVED]');
  sanitized = sanitized.replace(OBFUSCATED_EMAIL, '[EMAIL REMOVED]');
  
  // Replace phone numbers
  sanitized = sanitized.replace(PHONE_PATTERN, '[PHONE REMOVED]');
  sanitized = sanitized.replace(OBFUSCATED_PHONE, '[PHONE REMOVED]');
  
  // Replace URLs
  sanitized = sanitized.replace(URL_PATTERN, '[LINK REMOVED]');
  
  return sanitized;
}

/**
 * Checks if text contains suspicious patterns suggesting offline transaction attempts
 */
export function detectOfflineAttempt(text: string): boolean {
  return OFFLINE_KEYWORDS.some(pattern => pattern.test(text));
}
