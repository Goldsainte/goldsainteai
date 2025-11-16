// src/hooks/useChatMessageSafety.ts
import { supabase } from "@/integrations/supabase/client";

export type SafetyIssueType =
  | "email"
  | "phone"
  | "social_handle"
  | "external_payment"
  | "other_off_platform";

export type SafetyIssue = {
  type: SafetyIssueType;
  description: string;
};

export type SafetyCheckResult = {
  issues: SafetyIssue[];
  hasIssues: boolean;
};

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX = /(\+\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/;
const SOCIAL_WORDS = /(whatsapp|telegram|signal|wechat|snapchat|instagram dm|ig dm|dm me)/i;
const PAYMENT_WORDS = /(paypal|venmo|cashapp|cash app|zelle|wise|revolut|iban|western union|crypto|btc)/i;

export function checkMessageForPolicyViolations(text: string): SafetyCheckResult {
  const issues: SafetyIssue[] = [];
  const trimmed = text.trim();

  if (!trimmed) {
    return { issues: [], hasIssues: false };
  }

  if (EMAIL_REGEX.test(trimmed)) {
    issues.push({
      type: "email",
      description: "Looks like you're sharing an email address.",
    });
  }

  // Rough heuristic: 7+ digits usually suggests a phone number
  const digitsCount = (trimmed.match(/\d/g) || []).length;
  if (PHONE_REGEX.test(trimmed) && digitsCount >= 7) {
    issues.push({
      type: "phone",
      description: "Looks like you're sharing a phone number.",
    });
  }

  if (SOCIAL_WORDS.test(trimmed)) {
    issues.push({
      type: "social_handle",
      description:
        "It sounds like you may be trying to move the conversation to another app.",
    });
  }

  if (PAYMENT_WORDS.test(trimmed)) {
    issues.push({
      type: "external_payment",
      description:
        "It sounds like you may be trying to move payment off Goldsainte.",
    });
  }

  return {
    issues,
    hasIssues: issues.length > 0,
  };
}

/**
 * Hook that:
 * - Checks a message text before send
 * - Optionally logs a safety event to Supabase
 */
export function useChatMessageSafety(conversationId?: string, messageId?: string) {
  const runCheck = (text: string): SafetyCheckResult => {
    return checkMessageForPolicyViolations(text);
  };

  const logEvent = async (issues: SafetyIssue[], originalText: string) => {
    if (!conversationId || issues.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const eventType = issues.some((i) => i.type === "external_payment")
      ? "potential_external_payment"
      : "potential_off_platform_contact";

    const reasons = issues.map((i) => i.description);

    await supabase.from("chat_safety_events").insert({
      conversation_id: conversationId,
      message_id: messageId ?? null,
      sender_id: user.id,
      event_type: eventType,
      reasons,
      original_text: originalText,
    });
  };

  return { runCheck, logEvent };
}
