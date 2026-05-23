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

/**
 * GoTrue's "Prevent email enumeration" protection (enabled on this project)
 * causes `supabase.auth.signUp()` to silently SUCCEED for a duplicate email,
 * returning a fake user object with `identities: []` and no session — instead
 * of returning an error. Our trigger-level `email_already_registered` raise
 * never even runs in this path.
 *
 * Callers must check the returned `data` shape in addition to `error`.
 * See: https://supabase.com/docs/guides/auth/auth-identity-linking#user-enumeration
 */
export function isDuplicateEmailSignupResponse(
  data: { user?: { identities?: unknown[] | null } | null; session?: unknown } | null | undefined,
): boolean {
  if (!data || !data.user) return false;
  if (data.session) return false;
  const identities = data.user.identities;
  return Array.isArray(identities) && identities.length === 0;
}