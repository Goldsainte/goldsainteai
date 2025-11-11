/**
 * Feature flags for the application
 */

export const FEATURE_FLAGS = {
  // Chat booking behavior
  USE_CHAT_BOOKING_LIST: false, // Disabled - using Expedia widget instead
  USE_EXPEDIA_WIDGET_MODAL: false, // Disabled - using inline widget instead
  USE_EXPEDIA_WIDGET_INLINE: true, // Enabled - inline widget in chat
  
  // Booking flow preferences
  AGENT_FIRST_BOOKING: true, // Prioritize agent path over self-service
  DISABLE_HOTEL_CARDS: true, // No hotel cards - use Expedia widget only
  
  // Mobile breakpoint for forcing modal behavior
  MOBILE_BREAKPOINT: 768, // px
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
