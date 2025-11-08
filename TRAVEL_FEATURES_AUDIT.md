# Travel Features Comprehensive Audit
**Date:** 2025-11-08
**Focus:** Making features 1,2,3,5,6,7,8 work REALLY well and consistently

---

## CURRENT STATE ANALYSIS

### 1. Core Trip Planning ❌ INCONSISTENT

**What's Broken:**
- ✅ Simple round-trip works BUT date parsing is unreliable
- ❌ Multi-city flights - NO SUPPORT AT ALL (not implemented)
- ❌ Date flexibility (±3 days) - NO COMPARISON TOOL
- ❌ Budget vs comfort tradeoff - No side-by-side comparison
- ⚠️ AI agent sometimes searches without collecting all info

**Root Cause:**
- `travel-ai-agent` lacks multi-city tool
- No date flexibility analysis function
- Conversational flow sometimes skips critical questions
- No structured comparison tools

**Files Involved:**
- `supabase/functions/travel-ai-agent/index.ts` (main agent)
- `supabase/functions/amadeus-search-flights/index.ts` (basic search only)

---

### 2. Lodging & Alternatives ⚠️ PARTIAL

**What's Broken:**
- ✅ Hotel filters work (location, price, stars, amenities)
- ❌ Short-term rental comparison - NOT IMPLEMENTED
- ❌ Late check-in edge case - NO SPECIAL HANDLING
- ⚠️ "Walkable distance" requires manual interpretation

**Root Cause:**
- No Airbnb/VRBO integration
- No hotel policy lookup (check-in times, late arrival)
- Hotel API returns data but no policy details

**Files Involved:**
- `supabase/functions/amadeus-search-hotels/index.ts`
- `supabase/functions/expedia-search-hotels/index.ts`

---

### 3. Transportation on Ground ❌ CRITICAL GAPS

**What's Broken:**
- ❌ Rail vs air comparison - NO IMPLEMENTATION
- ❌ Driving rules/IDP guidance - NO DATA SOURCE
- ⚠️ Car rental works but lacks policy details

**Root Cause:**
- No rail search API integration
- No country-specific driving rules database
- No insurance/IDP requirement checker

**Files Involved:**
- `supabase/functions/amadeus-search-cars/index.ts` (basic only)
- Need: Rail search integration (Trainline, Rail Europe)
- Need: Driving rules database

---

### 5. Bags, Fees, and Fare Rules ❌ COMPLETELY MISSING

**What's Broken:**
- ❌ Baggage policy matrix - NO DATA
- ❌ Change/cancel fees - NO LOOKUP
- ❌ 24-hour rule - MENTIONED IN CODE BUT NOT EXPOSED

**Root Cause:**
- Amadeus flight offers don't include detailed baggage policies
- No airline policy scraper or database
- Cancel/change logic exists for bookings but not for quotes

**Files Involved:**
- `supabase/functions/amadeus-cancel-flight/index.ts` (has 24hr logic)
- `supabase/functions/amadeus-book-flight/index.ts` (mentions baggage)
- Need: Airline policy database

---

### 6. Loyalty & Payments ❌ NOT IMPLEMENTED

**What's Broken:**
- ❌ Points/redemption calculator - NO TOOL
- ❌ Currency conversion guidance - BASIC ONLY
- ❌ Card fee estimates - NO DATA

**Root Cause:**
- No loyalty program integration
- No award booking calculator
- Basic currency helper exists but not comprehensive

**Files Involved:**
- `supabase/functions/_shared/currencyHelpers.ts` (basic)
- Need: Loyalty programs API integration
- Need: Award booking logic

---

### 7. Accessibility & Special Needs ❌ MISSING

**What's Broken:**
- ❌ Wheelchair assistance - NO BOOKING FLOW
- ❌ Food allergy flagging - NO SYSTEM
- ❌ Special service requests - NOT IMPLEMENTED

**Root Cause:**
- Booking flows don't capture special requests
- No SSR (Special Service Request) codes in flight booking
- No accessibility filters in hotel search

**Files Involved:**
- `supabase/functions/amadeus-book-flight/index.ts` (needs SSR fields)
- `supabase/functions/amadeus-book-hotel/index.ts` (needs special requests)

---

### 8. Safety, Insurance, and Alerts ❌ CRITICAL MISSING

**What's Broken:**
- ❌ Travel advisories - NO INTEGRATION
- ❌ Insurance comparison - NO TOOL
- ⚠️ Visa checker exists but inconsistent

**Root Cause:**
- No State Department API integration
- No insurance partner integration
- Visa checker (`check-visa-requirements`) uses OpenAI but not reliable

**Files Involved:**
- `supabase/functions/check-visa-requirements/index.ts` (exists but weak)
- Need: Travel.State.Gov API
- Need: Insurance comparison API

---

## PRIORITY FIXES

### CRITICAL (Must Fix Immediately)

1. **Multi-City Flight Search** - Add tool + Amadeus API support
2. **Date Flexibility Analysis** - Create comparison tool (±3 days)
3. **Baggage Policy Lookup** - Build airline policy database
4. **Travel Advisory Integration** - Connect to State Dept API
5. **Improve AI Conversational Flow** - Make it actually ask required questions

### HIGH (Fix Next)

6. **Rail vs Air Comparison** - Integrate rail search API
7. **Accessibility Booking Flow** - Add SSR codes to bookings
8. **Insurance Comparison** - Partner or build comparison tool
9. **Late Check-in Handler** - Add hotel policy lookups
10. **Fare Rule Checker** - Add change/cancel fee lookup

### MEDIUM (Important but Can Wait)

11. **Short-term Rental Integration** - Add Airbnb/VRBO
12. **Loyalty Calculator** - Build award booking tool
13. **Driving Rules Database** - IDP requirements by country
14. **Currency/Fee Estimator** - Comprehensive FX + card fees

---

## IMPLEMENTATION PLAN

### Phase 1: Fix Core Search (Days 1-3)
- [ ] Add multi-city flight tool to AI agent
- [ ] Create date flexibility comparison function
- [ ] Fix conversational flow to be more strict
- [ ] Add budget vs comfort comparison logic

### Phase 2: Add Missing Data (Days 4-6)
- [ ] Build baggage policy database (scrape airline sites)
- [ ] Integrate State Dept travel advisories API
- [ ] Add fare rule lookup (change/cancel fees)
- [ ] Create accessibility booking fields

### Phase 3: Advanced Features (Days 7-10)
- [ ] Rail search integration (Trainline API)
- [ ] Insurance comparison tool
- [ ] Loyalty program calculator
- [ ] Short-term rental search (Airbnb)

---

## FILES TO CREATE/MODIFY

### New Edge Functions Needed:
1. `supabase/functions/search-multi-city-flights/index.ts`
2. `supabase/functions/compare-dates-flexibility/index.ts`
3. `supabase/functions/lookup-baggage-policy/index.ts`
4. `supabase/functions/get-travel-advisories/index.ts`
5. `supabase/functions/check-fare-rules/index.ts`
6. `supabase/functions/search-rail-options/index.ts`
7. `supabase/functions/compare-insurance-plans/index.ts`

### Files to Modify:
1. `supabase/functions/travel-ai-agent/index.ts` - Add new tools
2. `supabase/functions/amadeus-book-flight/index.ts` - Add SSR fields
3. `supabase/functions/amadeus-book-hotel/index.ts` - Add special requests

---

## TESTING CHECKLIST

After implementing fixes, test these exact scenarios:

### 1. Core Trip Planning
- [ ] "Find JFK→LAX, Feb 14–18, nonstop, carry-on only, under $400"
- [ ] "CLT→LHR (May 5–10), then LHR→CDG, CDG→CLT (May 15)"
- [ ] "NYC→MIA around March 10 for 4 nights; show ±3-day options"
- [ ] "Two options: cheapest vs. fewest stops for SFO→NRT in June"

### 2. Lodging
- [ ] "Barcelona, 3 nights, walkable to Gothic Quarter, ≥4★, gym, <$220/night"
- [ ] "Lisbon apartment for a week with kitchen; compare to 3-star hotel"
- [ ] "Arriving 01:30; confirm 24h front desk or key pickup"

### 3. Transportation
- [ ] "Rome→Florence on Friday morning; compare train vs. flight"
- [ ] "Do I need an International Driving Permit for Japan?"

### 5. Bags & Fees
- [ ] "What are carry-on & checked limits for Delta Basic vs Main?"
- [ ] "If I buy Basic Economy JFK→SFO, what's the change penalty?"

### 6. Loyalty & Payments
- [ ] "Best way to book ATL→CDG in biz with Amex MR points?"
- [ ] "Estimate total cost for London weekend on $1,200"

### 7. Accessibility
- [ ] "Request aisle chair + pre-boarding for LAS→SEA"
- [ ] "Severe nut allergy—airline policies and bring-your-own rules"

### 8. Safety & Insurance
- [ ] "Solo female traveler to Istanbul—current advisory level"
- [ ] "Compare single-trip vs. annual plan for 3 international trips"

---

## SUCCESS CRITERIA

Each feature must:
1. **Work consistently** - Same input = same quality output
2. **Ask right questions** - Collect all required info before searching
3. **Provide accurate data** - Real APIs, not hallucinated answers
4. **Handle edge cases** - Late check-in, allergies, date changes, etc.
5. **Be fast** - Response within 5 seconds for searches

---

**Status:** READY TO IMPLEMENT FIXES
**Next Action:** Create missing edge functions and update AI agent tools
