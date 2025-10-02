export const buildReservationRedirect = (url: string) => {
  try {
    if (!url) return '/r';
    // Encode the target URL and use our internal redirect route to avoid iframe blocking
    const encoded = btoa(url);
    return `/r?to=${encodeURIComponent(encoded)}`;
  } catch {
    return '/r';
  }
};
