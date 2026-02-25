

# Remove Menu Items from Profile Menu

## Items to Remove

1. **Creator Studio** -- from the Discover accordion (both mobile and desktop)
2. **Collab Opportunities** -- from the My Account accordion (both mobile and desktop)
3. **Partner Bookings** -- from the My Account accordion (both mobile and desktop)
4. **Earnings & Billing** -- entire accordion section (both mobile and desktop)

## Technical Details

### File: `src/components/Header.tsx`

**Mobile menu removals:**
- Lines 292-300: Creator Studio item in Discover
- Lines 344-363: Collab Opportunities + Partner Bookings in My Account
- Lines 368-404: Entire Earnings & Billing accordion section

**Desktop menu removals:**
- Lines 623-631: Creator Studio item in Discover
- Lines 675-694: Collab Opportunities + Partner Bookings in My Account
- Lines 699-735: Entire Earnings & Billing accordion section

Also clean up unused variables: `showPartnerBookings` (line 53) since Partner Bookings is removed. The `HandCoins`, `ShieldCheck`, `CreditCard` imports can also be removed if no longer used elsewhere.

No other files affected.

