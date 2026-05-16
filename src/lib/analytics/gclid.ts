const GCLID_STORAGE_KEY = 'goldsainte_gclid';
const GCLID_EXPIRY_DAYS = 90; // Google Ads attribution window

export function captureGclidFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get('gclid');
    if (gclid) {
      const data = {
        value: gclid,
        capturedAt: Date.now(),
      };
      localStorage.setItem(GCLID_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore (private mode, storage disabled)
  }
}

export function getStoredGclid(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GCLID_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const expiryMs = GCLID_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - data.capturedAt > expiryMs) {
      localStorage.removeItem(GCLID_STORAGE_KEY);
      return null;
    }
    return data.value;
  } catch {
    return null;
  }
}

export function clearGclid(): void {
  try {
    localStorage.removeItem(GCLID_STORAGE_KEY);
  } catch {
    // ignore
  }
}