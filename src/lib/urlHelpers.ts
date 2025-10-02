export const buildReservationRedirect = (url: string) => {
  try {
    if (!url) return '/r';
    // Encode target URL safely (handles unicode) and use internal redirect route to avoid iframe blocking
    const encoded = btoa(unescape(encodeURIComponent(url)));
    return `/r?to=${encodeURIComponent(encoded)}`;
  } catch {
    // If encoding fails, fall back to opening the URL directly when possible
    if (/^https?:\/\//i.test(url)) return url;
    return '/r';
  }
};
