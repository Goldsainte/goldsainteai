/**
 * Image utilities for cache-busting and responsive loading
 */

export function getPublicImageUrl(path: string): string {
  const version = import.meta.env.VITE_RELEASE_VERSION || 'v1';
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${encodeURIComponent(version)}`;
}
