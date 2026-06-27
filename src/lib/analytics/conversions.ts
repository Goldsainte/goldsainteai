const GOOGLE_ADS_ID = 'AW-17180504737';
// Conversion label from Google Ads (Conversions → conversion action → the label
// portion of "send_to: AW-17180504737/XXXXXXXX"). Set VITE_GOOGLE_ADS_CONVERSION_LABEL
// in the build env; until it's set, the Ads conversion is skipped (GA4 purchase
// still fires).
const CONVERSION_LABEL_PURCHASE =
  import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL || '';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface PurchaseEvent {
  value: number;
  currency?: string;
  transactionId: string;
  productType:
    | 'trip_booking'
    | 'itinerary'
    | 'bundle'
    | 'transportation'
    | 'coin_purchase';
}

export function trackPurchaseConversion(event: PurchaseEvent): void {
  if (typeof window === 'undefined' || !window.gtag) {
    // eslint-disable-next-line no-console
    console.warn('[Conversion] gtag not loaded, skipping conversion event');
    return;
  }

  // Google Ads conversion (only when a real label is configured)
  if (CONVERSION_LABEL_PURCHASE) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL_PURCHASE}`,
      value: event.value,
      currency: event.currency || 'USD',
      transaction_id: event.transactionId,
    });
  }

  // GA4-compatible purchase event (no-op if GA4 isn't configured)
  window.gtag('event', 'purchase', {
    transaction_id: event.transactionId,
    value: event.value,
    currency: event.currency || 'USD',
    items: [{ id: event.productType, item_category: event.productType }],
  });
}

/**
 * Fire a purchase conversion once per session_id (deduped via sessionStorage).
 * Useful on success pages where the URL may be refreshed/back-navigated.
 */
export function trackPurchaseConversionOnce(
  key: string,
  event: PurchaseEvent
): void {
  if (typeof window === 'undefined') return;
  try {
    const firedKey = `conversion_fired_${key}`;
    if (sessionStorage.getItem(firedKey)) return;
    trackPurchaseConversion(event);
    sessionStorage.setItem(firedKey, '1');
  } catch {
    // sessionStorage unavailable — fire without dedup
    trackPurchaseConversion(event);
  }
}