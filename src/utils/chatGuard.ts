import { z } from 'zod';

/**
 * Returns an error string if the message appears to contain
 * off-platform contact details (phone, email, obvious @handle, etc.).
 * Returns null if the message looks okay.
 */
export function validateOnPlatformMessage(message: string): string | null {
  const text = message.toLowerCase();

  // Very basic patterns for phone numbers and emails
  const phonePattern = /(\+?\d[\d\s\-().]{7,})/;
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/;

  // Obvious "contact me" phrases
  const offPlatformPhrases = [
    "text me at",
    "call me at",
    "whatsapp me",
    "dm me on ig",
    "dm me on instagram",
    "snap me",
    "snapchat me",
    "telegram me",
    "add me on",
    "my number is",
    "my phone is",
    "email me at",
    "reach me at",
  ];

  if (phonePattern.test(text)) {
    return "For your safety and to protect marketplace commissions, phone numbers can't be shared in chat.";
  }

  if (emailPattern.test(text)) {
    return "For your safety and to protect marketplace commissions, email addresses can't be shared in chat.";
  }

  if (offPlatformPhrases.some((phrase) => text.includes(phrase))) {
    return "Please keep the conversation on Goldsainte. Off-platform contact details aren't allowed in chat.";
  }

  // crude @handle guard (optional, you can refine)
  if (/@\w{3,}/.test(text) && (text.includes("instagram") || text.includes("twitter") || text.includes("tiktok"))) {
    return "Sharing social media handles that enable off-platform contact isn't allowed in chat.";
  }

  return null;
}

/**
 * Schema for validating chat messages before submission
 */
export const chatMessageSchema = z.object({
  body: z.string()
    .trim()
    .min(1, { message: "Message cannot be empty" })
    .max(2000, { message: "Message must be less than 2000 characters" })
});

/**
 * Validates a chat message for both content and off-platform contact
 */
export function validateChatMessage(message: string): { valid: boolean; error?: string } {
  // First check schema validation
  const schemaValidation = chatMessageSchema.safeParse({ body: message });
  if (!schemaValidation.success) {
    return {
      valid: false,
      error: schemaValidation.error.errors[0].message
    };
  }

  // Then check for off-platform contact
  const contactViolation = validateOnPlatformMessage(message);
  if (contactViolation) {
    return {
      valid: false,
      error: contactViolation
    };
  }

  return { valid: true };
}
