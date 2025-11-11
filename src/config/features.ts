/**
 * Feature flags for the application
 */

export const FEATURE_FLAGS = {
  // Chat booking behavior
  USE_CHAT_BOOKING_LIST: false, // Show Booking.com hotel list from chat
  USE_EXPEDIA_WIDGET_MODAL: true, // Open Expedia widget modal from chat (default)
  
  // Mobile breakpoint for forcing modal behavior
  MOBILE_BREAKPOINT: 768, // px
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
