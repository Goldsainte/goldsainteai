/**
 * Security utilities for input sanitization and validation
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Rate limiting check
 * Note: Currently disabled - returns allowed=true. To enable, create rate_limits table in database.
 */
export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  // Rate limiting disabled - rate_limits table doesn't exist
  // To enable, create the table with: identifier (text), request_count (int), window_start (timestamptz)
  console.log(`Rate limit check for ${identifier} - skipped (table not configured)`);
  return { allowed: true, remaining: maxRequests };
}

/**
 * Validate JWT token format (not verification, just format check)
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3;
}

/**
 * Sanitize object by removing potentially dangerous keys
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const dangerous = ["__proto__", "constructor", "prototype"];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (dangerous.includes(key)) continue;
    
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Content Security Policy headers
 */
export const CSP_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://creator.expediagroup.com https://widgets.expedia.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://creator.expediagroup.com",
    "frame-src 'self' https://creator.expediagroup.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
};
