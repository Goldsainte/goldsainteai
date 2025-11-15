import { z } from "zod";

/**
 * Reusable form validation schemas with proper input sanitization
 */

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Please enter a valid email address" })
  .max(255, { message: "Email must be less than 255 characters" });

// Name validation
export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name is required" })
  .max(100, { message: "Name must be less than 100 characters" })
  .regex(/^[-a-zA-Z\s']+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" });

// Phone validation
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[\d\s+()-]+$/, { message: "Please enter a valid phone number" })
  .min(10, { message: "Phone number must be at least 10 digits" })
  .max(20, { message: "Phone number must be less than 20 characters" })
  .optional();

// Text field validation
export const textFieldSchema = (minLength: number = 1, maxLength: number = 500) =>
  z
    .string()
    .trim()
    .min(minLength, { message: `Must be at least ${minLength} characters` })
    .max(maxLength, { message: `Must be less than ${maxLength} characters` });

// Booking form schemas
export const guestInfoSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  country: z.string().max(100).optional(),
  specialRequests: textFieldSchema(0, 1000).optional(),
});

export const jobPostingSchema = z.object({
  title: textFieldSchema(5, 200),
  description: textFieldSchema(20, 2000),
  destination: textFieldSchema(2, 200),
  budgetMin: z.number().positive().max(1000000),
  budgetMax: z.number().positive().max(1000000),
  numberOfTravelers: z.number().int().positive().max(100),
  clientName: nameSchema,
  contactMethod: z.enum(['email', 'phone', 'whatsapp']),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "Maximum budget must be greater than or equal to minimum budget",
  path: ["budgetMax"],
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: textFieldSchema(10, 1000),
  helpfulnessRating: z.number().int().min(1).max(5).optional(),
});

export const messageSchema = z.object({
  content: textFieldSchema(1, 2000),
});

// Currency and price validation
export const priceSchema = z.number().positive().max(10000000, {
  message: "Price must be less than 10,000,000"
});

export const currencySchema = z.string().length(3, {
  message: "Currency code must be exactly 3 characters"
}).toUpperCase();

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
