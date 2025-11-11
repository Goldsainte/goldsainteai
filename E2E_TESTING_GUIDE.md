# End-to-End Testing Guide - Goldsainte Platform

## Overview
This guide provides step-by-step instructions for comprehensive E2E testing of all platform features across devices and user roles.

## Test Environment Setup

### Prerequisites
1. **Test Accounts Required:**
   - Anonymous visitor (no login)
   - Traveler account (email: traveler@test.com)
   - Creator accounts: Bronze, Gold, Platinum (creator-bronze@test.com, creator-gold@test.com, creator-platinum@test.com)
   - Agent accounts x2 (agent1@test.com, agent2@test.com)
   - Admin account (admin@test.com)

2. **Browsers & Devices:**
   - Desktop: Chrome, Safari, Firefox
   - Mobile: iOS Safari (iPhone 13+), Android Chrome (Pixel 5+)
   - Test responsive breakpoints: 375px, 768px, 1024px, 1440px

3. **Stripe Test Mode:**
   - Use test card: 4242 4242 4242 4242
   - Declined card: 4000 0000 0000 0002
   - Test webhook endpoint configured

### Running Automated E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Run all E2E tests
npx playwright test

# Run specific test suite
npx playwright test e2e/critical-voice.spec.ts
npx playwright test e2e/critical-booking.spec.ts
npx playwright test e2e/critical-marketplace.spec.ts

# Run with UI (headed mode)
npx playwright test --ui

# Generate HTML report
npx playwright show-report
```

## Manual Testing Journeys

### Journey 1: Global Voice AI Concierge ("Hey Goldsainte")

**Test Steps:**
1. Navigate to homepage (not logged in)
2. Grant microphone permission when prompted
3. Say "Hey Goldsainte" clearly
4. Verify widget opens and displays "Listening..."
5. Ask: "Find me hotels in Miami for November 12-15"
6. Verify AI responds with booking choice prompt
7. Navigate to /about page
8. Say "Hey Goldsainte" again
9. Verify wake word still works from new page

**Denial Flow:**
1. Deny microphone permission
2. Verify fallback UI appears with chat input
3. Type the same hotel query
4. Verify identical booking flow without voice

**Expected Results:**
- Wake word activates from all pages
- Voice transcription accurate
- Context retained across follow-up questions
- Session transcript saved to profile
- Telemetry events logged: `wake_word_detected`, `voice_mode_activated`

**P0 Blocker if:**
- Wake word doesn't activate from any page
- Microphone permission never prompts
- Voice mode crashes or hangs

---

### Journey 2: Personal AI Agent (Preference Learning)

**Test Steps - Cold Start (First Time User):**
1. Log in as new traveler account
2. Open AI chat
3. Ask: "I need a vacation recommendation"
4. System should ask about travel style preferences
5. Respond: "I prefer luxury resorts with spas"
6. Ask for budget: respond "$500-800 per night"
7. Verify AI stores preferences

**Test Steps - Returning User:**
1. Log out and log back in as same traveler
2. Ask: "Recommend a hotel for my next trip"
3. Verify AI references stored preferences ("luxury resorts", "$500-800")
4. Ask for a beach destination
5. Verify recommendations align with stored profile

**Database Verification:**
```sql
SELECT * FROM user_travel_preferences WHERE user_id = '[test_user_id]';
```

**Expected Results:**
- Preferences stored in `user_travel_preferences` table
- AI recommendations improve with more interactions
- Cold-start asks clarifying questions
- Returning user gets personalized suggestions

**P0 Blocker if:**
- Preferences never saved to database
- AI doesn't use stored preferences
- Error when fetching preference profile

---

### Journey 3: Travel Agent Marketplace with Milestone Payments

**Test Steps:**
1. Log in as traveler
2. Navigate to /marketplace
3. Click "Post a Trip Request"
4. Fill complex trip details:
   - Destination: "Paris, France"
   - Duration: "10 days, June 1-10, 2026"
   - Budget: "$8,000"
   - Requirements: "Luxury hotels, private tours, Michelin dining"
5. Submit request
6. Verify job posted to marketplace

**Agent Matching:**
1. Log in as agent1@test.com
2. Navigate to /marketplace
3. View traveler's job posting
4. Click "Place Bid"
5. Propose 3 milestones:
   - Milestone 1: "Itinerary Planning" - $500
   - Milestone 2: "Hotel & Flight Booking" - $3,000
   - Milestone 3: "On-trip Support" - $500
6. Submit bid

**Milestone Funding:**
1. Log back in as traveler
2. Accept agent's bid
3. Fund Milestone 1 via Stripe (test card 4242...)
4. Verify payment successful
5. Check agent dashboard shows "pending" balance

**Milestone Release:**
1. Agent completes work, marks Milestone 1 complete
2. Traveler reviews and approves
3. Click "Release Payment"
4. Verify Stripe Connect transfer to agent
5. Check agent dashboard shows available balance

**Dispute Path:**
1. If traveler disputes Milestone 2
2. Click "File Dispute"
3. Provide reason
4. Verify escrow hold, admin notified

**Expected Results:**
- All milestone payments tracked in `creator_revenue_transactions`
- Stripe Connect onboarding complete for agent
- Fees/commissions calculated correctly (platform takes 10%)
- Real-time chat available with file attachments
- Notifications fire at each stage

**P0 Blocker if:**
- Cannot create marketplace job
- Milestones not funded via Stripe
- Payments don't transfer to agent
- Commission calculation wrong

---

### Journey 4: CoCurated™ Collaborative Travel Packages

**Test Steps:**
1. Navigate to /packages
2. Browse curated packages
3. Filter by "Date Flexibility: Flexible"
4. Select package: "Tuscany Wine Country - 7 Days"
5. Verify transparent pricing breakdown displayed
6. Choose dates: "September 15-22, 2026"
7. Check availability
8. Click "Book Package"
9. Complete Stripe checkout (test mode)
10. Verify booking confirmation email
11. Navigate to "My Bookings"
12. Verify package listed with correct dates

**Cancellation Flow:**
1. Click "Cancel Booking"
2. Provide reason
3. Verify refund policy displayed
4. Confirm cancellation
5. Check Stripe refund processed
6. Verify booking status changed to "cancelled"

**Expected Results:**
- Inventory check prevents double-booking
- Pricing includes all fees (transparent)
- Fixed vs flexible date handling correct
- Cancellation refunds according to policy

**P0 Blocker if:**
- Cannot book package
- Double-booking occurs (inventory check fails)
- Refund doesn't process

---

### Journey 5: Creator Dashboard (Tiers, Analytics, Products)

**Test Steps - Bronze Creator:**
1. Log in as creator-bronze@test.com
2. Navigate to /creator-dashboard
3. Verify tier badge shows "Bronze"
4. Check analytics: views, engagement, earnings
5. Create new package:
   - Title: "Weekend Getaway to Charleston"
   - Price: $1,200
   - Commission: 15% (Bronze tier rate)
6. Publish package

**Test Steps - Platinum Creator:**
1. Log in as creator-platinum@test.com
2. Navigate to /creator-dashboard
3. Verify tier badge shows "Platinum"
4. Create package with same price
5. Verify commission: 40% (Platinum tier rate + 20% bonus)
6. Check earnings dashboard shows higher commission

**Tier Progression:**
1. Simulate Bronze creator reaching Gold threshold
2. Verify tier upgrade notification
3. Check commission rate updated automatically

**Expected Results:**
- Tier progression Bronze → Gold → Platinum impacts commission logic
- Analytics track: content views, virtual gifts, package bookings, Shop sales
- Earnings accurately reflect tier-based commissions
- Platinum bonus (+20%) applied and reported

**P0 Blocker if:**
- Tier not displayed correctly
- Commission calculation wrong for tier
- Analytics data missing

---

### Journey 6: Creator Payouts & Revenue Streams

**Test Steps:**
1. Log in as creator-platinum@test.com
2. Complete Stripe Connect onboarding if not done:
   - Navigate to /creator-dashboard
   - Click "Complete Payout Setup"
   - Fill Stripe Connect form (test mode)
3. Verify multiple revenue sources:
   - Content views: $50
   - Virtual gifts: $100
   - Package booking commission: $480 (40% of $1,200)
   - Shop product sale: $200
   - Affiliate revenue: $75
4. Check total pending balance: $905
5. Click "Request Payout"
6. Enter bank account (test): routing 110000000, account 000123456789
7. Submit payout request
8. Verify Stripe test transfer initiated

**Commission Verification:**
1. Bronze creator package sale: $1,200
   - Commission: 15% = $180
   - Platform fee: 10% = $18
   - Net to creator: $162
2. Platinum creator package sale: $1,200
   - Commission: 40% + 20% bonus = 60% = $720
   - Platform fee: 10% = $72
   - Net to creator: $648

**Expected Results:**
- All revenue streams tracked in `creator_revenue_transactions`
- Stripe Connect payout succeeds in test mode
- Fees/commissions correct per tier
- Platinum bonus applied

**P0 Blocker if:**
- Stripe Connect onboarding fails
- Payout doesn't reach bank account (test)
- Commission calculation incorrect

---

### Journey 7: Group Bookings & Split Payments

**Test Steps:**
1. Log in as traveler
2. Navigate to /group-trips
3. Click "Create Group Trip"
4. Fill details:
   - Trip name: "Friends Ski Trip 2026"
   - Destination: "Aspen, Colorado"
   - Total cost: $4,000
   - Participants: 4 people
   - Cost per person: $1,000
5. Add participant emails:
   - friend1@test.com
   - friend2@test.com
   - friend3@test.com
6. Click "Generate Payment Links"
7. Verify each participant receives unique Stripe payment link

**Participant Payment:**
1. Open payment link as friend1@test.com
2. Complete Stripe checkout
3. Verify organizer sees payment received (1/4 paid)
4. Repeat for friend2@test.com (2/4 paid)
5. Verify partial completion allowed (not all must pay)

**Notification Check:**
1. Verify organizer gets email when payment completed
2. Check all participants see updated payment status
3. When 4/4 paid, verify trip status changes to "Fully Funded"

**Expected Results:**
- Secure payment links generated per participant
- Partial completion allowed
- Notifications fire on each payment
- Total tracked in `group_bookings` table

**P0 Blocker if:**
- Payment links don't generate
- Payments not tracked correctly
- Notifications don't fire

---

### Journey 8: Complete Itinerary Management

**Test Steps:**
1. Log in as traveler
2. Navigate to /itinerary or /my-trips
3. Click "Create Itinerary"
4. Build day-by-day plan:
   - Day 1: "Flight to Paris, check-in at hotel"
   - Day 2: "Louvre Museum, Eiffel Tower"
   - Day 3: "Versailles day trip"
5. Upload travel docs:
   - Flight confirmation PDF
   - Hotel reservation PDF
   - Passport copy
6. Click "Save Itinerary"

**Calendar Sync:**
1. Click "Sync to Calendar"
2. Choose format: Google Calendar / Apple Calendar / ICS Download
3. For Google: authorize OAuth flow
4. Verify events added to calendar
5. For ICS: download file and verify format

**Sharing with RBAC:**
1. Click "Share Itinerary"
2. Add companion: companion@test.com
3. Set permission: "View Only"
4. Send invite
5. Log in as companion
6. Verify can view but not edit
7. As organizer, change permission to "Edit"
8. Verify companion can now edit

**Offline/Printable View:**
1. Click "Export for Offline"
2. Verify PDF generated with all details
3. Check printable format includes:
   - Day-by-day schedule
   - Travel documents
   - Contact info

**Expected Results:**
- Day-by-day itinerary builder works
- Documents upload to Supabase Storage
- Calendar sync (Google/Apple/ICS) functional
- RBAC enforced (view vs edit permissions)
- Offline/printable exports complete

**P0 Blocker if:**
- Cannot create itinerary
- Calendar sync fails
- RBAC not enforced (viewer can edit)
- Documents don't upload

---

### Journey 9: Real-time Communication Hub

**Test Steps:**
1. Log in as traveler
2. Navigate to /messages
3. Start conversation with agent1@test.com
4. Send message: "Quick question about my trip"
5. Verify message appears instantly (real-time)
6. As agent, reply: "Sure, happy to help!"
7. Verify traveler sees reply without refresh

**Group Chat:**
1. Create group chat with multiple participants
2. Send message to group
3. Verify all participants receive
4. Check typing indicators work

**Notifications:**
1. Send message while recipient offline
2. Verify push/web notification fires
3. Check unread count badge appears
4. Click notification, opens chat

**File Attachments:**
1. Click "Attach File"
2. Upload image or PDF
3. Verify file appears in chat
4. Recipient can download

**Email/SMS Fallback:**
1. If push notification fails, verify email sent
2. Check SMS fallback for critical messages

**Expected Results:**
- Real-time chat via Supabase Realtime
- Push/web notifications work
- Unread counts accurate
- File attachments functional
- Email/SMS fallback available

**P0 Blocker if:**
- Messages don't send in real-time
- Notifications don't fire
- File attachments fail

---

## Cross-Cutting Checks

### Auth & RBAC
- [ ] Traveler cannot access admin routes
- [ ] Creator cannot edit other creators' packages
- [ ] Agent cannot approve own milestone releases
- [ ] Admin can access all dashboards
- [ ] Roles stored in separate `user_roles` table (NOT on profiles)

### Performance
- [ ] Lighthouse score: Performance > 90, Accessibility > 95
- [ ] First Input Delay (FID) < 100ms
- [ ] Time to First Byte (TTFB) < 600ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

### Accessibility
- [ ] WCAG 2.1 AA compliance on critical flows
- [ ] Keyboard navigation works (TAB, ENTER, ESC)
- [ ] ARIA labels present for voice UI
- [ ] Screen reader tested (NVDA/VoiceOver)

### SEO
- [ ] Meta tags present on all pages
- [ ] Open Graph tags for package sharing
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Canonical tags on package pages

### Security
- [ ] CSRF tokens on forms
- [ ] XSS prevention (input sanitization)
- [ ] CSP headers configured
- [ ] Auth tokens stored securely (httpOnly cookies)
- [ ] Rate limits on API endpoints
- [ ] File upload scanning (virus check)

### Observability
- [ ] Error logs captured (Sentry or equivalent)
- [ ] Metrics tracked (response times, error rates)
- [ ] Traces for all major flows
- [ ] Error boundaries show helpful UI
- [ ] Analytics events emitted at key actions

---

## Test Data Seeding

Run the seed script to create test accounts and data:

```sql
-- See SEED_DATA_SCRIPT.sql for full script
```

---

## Bug Reporting Template

When you find a bug, report it with:

**Priority:** P0 / P1 / P2
**Journey:** [e.g., Voice AI Concierge]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Logs/Screenshots:**
[Attach browser console logs, network errors, screenshots]

**Suspected Root Cause:**
[Your analysis]

---

## Definition of Done Checklist

- [ ] Voice wake word activates from every page, executes successful query
- [ ] Fallback UI works if mic denied
- [ ] Traveler can post trip, fund milestones, release payments (Stripe test)
- [ ] Fees/commissions calculated correctly
- [ ] Creator can publish package, receive booking, see revenue
- [ ] Stripe Connect payout succeeds (test mode)
- [ ] Group split payments complete with 2+ participants
- [ ] Notifications fire at each stage
- [ ] Itinerary can be created, docs uploaded, calendar synced
- [ ] RBAC enforced (view vs edit permissions)
- [ ] All E2E tests green in CI with artifacts (videos/screenshots)
- [ ] No P0/P1 bugs on critical paths
- [ ] Error logs show no unhandled exceptions
- [ ] Observability dashboards show traces for all flows
- [ ] Analytics events emitted as specified

---

## Next Steps After Testing

1. **Pass:** If all journeys pass, proceed to production deployment
2. **Fail:** Document all P0/P1 bugs, prioritize fixes, re-test
3. **Blocked:** If critical feature missing, escalate to product team

---

**Testing Start Date:** ___________
**Testing Completion Date:** ___________
**Signed off by:** ___________ (QA Lead)
