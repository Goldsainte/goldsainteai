/**
 * Input validation and sanitization utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  // Lightweight allowlist sanitizer (Deno edge runtime — no DOM available).
  // Avoids isomorphic-dompurify which transitively pulls native `canvas`
  // and fails to bundle in edge functions.
  const ALLOWED_TAGS = new Set([
    "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li",
  ]);
  const ALLOWED_ATTR = new Set(["href", "target"]);

  return html.replace(
    /<\/?([a-zA-Z0-9]+)([^>]*)>/g,
    (_match, tag: string, attrs: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return "";

      const cleanedAttrs = (attrs.match(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g) || [])
        .map((a) => {
          const [, k, v] = a.match(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/) || [];
          if (!k || !ALLOWED_ATTR.has(k.toLowerCase())) return "";
          if (k.toLowerCase() === "href" && /^\s*javascript:/i.test(v)) return "";
          return ` ${k.toLowerCase()}="${v.replace(/"/g, "&quot;")}"`;
        })
        .join("");

      return _match.startsWith("</") ? `</${name}>` : `<${name}${cleanedAttrs}>`;
    },
  );
}

/**
 * Sanitize plain text (remove HTML tags, trim whitespace)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim()
    .substring(0, 10000); // Limit length
}

/**
 * Validate and sanitize a numeric value
 */
export function validateNumber(
  value: any,
  min?: number,
  max?: number
): { valid: boolean; value?: number; error?: string } {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: "Invalid number" };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `Value must not exceed ${max}` };
  }

  return { valid: true, value: num };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength: number = 0,
  maxLength: number = 10000
): { valid: boolean; error?: string } {
  if (value.length < minLength) {
    return { valid: false, error: `Minimum length is ${minLength}` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `Maximum length is ${maxLength}` };
  }

  return { valid: true };
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate and sanitize request body
 */
export function validateRequestBody(
  body: any,
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Prevent SQL injection by checking for suspicious patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\bOR\b.*=.*\b|1=1|'=')/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Rate limit check helper
 */
export function getRateLimitKey(ip: string, endpoint: string): string {
  return `ratelimit:${ip}:${endpoint}`;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: any,
  limit?: any
): { page: number; limit: number } {
  const validatedPage = Math.max(1, parseInt(page || "1"));
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit || "20")));

  return {
    page: validatedPage,
    limit: validatedLimit,
  };
}
