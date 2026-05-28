## Problem
The profile dropdown shows "My Trips" but users expect "My Bookings" or "My Journeys" to find their purchased trips. The label mismatch causes confusion.

## Solution
Rename the dropdown entry to match the actual page title, and route directly to the canonical path.

## Changes

1. **src/components/Header.tsx — Dropdown item #1 (lines 226-232)**
   - Change `navigate('/my-trips')` → `navigate(primaryBookingsPath)` (which is `/my-bookings`)
   - Change label text `"My Trips"` → `"My Bookings"`
   - Keep the `Luggage` icon

2. **src/components/Header.tsx — Dropdown item #2 (lines 473-479)**
   - Same two changes as above.

3. **AppRoutes.tsx (verify)**
   - Keep existing `/my-trips` → `/my-bookings` redirect for backward compatibility.

## What stays the same
- "My Purchases" remains untouched (digital goods are separate from trip bookings).
- No new pages or routes created.
- All role-gating logic (isTraveler, isAgentAccount, etc.) remains intact.