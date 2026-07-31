/* edgeErrorMessage — extracts the REAL error text from a failed
 * supabase.functions.invoke() call instead of the useless
 * "Edge Function returned a non-2xx status code".
 *
 * This exact implementation was copy-pasted locally into four files during
 * launch week (backlog 3.1) after the flattened message blinded debugging
 * five separate times. This is the first SHARED copy (30 Jul, extracted
 * verbatim from ApplicationReviewDashboard); new call sites should import
 * from here, and the local copies can migrate over post-launch. */
export const edgeErrorMessage = async (error: any, fallback: string): Promise<string> => {
  try {
    const res = error?.context;
    if (res && typeof res.json === "function") {
      const body = await res.clone().json();
      const detail = body?.message || body?.error;
      if (detail) return String(detail);
    }
    if (res && typeof res.text === "function") {
      const txt = await res.clone().text();
      if (txt) return txt.slice(0, 300);
    }
  } catch {
    /* fall through to the generic message */
  }
  return error?.message || fallback;
};
