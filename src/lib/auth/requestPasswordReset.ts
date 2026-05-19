import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";

type PasswordResetResult = {
  ok: boolean;
  error?: string;
  rateLimited?: boolean;
};

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await invokeEdgeFunction("request-password-reset", {
    body: {
      email: normalizedEmail,
      redirectTo: `${window.location.origin}/reset-password`,
    },
    showToastOnError: false,
    retryOnNetworkError: true,
    maxRetries: 2,
  });

  if (!error) {
    return { ok: true };
  }

  if (error?.type === "RATE_LIMIT") {
    return {
      ok: false,
      rateLimited: true,
      error: "Too many reset attempts. Please wait a moment and try again.",
    };
  }

  return {
    ok: false,
    error:
      error?.context?.body?.error ||
      error?.message ||
      error?.error ||
      "Failed to send reset email. Please try again.",
  };
}