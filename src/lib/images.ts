/**
 * Image utilities for cache-busting and responsive loading
 */

export function getPublicImageUrl(path: string): string {
  const version = import.meta.env.VITE_RELEASE_VERSION || 'v1';
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${encodeURIComponent(version)}`;
}

type ImageTransform = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

/** Convert a Supabase public object URL into a resized, CDN-cached render URL.
 *  Non-Supabase / bundled / already-transformed URLs pass through untouched. */
export function supabaseImageUrl(
  url: string | null | undefined,
  { width, height, quality = 70, resize = "cover" }: ImageTransform = {}
): string {
  if (!url) return "";
  if (!url.includes("/storage/v1/object/public/")) return url;

  const renderUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  if (quality) params.set("quality", String(quality));
  if (resize) params.set("resize", resize);

  const sep = renderUrl.includes("?") ? "&" : "?";
  return `${renderUrl}${sep}${params.toString()}`;
}

/** Build a responsive srcSet of render URLs. Returns undefined for non-Supabase URLs. */
export function supabaseSrcSet(
  url: string | null | undefined,
  widths: number[],
  opts: Omit<ImageTransform, "width"> = {}
): string | undefined {
  if (!url || !url.includes("/storage/v1/object/public/")) return undefined;
  return widths
    .map((w) => `${supabaseImageUrl(url, { ...opts, width: w })} ${w}w`)
    .join(", ");
}
