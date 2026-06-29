// Single source of truth for social handles.
//
// Users type handles inconsistently — "@name", "name", or a pasted profile URL
// ("https://instagram.com/name", "tiktok.com/@name/"). The profile-link builders
// expect a BARE handle and add the platform prefix themselves (TikTok URLs include
// "@", Instagram/YouTube don't), so a stored "@" produces broken links
// ("tiktok.com/@@name", "instagram.com/@name"). Normalize on save AND defensively at
// every URL builder so existing "@…" rows are repaired without a migration.

export type SocialPlatform = "tiktok" | "instagram" | "youtube";

/**
 * Reduce any handle-ish input to a bare handle: strips a leading "@", surrounding
 * whitespace, and — if a full URL/path was pasted — keeps only the final segment.
 *   "@creator001"                         -> "creator001"
 *   "https://instagram.com/creator001/"   -> "creator001"
 *   "https://www.tiktok.com/@creator001"  -> "creator001"
 */
export function normalizeHandle(input?: string | null): string {
  if (!input) return "";
  let h = input.trim();
  if (/(https?:|www\.|instagram\.com|tiktok\.com|youtube\.com|youtu\.be)/i.test(h)) {
    h = h.replace(/[?#].*$/, ""); // drop query/hash
    h = h.replace(/\/+$/, ""); // drop trailing slashes
    h = h.split("/").filter(Boolean).pop() || ""; // last path segment
  }
  return h.replace(/^@+/, "").trim();
}

/** Bare handle prefixed with a single "@", for display. Empty string if no handle. */
export function atHandle(input?: string | null): string {
  const h = normalizeHandle(input);
  return h ? `@${h}` : "";
}

/** Build a public profile URL for a platform, or null if there's no handle. */
export function socialUrl(platform: SocialPlatform, input?: string | null): string | null {
  const h = normalizeHandle(input);
  if (!h) return null;
  switch (platform) {
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    case "instagram":
      return `https://www.instagram.com/${h}`;
    case "youtube":
      return `https://www.youtube.com/@${h}`;
    default:
      return null;
  }
}
