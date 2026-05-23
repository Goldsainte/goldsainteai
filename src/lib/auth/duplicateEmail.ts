/**
 * Shared detection for the "email already registered" signup error.
 *
 * Primary signal: the `email_already_registered` string emitted by our
 * `handle_new_user` trigger (RAISE EXCEPTION ... 'email_already_registered').
 * Fallback: GoTrue's native "already registered" / "already been registered"
 * messages, which can surface when Supabase rejects the signup before our
 * trigger runs.
 *
 * Use this helper from every signup entry point so the UX stays consistent.
 */
export function isDuplicateEmailError(error: unknown): boolean {
  if (!error) return false;
  const anyErr = error as { message?: unknown; hint?: unknown; code?: unknown };
  const parts = [anyErr.message, anyErr.hint, anyErr.code]
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.toLowerCase());
  if (parts.length === 0) return false;
  const haystack = parts.join(" | ");
  return (
    haystack.includes("email_already_registered") ||
    haystack.includes("already registered") ||
    haystack.includes("already been registered")
  );
}